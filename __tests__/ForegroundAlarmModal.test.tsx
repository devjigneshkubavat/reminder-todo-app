import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

jest.mock('react-native-navigation', () => ({
  Navigation: {
    events: () => ({
      registerComponentDidAppearListener: jest.fn(() => ({remove: jest.fn()})),
      registerComponentDidDisappearListener: jest.fn(() => ({remove: jest.fn()})),
    }),
  },
}));

import { ForegroundAlarmModal } from '../src/components/ForegroundAlarmModal';
import * as notificationService from '../src/services/notificationService';

jest.mock('../src/services/notificationService', () => {
  const actual = jest.requireActual('../src/services/notificationService');
  return {
    ...actual,
    handleMarkDone: jest.fn(async () => {}),
    handleOnIt: jest.fn(async () => {}),
    applySnooze: jest.fn(async () => {}),
  };
});

describe('ForegroundAlarmModal', () => {
  let renderer: ReactTestRenderer.ReactTestRenderer | null = null;

  afterEach(() => {
    if (renderer) {
      ReactTestRenderer.act(() => {
        renderer?.unmount();
      });
      renderer = null;
    }
    jest.clearAllMocks();
  });

  test('does not render modal when there is no active alarm', () => {
    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<ForegroundAlarmModal />);
    });

    expect(renderer!.toJSON()).toBeNull();
  });

  test('renders alarm details and handles Done button', async () => {
    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<ForegroundAlarmModal />);
    });

    // Trigger alarm event
    ReactTestRenderer.act(() => {
      notificationService.notifyAlarmTriggered({
        id: 'task-modal-1',
        title: 'Team Standup',
        description: 'Discuss sprint goals',
        dueDate: '2026-10-01T10:00:00.000Z',
      });
    });

    const root = renderer!.root;
    const modalView = root.findByProps({ testID: 'foreground-alarm-modal' });
    expect(modalView).toBeDefined();

    // Check Done button
    const doneBtn = root.findByProps({ testID: 'alarm-done-button' });
    await ReactTestRenderer.act(async () => {
      doneBtn.props.onPress();
    });

    expect(notificationService.handleMarkDone).toHaveBeenCalledWith('task-modal-1');
  });

  test('handles On it button', async () => {
    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<ForegroundAlarmModal />);
    });

    ReactTestRenderer.act(() => {
      notificationService.notifyAlarmTriggered({
        id: 'task-modal-2',
        title: 'Pay Electricity Bill',
        dueDate: '2026-10-01T10:00:00.000Z',
      });
    });

    const root = renderer!.root;
    const onItBtn = root.findByProps({ testID: 'alarm-on-it-button' });
    await ReactTestRenderer.act(async () => {
      onItBtn.props.onPress();
    });

    expect(notificationService.handleOnIt).toHaveBeenCalledWith('task-modal-2');
  });

  test('handles Snooze 5, 10, 15 min buttons', async () => {
    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<ForegroundAlarmModal />);
    });

    ReactTestRenderer.act(() => {
      notificationService.notifyAlarmTriggered({
        id: 'task-modal-3',
        title: 'Water Plants',
        dueDate: '2026-10-01T10:00:00.000Z',
      });
    });

    const root = renderer!.root;
    const snooze10Btn = root.findByProps({ testID: 'snooze-10-button' });
    await ReactTestRenderer.act(async () => {
      snooze10Btn.props.onPress();
    });

    expect(notificationService.applySnooze).toHaveBeenCalledWith(
      'task-modal-3',
      10,
      expect.objectContaining({
        title: 'Water Plants',
      }),
    );
  });
});
