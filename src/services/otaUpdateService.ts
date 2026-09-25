import {Alert, Platform} from 'react-native';
import hotUpdate from 'react-native-ota-hot-update';
import ReactNativeBlobUtil from 'react-native-blob-util';

const UPDATE_MANIFEST_URL =
  'https://raw.githubusercontent.com/devjigneshkubavat/reminder-todo-app/main/ota/update.json';
const OTA_RUNTIME_VERSION = '1.0';
const ANDROID_VERSION_CODE = 1;
const REQUEST_TIMEOUT_MS = 10_000;

export interface OtaManifest {
  version: number;
  runtimeVersion: string;
  minimumVersionCode: number;
  downloadAndroidUrl: string;
  releaseNotes?: string;
  mandatory?: boolean;
}

export type OtaCheckResult =
  | 'debug-build'
  | 'up-to-date'
  | 'update-installed'
  | 'incompatible';

function isValidManifest(value: unknown): value is OtaManifest {
  if (!value || typeof value !== 'object') return false;
  const manifest = value as Partial<OtaManifest>;
  return (
    Number.isSafeInteger(manifest.version) &&
    Number(manifest.version) >= 0 &&
    typeof manifest.runtimeVersion === 'string' &&
    Number.isSafeInteger(manifest.minimumVersionCode) &&
    typeof manifest.downloadAndroidUrl === 'string' &&
    (manifest.version === 0 || manifest.downloadAndroidUrl.startsWith('https://'))
  );
}

async function fetchManifest(): Promise<OtaManifest> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const response = await fetch(`${UPDATE_MANIFEST_URL}?t=${Date.now()}`, {
      headers: {'Cache-Control': 'no-cache'},
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`Update server returned ${response.status}`);
    const manifest: unknown = await response.json();
    if (!isValidManifest(manifest)) throw new Error('The update manifest is invalid');
    return manifest;
  } finally {
    clearTimeout(timeout);
  }
}

function promptToRestart(releaseNotes?: string, mandatory = false) {
  Alert.alert(
    'Update ready',
    releaseNotes || 'The latest app update has been downloaded.',
    [
      ...(!mandatory ? [{text: 'Later', style: 'cancel' as const}] : []),
      {text: 'Restart now', onPress: () => hotUpdate.resetApp()},
    ],
    {cancelable: !mandatory},
  );
}

export async function checkForOtaUpdate(
  options: {silent?: boolean} = {},
): Promise<OtaCheckResult> {
  if (__DEV__ || Platform.OS !== 'android') {
    if (!options.silent) {
      Alert.alert('Release builds only', 'OTA updates are checked in Android release builds.');
    }
    return 'debug-build';
  }

  try {
    const [manifest, currentVersion] = await Promise.all([
      fetchManifest(),
      hotUpdate.getCurrentVersion(),
    ]);

    if (
      manifest.runtimeVersion !== OTA_RUNTIME_VERSION ||
      manifest.minimumVersionCode > ANDROID_VERSION_CODE
    ) {
      if (!options.silent) {
        Alert.alert('Store update required', 'This update requires a newer native app version.');
      }
      return 'incompatible';
    }

    if (manifest.version <= currentVersion) {
      if (!options.silent) Alert.alert('Up to date', 'You already have the latest version.');
      return 'up-to-date';
    }

    await hotUpdate.downloadBundleUri(
      ReactNativeBlobUtil,
      manifest.downloadAndroidUrl,
      manifest.version,
      {
        restartAfterInstall: false,
        maxBundleVersions: 2,
        metadata: {
          runtimeVersion: manifest.runtimeVersion,
          releaseNotes: manifest.releaseNotes || '',
        },
      },
    );
    promptToRestart(manifest.releaseNotes, manifest.mandatory);
    return 'update-installed';
  } catch (error) {
    if (!options.silent) {
      Alert.alert(
        'Unable to check for updates',
        error instanceof Error ? error.message : 'Please try again later.',
      );
    }
    throw error;
  }
}

export const otaConfig = {
  runtimeVersion: OTA_RUNTIME_VERSION,
  androidVersionCode: ANDROID_VERSION_CODE,
  manifestUrl: UPDATE_MANIFEST_URL,
};
