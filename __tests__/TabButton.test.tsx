import React from 'react';
import {Text} from 'react-native';
import ReactTestRenderer from 'react-test-renderer';
import {TabButton} from '../src/navigation/TabButton';

describe('TabButton', () => {
  test('renders Home tab with 🏠 icon and label', () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <TabButton label="Home" tabIndex={0} selected={true} />,
      );
    });

    const root = renderer!.root;
    const texts = root.findAllByType(Text);
    const textValues = texts.map(t => t.props.children);
    expect(textValues).toContain('🏠');
    expect(textValues).toContain('Home');
  });

  test('renders Settings tab with ⚙️ icon and label', () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <TabButton label="Settings" tabIndex={4} selected={false} />,
      );
    });

    const root = renderer!.root;
    const texts = root.findAllByType(Text);
    const textValues = texts.map(t => t.props.children);
    expect(textValues).toContain('⚙️');
    expect(textValues).toContain('Settings');
  });

  test('renders Add button with + for tabIndex 2', () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <TabButton label="+" tabIndex={2} />,
      );
    });

    const root = renderer!.root;
    const texts = root.findAllByType(Text);
    const textValues = texts.map(t => t.props.children);
    expect(textValues).toContain('+');
  });
});
