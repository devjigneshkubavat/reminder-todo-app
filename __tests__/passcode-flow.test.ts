import {disablePasscode, getPasscodeChoice, matchesPasscode, savePasscode, saveSkippedChoice} from '../src/security/passcode';
import {showHome, showPasscode} from '../src/navigation/routes';
import {
  beginConfirmation,
  confirmPasscode,
  disablePasscodeFromSecurity,
  lockOnBackground,
  savePasscodeFromSecurity,
  skipPasscode,
  startPasscodeFlow,
  unlockWithPasscode,
} from '../src/security/flow';

jest.mock('../src/security/passcode', () => ({
  getPasscodeChoice: jest.fn(),
  matchesPasscode: jest.fn(),
  savePasscode: jest.fn(),
  saveSkippedChoice: jest.fn(),
  disablePasscode: jest.fn(),
}));

jest.mock('../src/navigation/routes', () => ({
  showHome: jest.fn(),
  showPasscode: jest.fn(),
}));

const getChoice = getPasscodeChoice as jest.Mock;
const matches = matchesPasscode as jest.Mock;
const save = savePasscode as jest.Mock;
const saveSkip = saveSkippedChoice as jest.Mock;
const disable = disablePasscode as jest.Mock;
const home = showHome as jest.Mock;
const passcode = showPasscode as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  getChoice.mockResolvedValue('new');
  matches.mockResolvedValue(false);
  save.mockResolvedValue(undefined);
  saveSkip.mockResolvedValue(undefined);
  disable.mockResolvedValue(undefined);
  home.mockResolvedValue(undefined);
  passcode.mockResolvedValue(undefined);
});

test('fresh launch asks for creation, while a saved PIN asks for unlock', async () => {
  await startPasscodeFlow();
  expect(passcode).toHaveBeenLastCalledWith('create');

  getChoice.mockResolvedValue('enabled');
  await startPasscodeFlow();
  expect(passcode).toHaveBeenLastCalledWith('unlock');
});

test('skipped choice opens home on the next launch', async () => {
  await skipPasscode();
  expect(saveSkip).toHaveBeenCalled();
  expect(home).toHaveBeenCalled();

  getChoice.mockResolvedValue('skipped');
  await startPasscodeFlow();
  expect(home).toHaveBeenCalledTimes(2);
});

test('confirmation saves only matching passcodes and backgrounding locks home', async () => {
  await startPasscodeFlow();
  await beginConfirmation('1234');
  expect(passcode).toHaveBeenLastCalledWith('confirm');
  await confirmPasscode('9999');
  expect(save).not.toHaveBeenCalled();
  expect(passcode).toHaveBeenLastCalledWith('create', 'Passcodes did not match. Try again.');

  await beginConfirmation('1234');
  await confirmPasscode('1234');
  expect(save).toHaveBeenCalledWith('1234');
  expect(home).toHaveBeenCalled();
  await lockOnBackground();
  expect(passcode).toHaveBeenLastCalledWith('unlock');
});

test('unlock keeps home closed for a wrong PIN and opens it for backup', async () => {
  getChoice.mockResolvedValue('enabled');
  await startPasscodeFlow();
  expect(await unlockWithPasscode('9999')).toBe(false);
  expect(home).not.toHaveBeenCalled();

  matches.mockResolvedValue(true);
  expect(await unlockWithPasscode('0000')).toBe(true);
  expect(home).toHaveBeenCalledTimes(1);
});

test('security changes update whether backgrounding requires a passcode', async () => {
  getChoice.mockResolvedValue('enabled');
  await startPasscodeFlow();
  matches.mockResolvedValue(true);
  await unlockWithPasscode('1234');

  await disablePasscodeFromSecurity();
  expect(disable).toHaveBeenCalled();
  await lockOnBackground();
  expect(passcode).toHaveBeenCalledTimes(1);

  await savePasscodeFromSecurity('4321');
  expect(save).toHaveBeenCalledWith('4321');
  await lockOnBackground();
  expect(passcode).toHaveBeenLastCalledWith('unlock');
});
