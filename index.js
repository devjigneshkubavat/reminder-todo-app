/**
 * @format
 */

import notifee from 'react-native-notify-kit';
import { handleNotificationEvent } from './src/services/notificationService';
import './src/navigation';

notifee.onBackgroundEvent(async ({ type, detail }) => {
  await handleNotificationEvent(type, detail);
});
