import notifee, {
  AlarmType,
  AndroidCategory,
  AndroidImportance,
  EventType,
  TriggerType,
} from 'react-native-notify-kit';
import {
  initNotifications,
  buildAlarmNotification,
  scheduleTaskAlarm,
  cancelTaskAlarm,
  showSnoozeOptionsNotification,
  applySnooze,
  handleMarkDone,
  handleOnIt,
  handleNotificationEvent,
  getNextTaskOccurrence,
  syncAllTaskAlarms,
  TASK_ALARM_CHANNEL_ID,
  TASK_SIMPLE_CHANNEL_ID,
  NOTIFICATION_ACTIONS,
  addAlarmListener,
} from '../src/services/notificationService';
import { store } from '../src/store';
import { addTask, TaskItem } from '../src/store/tasksSlice';
import { Platform } from 'react-native';

describe('notificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    Platform.OS = 'android';
  });

  describe('initNotifications', () => {
    test('creates Android alarm and simple channels, and requests permissions', async () => {
      const result = await initNotifications();

      expect(notifee.createChannel).toHaveBeenCalledWith(
        expect.objectContaining({
          id: TASK_ALARM_CHANNEL_ID,
          name: 'Task Alarms',
          importance: AndroidImportance.HIGH,
          vibration: true,
          bypassDnd: true,
        }),
      );
      expect(notifee.createChannel).toHaveBeenCalledWith(
        expect.objectContaining({
          id: TASK_SIMPLE_CHANNEL_ID,
          name: 'Task Notifications',
          importance: AndroidImportance.DEFAULT,
          vibration: true,
          bypassDnd: false,
        }),
      );
      expect(notifee.requestPermission).toHaveBeenCalled();
      expect(result).toEqual({
        authorized: true,
        alarmManagerAvailable: true,
        dndBypassEnabled: true,
      });
      expect(notifee.createChannel).toHaveBeenCalledWith(
        expect.objectContaining({
          vibrationPattern: [500, 200, 500, 200, 500, 200],
        }),
      );
    });
  });

  describe('buildAlarmNotification', () => {
    test('constructs an alarm-like notification with Done, Snooze, and On it action buttons', () => {
      const task: Pick<TaskItem, 'id' | 'title' | 'description' | 'dueDate'> = {
        id: 'task-123',
        title: 'Submit Report',
        description: 'Monthly finance report',
        dueDate: new Date(Date.now() + 60000).toISOString(),
      };

      const notification = buildAlarmNotification(task);

      expect(notification.id).toBe('alarm_task-123');
      expect(notification.title).toBe('⏰ Submit Report');
      expect(notification.body).toBe('Monthly finance report');
      expect(notification.data?.taskId).toBe('task-123');

      // Android Alarm options
      expect(notification.android).toBeDefined();
      expect(notification.android?.category).toBe(AndroidCategory.ALARM);
      expect(notification.android?.importance).toBe(AndroidImportance.HIGH);
      expect(notification.android?.ongoing).toBe(true);
      expect(notification.android?.loopSound).toBe(true);
      expect(notification.android?.lightUpScreen).toBe(true);

      // Buttons
      const actions = notification.android?.actions;
      expect(actions).toHaveLength(3);
      expect(actions?.[0]).toEqual({
        title: 'Done',
        pressAction: { id: NOTIFICATION_ACTIONS.DONE },
      });
      expect(actions?.[1]).toEqual({
        title: 'Snooze',
        pressAction: { id: NOTIFICATION_ACTIONS.SNOOZE },
      });
      expect(actions?.[2]).toEqual({
        title: 'On it',
        pressAction: { id: NOTIFICATION_ACTIONS.ON_IT },
      });
    });

    test('constructs a simple push notification without ongoing or looping alarm properties', () => {
      const task: Pick<TaskItem, 'id' | 'title' | 'description' | 'dueDate'> = {
        id: 'task-simple-1',
        title: 'Check Emails',
        description: 'Inbox zero reminder',
        dueDate: new Date(Date.now() + 60000).toISOString(),
      };

      const notification = buildAlarmNotification(task, 'simple');

      expect(notification.id).toBe('alarm_task-simple-1');
      expect(notification.title).toBe('Check Emails'); // No alarm emoji
      expect(notification.body).toBe('Inbox zero reminder');
      expect(notification.data?.taskId).toBe('task-simple-1');
      expect(notification.data?.notificationType).toBe('simple');

      // Android Simple options
      expect(notification.android).toBeDefined();
      expect(notification.android?.channelId).toBe(TASK_SIMPLE_CHANNEL_ID);
      expect(notification.android?.category).toBe(AndroidCategory.REMINDER);
      expect(notification.android?.importance).toBe(AndroidImportance.DEFAULT);
      expect(notification.android?.ongoing).toBe(false); // Can be swiped away!
      expect(notification.android?.loopSound).toBe(false);
      expect(notification.android?.lightUpScreen).toBe(false);
      expect(notification.android?.autoCancel).toBe(true);

      // Actions are still available for convenience
      expect(notification.android?.actions).toHaveLength(3);
    });
  });

  describe('getNextTaskOccurrence', () => {
    test('returns exact dueDate timestamp for single occurrence task in future', () => {
      const futureTime = Date.now() + 100000;
      const task = {
        dueDate: new Date(futureTime).toISOString(),
        occurOnce: true,
      };

      const occurrence = getNextTaskOccurrence(task);
      expect(occurrence).toBe(futureTime);
    });

    test('returns null for single occurrence task in the past', () => {
      const pastTime = Date.now() - 50000;
      const task = {
        dueDate: new Date(pastTime).toISOString(),
        occurOnce: true,
      };

      const occurrence = getNextTaskOccurrence(task);
      expect(occurrence).toBeNull();
    });

    test('calculates next weekday for recurring tasks', () => {
      // Suppose now is a fixed Monday 10:00 AM
      const now = new Date('2026-10-05T10:00:00Z').getTime(); // Mon
      const task = {
        // Due at 11:00 AM every Wednesday (weekday id 2)
        dueDate: new Date('2026-10-01T11:00:00Z').toISOString(),
        occurOnce: false,
        weekdays: [2], // Wednesday
      };

      const nextOccurrence = getNextTaskOccurrence(task, now);
      expect(nextOccurrence).not.toBeNull();
      const nextDate = new Date(nextOccurrence!);
      // In JS, Wednesday getDay() === 3
      expect(nextDate.getDay()).toBe(3);
      expect(nextDate.getTime()).toBeGreaterThan(now);
    });
  });

  describe('scheduleTaskAlarm', () => {
    test('creates trigger notification with SET_ALARM_CLOCK for future task', async () => {
      const futureTime = Date.now() + 120000;
      const task: TaskItem = {
        id: 'task-test-1',
        title: 'Call Doctor',
        dueDate: new Date(futureTime).toISOString(),
        priority: 'high',
        occurOnce: true,
        createdAt: new Date().toISOString(),
      };

      const scheduled = await scheduleTaskAlarm(task);

      expect(scheduled).toBe(true);
      expect(notifee.cancelNotification).toHaveBeenCalledWith('alarm_task-test-1');
      expect(notifee.createTriggerNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'alarm_task-test-1',
          title: '⏰ Call Doctor',
        }),
        expect.objectContaining({
          type: TriggerType.TIMESTAMP,
          timestamp: futureTime,
          alarmManager: expect.objectContaining({
            type: AlarmType.SET_ALARM_CLOCK,
          }),
        }),
      );
    });

    test('creates trigger notification with SET_EXACT_AND_ALLOW_WHILE_IDLE when notificationType is simple', async () => {
      const futureTime = Date.now() + 120000;
      const task: TaskItem = {
        id: 'task-simple-sched',
        title: 'Water Plants',
        dueDate: new Date(futureTime).toISOString(),
        priority: 'normal',
        occurOnce: true,
        createdAt: new Date().toISOString(),
      };

      const scheduled = await scheduleTaskAlarm(task, undefined, 'simple');

      expect(scheduled).toBe(true);
      expect(notifee.createTriggerNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'alarm_task-simple-sched',
          title: 'Water Plants',
        }),
        expect.objectContaining({
          type: TriggerType.TIMESTAMP,
          timestamp: futureTime,
          alarmManager: expect.objectContaining({
            type: AlarmType.SET_EXACT_AND_ALLOW_WHILE_IDLE,
          }),
        }),
      );
    });

    test('does not schedule alarm if due time is in the past', async () => {
      const pastTime = Date.now() - 60000;
      const task: TaskItem = {
        id: 'task-past',
        title: 'Old task',
        dueDate: new Date(pastTime).toISOString(),
        priority: 'normal',
        occurOnce: true,
        createdAt: new Date().toISOString(),
      };

      const scheduled = await scheduleTaskAlarm(task);
      expect(scheduled).toBe(false);
      expect(notifee.createTriggerNotification).not.toHaveBeenCalled();
    });
  });

  describe('cancelTaskAlarm', () => {
    test('cancels displayed and trigger alarm notifications', async () => {
      await cancelTaskAlarm('task-99');

      expect(notifee.cancelNotification).toHaveBeenCalledWith('alarm_task-99');
      expect(notifee.cancelTriggerNotification).toHaveBeenCalledWith('alarm_task-99');
      expect(notifee.cancelNotification).toHaveBeenCalledWith('snooze_picker_task-99');
    });
  });

  describe('showSnoozeOptionsNotification', () => {
    test('cancels ringing alarm and displays snooze picker with 5, 10, 15 min options', async () => {
      await showSnoozeOptionsNotification(
        'task-snooze-1',
        'Take Medication',
        '2 pills',
        new Date().toISOString(),
      );

      expect(notifee.cancelNotification).toHaveBeenCalledWith('alarm_task-snooze-1');
      expect(notifee.displayNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'snooze_picker_task-snooze-1',
          title: '⏰ Snooze: Take Medication',
          body: 'Choose snooze duration:',
          android: expect.objectContaining({
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
          }),
        }),
      );
    });
  });

  describe('applySnooze', () => {
    test('cancels picker, updates task due date in store, and schedules new alarm', async () => {
      // Add a task to store first
      store.dispatch(
        addTask({
          title: 'Buy Groceries',
          dueDate: new Date(Date.now() + 10000).toISOString(),
          priority: 'normal',
          occurOnce: true,
        }),
      );
      const taskId = store.getState().tasks.items[0].id;

      const beforeNow = Date.now();
      await applySnooze(taskId, 10);

      // Picker and alarm cancelled
      expect(notifee.cancelNotification).toHaveBeenCalledWith(`snooze_picker_${taskId}`);
      expect(notifee.cancelNotification).toHaveBeenCalledWith(`alarm_${taskId}`);

      // Due date updated in store ~10 min in the future
      const updatedTask = store.getState().tasks.items.find(t => t.id === taskId);
      expect(updatedTask).toBeDefined();
      const updatedDue = new Date(updatedTask!.dueDate).getTime();
      expect(updatedDue).toBeGreaterThanOrEqual(beforeNow + 10 * 60 * 1000 - 1000);

      // Alarm rescheduled
      expect(notifee.createTriggerNotification).toHaveBeenCalled();
    });
  });

  describe('handleMarkDone', () => {
    test('cancels alarm and marks task complete in store', async () => {
      store.dispatch(
        addTask({
          title: 'Walk the dog',
          dueDate: new Date(Date.now() + 60000).toISOString(),
          priority: 'normal',
          occurOnce: true,
        }),
      );
      const taskId = store.getState().tasks.items[0].id;

      await handleMarkDone(taskId);

      expect(notifee.cancelNotification).toHaveBeenCalledWith(`alarm_${taskId}`);
      const completedTask = store.getState().tasks.items.find(t => t.id === taskId);
      expect(completedTask?.completedAt).toBeDefined();
    });
  });

  describe('handleOnIt', () => {
    test('dismisses the notification without marking task completed', async () => {
      store.dispatch(
        addTask({
          title: 'Reply to emails',
          dueDate: new Date(Date.now() + 60000).toISOString(),
          priority: 'normal',
          occurOnce: true,
        }),
      );
      const taskId = store.getState().tasks.items[0].id;

      await handleOnIt(taskId);

      expect(notifee.cancelNotification).toHaveBeenCalledWith(`alarm_${taskId}`);
      expect(notifee.cancelNotification).toHaveBeenCalledWith(`snooze_picker_${taskId}`);
      const task = store.getState().tasks.items.find(t => t.id === taskId);
      expect(task?.completedAt).toBeUndefined();
    });
  });

  describe('handleNotificationEvent', () => {
    test('handles Done action press event', async () => {
      store.dispatch(
        addTask({
          title: 'Workout',
          dueDate: new Date(Date.now() + 60000).toISOString(),
          priority: 'normal',
          occurOnce: true,
        }),
      );
      const taskId = store.getState().tasks.items[0].id;

      await handleNotificationEvent(EventType.ACTION_PRESS, {
        notification: {
          id: `alarm_${taskId}`,
          data: { taskId, taskTitle: 'Workout' },
        },
        pressAction: { id: NOTIFICATION_ACTIONS.DONE },
      });

      const task = store.getState().tasks.items.find(t => t.id === taskId);
      expect(task?.completedAt).toBeDefined();
    });

    test('handles On it action press event', async () => {
      await handleNotificationEvent(EventType.ACTION_PRESS, {
        notification: {
          id: 'alarm_task-999',
          data: { taskId: 'task-999' },
        },
        pressAction: { id: NOTIFICATION_ACTIONS.ON_IT },
      });

      expect(notifee.cancelNotification).toHaveBeenCalledWith('alarm_task-999');
    });

    test('handles Snooze action press event by showing snooze picker', async () => {
      await handleNotificationEvent(EventType.ACTION_PRESS, {
        notification: {
          id: 'alarm_task-888',
          data: { taskId: 'task-888', taskTitle: 'Review PR' },
        },
        pressAction: { id: NOTIFICATION_ACTIONS.SNOOZE },
      });

      expect(notifee.displayNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'snooze_picker_task-888',
          title: '⏰ Snooze: Review PR',
        }),
      );
    });

    test('handles SNOOZE_5, SNOOZE_10, SNOOZE_15 action presses', async () => {
      await handleNotificationEvent(EventType.ACTION_PRESS, {
        notification: {
          id: 'snooze_picker_task-777',
          data: { taskId: 'task-777', taskTitle: 'Drink Water' },
        },
        pressAction: { id: NOTIFICATION_ACTIONS.SNOOZE_5 },
      });

      expect(notifee.cancelNotification).toHaveBeenCalledWith('snooze_picker_task-777');
      expect(notifee.createTriggerNotification).toHaveBeenCalled();
    });

    test('notifies foreground alarm listeners on DELIVERED event', async () => {
      let receivedAlarm: any = null;
      const unsubscribe = addAlarmListener(alarm => {
        receivedAlarm = alarm;
      });

      await handleNotificationEvent(EventType.DELIVERED, {
        notification: {
          id: 'alarm_task-delivered',
          data: { taskId: 'task-delivered', taskTitle: 'Morning Alarm' },
        },
      });

      unsubscribe();
      expect(receivedAlarm).not.toBeNull();
      expect(receivedAlarm.id).toBe('task-delivered');
      expect(receivedAlarm.title).toBe('Morning Alarm');
    });

    test('does not notify foreground alarm listeners when notificationType is simple', async () => {
      let receivedAlarm: any = null;
      const unsubscribe = addAlarmListener(alarm => {
        receivedAlarm = alarm;
      });

      await handleNotificationEvent(EventType.DELIVERED, {
        notification: {
          id: 'alarm_task-simple-delivered',
          data: {
            taskId: 'task-simple-delivered',
            taskTitle: 'Gentle Notification',
            notificationType: 'simple',
          },
        },
      });

      unsubscribe();
      expect(receivedAlarm).toBeNull();
    });
  });

  describe('syncAllTaskAlarms', () => {
    test('schedules incomplete future tasks and cancels completed/deleted tasks', async () => {
      const futureDate = new Date(Date.now() + 100000).toISOString();
      const pastDate = new Date(Date.now() - 50000).toISOString();

      const tasks: TaskItem[] = [
        {
          id: 'active-1',
          title: 'Active Task',
          dueDate: futureDate,
          priority: 'normal',
          occurOnce: true,
          createdAt: new Date().toISOString(),
        },
        {
          id: 'completed-1',
          title: 'Completed Task',
          dueDate: pastDate,
          priority: 'normal',
          occurOnce: true,
          createdAt: new Date().toISOString(),
          completedAt: new Date().toISOString(),
        },
      ];

      await syncAllTaskAlarms(tasks);

      expect(notifee.cancelNotification).toHaveBeenCalledWith('alarm_completed-1');
      expect(notifee.createTriggerNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'alarm_active-1',
        }),
        expect.anything(),
      );
    });
  });
});
