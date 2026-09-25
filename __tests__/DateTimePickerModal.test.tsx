import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { DateTimePickerModal } from '../src/components/DateTimePickerModal';

describe('DateTimePickerModal', () => {
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

  test('provides all 60 minutes (0 to 59) in the minute picker', () => {
    const initialDate = new Date('2026-10-15T10:00:00.000Z');
    const onChange = jest.fn();

    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <DateTimePickerModal value={initialDate} onChange={onChange} />,
      );
    });

    const root = renderer!.root;

    // Open time picker modal
    const timeBtn = root.findByProps({ testID: 'time-picker-button' });
    ReactTestRenderer.act(() => {
      timeBtn.props.onPress();
    });

    // Check that minutes from 0 to 59 all exist
    for (let m = 0; m < 60; m++) {
      const minuteChip = root.findByProps({ testID: `minute-${m}` });
      expect(minuteChip).toBeDefined();
    }
  });

  test('selecting a specific minute (e.g. 7 or 42) updates the time and confirms correctly', () => {
    const initialDate = new Date('2026-10-15T10:00:00.000');
    const onChange = jest.fn();

    ReactTestRenderer.act(() => {
      renderer = ReactTestRenderer.create(
        <DateTimePickerModal value={initialDate} onChange={onChange} />,
      );
    });

    const root = renderer!.root;

    // Open time picker
    const timeBtn = root.findByProps({ testID: 'time-picker-button' });
    ReactTestRenderer.act(() => {
      timeBtn.props.onPress();
    });

    // Select minute 42
    const minute42 = root.findByProps({ testID: 'minute-42' });
    ReactTestRenderer.act(() => {
      minute42.props.onPress();
    });

    // Confirm
    const confirmBtn = root.findByProps({ testID: 'btn-picker-confirm' });
    ReactTestRenderer.act(() => {
      confirmBtn.props.onPress();
    });

    expect(onChange).toHaveBeenCalledTimes(1);
    const confirmedDate: Date = onChange.mock.calls[0][0];
    expect(confirmedDate.getMinutes()).toBe(42);
  });
});
