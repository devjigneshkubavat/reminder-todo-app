import {getGreeting} from '../src/utils/greeting';

describe('getGreeting', () => {
  const createDateWithHour = (hour: number, minute: number = 0) => {
    const date = new Date();
    date.setHours(hour, minute, 0, 0);
    return date;
  };

  test('returns "Good night" from 00:00 to 04:59', () => {
    expect(getGreeting(createDateWithHour(0, 0))).toBe('Good night');
    expect(getGreeting(createDateWithHour(3, 30))).toBe('Good night');
    expect(getGreeting(createDateWithHour(4, 59))).toBe('Good night');
  });

  test('returns "Good morning" from 05:00 to 11:59', () => {
    expect(getGreeting(createDateWithHour(5, 0))).toBe('Good morning');
    expect(getGreeting(createDateWithHour(9, 15))).toBe('Good morning');
    expect(getGreeting(createDateWithHour(11, 59))).toBe('Good morning');
  });

  test('returns "Good afternoon" from 12:00 to 16:59', () => {
    expect(getGreeting(createDateWithHour(12, 0))).toBe('Good afternoon');
    expect(getGreeting(createDateWithHour(14, 0))).toBe('Good afternoon');
    expect(getGreeting(createDateWithHour(16, 59))).toBe('Good afternoon');
  });

  test('returns "Good evening" from 17:00 to 20:59', () => {
    expect(getGreeting(createDateWithHour(17, 0))).toBe('Good evening');
    expect(getGreeting(createDateWithHour(19, 45))).toBe('Good evening');
    expect(getGreeting(createDateWithHour(20, 59))).toBe('Good evening');
  });

  test('returns "Good night" from 21:00 to 23:59', () => {
    expect(getGreeting(createDateWithHour(21, 0))).toBe('Good night');
    expect(getGreeting(createDateWithHour(22, 30))).toBe('Good night');
    expect(getGreeting(createDateWithHour(23, 59))).toBe('Good night');
  });

  test('returns a valid greeting when called with no parameters', () => {
    const validGreetings = [
      'Good morning',
      'Good afternoon',
      'Good evening',
      'Good night',
    ];
    expect(validGreetings).toContain(getGreeting());
  });
});
