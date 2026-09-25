/**
 * Date and time helper utilities for task creation and validation.
 */

export function formatDate(date: Date): string {
  const now = new Date();
  const isToday =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();

  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  const isTomorrow =
    date.getFullYear() === tomorrow.getFullYear() &&
    date.getMonth() === tomorrow.getMonth() &&
    date.getDate() === tomorrow.getDate();

  const monthNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
  ];
  const dateStr = `${monthNames[date.getMonth()]} ${date.getDate()}, ${date.getFullYear()}`;

  if (isToday) return 'Today';
  if (isTomorrow) return `Tomorrow (${dateStr})`;
  return dateStr;
}

export function formatTime(date: Date): string {
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 becomes 12
  const minutesStr = minutes < 10 ? `0${minutes}` : `${minutes}`;
  const hoursStr = hours < 10 ? `0${hours}` : `${hours}`;
  return `${hoursStr}:${minutesStr} ${ampm}`;
}

/**
 * Checks if a target date/time is strictly before the current minute.
 * Using minute-level resolution prevents the default current time from
 * expiring a few seconds after the modal opens.
 */
export function isTimeInPast(target: Date, reference: Date = new Date()): boolean {
  const targetMinute = Math.floor(target.getTime() / 60000);
  const referenceMinute = Math.floor(reference.getTime() / 60000);
  // Alarms must be strictly in the future. Treating the current minute as
  // valid creates a timestamp that has already passed by the time Save runs.
  return targetMinute <= referenceMinute;
}

export function createDefaultTaskDateTime(reference: Date = new Date()): Date {
  const d = new Date(reference);
  // Give the user enough time to complete the form while keeping the default
  // convenient for a quick reminder.
  d.setMinutes(d.getMinutes() + 5, 0, 0);
  return d;
}
