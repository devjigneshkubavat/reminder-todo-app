import reducer, {
  archiveTask,
  completeTask,
  deleteTask,
  TaskItem,
} from '../src/store/tasksSlice';
import { groupTasks } from '../src/utils/taskSections';
import {
  EMPTY_HISTORY_FILTER,
  historyFilterError,
  selectHistory,
} from '../src/utils/history';

const make = (id: string, day: number, hour = 10): TaskItem => ({
  id,
  title: id,
  dueDate: new Date(2026, 8, day, hour).toISOString(),
  createdAt: new Date().toISOString(),
  priority: 'normal',
  occurOnce: true,
});

test('deletion archives until history permanently deletes; completion is not allowed after deletion', () => {
  const initial = { items: [make('one', 24), make('two', 24)] };
  const archived = reducer(initial, archiveTask('one'));
  expect(archived.items).toHaveLength(2);
  expect(archived.items[0].deletedAt).toBeTruthy();
  expect(reducer(archived, completeTask('one'))).toEqual(archived);
  expect(
    groupTasks(archived.items, new Date(2026, 8, 24, 9).getTime()).today.map(
      t => t.id,
    ),
  ).toEqual(['two']);
  expect(
    selectHistory(archived.items, EMPTY_HISTORY_FILTER, 'newest').map(
      t => t.id,
    ),
  ).toEqual(['one']);
  expect(reducer(archived, deleteTask('one')).items.map(t => t.id)).toEqual([
    'two',
  ]);
});

test('history includes completed and deleted tasks, sorts scheduled time and filters inclusive local dates and categories', () => {
  const items = [
    { ...make('early', 24, 1), completedAt: 'done', category: 'Work' },
    { ...make('late', 24, 23), deletedAt: 'deleted', category: 'Work' },
    { ...make('other', 25), completedAt: 'done' },
    make('active', 24),
  ];
  expect(
    selectHistory(items, EMPTY_HISTORY_FILTER, 'newest').map(t => t.id),
  ).toEqual(['other', 'late', 'early']);
  const filter = { category: 'Work', from: '2026-09-24', to: '2026-09-24' };
  expect(selectHistory(items, filter, 'oldest').map(t => t.id)).toEqual([
    'early',
    'late',
  ]);
  expect(
    selectHistory(
      items,
      { ...EMPTY_HISTORY_FILTER, category: '' },
      'newest',
    ).map(t => t.id),
  ).toEqual(['other']);
  expect(items[0].id).toBe('early');
});

test('validates dates and reversed ranges', () => {
  expect(
    historyFilterError({ category: null, from: '2026-02-30', to: '' }),
  ).toBeTruthy();
  expect(
    historyFilterError({
      category: null,
      from: '2026-09-25',
      to: '2026-09-24',
    }),
  ).toBeTruthy();
  expect(
    historyFilterError({ category: null, from: '2028-02-29', to: '' }),
  ).toBeUndefined();
});
