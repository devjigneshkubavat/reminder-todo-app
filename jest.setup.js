/* global jest */

const store = new Map();

const mockStorage = {
  getItem: jest.fn(async key => store.get(key) ?? null),
  setItem: jest.fn(async (key, val) => {
    store.set(key, val);
  }),
  removeItem: jest.fn(async key => {
    store.delete(key);
  }),
  clear: jest.fn(async () => {
    store.clear();
  }),
  getAllKeys: jest.fn(async () => Array.from(store.keys())),
};

jest.mock('@react-native-async-storage/async-storage', () => ({
  __esModule: true,
  default: mockStorage,
  createAsyncStorage: jest.fn(() => mockStorage),
}));

jest.mock('redux-persist', () => {
  const actual = jest.requireActual('redux-persist');
  return {
    ...actual,
    persistStore: jest.fn(() => ({
      pause: jest.fn(),
      persist: jest.fn(),
      purge: jest.fn(),
      flush: jest.fn(() => Promise.resolve()),
      subscribe: jest.fn(),
      getState: jest.fn(() => ({bootstrapped: true})),
    })),
  };
});

const mockNotifee = {
  createChannel: jest.fn(async () => 'task_alarm_channel'),
  createTriggerNotification: jest.fn(async () => 'alarm_1'),
  displayNotification: jest.fn(async () => 'notification_1'),
  cancelNotification: jest.fn(async () => {}),
  cancelTriggerNotification: jest.fn(async () => {}),
  cancelAllNotifications: jest.fn(async () => {}),
  getTriggerNotificationIds: jest.fn(async () => []),
  getNotificationSettings: jest.fn(async () => ({
    authorizationStatus: 1,
    android: {alarm: 1, fullScreenIntent: 1},
  })),
  requestPermission: jest.fn(async () => ({
    authorizationStatus: 1,
    android: {alarm: 1, fullScreenIntent: 1},
  })),
  onForegroundEvent: jest.fn(() => () => {}),
  onBackgroundEvent: jest.fn(),
  openAlarmPermissionSettings: jest.fn(async () => {}),
  openNotificationSettings: jest.fn(async () => {}),
  getChannel: jest.fn(async () => ({bypassDnd: true})),
};

jest.mock('react-native-notify-kit', () => ({
  __esModule: true,
  default: mockNotifee,
  AndroidImportance: { HIGH: 4, DEFAULT: 3, LOW: 2, MIN: 1, NONE: 0 },
  AndroidCategory: { ALARM: 'alarm', REMINDER: 'reminder', EVENT: 'event' },
  AndroidColor: { RED: '#ff0000', BLUE: '#0000ff' },
  AndroidVisibility: { PUBLIC: 1, PRIVATE: 0, SECRET: -1 },
  TriggerType: { TIMESTAMP: 0, INTERVAL: 1 },
  AlarmType: {
    SET: 0,
    SET_AND_ALLOW_WHILE_IDLE: 1,
    SET_EXACT: 2,
    SET_EXACT_AND_ALLOW_WHILE_IDLE: 3,
    SET_ALARM_CLOCK: 4,
  },
  EventType: {
    UNKNOWN: -1,
    DISMISSED: 0,
    PRESS: 1,
    ACTION_PRESS: 2,
    DELIVERED: 3,
  },
  AuthorizationStatus: {
    NOT_DETERMINED: -1,
    DENIED: 0,
    AUTHORIZED: 1,
    PROVISIONAL: 2,
  },
}));

jest.mock('react-native-ota-hot-update', () => ({
  __esModule: true,
  default: {
    downloadBundleUri: jest.fn(async () => {}),
    getCurrentVersion: jest.fn(async () => 0),
    resetApp: jest.fn(async () => {}),
    rollbackToPreviousBundle: jest.fn(async () => true),
  },
}));

jest.mock('react-native-blob-util', () => ({
  __esModule: true,
  default: {},
}));

jest.mock('react-native-navigation', () => ({
  Navigation: {
    setRoot: jest.fn(async () => {}),
    showModal: jest.fn(async () => {}),
    dismissModal: jest.fn(async () => {}),
    registerComponent: jest.fn(),
    setDefaultOptions: jest.fn(),
    events: () => ({
      registerAppLaunchedListener: jest.fn(),
      registerBottomTabPressedListener: jest.fn(),
      registerModalDismissedListener: jest.fn(),
      registerComponentDidAppearListener: jest.fn(() => ({ remove: jest.fn() })),
      registerComponentDidDisappearListener: jest.fn(() => ({ remove: jest.fn() })),
    }),
  },
  OptionsModalPresentationStyle: {
    fullScreen: 'fullScreen',
  },
}));
