import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import tasksReducer, { TaskItem } from '../src/store/tasksSlice';
import { TaskCard } from '../src/components/TaskCard';
import * as routes from '../src/navigation/routes';

jest.mock('../src/navigation/routes', () => ({
  showAddModal: jest.fn(() => Promise.resolve()),
}));

describe('Task Editing', () => {
  let activeRenderer: ReactTestRenderer.ReactTestRenderer | null = null;

  function renderCard(task: TaskItem, props: { overdue?: boolean; history?: boolean } = {}) {
    const store = configureStore({
      reducer: { tasks: tasksReducer },
      preloadedState: { tasks: { items: [task] } },
    });

    ReactTestRenderer.act(() => {
      activeRenderer = ReactTestRenderer.create(
        <Provider store={store}>
          <TaskCard task={task} {...props} />
        </Provider>,
      );
    });

    return { store, renderer: activeRenderer! };
  }

  afterEach(() => {
    if (activeRenderer) {
      ReactTestRenderer.act(() => {
        activeRenderer?.unmount();
      });
      activeRenderer = null;
    }
    jest.clearAllMocks();
  });

  const baseTask: TaskItem = {
    id: 'task-1',
    title: 'Review Project Proposal',
    description: 'Check budget and timeline',
    dueDate: new Date(Date.now() + 3600000).toISOString(),
    priority: 'high',
    occurOnce: true,
    createdAt: new Date().toISOString(),
  };

  test('allows editing today or upcoming active tasks and opens edit modal', () => {
    const { renderer } = renderCard(baseTask);
    const root = renderer.root;

    const editPressable = root.findByProps({ testID: 'edit-task-1' });
    expect(editPressable.props.disabled).toBe(false);

    const editIcon = root.findByProps({ testID: 'edit-icon-task-1' });
    expect(editIcon).toBeTruthy();

    ReactTestRenderer.act(() => {
      editPressable.props.onPress();
    });

    expect(routes.showAddModal).toHaveBeenCalledWith(baseTask);
  });

  test('allows editing overdue active tasks', () => {
    const overdueTask: TaskItem = {
      ...baseTask,
      id: 'task-overdue-1',
      title: 'Submit Tax Returns',
      dueDate: new Date(Date.now() - 86400000).toISOString(),
    };

    const { renderer } = renderCard(overdueTask, { overdue: true });
    const root = renderer.root;

    const editPressable = root.findByProps({ testID: 'edit-task-overdue-1' });
    expect(editPressable.props.disabled).toBe(false);

    ReactTestRenderer.act(() => {
      editPressable.props.onPress();
    });

    expect(routes.showAddModal).toHaveBeenCalledWith(overdueTask);
  });

  test('does not allow editing completed tasks (done tasks)', () => {
    const completedTask: TaskItem = {
      ...baseTask,
      id: 'task-completed-1',
      completedAt: new Date().toISOString(),
    };

    const { renderer } = renderCard(completedTask);
    const root = renderer.root;

    expect(root.findAllByProps({ testID: 'edit-task-completed-1' })).toHaveLength(0);
    expect(root.findAllByProps({ testID: 'edit-icon-task-completed-1' })).toHaveLength(0);
  });

  test('does not allow editing deleted tasks', () => {
    const deletedTask: TaskItem = {
      ...baseTask,
      id: 'task-deleted-1',
      deletedAt: new Date().toISOString(),
    };

    const { renderer } = renderCard(deletedTask);
    const root = renderer.root;

    expect(root.findAllByProps({ testID: 'edit-task-deleted-1' })).toHaveLength(0);
    expect(root.findAllByProps({ testID: 'edit-icon-task-deleted-1' })).toHaveLength(0);
  });

  test('does not allow editing tasks when viewed in history', () => {
    const historyTask: TaskItem = {
      ...baseTask,
      id: 'task-hist-1',
    };

    const { renderer } = renderCard(historyTask, { history: true });
    const root = renderer.root;

    expect(root.findAllByProps({ testID: 'edit-task-hist-1' })).toHaveLength(0);
    expect(root.findAllByProps({ testID: 'edit-icon-task-hist-1' })).toHaveLength(0);
  });
});
