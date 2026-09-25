import React from 'react';
import { Text } from 'react-native';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import tasksReducer from '../src/store/tasksSlice';
import ReactTestRenderer from 'react-test-renderer';
import { HomeScreen as HomeContent } from '../src/screens/HomeScreen';
const testStore = configureStore({ reducer: { tasks: tasksReducer } });
function HomeScreen(props: React.ComponentProps<typeof HomeContent>) {
  return (
    <Provider store={testStore}>
      <HomeContent {...props} />
    </Provider>
  );
}
import * as greetingUtils from '../src/utils/greeting';

describe('HomeScreen', () => {
  let renderer: ReactTestRenderer.ReactTestRenderer | null = null;

  afterEach(() => {
    if (renderer) {
      ReactTestRenderer.act(() => {
        renderer?.unmount();
      });
      renderer = null;
    }
    jest.restoreAllMocks();
  });

  test('renders greeting based on current time and does not render dummy Home text', () => {
    jest.spyOn(greetingUtils, 'getGreeting').mockReturnValue('Good morning');

    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<HomeScreen />);
    });

    const root = renderer!.root;
    const greetingText = root.findByProps({ accessibilityRole: 'header' });
    expect(greetingText.props.children).toBe('Good morning');

    // Ensure dummy "Home" text is removed
    const allTextNodes = root.findAllByType(Text);
    const hasDummyHome = allTextNodes.some(
      node => node.props.children === 'Home',
    );
    expect(hasDummyHome).toBe(false);
  });

  test('renders notification icon button and handles press', () => {
    const onNotificationPress = jest.fn();

    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <HomeScreen onNotificationPress={onNotificationPress} />,
      );
    });

    const root = renderer!.root;
    const notificationButton = root.findByProps({
      accessibilityLabel: 'Notifications',
    });
    expect(notificationButton).toBeTruthy();

    ReactTestRenderer.act(() => {
      notificationButton.props.onPress();
    });
    expect(onNotificationPress).toHaveBeenCalledTimes(1);
  });

  test('renders "Good afternoon" when mocked', () => {
    jest.spyOn(greetingUtils, 'getGreeting').mockReturnValue('Good afternoon');

    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<HomeScreen />);
    });

    const root = renderer!.root;
    const greetingText = root.findByProps({ accessibilityRole: 'header' });
    expect(greetingText.props.children).toBe('Good afternoon');
  });

  test('renders "Good evening" when mocked', () => {
    jest.spyOn(greetingUtils, 'getGreeting').mockReturnValue('Good evening');

    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<HomeScreen />);
    });

    const root = renderer!.root;
    const greetingText = root.findByProps({ accessibilityRole: 'header' });
    expect(greetingText.props.children).toBe('Good evening');
  });

  test('renders "Good night" when mocked', () => {
    jest.spyOn(greetingUtils, 'getGreeting').mockReturnValue('Good night');

    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<HomeScreen />);
    });

    const root = renderer!.root;
    const greetingText = root.findByProps({ accessibilityRole: 'header' });
    expect(greetingText.props.children).toBe('Good night');
  });

  test('updates greeting on interval tick', () => {
    jest.useFakeTimers();
    const getGreetingSpy = jest
      .spyOn(greetingUtils, 'getGreeting')
      .mockReturnValue('Good morning');

    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(<HomeScreen />);
    });

    let root = renderer!.root;
    expect(
      root.findByProps({ accessibilityRole: 'header' }).props.children,
    ).toBe('Good morning');

    getGreetingSpy.mockReturnValue('Good afternoon');
    ReactTestRenderer.act(() => {
      jest.advanceTimersByTime(60000);
    });

    root = renderer!.root;
    expect(
      root.findByProps({ accessibilityRole: 'header' }).props.children,
    ).toBe('Good afternoon');

    jest.useRealTimers();
  });
});
