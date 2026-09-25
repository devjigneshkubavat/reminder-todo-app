# Android OTA updates

The app uses `react-native-ota-hot-update` and the public GitHub repository as
free static hosting. OTA updates can change JavaScript, styling, and bundled
assets. Native dependencies, permissions, Kotlin/Java code, and native
configuration still require a Play Store release.

## Publish an update

1. Keep `runtimeVersion` in `src/services/otaUpdateService.ts`,
   `scripts/build-ota-android.sh`, and `ota/update.json` aligned. Increment it
   whenever native compatibility changes.
2. Build the next monotonically increasing OTA version:

   ```sh
   yarn ota:build:android 1 "Added the new reminder feature"
   ```

3. Test the bundle in an Android release build.
4. Commit and push `ota/update.json` and the generated file under
   `ota/releases/` to `main`.

The installed app checks silently at startup. Users can also open Settings and
tap **Check for updates**. Updates activate after restart, and the two latest
bundles are retained for rollback.

The GitHub repository must be public for devices to download these files.
Never embed a GitHub personal access token in the app.
