import { configureStore } from '@reduxjs/toolkit';
import tasksReducer, {
  addTask,
  completeTask,
  updateTask,
  archiveTask,
  deleteTask,
  snoozeTask,
} from '../src/store/tasksSlice';
import settingsReducer, { setNotificationType } from '../src/store/settingsSlice';
import { notificationMiddleware } from '../src/store/notificationMiddleware';
import * as notificationService from '../src/services/notificationService';

jest.mock('../src/services/notificationService', () => ({
  scheduleTaskAlarm: jest.fn(async () => true),
  cancelTaskAlarm: jest.fn(async () => {}),
  syncAllTaskAlarms: jest.fn(async () => {}),
}));

describe('notificationMiddleware', () => {
  let store: ReturnType<typeof createTestStore>;

  function createTestStore() {
    return configureStore({
      reducer: {
        tasks: tasksReducer,
        settings: settingsReducer,
      },
      middleware: getDefaultMiddleware =>
        getDefaultMiddleware().concat(notificationMiddleware),
    });
  }

  beforeEach(() => {
    jest.clearAllMocks();
    store = createTestStore();
  });

  test('schedules alarm when addTask is dispatched', () => {
    store.dispatch(
      addTask({
        title: 'Meeting with Client',
        dueDate: new Date(Date.now() + 60000).toISOString(),
        priority: 'high',
        occurOnce: true,
      }),
    );

    expect(notificationService.scheduleTaskAlarm).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Meeting with Client',
      }),
    );
  });

  test('updates alarm when updateTask is dispatched', () => {
    store.dispatch(
      addTask({
        title: 'Initial Task',
        dueDate: new Date(Date.now() + 60000).toISOString(),
        priority: 'normal',
        occurOnce: true,
      }),
    );
    const task = store.getState().tasks.items[0];
    jest.clearAllMocks();

    const updatedTask = { ...task, title: 'Updated Task Title' };
    store.dispatch(updateTask(updatedTask));

    expect(notificationService.scheduleTaskAlarm).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Updated Task Title',
      }),
    );
  });

  test('cancels alarm when completeTask is dispatched', () => {
    store.dispatch(
      addTask({
        title: 'Task to Complete',
        dueDate: new Date(Date.now() + 60000).toISOString(),
        priority: 'normal',
        occurOnce: true,
      }),
    );
    const taskId = store.getState().tasks.items[0].id;
    jest.clearAllMocks();

    store.dispatch(completeTask(taskId));

    expect(notificationService.cancelTaskAlarm).toHaveBeenCalledWith(taskId);
  });

  test('cancels alarm when archiveTask is dispatched', () => {
    store.dispatch(
      addTask({
        title: 'Task to Archive',
        dueDate: new Date(Date.now() + 60000).toISOString(),
        priority: 'normal',
        occurOnce: true,
      }),
    );
    const taskId = store.getState().tasks.items[0].id;
    jest.clearAllMocks();

    store.dispatch(archiveTask(taskId));

    expect(notificationService.cancelTaskAlarm).toHaveBeenCalledWith(taskId);
  });

  test('cancels alarm when deleteTask is dispatched', () => {
    store.dispatch(
      addTask({
        title: 'Task to Delete',
        dueDate: new Date(Date.now() + 60000).toISOString(),
        priority: 'normal',
        occurOnce: true,
      }),
    );
    const taskId = store.getState().tasks.items[0].id;
    jest.clearAllMocks();

    store.dispatch(deleteTask(taskId));

    expect(notificationService.cancelTaskAlarm).toHaveBeenCalledWith(taskId);
  });

  test('schedules alarm with new due date when snoozeTask is dispatched', () => {
    store.dispatch(
      addTask({
        title: 'Task to Snooze',
        dueDate: new Date(Date.now() + 60000).toISOString(),
        priority: 'normal',
        occurOnce: true,
      }),
    );
    const taskId = store.getState().tasks.items[0].id;
    jest.clearAllMocks();

    const newDueDate = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    store.dispatch(snoozeTask({ id: taskId, dueDate: newDueDate }));

    expect(notificationService.scheduleTaskAlarm).toHaveBeenCalledWith(
      expect.objectContaining({
        id: taskId,
        dueDate: newDueDate,
      }),
    );
  });

  test('resyncs all alarms when setNotificationType is dispatched', () => {
    store.dispatch(
      addTask({
        title: 'Task to Resync',
        dueDate: new Date(Date.now() + 60000).toISOString(),
        priority: 'normal',
        occurOnce: true,
      }),
    );
    jest.clearAllMocks();

    store.dispatch(setNotificationType('simple'));

    expect(notificationService.syncAllTaskAlarms).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ title: 'Task to Resync' }),
      ]),
      'simple',
    );
  });
});

