import { TaskItem } from '../store/tasksSlice';

export type TaskSectionKey = 'today' | 'tomorrow' | 'overdue';

export function groupTasks(tasks: TaskItem[], now: number) {
  const tomorrow = new Date(now);
  tomorrow.setHours(0, 0, 0, 0);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const afterTomorrow = new Date(tomorrow);
  afterTomorrow.setDate(afterTomorrow.getDate() + 1);
  const groups: Record<TaskSectionKey, TaskItem[]> = {
    today: [],
    tomorrow: [],
    overdue: [],
  };
  const currentMinute = Math.floor(now / 60000);
  for (const task of tasks) {
    if (task.completedAt || task.deletedAt) continue;
    const due = Date.parse(task.dueDate);
    if (!Number.isFinite(due)) continue;
    if (Math.floor(due / 60000) < currentMinute) groups.overdue.push(task);
    else if (due < tomorrow.getTime()) groups.today.push(task);
    else if (due < afterTomorrow.getTime()) groups.tomorrow.push(task);
  }
  for (const items of Object.values(groups)) {
    items.sort((a, b) => Date.parse(a.dueDate) - Date.parse(b.dueDate));
  }
  return groups;
}
