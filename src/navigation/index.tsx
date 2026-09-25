import {Alert, AppState} from 'react-native';
import {Navigation} from 'react-native-navigation';
import notifee from 'react-native-notify-kit';
import {PasscodeScreen} from '../screens/PasscodeScreen';
import {lockOnBackground, startPasscodeFlow} from '../security/flow';
import {screenOptions, isAddModalOpen, markAddModalDismissed, screens, showAddModal} from './routes';
import {store, waitForStoreReady} from '../store';
import {withRedux} from '../store/withRedux';
import {
  initNotifications,
  handleNotificationEvent,
  syncAllTaskAlarms,
} from '../services/notificationService';
import {TabButton} from './TabButton';

Navigation.setDefaultOptions(screenOptions);

Navigation.registerComponent(screens.home, () => require('../screens/Screens').HomeScreen);
Navigation.registerComponent(screens.history, () => withRedux(require('../screens/HistoryScreen').HistoryScreen));
Navigation.registerComponent(screens.dates, () => require('../screens/DatesScreen').DatesScreen);
Navigation.registerComponent(screens.add, () => require('../screens/Screens').AddScreen);
Navigation.registerComponent(screens.settings, () => require('../screens/Screens').SettingsScreen);
Navigation.registerComponent(screens.security, () => require('../screens/Screens').SecurityScreen);
Navigation.registerComponent(screens.modal, () => require('../screens/Screens').ModalScreen);
Navigation.registerComponent(screens.tabButton, () => TabButton);
Navigation.registerComponent(screens.passcode, () => PasscodeScreen);

Navigation.events().registerAppLaunchedListener(() => {
  waitForStoreReady()
    .then(() => initNotifications())
    .then(async setup => {
      if (!setup.authorized) {
        Alert.alert(
          'Enable task alarms',
          'Notifications are disabled. Enable them in Settings so task alarms can ring.',
          [
            {text: 'Not now', style: 'cancel'},
            {text: 'Open Settings', onPress: () => notifee.openNotificationSettings()},
          ],
        );
        return;
      }
      if (!setup.alarmManagerAvailable) {
        Alert.alert(
          'Allow exact alarms',
          'Exact alarm access is required for reminders to ring on time.',
          [
            {text: 'Not now', style: 'cancel'},
            {text: 'Open Settings', onPress: () => notifee.openAlarmPermissionSettings()},
          ],
        );
        return;
      }
      await syncAllTaskAlarms(store.getState().tasks.items);
    })
    .catch(error => {
      console.warn('Notification setup failed', error);
      Alert.alert(
        'Task alarms unavailable',
        'The alarm service could not be initialized. Please restart the app and try again.',
      );
    });
  startPasscodeFlow();
});

notifee.onForegroundEvent(({type, detail}) => {
  handleNotificationEvent(type, detail).catch(() => {});
});

Navigation.events().registerBottomTabPressedListener(({tabIndex}) => {
  if (tabIndex === 2) {
    showAddModal().catch(() => Alert.alert('Unable to open modal', 'Please try again.'));
  }
});

Navigation.events().registerModalDismissedListener(({componentName}) => {
  if (componentName === screens.modal) {
    markAddModalDismissed();
  }
});

AppState.addEventListener('change', state => {
  if (state === 'background' && !isAddModalOpen()) {
    lockOnBackground().catch(() => startPasscodeFlow());
  }
});
