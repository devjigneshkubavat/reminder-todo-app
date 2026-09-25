import notifee, {
  AlarmType,
  AuthorizationStatus,
  AndroidCategory,
  AndroidColor,
  AndroidImportance,
  AndroidVisibility,
  EventDetail,
  EventType,
  Notification,
  TimestampTrigger,
  TriggerType,
} from 'react-native-notify-kit';
import { Platform } from 'react-native';
import {
  completeTask,
  snoozeTask,
  TaskItem,
} from '../store/tasksSlice';
import { NotificationType } from '../store/settingsSlice';

// Version the channel because Android freezes alarm behavior (including DND
// bypass) after a channel is first created. The original channel was created
// without valid DND access and cannot be repaired in place.
export const TASK_ALARM_CHANNEL_ID = 'task_alarm_channel_v3';
export const TASK_SIMPLE_CHANNEL_ID = 'task_simple_channel';

export interface NotificationSetupResult {
  authorized: boolean;
  alarmManagerAvailable: boolean;
  dndBypassEnabled: boolean;
}

export function getSavedNotificationType(): NotificationType {
  try {
    const storeModule = require('../store') as typeof import('../store');
    return storeModule.store.getState()?.settings?.notificationType || 'alarm';
  } catch {
    return 'alarm';
  }
}

async function getReadyStore() {
  // This service is imported while the Redux store installs its notification
  // middleware. Resolve the store only when an action is handled to avoid a
  // circular module initialization and to ensure killed-state actions cannot
  // be overwritten by redux-persist rehydration.
  const storeModule = require('../store') as typeof import('../store');
  await storeModule.waitForStoreReady();
  return storeModule.store;
}

export const NOTIFICATION_ACTIONS = {
  DONE: 'action_done',
  SNOOZE: 'action_snooze',
  ON_IT: 'action_on_it',
  SNOOZE_5: 'action_snooze_5',
  SNOOZE_10: 'action_snooze_10',
  SNOOZE_15: 'action_snooze_15',
} as const;

export interface ActiveAlarmTask {
  id: string;
  title: string;
  description?: string;
  dueDate: string;
}

type AlarmListener = (task: ActiveAlarmTask) => void;
const alarmListeners = new Set<AlarmListener>();

export function addAlarmListener(listener: AlarmListener): () => void {
  alarmListeners.add(listener);
  return () => {
    alarmListeners.delete(listener);
  };
}

export function notifyAlarmTriggered(task: ActiveAlarmTask) {
  alarmListeners.forEach(listener => {
    try {
      listener(task);
    } catch {
      // Ignore listener error
    }
  });
}

/**
 * Calculates the next occurrence timestamp for a task in milliseconds.
 * If occurOnce is true: returns date from dueDate.
 * If weekdays is set: finds the earliest upcoming matching weekday at the specified time.
 */
export function getNextTaskOccurrence(
  task: Pick<TaskItem, 'dueDate' | 'occurOnce' | 'weekdays'>,
  nowMs = Date.now(),
): number | null {
  const due = new Date(task.dueDate);
  if (isNaN(due.getTime())) return null;

  if (task.occurOnce || !task.weekdays || task.weekdays.length === 0) {
    const time = due.getTime();
    return time > nowMs ? time : null;
  }

  // Weekdays recurrence:
  // Weekday IDs in UI: 0=Mon, 1=Tue, 2=Wed, 3=Thu, 4=Fri, 5=Sat, 6=Sun
  // JS Date.getDay(): 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  // Mapping: JS day -> UI weekday id: (jsDay + 6) % 7
  const targetHour = due.getHours();
  const targetMinute = due.getMinutes();

  for (let offset = 0; offset <= 7; offset++) {
    const candidate = new Date(nowMs);
    candidate.setDate(candidate.getDate() + offset);
    candidate.setHours(targetHour, targetMinute, 0, 0);

    if (candidate.getTime() <= nowMs) continue;

    const jsDay = candidate.getDay();
    const uiWeekdayId = (jsDay + 6) % 7;

    if (task.weekdays.includes(uiWeekdayId)) {
      return candidate.getTime();
    }
  }

  return null;
}

