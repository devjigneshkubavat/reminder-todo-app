import { Middleware } from '@reduxjs/toolkit';
import {
  addTask,
  updateTask,
  completeTask,
  archiveTask,
  deleteTask,
  snoozeTask,
  TaskItem,
} from './tasksSlice';
import { setNotificationType } from './settingsSlice';
import {
  scheduleTaskAlarm,
  cancelTaskAlarm,
  syncAllTaskAlarms,
} from '../services/notificationService';

export const notificationMiddleware: Middleware = storeAPI => next => action => {
  const result = next(action);

  const reportFailure = (operation: string) => (error: unknown) => {
    console.warn(`Notification ${operation} failed`, error);
  };

  if (addTask.match(action)) {
    scheduleTaskAlarm(action.payload).catch(reportFailure('schedule'));
  } else if (updateTask.match(action)) {
    if (action.payload.completedAt || action.payload.deletedAt) {
      cancelTaskAlarm(action.payload.id).catch(reportFailure('cancel'));
    } else {
      scheduleTaskAlarm(action.payload).catch(reportFailure('reschedule'));
    }
  } else if (completeTask.match(action)) {
    cancelTaskAlarm(action.payload.id).catch(reportFailure('cancel'));
  } else if (archiveTask.match(action)) {
    cancelTaskAlarm(action.payload.id).catch(reportFailure('cancel'));
  } else if (deleteTask.match(action)) {
    cancelTaskAlarm(action.payload).catch(reportFailure('cancel'));
  } else if (snoozeTask.match(action)) {
    const state = (storeAPI.getState as () => { tasks: { items: TaskItem[] } })();
    const task = state.tasks.items.find(item => item.id === action.payload.id);
    if (task) {
      scheduleTaskAlarm({ ...task, dueDate: action.payload.dueDate }).catch(
        reportFailure('snooze'),
      );
    }
  } else if (setNotificationType.match(action)) {
    const state = (storeAPI.getState as () => { tasks: { items: TaskItem[] } })();
    syncAllTaskAlarms(state.tasks.items, action.payload).catch(
      reportFailure('syncSettings'),
    );
  }

  return result;
};

