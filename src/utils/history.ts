import { TaskItem } from '../store/tasksSlice';

export interface HistoryFilter {
  category: string | null;
  from: string;
  to: string;
}
export const EMPTY_HISTORY_FILTER: HistoryFilter = {
  category: null,
  from: '',
  to: '',
};
export type HistorySort = 'newest' | 'oldest';

export function dateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(
    2,
    '0',
  )}-${String(date.getDate()).padStart(2, '0')}`;
}

export function validDateKey(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  return dateKey(date) === value;
}

export function historyFilterError(filter: HistoryFilter): string | undefined {
  if (
    (filter.from && !validDateKey(filter.from)) ||
    (filter.to && !validDateKey(filter.to))
  )
    return 'Enter a valid date as YYYY-MM-DD.';
  if (filter.from && filter.to && filter.from > filter.to)
    return 'End date must be on or after start date.';
  return undefined;
}

export function selectHistory(
  tasks: TaskItem[],
  filter: HistoryFilter,
  sort: HistorySort,
) {
  return tasks
    .filter(task => {
      if (!task.completedAt && !task.deletedAt) return false;
      if (filter.category !== null && (task.category || '') !== filter.category)
        return false;
      const date = new Date(task.dueDate);
      if (!Number.isFinite(date.getTime())) return false;
      const key = dateKey(date);
      return (
        (!filter.from || key >= filter.from) && (!filter.to || key <= filter.to)
      );
    })
    .sort((a, b) => {
      const delta = Date.parse(a.dueDate) - Date.parse(b.dueDate);
      return (sort === 'oldest' ? delta : -delta) || a.id.localeCompare(b.id);
    });
}