/**
 * Initialize notification channels and permissions.
 */
export async function initNotifications(): Promise<NotificationSetupResult> {
  if (Platform.OS === 'android') {
    await notifee.createChannel({
      id: TASK_ALARM_CHANNEL_ID,
      name: 'Task Alarms',
      description: 'Alarm notifications with sound and action buttons for scheduled tasks',
      importance: AndroidImportance.HIGH,
      sound: 'default',
      vibration: true,
      // notify-kit requires an even-length array of strictly positive values.
      // A leading zero makes channel validation fail before permission is asked.
      vibrationPattern: [500, 200, 500, 200, 500, 200],
      bypassDnd: true,
      visibility: AndroidVisibility.PUBLIC,
      lights: true,
      lightColor: AndroidColor.RED,
    });

    await notifee.createChannel({
      id: TASK_SIMPLE_CHANNEL_ID,
      name: 'Task Notifications',
      description: 'Standard notifications with quick actions for scheduled tasks',
      importance: AndroidImportance.DEFAULT,
      sound: 'default',
      vibration: true,
      bypassDnd: false,
      visibility: AndroidVisibility.PUBLIC,
    });
  }

  const settings = await notifee.requestPermission();
  const channel = Platform.OS === 'android'
    ? await notifee.getChannel(TASK_ALARM_CHANNEL_ID)
    : undefined;
  return {
    authorized: settings.authorizationStatus > AuthorizationStatus.DENIED,
    alarmManagerAvailable: settings.android.alarm !== 0,
    dndBypassEnabled: Platform.OS !== 'android' || channel?.bypassDnd === true,
  };
}

/**
 * Builds the notification payload based on whether the user selected
 * alarm or simple push notification.
 */
export function buildAlarmNotification(
  task: Pick<TaskItem, 'id' | 'title' | 'description' | 'dueDate'>,
  notificationType?: NotificationType,
): Notification {
  const type = notificationType ?? getSavedNotificationType();
  const isSimple = type === 'simple';

  return {
    id: `alarm_${task.id}`,
    title: isSimple ? task.title : `⏰ ${task.title}`,
    body: task.description || (isSimple ? 'Task reminder' : 'Task reminder alarm'),
    data: {
      taskId: task.id,
      taskTitle: task.title,
      taskDescription: task.description || '',
      taskDueDate: task.dueDate,
      notificationType: type,
    },
    android: {
      channelId: isSimple ? TASK_SIMPLE_CHANNEL_ID : TASK_ALARM_CHANNEL_ID,
      category: isSimple ? AndroidCategory.REMINDER : AndroidCategory.ALARM,
      importance: isSimple ? AndroidImportance.DEFAULT : AndroidImportance.HIGH,
      ongoing: !isSimple, // Alarm stays until action taken; Simple is swipeable
      loopSound: !isSimple, // Alarm rings continuously; Simple plays chime once
      lightUpScreen: !isSimple,
      autoCancel: isSimple,
      pressAction: {
        id: 'default',
        launchActivity: 'default',
      },
      actions: [
        {
          title: 'Done',
          pressAction: { id: NOTIFICATION_ACTIONS.DONE },
        },
        {
          title: 'Snooze',
          pressAction: { id: NOTIFICATION_ACTIONS.SNOOZE },
        },
        {
          title: 'On it',
          pressAction: { id: NOTIFICATION_ACTIONS.ON_IT },
        },
      ],
    },
    ios: {
      sound: 'default',
      critical: !isSimple,
      interruptionLevel: isSimple ? 'active' : 'timeSensitive',
      categoryId: isSimple ? 'TASK_REMINDER' : 'TASK_ALARM',
    },
  };
}

/**
 * Schedules an exact alarm notification or standard notification for a task.
 */
