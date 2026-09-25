import tasksReducer, {
  addTask,
  deleteTask,
  TaskItem,
  updateTask,
} from '../src/store/tasksSlice';

describe('tasksSlice', () => {
  test('starts with empty list', () => {
    const state = tasksReducer(undefined, {type: 'INIT'});
    expect(state.items).toEqual([]);
  });

  test('adds a task with generated id and timestamp', () => {
    const state = tasksReducer(
      undefined,
      addTask({
        title: 'Buy groceries',
        description: 'Milk, eggs, bread',
        dueDate: '2026-09-23T10:00:00.000Z',
        category: 'Shopping',
        priority: 'high',
        occurOnce: true,
      }),
    );

    expect(state.items).toHaveLength(1);
    expect(state.items[0].title).toBe('Buy groceries');
    expect(state.items[0].category).toBe('Shopping');
    expect(state.items[0].priority).toBe('high');
    expect(state.items[0].id).toBeTruthy();
    expect(state.items[0].createdAt).toBeTruthy();
  });

  test('updates an existing task', () => {
    const initialTask: TaskItem = {
      id: 'task-1',
      title: 'Old Title',
      dueDate: '2026-09-23T10:00:00.000Z',
      priority: 'normal',
      occurOnce: true,
      createdAt: '2026-09-22T10:00:00.000Z',
    };

    const state = tasksReducer(
      {items: [initialTask]},
      updateTask({
        ...initialTask,
        title: 'Updated Title',
        priority: 'medium',
      }),
    );

    expect(state.items[0].title).toBe('Updated Title');
    expect(state.items[0].priority).toBe('medium');
  });

  test('deletes a task by id', () => {
    const task: TaskItem = {
      id: 'task-1',
      title: 'To be deleted',
      dueDate: '2026-09-23T10:00:00.000Z',
      priority: 'normal',
      occurOnce: true,
      createdAt: '2026-09-22T10:00:00.000Z',
    };

    const state = tasksReducer({items: [task]}, deleteTask('task-1'));
    expect(state.items).toHaveLength(0);
  });
});
