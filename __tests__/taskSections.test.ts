import { groupTasks } from '../src/utils/taskSections';
import reducer, {
  addTask,
  completeTask,
  deleteTask,
  TaskItem,
} from '../src/store/tasksSlice';

const task = (id: string, due: Date): TaskItem => ({
  id,
  title: id,
  dueDate: due.toISOString(),
  createdAt: due.toISOString(),
  priority: 'normal',
  occurOnce: true,
});

test('groups by local calendar days and minute precision across month boundaries', () => {
  const now = new Date(2026, 8, 30, 12, 0, 45);
  const tasks = [
    task('tomorrow', new Date(2026, 9, 1)),
    task('later', new Date(2026, 9, 2)),
    task('past', new Date(2026, 8, 30, 11, 59)),
    task('today', new Date(2026, 8, 30, 12)),
    { ...task('done', now), completedAt: now.toISOString() },
  ];
  const groups = groupTasks(tasks, now.getTime());
  expect(groups.today.map(t => t.id)).toEqual(['today']);
  expect(groups.tomorrow.map(t => t.id)).toEqual(['tomorrow']);
  expect(groups.overdue.map(t => t.id)).toEqual(['past']);
  expect(tasks[0].id).toBe('tomorrow');
});

test('completion preserves task data for history and deletion removes only its target', () => {
  const action = addTask({
    title: 'Saved task',
    description: 'Keep history',
    dueDate: new Date().toISOString(),
    priority: 'normal',
    occurOnce: true,
  });
  const initial = reducer(undefined, action);
  expect(reducer(undefined, action)).toEqual(initial);
  const id = initial.items[0].id;
  const done = reducer(initial, completeTask(id));
  expect(done.items[0]).toMatchObject(initial.items[0]);
  expect(done.items[0].completedAt).toBeTruthy();
  expect(reducer(done, completeTask(id))).toEqual(done);
  expect(groupTasks(done.items, Date.now()).today).toHaveLength(0);
  expect(reducer(done, deleteTask('missing'))).toEqual(done);
  expect(reducer(done, deleteTask(id)).items).toEqual([]);
});
