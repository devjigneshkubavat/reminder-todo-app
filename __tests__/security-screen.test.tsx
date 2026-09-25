import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import {Switch} from 'react-native';
import {SecurityScreen} from '../src/screens/Screens';
import {getPasscodeChoice} from '../src/security/passcode';
import {disablePasscodeFromSecurity} from '../src/security/flow';

jest.mock('react-native-navigation', () => ({Navigation: {dismissModal: jest.fn()}}));
jest.mock('../src/navigation/routes', () => ({
  showHome: jest.fn(),
  showSecurity: jest.fn(),
  showSecurityPasscode: jest.fn(),
}));
jest.mock('../src/security/passcode', () => ({getPasscodeChoice: jest.fn()}));
jest.mock('../src/security/flow', () => ({disablePasscodeFromSecurity: jest.fn()}));

test('switch disables an enabled passcode and updates its state', async () => {
  (getPasscodeChoice as jest.Mock).mockResolvedValue('enabled');
  (disablePasscodeFromSecurity as jest.Mock).mockResolvedValue(undefined);

  let renderer: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(async () => {
    renderer = ReactTestRenderer.create(<SecurityScreen />);
  });
  const switchControl = renderer!.root.findByType(Switch);
  expect(switchControl.props.value).toBe(true);

  await ReactTestRenderer.act(async () => {
    await switchControl.props.onValueChange(false);
  });
  expect(disablePasscodeFromSecurity).toHaveBeenCalledTimes(1);
  expect(renderer!.root.findByType(Switch).props.value).toBe(false);
});
