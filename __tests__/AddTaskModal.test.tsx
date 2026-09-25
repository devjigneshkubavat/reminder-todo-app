import React from 'react';
import ReactTestRenderer from 'react-test-renderer';
import {Provider} from 'react-redux';
import {configureStore} from '@reduxjs/toolkit';
import {Switch} from 'react-native';
import {Navigation} from 'react-native-navigation';
import {AddTaskModal} from '../src/screens/AddTaskModal';
import categoriesReducer from '../src/store/categoriesSlice';
import tasksReducer from '../src/store/tasksSlice';

jest.mock('react-native-navigation', () => ({
  Navigation: {
    dismissModal: jest.fn(() => Promise.resolve()),
  },
}));

describe('AddTaskModal', () => {
  let activeRenderer: ReactTestRenderer.ReactTestRenderer | null = null;

  function renderWithStore(
    ui: React.ReactElement,
    initialTasks: any[] = [],
  ) {
    const store = configureStore({
      reducer: {
        categories: categoriesReducer,
        tasks: tasksReducer,
      },
      preloadedState: {
        tasks: { items: initialTasks },
      },
    });

    ReactTestRenderer.act(() => {
      activeRenderer = ReactTestRenderer.create(
        <Provider store={store}>{ui}</Provider>,
      );
    });

    return {store, renderer: activeRenderer!};
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

  test('renders header on left and close button on right', () => {
    const {renderer} = renderWithStore(<AddTaskModal componentId="modal-1" />);
    const root = renderer.root;

    const header = root.findByProps({accessibilityRole: 'header'});
    expect(header.props.children).toBe('Add Task');

    const closeBtn = root.findByProps({testID: 'close-modal-button'});
    expect(closeBtn).toBeTruthy();

    ReactTestRenderer.act(() => {
      closeBtn.props.onPress();
    });
    expect(Navigation.dismissModal).toHaveBeenCalledWith('modal-1');
  });

  test('keeps save button disabled until task title is entered', () => {
    const {renderer} = renderWithStore(<AddTaskModal componentId="modal-1" />);
    const root = renderer.root;

    const saveBtn = root.findByProps({testID: 'save-task-button'});
    expect(saveBtn.props.disabled).toBe(true);

    const titleInput = root.findByProps({testID: 'task-title-input'});
    ReactTestRenderer.act(() => {
      titleInput.props.onChangeText('Doctor appointment');
    });

    const updatedSaveBtn = root.findByProps({testID: 'save-task-button'});
    expect(updatedSaveBtn.props.disabled).toBe(false);
  });

  test('allows entering optional description', () => {
    const {renderer} = renderWithStore(<AddTaskModal componentId="modal-1" />);
    const root = renderer.root;

    const descInput = root.findByProps({testID: 'task-description-input'});
    expect(descInput.props.placeholder).toBe('Add details, notes, or subtasks...');

    ReactTestRenderer.act(() => {
      descInput.props.onChangeText('Bring medical records');
    });
    expect(descInput.props.value).toBe('Bring medical records');
  });

  test('allows selecting priority from 3 options (Normal, Medium, High)', () => {
    const {renderer} = renderWithStore(<AddTaskModal componentId="modal-1" />);
    const root = renderer.root;

    const highPriorityBtn = root.findByProps({testID: 'priority-high'});
    ReactTestRenderer.act(() => {
      highPriorityBtn.props.onPress();
    });

    const mediumPriorityBtn = root.findByProps({testID: 'priority-medium'});
    ReactTestRenderer.act(() => {
      mediumPriorityBtn.props.onPress();
    });
    expect(mediumPriorityBtn).toBeTruthy();
  });

  test('toggling occur once switch reveals weekdays selector', () => {
    const {renderer} = renderWithStore(<AddTaskModal componentId="modal-1" />);
    const root = renderer.root;

    // Initially occur once is true -> weekdays are hidden
    expect(() => root.findByProps({testID: 'weekdays-container'})).toThrow();

    const occurSwitch = root.findByType(Switch);
    ReactTestRenderer.act(() => {
      occurSwitch.props.onValueChange(false);
    });

    // Now weekdays container is visible
    expect(root.findByProps({testID: 'weekdays-container'})).toBeTruthy();
    const mondayPill = root.findByProps({testID: 'weekday-0'});
    expect(mondayPill).toBeTruthy();
  });

  test('dispatches task to store and dismisses modal on save', () => {
    const {store, renderer} = renderWithStore(
      <AddTaskModal componentId="modal-1" />,
    );
    const root = renderer.root;

    const titleInput = root.findByProps({testID: 'task-title-input'});
    ReactTestRenderer.act(() => {
      titleInput.props.onChangeText('Workout session');
    });

    const descInput = root.findByProps({testID: 'task-description-input'});
    ReactTestRenderer.act(() => {
      descInput.props.onChangeText('Leg day at the gym');
    });

    const saveBtn = root.findByProps({testID: 'save-task-button'});
    expect(saveBtn.props.disabled).toBe(false);

    ReactTestRenderer.act(() => {
      saveBtn.props.onPress();
    });

    const tasks = store.getState().tasks.items;
    expect(tasks).toHaveLength(1);
    expect(tasks[0].title).toBe('Workout session');
    expect(tasks[0].description).toBe('Leg day at the gym');
    expect(tasks[0].priority).toBe('normal');
    expect(Navigation.dismissModal).toHaveBeenCalledWith('modal-1');
  });

  describe('Edit Mode', () => {
    const existingTask = {
      id: 'existing-task-1',
      title: 'Original Title',
      description: 'Original Description',
      dueDate: new Date(Date.now() + 3600000).toISOString(),
      priority: 'normal' as const,
      occurOnce: true,
      category: 'Work',
      createdAt: new Date().toISOString(),
    };

    test('prefills details and shows Edit Task header in edit mode', () => {
      const {renderer} = renderWithStore(
        <AddTaskModal componentId="modal-edit-1" taskToEdit={existingTask} />,
      );
      const root = renderer.root;

      const header = root.findByProps({accessibilityRole: 'header'});
      expect(header.props.children).toBe('Edit Task');

      const titleInput = root.findByProps({testID: 'task-title-input'});
      expect(titleInput.props.value).toBe('Original Title');

      const descInput = root.findByProps({testID: 'task-description-input'});
      expect(descInput.props.value).toBe('Original Description');
    });

    test('keeps save button disabled initially until a detail is changed', () => {
      const {renderer} = renderWithStore(
        <AddTaskModal componentId="modal-edit-2" taskToEdit={existingTask} />,
      );
      const root = renderer.root;

      const saveBtn = root.findByProps({testID: 'save-task-button'});
      expect(saveBtn.props.disabled).toBe(true);

      const titleInput = root.findByProps({testID: 'task-title-input'});
      // Change title
      ReactTestRenderer.act(() => {
        titleInput.props.onChangeText('Modified Title');
      });

      const updatedSaveBtn = root.findByProps({testID: 'save-task-button'});
      expect(updatedSaveBtn.props.disabled).toBe(false);

      // Revert title back to original
      ReactTestRenderer.act(() => {
        titleInput.props.onChangeText('Original Title');
      });

      const revertedSaveBtn = root.findByProps({testID: 'save-task-button'});
      expect(revertedSaveBtn.props.disabled).toBe(true);
    });

    test('enables save button when priority is changed and dispatches updateTask', () => {
      const {store, renderer} = renderWithStore(
        <AddTaskModal componentId="modal-edit-3" taskToEdit={existingTask} />,
        [existingTask],
      );
      const root = renderer.root;

      // Change priority to high
      const highPriorityBtn = root.findByProps({testID: 'priority-high'});
      ReactTestRenderer.act(() => {
        highPriorityBtn.props.onPress();
      });

      const saveBtn = root.findByProps({testID: 'save-task-button'});
      expect(saveBtn.props.disabled).toBe(false);

      ReactTestRenderer.act(() => {
        saveBtn.props.onPress();
      });

      const tasks = store.getState().tasks.items;
      const updated = tasks.find(t => t.id === 'existing-task-1');
      expect(updated?.priority).toBe('high');
      expect(Navigation.dismissModal).toHaveBeenCalledWith('modal-edit-3');
    });

    test('allows editing an overdue task without time-in-past validation blocking save', () => {
      const overdueTask = {
        id: 'overdue-1',
        title: 'Overdue Task',
        dueDate: new Date(Date.now() - 3600000).toISOString(),
        priority: 'medium' as const,
        occurOnce: true,
        createdAt: new Date().toISOString(),
      };

      const {store, renderer} = renderWithStore(
        <AddTaskModal componentId="modal-overdue" taskToEdit={overdueTask} />,
        [overdueTask],
      );
      const root = renderer.root;

      const titleInput = root.findByProps({testID: 'task-title-input'});
      ReactTestRenderer.act(() => {
        titleInput.props.onChangeText('Updated Overdue Task');
      });

      const saveBtn = root.findByProps({testID: 'save-task-button'});
      expect(saveBtn.props.disabled).toBe(false);

      ReactTestRenderer.act(() => {
        saveBtn.props.onPress();
      });

      const tasks = store.getState().tasks.items;
      const updated = tasks.find(t => t.id === 'overdue-1');
      expect(updated?.title).toBe('Updated Overdue Task');
      expect(Navigation.dismissModal).toHaveBeenCalledWith('modal-overdue');
    });
  });
});
