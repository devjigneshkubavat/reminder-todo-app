import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import settingsReducer from '../src/store/settingsSlice';
import { SettingsScreenComponent } from '../src/screens/SettingsScreen';
import * as routes from '../src/navigation/routes';

jest.mock('../src/navigation/routes', () => ({
  showSecurity: jest.fn(),
}));

describe('SettingsScreen', () => {
  let store: ReturnType<typeof createTestStore>;
  let renderer: ReactTestRenderer.ReactTestRenderer | null = null;

  function createTestStore(initialNotificationType: 'alarm' | 'simple' = 'alarm') {
    return configureStore({
      reducer: {
        settings: settingsReducer,
      },
      preloadedState: {
        settings: {
          notificationType: initialNotificationType,
        },
      },
    });
  }

  afterEach(() => {
    if (renderer) {
      ReactTestRenderer.act(() => {
        renderer?.unmount();
      });
      renderer = null;
    }
    jest.clearAllMocks();
  });

  test('renders with alarm notification selected by default', () => {
    store = createTestStore('alarm');

    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <Provider store={store}>
          <SettingsScreenComponent />
        </Provider>,
      );
    });

    const root = renderer!.root;
    const alarmOption = root.findByProps({ testID: 'notification-type-alarm' });
    const simpleOption = root.findByProps({ testID: 'notification-type-simple' });

    expect(alarmOption.props.accessibilityState.selected).toBe(true);
    expect(simpleOption.props.accessibilityState.selected).toBe(false);
  });

  test('switches from alarm to simple notification when pressed', () => {
    store = createTestStore('alarm');

    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <Provider store={store}>
          <SettingsScreenComponent />
        </Provider>,
      );
    });

    const root = renderer!.root;
    const simpleOption = root.findByProps({ testID: 'notification-type-simple' });

    ReactTestRenderer.act(() => {
      simpleOption.props.onPress();
    });

    expect(store.getState().settings.notificationType).toBe('simple');
  });

  test('switches from simple to alarm notification when pressed', () => {
    store = createTestStore('simple');

    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <Provider store={store}>
          <SettingsScreenComponent />
        </Provider>,
      );
    });

    const root = renderer!.root;
    const alarmOption = root.findByProps({ testID: 'notification-type-alarm' });

    ReactTestRenderer.act(() => {
      alarmOption.props.onPress();
    });

    expect(store.getState().settings.notificationType).toBe('alarm');
  });

  test('navigates to security screen when security row is pressed', () => {
    store = createTestStore('alarm');

    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <Provider store={store}>
          <SettingsScreenComponent />
        </Provider>,
      );
    });

    const root = renderer!.root;
    const securityRow = root.findByProps({ testID: 'security-row' });

    ReactTestRenderer.act(() => {
      securityRow.props.onPress();
    });

    expect(routes.showSecurity).toHaveBeenCalledTimes(1);
  });
});
