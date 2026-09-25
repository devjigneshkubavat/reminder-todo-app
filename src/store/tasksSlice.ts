import { createSlice, nanoid, PayloadAction } from '@reduxjs/toolkit';

export type TaskPriority = 'normal' | 'medium' | 'high';

export interface TaskItem {
  id: string;
  title: string;
  description?: string;
  dueDate: string;
  category?: string;
  priority: TaskPriority;
  occurOnce: boolean;
  weekdays?: number[];
  createdAt: string;
  completedAt?: string;
  deletedAt?: string;
}

export interface TasksState {
  items: TaskItem[];
}

const initialState: TasksState = {
  items: [],
};

export const tasksSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    addTask: {
      prepare: (
        task: Omit<TaskItem, 'id' | 'createdAt' | 'completedAt' | 'deletedAt'>,
      ) => ({
        payload: { ...task, id: nanoid(), createdAt: new Date().toISOString() },
      }),
      reducer: (state, action: PayloadAction<TaskItem>) => {
        state.items.unshift(action.payload);
      },
    },
    completeTask: {
      prepare: (id: string) => ({
        payload: { id, completedAt: new Date().toISOString() },
      }),
      reducer: (
        state,
        action: PayloadAction<{ id: string; completedAt: string }>,
      ) => {
        const task = state.items.find(item => item.id === action.payload.id);
        if (task && !task.completedAt && !task.deletedAt)
          task.completedAt = action.payload.completedAt;
      },
    },
    updateTask: (state, action: PayloadAction<TaskItem>) => {
      const index = state.items.findIndex(
        task => task.id === action.payload.id,
      );
      if (index !== -1) {
        state.items[index] = action.payload;
      }
    },
    archiveTask: {
      prepare: (id: string) => ({
        payload: { id, deletedAt: new Date().toISOString() },
      }),
      reducer: (
        state,
        action: PayloadAction<{ id: string; deletedAt: string }>,
      ) => {
        const task = state.items.find(item => item.id === action.payload.id);
        if (task && !task.deletedAt) task.deletedAt = action.payload.deletedAt;
      },
    },
    deleteTask: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter(task => task.id !== action.payload);
    },
    snoozeTask: (
      state,
      action: PayloadAction<{ id: string; dueDate: string }>,
    ) => {
      const task = state.items.find(item => item.id === action.payload.id);
      if (task && !task.completedAt && !task.deletedAt) {
        task.dueDate = action.payload.dueDate;
      }
    },
  },
});

export const {
  addTask,
  completeTask,
  updateTask,
  archiveTask,
  deleteTask,
  snoozeTask,
} = tasksSlice.actions;

export default tasksSlice.reducer;
