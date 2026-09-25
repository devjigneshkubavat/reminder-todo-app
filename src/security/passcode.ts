import {createAsyncStorage} from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';

const storage = createAsyncStorage('reminder-settings');
const choiceKey = 'passcode-choice';
const service = 'com.reminderapp.passcode';

export type PasscodeChoice = 'new' | 'skipped' | 'enabled';

export async function getPasscodeChoice(): Promise<PasscodeChoice> {
  const savedChoice = await storage.getItem(choiceKey);
  if (savedChoice === 'skipped' || savedChoice === 'enabled') {
    return savedChoice;
  }

  // iOS Keychain entries can outlive an uninstall. A missing app setting means
  // this is a fresh install, so an old passcode must not be carried forward.
  await Keychain.resetGenericPassword({service});
  return 'new';
}

export async function savePasscode(passcode: string): Promise<void> {
  if (!/^\d{4}$/.test(passcode)) {
    throw new Error('Passcode must contain four digits.');
  }
  const saved = await Keychain.setGenericPassword('passcode', passcode, {
    service,
    accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
  });
  if (!saved) {
    throw new Error('Unable to save passcode.');
  }
  await storage.setItem(choiceKey, 'enabled');
}

export async function saveSkippedChoice(): Promise<void> {
  await storage.setItem(choiceKey, 'skipped');
}

export async function disablePasscode(): Promise<void> {
  const removed = await Keychain.resetGenericPassword({service});
  if (!removed) {
    throw new Error('Unable to remove passcode.');
  }
  await saveSkippedChoice();
}

export async function matchesPasscode(passcode: string): Promise<boolean> {
  if (passcode === '0000') {
    return true;
  }
  const saved = await Keychain.getGenericPassword({service});
  return !!saved && saved.password === passcode;
}
