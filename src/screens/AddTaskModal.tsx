import React, { useMemo, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { Navigation } from 'react-native-navigation';
import { CategoryPicker } from '../components/CategoryPicker';
import { DateTimePickerModal } from '../components/DateTimePickerModal';
import { useAppDispatch } from '../store';
import { addTask, updateTask, TaskItem, TaskPriority } from '../store/tasksSlice';
import { createDefaultTaskDateTime, isTimeInPast } from '../utils/dateTime';

export interface AddTaskModalProps {
  componentId: string;
  taskToEdit?: TaskItem;
}

const WEEKDAYS = [
  { id: 0, label: 'M', name: 'Mon' },
  { id: 1, label: 'T', name: 'Tue' },
  { id: 2, label: 'W', name: 'Wed' },
  { id: 3, label: 'T', name: 'Thu' },
  { id: 4, label: 'F', name: 'Fri' },
  { id: 5, label: 'S', name: 'Sat' },
  { id: 6, label: 'S', name: 'Sun' },
];

const PRIORITIES: { key: TaskPriority; label: string; activeColor: string }[] =
  [
    { key: 'normal', label: 'Normal', activeColor: '#2563eb' },
    { key: 'medium', label: 'Medium', activeColor: '#d97706' },
    { key: 'high', label: 'High', activeColor: '#dc2626' },
  ];

export function AddTaskModal({ componentId, taskToEdit }: AddTaskModalProps) {
  const isEditMode = Boolean(taskToEdit);
  const { height } = useWindowDimensions();
  const [availableHeight, setAvailableHeight] = useState(height);
  const todayLabel = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  const dispatch = useAppDispatch();

  // Form states initialized with taskToEdit if editing
  const [title, setTitle] = useState(() => taskToEdit?.title ?? '');
  const [description, setDescription] = useState(
    () => taskToEdit?.description ?? '',
  );
  const [dateTime, setDateTime] = useState<Date>(() =>
    taskToEdit?.dueDate
      ? new Date(taskToEdit.dueDate)
      : createDefaultTaskDateTime(),
  );
  const [category, setCategory] = useState<string | undefined>(
    () => taskToEdit?.category,
  );
  const [priority, setPriority] = useState<TaskPriority>(
    () => taskToEdit?.priority ?? 'normal',
  );
  const [occurOnce, setOccurOnce] = useState(() => taskToEdit?.occurOnce ?? true);
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>(() =>
    taskToEdit?.weekdays?.length ? taskToEdit.weekdays : [1, 2, 3, 4, 5],
  );

  // Change detection for edit mode
  const hasChanges = useMemo(() => {
    if (!taskToEdit) {
      return true; // Adding new task always has changes relative to empty
    }

    if (title.trim() !== taskToEdit.title.trim()) return true;
    if (
      (description.trim() || undefined) !==
      (taskToEdit.description?.trim() || undefined)
    )
      return true;
    if (dateTime.getTime() !== new Date(taskToEdit.dueDate).getTime())
      return true;
    if ((category || undefined) !== (taskToEdit.category || undefined))
      return true;
    if (priority !== taskToEdit.priority) return true;
    if (occurOnce !== taskToEdit.occurOnce) return true;

    if (!occurOnce) {
      const initialDays = [...(taskToEdit.weekdays || [])]
        .sort((a, b) => a - b)
        .join(',');
      const currentDays = [...selectedWeekdays].sort((a, b) => a - b).join(',');
      if (currentDays !== initialDays) return true;
    }

    return false;
  }, [
    taskToEdit,
    title,
    description,
    dateTime,
    category,
    priority,
    occurOnce,
    selectedWeekdays,
  ]);

  // Validation
  const isTitleValid = title.trim().length > 0;
  // If editing an existing task, retaining its current due date is valid (even if overdue)
  const isTimeValid =
    !isTimeInPast(dateTime) ||
    (isEditMode &&
      Boolean(taskToEdit) &&
      dateTime.getTime() === new Date(taskToEdit!.dueDate).getTime());
  const isOccurrenceValid = occurOnce || selectedWeekdays.length > 0;
  const isFormValid = isTitleValid && isTimeValid && isOccurrenceValid;
  const isSaveDisabled = !isFormValid || (isEditMode && !hasChanges);

  const handleClose = () => {
    Navigation.dismissModal(componentId).catch(() => {});
  };

  const toggleWeekday = (dayId: number) => {
    setSelectedWeekdays(prev =>
      prev.includes(dayId) ? prev.filter(d => d !== dayId) : [...prev, dayId],
    );
  };

  const handleSave = () => {
    if (isSaveDisabled) return;

    if (isEditMode && taskToEdit) {
      dispatch(
        updateTask({
          ...taskToEdit,
          title: title.trim(),
          description: description.trim() || undefined,
          dueDate: dateTime.toISOString(),
          category,
          priority,
          occurOnce,
          weekdays: occurOnce
            ? undefined
            : selectedWeekdays.sort((a, b) => a - b),
        }),
      );
    } else {
      dispatch(
        addTask({
          title: title.trim(),
          description: description.trim() || undefined,
          dueDate: dateTime.toISOString(),
          category,
          priority,
          occurOnce,
          weekdays: occurOnce
            ? undefined
            : selectedWeekdays.sort((a, b) => a - b),
        }),
      );
    }

    handleClose();
  };

  return (
    <View style={styles.modalBackdrop}>
      <KeyboardAvoidingView
        enabled={Platform.OS === 'ios'}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardContainer}
      >
        <View
          style={styles.sheetViewport}
          onLayout={({ nativeEvent }) => {
            setAvailableHeight(nativeEvent.layout.height);
          }}
        >
          <View
            style={[
              styles.modalSheet,
              { height: Math.min(height * 0.92, availableHeight) },
            ]}
          >
            {/* Header on left side with close button on top right */}
            <View style={styles.headerBar}>
              <View style={styles.headerTitleContainer}>
                <Text accessibilityRole="header" style={styles.headerTitle}>
                  {isEditMode ? 'Edit Task' : 'Add Task'}
                </Text>
                <Text style={styles.headerSubtitle}>
                  {isEditMode ? 'Update task details' : `Today, ${todayLabel}`}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close"
                testID="close-modal-button"
                onPress={handleClose}
                hitSlop={10}
                style={styles.closeButton}
              >
                <Text style={styles.closeText}>×</Text>
              </Pressable>
            </View>

            {/* Form Scroll Area */}
            <ScrollView
              style={styles.scrollArea}
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              {/* Task Input (Mandatory) */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>
                  Task <Text style={styles.requiredIndicator}>*</Text>
                </Text>
                <TextInput
                  accessibilityLabel="Task Title"
                  testID="task-title-input"
                  style={styles.textInput}
                  placeholder="What do you need to do?"
                  placeholderTextColor="#94a3b8"
                  value={title}
                  onChangeText={setTitle}
                  returnKeyType="next"
                />
              </View>

              {/* Description (Optional) */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Description (Optional)</Text>
                <TextInput
                  accessibilityLabel="Task Description"
                  testID="task-description-input"
                  style={[styles.textInput, styles.multilineInput]}
                  placeholder="Add details, notes, or subtasks..."
                  placeholderTextColor="#94a3b8"
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>

              {/* Mandatory Date & Time Picker */}
              <DateTimePickerModal value={dateTime} onChange={setDateTime} />

              {/* Optional Category Dropdown */}
              <CategoryPicker
                selectedCategory={category}
                onSelectCategory={setCategory}
              />

              {/* Priority Selection */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Priority</Text>
                <View style={styles.priorityRow}>
                  {PRIORITIES.map(p => {
                    const isSelected = priority === p.key;
                    return (
                      <Pressable
                        key={p.key}
                        accessibilityRole="button"
                        accessibilityLabel={`Priority ${p.label}`}
                        testID={`priority-${p.key}`}
                        onPress={() => setPriority(p.key)}
                        style={[
                          styles.priorityButton,
                          isSelected && {
                            backgroundColor: p.activeColor,
                            borderColor: p.activeColor,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.priorityText,
                            isSelected && styles.priorityTextActive,
                          ]}
                        >
                          {p.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Occurrence */}
              <View style={styles.fieldGroup}>
                <Text style={styles.fieldLabel}>Occurrence</Text>
                <View style={styles.occurRow}>
                  <View>
                    <Text style={styles.occurTitle}>Occur once</Text>
                    <Text style={styles.occurSubtitle}>
                      {occurOnce
                        ? 'Does not repeat'
                        : 'Repeats weekly on selected days'}
                    </Text>
                  </View>
                  <Switch
                    accessibilityLabel="Occur once"
                    testID="occur-once-switch"
                    value={occurOnce}
                    onValueChange={setOccurOnce}
                    trackColor={{ false: '#cbd5e1', true: '#2563eb' }}
                    thumbColor="#ffffff"
                  />
                </View>

                {/* Weekdays pills: visible ONLY when occurOnce is false */}
                {!occurOnce ? (
                  <View
                    style={styles.weekdaysContainer}
                    testID="weekdays-container"
                  >
                    <Text style={styles.weekdaysInstruction}>
                      Select recurrence days:
                    </Text>
                    <View style={styles.weekdaysRow}>
                      {WEEKDAYS.map(day => {
                        const isSelected = selectedWeekdays.includes(day.id);
                        return (
                          <Pressable
                            key={day.id}
                            accessibilityRole="button"
                            accessibilityLabel={`Repeat on ${day.name}`}
                            testID={`weekday-${day.id}`}
                            onPress={() => toggleWeekday(day.id)}
                            style={[
                              styles.weekdayPill,
                              isSelected && styles.weekdayPillSelected,
                            ]}
                          >
                            <Text
                              style={[
                                styles.weekdayText,
                                isSelected && styles.weekdayTextSelected,
                              ]}
                            >
                              {day.label}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                    {selectedWeekdays.length === 0 ? (
                      <Text style={styles.errorText}>
                        Please select at least one weekday
                      </Text>
                    ) : null}
                  </View>
                ) : null}
              </View>
            </ScrollView>

            {/* Bottom Save Action */}
            <View style={styles.footerBar}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={isEditMode ? 'Save Changes' : 'Save Task'}
                accessibilityState={{ disabled: isSaveDisabled }}
                testID="save-task-button"
                disabled={isSaveDisabled}
                onPress={handleSave}
                style={[
                  styles.saveButton,
                  isSaveDisabled && styles.saveButtonDisabled,
                ]}
              >
                <Text
                  style={[
                    styles.saveButtonText,
                    isSaveDisabled && styles.saveButtonTextDisabled,
                  ]}
                >
                  {isEditMode ? 'Save Changes' : 'Save Task'}
                </Text>
              </Pressable>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: '#00000066',
  },
  keyboardContainer: {
    flex: 1,
    minHeight: 0,
    width: '100%',
    justifyContent: 'flex-end',
  },
  sheetViewport: {
    flex: 1,
    minHeight: 0,
    justifyContent: 'flex-end',
  },
  modalSheet: {
    minHeight: 0,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#f1f5f9',
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
  },
  headerSubtitle: {
    marginTop: 4,
    fontSize: 12,
    color: '#64748b',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    fontSize: 22,
    color: '#64748b',
    fontWeight: '600',
    lineHeight: 24,
  },
  scrollArea: {
    flex: 1,
    minHeight: 0,
    paddingHorizontal: 24,
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 24,
  },
  fieldGroup: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  requiredIndicator: {
    color: '#dc2626',
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#0f172a',
    backgroundColor: '#f8fafc',
  },
  multilineInput: {
    minHeight: 80,
    paddingTop: 12,
  },
  priorityRow: {
    flexDirection: 'row',
    gap: 10,
  },
  priorityButton: {
    flex: 1,
    minHeight: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    alignItems: 'center',
    justifyContent: 'center',
  },
  priorityText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#475569',
  },
  priorityTextActive: {
    color: '#ffffff',
    fontWeight: '700',
  },
  occurRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  occurTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: '#1e293b',
  },
  occurSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  weekdaysContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#f8fafc',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  weekdaysInstruction: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
  },
  weekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  weekdayPill: {
    flex: 1,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  weekdayPillSelected: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  weekdayText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  weekdayTextSelected: {
    color: '#ffffff',
  },
  errorText: {
    fontSize: 12,
    color: '#dc2626',
    marginTop: 6,
    fontWeight: '500',
  },
  footerBar: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 24,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#f1f5f9',
    backgroundColor: '#ffffff',
  },
  saveButton: {
    height: 52,
    borderRadius: 14,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#2563eb',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  saveButtonDisabled: {
    backgroundColor: '#e2e8f0',
    elevation: 0,
    shadowOpacity: 0,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
  saveButtonTextDisabled: {
    color: '#94a3b8',
  },
});
