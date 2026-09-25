import React from 'react';
import Renderer, { act } from 'react-test-renderer';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import tasksReducer, { TaskItem } from '../src/store/tasksSlice';
import { HomeScreen } from '../src/screens/HomeScreen';

test('overdue starts collapsed, expands, completes into history, and supports deletion', () => {
  const makeTask = (id: string): TaskItem => ({
    id,
    title: id,
    description: 'Details',
    dueDate: new Date(Date.now() - 86400000).toISOString(),
    createdAt: new Date().toISOString(),
    priority: 'normal',
    occurOnce: true,
  });
  const store = configureStore({
    reducer: { tasks: tasksReducer },
    preloadedState: { tasks: { items: [makeTask('one'), makeTask('two')] } },
  });
  let renderer!: Renderer.ReactTestRenderer;
  act(() => {
    renderer = Renderer.create(
      <Provider store={store}>
        <HomeScreen />
      </Provider>,
    );
  });
  try {
    const root = renderer.root;
    expect(
      root.findByProps({ testID: 'overdue-toggle' }).props.accessibilityState
        .expanded,
    ).toBe(false);
    expect(root.findAllByProps({ testID: 'done-one' })).toHaveLength(0);
    act(() => root.findByProps({ testID: 'overdue-toggle' }).props.onPress());
    act(() => root.findByProps({ testID: 'done-one' }).props.onPress());
    expect(
      store.getState().tasks.items.find(t => t.id === 'one')?.completedAt,
    ).toBeTruthy();
    expect(root.findAllByProps({ testID: 'done-one' })).toHaveLength(0);
    act(() => root.findByProps({ testID: 'delete-two' }).props.onPress());
    expect(store.getState().tasks.items.map(t => t.id)).toEqual(['one', 'two']);
    expect(store.getState().tasks.items[1].deletedAt).toBeTruthy();
    expect(root.findAllByProps({ testID: 'delete-two' })).toHaveLength(0);
    act(() => root.findByProps({ testID: 'overdue-toggle' }).props.onPress());
    expect(
      root.findByProps({ testID: 'overdue-toggle' }).props.accessibilityState
        .expanded,
    ).toBe(false);
  } finally {
    act(() => renderer.unmount());
  }
});
