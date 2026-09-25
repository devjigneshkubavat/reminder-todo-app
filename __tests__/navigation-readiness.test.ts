const mockSetRoot: jest.Mock = jest.fn(async () => {});
const mockShowModal: jest.Mock = jest.fn(async () => {});
const mockDismissModal = jest.fn(async () => {});
const mockReady = jest.fn(async () => {});

jest.mock('react-native-navigation', () => ({
  Navigation: {
    setRoot: mockSetRoot,
    showModal: mockShowModal,
    dismissModal: mockDismissModal,
  },
  OptionsModalPresentationStyle: {fullScreen: 'fullScreen'},
}));
jest.mock('../src/store', () => ({waitForStoreReady: mockReady}));

beforeEach(() => {
  jest.resetModules();
  jest.clearAllMocks();
});

test('keeps the passcode visible until persisted data is ready', async () => {
  let ready!: () => void;
  mockReady.mockImplementationOnce(() => new Promise<void>(resolve => { ready = resolve; }));
  const {showHome} = require('../src/navigation/routes');
  const transition = showHome();
  expect(mockSetRoot).not.toHaveBeenCalled();
  ready();
  await transition;
  const options = mockSetRoot.mock.calls[0][0].root.bottomTabs.options;
  expect(options.animations.setRoot.waitForRender).toBe(true);
  expect(options.bottomTabs.tabsAttachMode).toBe('onSwitchToTab');
});

test('locks without rebuilding tabs and prevents dismissing the lock with Back', async () => {
  const {showHome, showPasscode} = require('../src/navigation/routes');
  await showHome();
  await showPasscode('unlock');
  await showPasscode('unlock');
  expect(mockShowModal).toHaveBeenCalledTimes(1);
  expect(mockShowModal.mock.calls[0][0].component.options.hardwareBackButton.dismissModalOnPress).toBe(false);
  await showHome();
  expect(mockDismissModal).toHaveBeenCalledWith('PASSCODE_LOCK');
  expect(mockSetRoot).toHaveBeenCalledTimes(1);
});
