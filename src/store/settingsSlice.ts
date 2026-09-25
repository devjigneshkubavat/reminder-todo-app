import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type NotificationType = 'alarm' | 'simple';

export interface SettingsState {
  notificationType: NotificationType;
}

const initialState: SettingsState = {
  notificationType: 'alarm',
};

export const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    setNotificationType: (state, action: PayloadAction<NotificationType>) => {
      state.notificationType = action.payload;
    },
  },
});

export const { setNotificationType } = settingsSlice.actions;

export default settingsSlice.reducer;
