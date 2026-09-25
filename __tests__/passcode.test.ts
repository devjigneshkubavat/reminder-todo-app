import {createAsyncStorage} from '@react-native-async-storage/async-storage';
import * as Keychain from 'react-native-keychain';
import {disablePasscode, getPasscodeChoice, matchesPasscode, savePasscode, saveSkippedChoice} from '../src/security/passcode';

jest.mock('@react-native-async-storage/async-storage', () => ({
  createAsyncStorage: jest.fn(() => ({getItem: jest.fn(), setItem: jest.fn()})),
}));

jest.mock('react-native-keychain', () => ({
  ACCESSIBLE: {WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'device-only'},
  getGenericPassword: jest.fn(),
  resetGenericPassword: jest.fn(),
  setGenericPassword: jest.fn(),
}));

const storage = (createAsyncStorage as jest.Mock).mock.results[0].value;
const getItem = storage.getItem as jest.Mock;
const setItem = storage.setItem as jest.Mock;
const getCredentials = Keychain.getGenericPassword as jest.Mock;
const resetCredentials = Keychain.resetGenericPassword as jest.Mock;
const setCredentials = Keychain.setGenericPassword as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  getItem.mockResolvedValue(null);
  setItem.mockResolvedValue(undefined);
  resetCredentials.mockResolvedValue(true);
  setCredentials.mockResolvedValue({service: 'com.reminderapp.passcode'});
  getCredentials.mockResolvedValue(false);
});

test('a fresh install starts passcode setup and clears an old keychain entry', async () => {
  await expect(getPasscodeChoice()).resolves.toBe('new');
  expect(resetCredentials).toHaveBeenCalledWith({service: 'com.reminderapp.passcode'});
});

test('skipping persists the choice for the next launch', async () => {
  await saveSkippedChoice();
  expect(setItem).toHaveBeenCalledWith('passcode-choice', 'skipped');
  getItem.mockResolvedValue('skipped');
  await expect(getPasscodeChoice()).resolves.toBe('skipped');
});

test('saving a passcode uses secure storage before enabling the choice', async () => {
  await savePasscode('1234');
  expect(setCredentials).toHaveBeenCalledWith('passcode', '1234', {
    service: 'com.reminderapp.passcode',
    accessible: 'device-only',
  });
  expect(setItem).toHaveBeenCalledWith('passcode-choice', 'enabled');
  expect(setCredentials.mock.invocationCallOrder[0]).toBeLessThan(setItem.mock.invocationCallOrder[0]);
});

test('unlock accepts the saved passcode or backup 0000', async () => {
  getCredentials.mockResolvedValue({password: '1234'});
  await expect(matchesPasscode('1234')).resolves.toBe(true);
  await expect(matchesPasscode('9999')).resolves.toBe(false);
  await expect(matchesPasscode('0000')).resolves.toBe(true);
});

test('disabling removes the stored passcode before saving the disabled choice', async () => {
  await disablePasscode();
  expect(resetCredentials).toHaveBeenCalledWith({service: 'com.reminderapp.passcode'});
  expect(setItem).toHaveBeenCalledWith('passcode-choice', 'skipped');
  expect(resetCredentials.mock.invocationCallOrder[0]).toBeLessThan(setItem.mock.invocationCallOrder[0]);
});