export async function scheduleTaskAlarm(
  task: TaskItem,
  customTimestamp?: number,
  notificationType?: NotificationType,
): Promise<boolean> {
  const timestamp =
    customTimestamp ?? getNextTaskOccurrence(task);

  if (!timestamp || timestamp <= Date.now()) {
    return false;
  }

  // Cancel any existing alarm notification first
  await cancelTaskAlarm(task.id);

  const type = notificationType ?? getSavedNotificationType();
  const notification = buildAlarmNotification(task, type);

  const trigger: TimestampTrigger = {
    type: TriggerType.TIMESTAMP,
    timestamp,
    alarmManager: {
      type:
        type === 'simple'
          ? AlarmType.SET_EXACT_AND_ALLOW_WHILE_IDLE
          : AlarmType.SET_ALARM_CLOCK,
    },
  };

  try {
    await notifee.createTriggerNotification(notification, trigger);
    return true;
  } catch {
    // If SET_ALARM_CLOCK fails (e.g. permission restriction), fallback to SET_EXACT_AND_ALLOW_WHILE_IDLE
    try {
      trigger.alarmManager = {
        type: AlarmType.SET_EXACT_AND_ALLOW_WHILE_IDLE,
      };
      await notifee.createTriggerNotification(notification, trigger);
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Cancels all alarm and snooze notifications for a given task ID.
 */
export async function cancelTaskAlarm(taskId: string): Promise<void> {
  try {
    await notifee.cancelNotification(`alarm_${taskId}`);
    await notifee.cancelTriggerNotification(`alarm_${taskId}`);
    await notifee.cancelNotification(`snooze_picker_${taskId}`);
  } catch {
    // Ignore cancel error
  }
}

/**
 * Displays the snooze duration picker notification (5 min, 10 min, 15 min).
 */
export async function showSnoozeOptionsNotification(
  taskId: string,
  taskTitle: string,
  taskDescription = '',
  taskDueDate = '',
  notificationType?: NotificationType,
): Promise<void> {
  // Cancel the ringing alarm so sound stops
  try {
    await notifee.cancelNotification(`alarm_${taskId}`);
  } catch {}

  const type = notificationType ?? getSavedNotificationType();
  const isSimple = type === 'simple';

  await notifee.displayNotification({
    id: `snooze_picker_${taskId}`,
    title: isSimple ? `Snooze: ${taskTitle}` : `⏰ Snooze: ${taskTitle}`,
    body: 'Choose snooze duration:',
    data: {
      taskId,
      taskTitle,
      taskDescription,
      taskDueDate,
      notificationType: type,
    },
    android: {
      channelId: isSimple ? TASK_SIMPLE_CHANNEL_ID : TASK_ALARM_CHANNEL_ID,
      category: AndroidCategory.REMINDER,
      importance: isSimple ? AndroidImportance.DEFAULT : AndroidImportance.HIGH,
      autoCancel: true,
      pressAction: {
        id: 'default',
        launchActivity: 'default',
      },
      actions: [
        {
          title: '5 min',
          pressAction: { id: NOTIFICATION_ACTIONS.SNOOZE_5 },
        },
        {
          title: '10 min',
          pressAction: { id: NOTIFICATION_ACTIONS.SNOOZE_10 },
        },
        {
          title: '15 min',
          pressAction: { id: NOTIFICATION_ACTIONS.SNOOZE_15 },
        },
      ],
    },
    ios: {
      sound: 'default',
      interruptionLevel: isSimple ? 'active' : 'timeSensitive',
    },
  });
}

/**
 * Applies snooze duration (5, 10, or 15 minutes) and reschedules the alarm.
 */
export async function applySnooze(
  taskId: string,
  minutes: number,
  fallbackTask?: { title?: string; description?: string; dueDate?: string },
): Promise<void> {
  // Clear snooze picker
  try {
    await notifee.cancelNotification(`snooze_picker_${taskId}`);
    await notifee.cancelNotification(`alarm_${taskId}`);
  } catch {}

  const snoozeTimestamp = Date.now() + minutes * 60 * 1000;
  const newDueDate = new Date(snoozeTimestamp).toISOString();

  const store = await getReadyStore();

  // Update store
  store.dispatch(snoozeTask({ id: taskId, dueDate: newDueDate }));

  // Find task or construct from fallback
  const state = store.getState();
  const existingTask = state.tasks.items.find(item => item.id === taskId);

  const taskToSchedule: TaskItem = existingTask
    ? { ...existingTask, dueDate: newDueDate }
    : {
        id: taskId,
        title: fallbackTask?.title || 'Task Reminder',
        description: fallbackTask?.description,
        dueDate: newDueDate,
        priority: 'normal',
        occurOnce: true,
        createdAt: new Date().toISOString(),
      };

  // Existing tasks are rescheduled by notificationMiddleware when snoozeTask
  // is dispatched. Only the fallback path needs to schedule directly.
  if (!existingTask) {
    await scheduleTaskAlarm(taskToSchedule, snoozeTimestamp);
  }
}

/**
 * Handles "Done" action on a task.
 */
export async function handleMarkDone(taskId: string): Promise<void> {
  await cancelTaskAlarm(taskId);
  const store = await getReadyStore();
  store.dispatch(completeTask(taskId));
}

/**
 * Handles "On it" action on a task - simply removes the notification.
 */
export async function handleOnIt(taskId: string): Promise<void> {
  try {
    await notifee.cancelNotification(`alarm_${taskId}`);
    await notifee.cancelNotification(`snooze_picker_${taskId}`);
  } catch {}
}

/**
 * Unified notification event handler for both foreground and background events.
 */
export async function handleNotificationEvent(
  type: EventType,
  detail: EventDetail,
): Promise<void> {
  const { notification, pressAction } = detail;
  const taskId = notification?.data?.taskId as string | undefined;
  const taskTitle =
    (notification?.data?.taskTitle as string) ||
    notification?.title?.replace(/^⏰\s*/, '') ||
    'Task';
  const taskDescription =
    (notification?.data?.taskDescription as string) ||
    notification?.body ||
    '';
  const taskDueDate =
    (notification?.data?.taskDueDate as string) || '';
  const notifType = notification?.data?.notificationType as
    | NotificationType
    | undefined;

  if (type === EventType.ACTION_PRESS && pressAction) {
    switch (pressAction.id) {
      case NOTIFICATION_ACTIONS.DONE:
        if (taskId) {
          await handleMarkDone(taskId);
        }
        break;

      case NOTIFICATION_ACTIONS.ON_IT:
        if (taskId) {
          await handleOnIt(taskId);
        }
        break;

      case NOTIFICATION_ACTIONS.SNOOZE:
        if (taskId) {
          await showSnoozeOptionsNotification(
            taskId,
            taskTitle,
            taskDescription,
            taskDueDate,
            notifType,
          );
        }
        break;

      case NOTIFICATION_ACTIONS.SNOOZE_5:
        if (taskId) {
          await applySnooze(taskId, 5, {
            title: taskTitle,
            description: taskDescription,
            dueDate: taskDueDate,
          });
        }
        break;

      case NOTIFICATION_ACTIONS.SNOOZE_10:
        if (taskId) {
          await applySnooze(taskId, 10, {
            title: taskTitle,
            description: taskDescription,
            dueDate: taskDueDate,
          });
        }
        break;

      case NOTIFICATION_ACTIONS.SNOOZE_15:
        if (taskId) {
          await applySnooze(taskId, 15, {
            title: taskTitle,
            description: taskDescription,
            dueDate: taskDueDate,
          });
        }
        break;
    }
  } else if (type === EventType.DELIVERED || type === EventType.PRESS) {
    // Only alarm notifications trigger the full-screen / in-app alarm takeover modal.
    // Simple notifications should stay as a gentle push banner without popping up the modal.
    if (taskId && notifType !== 'simple') {
      notifyAlarmTriggered({
        id: taskId,
        title: taskTitle,
        description: taskDescription,
        dueDate: taskDueDate,
      });
    }
  }
}

/**
 * Synchronizes scheduled alarms for all tasks.
 */
export async function syncAllTaskAlarms(
  tasks: TaskItem[],
  notificationType?: NotificationType,
): Promise<void> {
  const type = notificationType ?? getSavedNotificationType();
  for (const task of tasks) {
    if (task.completedAt || task.deletedAt) {
      await cancelTaskAlarm(task.id);
    } else {
      await scheduleTaskAlarm(task, undefined, type);
    }
  }
}
