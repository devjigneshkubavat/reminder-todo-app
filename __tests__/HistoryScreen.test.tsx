import React from 'react';
import Renderer, { act } from 'react-test-renderer';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import tasksReducer, { TaskItem } from '../src/store/tasksSlice';
import categoriesReducer from '../src/store/categoriesSlice';
import { HistoryScreen } from '../src/screens/HistoryScreen';

test('history hides Done, deletes permanently and applies/reset date filters in its sheet', () => {
  const task: TaskItem = {
    id: 'past',
    title: 'Finished',
    dueDate: new Date(2026, 8, 24).toISOString(),
    createdAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    priority: 'normal',
    occurOnce: true,
  };
  const store = configureStore({
    reducer: { tasks: tasksReducer, categories: categoriesReducer },
    preloadedState: { tasks: { items: [task] } },
  });
  let renderer!: Renderer.ReactTestRenderer;
  act(() => {
    renderer = Renderer.create(
      <Provider store={store}>
        <HistoryScreen />
      </Provider>,
    );
  });
  try {
    const root = renderer.root;
    expect(root.findAllByProps({ testID: 'done-past' })).toHaveLength(0);
    act(() =>
      root
        .findByProps({ accessibilityLabel: 'Filter history' })
        .props.onPress(),
    );
    act(() =>
      root
        .findByProps({ testID: 'history-date-from' })
        .props.onChangeText('2026-09-25'),
    );
    act(() =>
      root.findByProps({ accessibilityLabel: 'Apply filters' }).props.onPress(),
    );
    expect(root.findAllByProps({ testID: 'task-card-past' })).toHaveLength(0);
    act(() =>
      root
        .findByProps({ accessibilityLabel: 'Filter history' })
        .props.onPress(),
    );
    act(() =>
      root.findByProps({ testID: 'history-date-from' }).props.onChangeText(''),
    );
    act(() =>
      root.findByProps({ accessibilityLabel: 'Apply filters' }).props.onPress(),
    );
    act(() => root.findByProps({ testID: 'delete-past' }).props.onPress());
    expect(store.getState().tasks.items).toHaveLength(0);
  } finally {
    act(() => renderer.unmount());
  }
});
