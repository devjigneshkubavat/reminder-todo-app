import {
  createDefaultTaskDateTime,
  formatDate,
  formatTime,
  isTimeInPast,
} from '../src/utils/dateTime';

describe('dateTime utilities', () => {
  test('formatDate formats today, tomorrow, and other dates', () => {
    const today = new Date();
    expect(formatDate(today)).toContain('Today');

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    expect(formatDate(tomorrow)).toContain('Tomorrow');

    const future = new Date(2027, 4, 15);
    expect(formatDate(future)).toBe('May 15, 2027');
  });

  test('formatTime formats 12-hour AM/PM correctly', () => {
    const morning = new Date(2026, 8, 22, 9, 5);
    expect(formatTime(morning)).toBe('09:05 AM');

    const noon = new Date(2026, 8, 22, 12, 0);
    expect(formatTime(noon)).toBe('12:00 PM');

    const evening = new Date(2026, 8, 22, 21, 30);
    expect(formatTime(evening)).toBe('09:30 PM');
  });

  test('isTimeInPast validates correctly with minute precision', () => {
    const now = new Date(2026, 8, 22, 14, 30, 0);

    const pastTime = new Date(2026, 8, 22, 14, 28, 0);
    expect(isTimeInPast(pastTime, now)).toBe(true);

    const sameMinute = new Date(2026, 8, 22, 14, 30, 45);
    expect(isTimeInPast(sameMinute, now)).toBe(true);

    const futureTime = new Date(2026, 8, 22, 14, 35, 0);
    expect(isTimeInPast(futureTime, now)).toBe(false);
  });

  test('createDefaultTaskDateTime starts five minutes ahead', () => {
    const reference = new Date(2026, 8, 22, 14, 30, 45);
    const defaultDate = createDefaultTaskDateTime(reference);
    expect(defaultDate.getTime()).toBe(new Date(2026, 8, 22, 14, 35, 0).getTime());
    expect(defaultDate.getSeconds()).toBe(0);
    expect(defaultDate.getMilliseconds()).toBe(0);
  });
});
