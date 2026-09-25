import {disablePasscode, getPasscodeChoice, matchesPasscode, savePasscode, saveSkippedChoice, PasscodeChoice} from './passcode';
import {showHome, showPasscode} from '../navigation/routes';

let choice: PasscodeChoice = 'new';
let draftPasscode: string | null = null;
let isUnlocked = false;

export async function startPasscodeFlow() {
  try {
    choice = await getPasscodeChoice();
    isUnlocked = false;
    if (choice === 'enabled') {
      await showPasscode('unlock');
    } else if (choice === 'skipped') {
      await showHome();
    } else {
      await showPasscode('create');
    }
  } catch {
    await showPasscode('error', 'Unable to load passcode settings.');
  }
}

export async function lockOnBackground() {
  if (choice === 'enabled' && isUnlocked) {
    isUnlocked = false;
    await showPasscode('unlock');
  }
}

export async function beginConfirmation(passcode: string) {
  draftPasscode = passcode;
  await showPasscode('confirm');
}

export async function confirmPasscode(passcode: string) {
  if (draftPasscode !== passcode) {
    draftPasscode = null;
    await showPasscode('create', 'Passcodes did not match. Try again.');
    return;
  }
  await savePasscode(passcode);
  draftPasscode = null;
  choice = 'enabled';
  isUnlocked = true;
  await showHome();
}

export async function skipPasscode() {
  await saveSkippedChoice();
  draftPasscode = null;
  choice = 'skipped';
  await showHome();
}

export async function unlockWithPasscode(passcode: string) {
  const matches = await matchesPasscode(passcode);
  if (matches) {
    isUnlocked = true;
    await showHome();
  }
  return matches;
}

export async function restartPasscodeCreation() {
  draftPasscode = null;
  await showPasscode('create');
}

export async function disablePasscodeFromSecurity() {
  await disablePasscode();
  choice = 'skipped';
  isUnlocked = true;
}

export async function savePasscodeFromSecurity(passcode: string) {
  await savePasscode(passcode);
  choice = 'enabled';
  isUnlocked = true;
}
