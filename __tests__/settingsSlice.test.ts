import settingsReducer, {
  setNotificationType,
  SettingsState,
} from '../src/store/settingsSlice';

describe('settingsSlice', () => {
  const initialState: SettingsState = {
    notificationType: 'alarm',
  };

  test('should return initial state when passed an undefined state', () => {
    expect(settingsReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  test('should set notification type to simple', () => {
    const nextState = settingsReducer(initialState, setNotificationType('simple'));
    expect(nextState.notificationType).toBe('simple');
  });

  test('should set notification type back to alarm', () => {
    const modifiedState: SettingsState = { notificationType: 'simple' };
    const nextState = settingsReducer(modifiedState, setNotificationType('alarm'));
    expect(nextState.notificationType).toBe('alarm');
  });
});
