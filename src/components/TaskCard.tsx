import React, { memo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAppDispatch } from '../store';
import {
  completeTask,
  archiveTask,
  deleteTask,
  TaskItem,
} from '../store/tasksSlice';
import { formatTime } from '../utils/dateTime';
import { showAddModal } from '../navigation/routes';

export const TaskCard = memo(function TaskCardContent({
  task,
  overdue = false,
  history = false,
  onEdit,
}: {
  task: TaskItem;
  overdue?: boolean;
  history?: boolean;
  onEdit?: (task: TaskItem) => void;
}) {
  const dispatch = useAppDispatch();
  const due = new Date(task.dueDate);
  const isCompletedOrDeleted = Boolean(task.completedAt || task.deletedAt);
  const canEdit = !history && !isCompletedOrDeleted;

  const handleEditPress = () => {
    if (canEdit) {
      if (onEdit) {
        onEdit(task);
      } else {
        showAddModal(task).catch(() => {});
      }
    }
  };

  return (
    <View
      style={[styles.card, overdue && styles.overdueCard]}
      testID={`task-card-${task.id}`}
    >
      <Pressable
        accessibilityRole={canEdit ? 'button' : undefined}
        accessibilityLabel={canEdit ? `Edit task ${task.title}` : undefined}
        testID={canEdit ? `edit-${task.id}` : undefined}
        disabled={!canEdit}
        onPress={handleEditPress}
        style={styles.details}
      >
        <View style={styles.titleRow}>
          <Text style={styles.title} numberOfLines={2}>
            {task.title}
          </Text>
          {canEdit && (
            <Text style={styles.editPencil} testID={`edit-icon-${task.id}`}>
              ✎
            </Text>
          )}
        </View>
        {task.description ? (
          <Text style={styles.description} numberOfLines={2}>
            {task.description}
          </Text>
        ) : null}
        <Text style={[styles.time, overdue && styles.overdueText]}>
          {overdue || history
            ? `${due.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                ...(history ? { year: 'numeric' as const } : {}),
              })} · `
            : ''}
          {formatTime(due)}
        </Text>
        {history ? (
          <Text
            style={[
              styles.status,
              task.deletedAt ? styles.overdueText : styles.doneText,
            ]}
          >
            {task.deletedAt ? 'Deleted' : 'Completed'}
            {task.category ? ` · ${task.category}` : ''}
          </Text>
        ) : null}
      </Pressable>
      <View style={styles.actions}>
        {!history && (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Mark ${task.title} done`}
            testID={`done-${task.id}`}
            onPress={() => dispatch(completeTask(task.id))}
            style={styles.done}
          >
            <Text style={styles.doneText}>Done</Text>
          </Pressable>
        )}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${history ? 'Permanently delete' : 'Delete'} ${
            task.title
          }`}
          testID={`delete-${task.id}`}
          onPress={() =>
            dispatch(history ? deleteTask(task.id) : archiveTask(task.id))
          }
          style={styles.delete}
        >
          <View accessible={false} style={styles.trashLid} />
          <View accessible={false} style={styles.trashBody}>
            <View style={styles.trashLine} />
            <View style={styles.trashLine} />
          </View>
        </Pressable>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
    gap: 12,
  },
  overdueCard: { borderColor: '#fecaca', backgroundColor: '#fffafa' },
  details: { flex: 1 },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: { flex: 1, fontSize: 15, fontWeight: '600', color: '#1e293b' },
  editPencil: {
    fontSize: 14,
    color: '#94a3b8',
    marginLeft: 6,
  },
  description: { fontSize: 13, lineHeight: 19, color: '#64748b', marginTop: 4 },
  time: { fontSize: 12, fontWeight: '500', color: '#64748b', marginTop: 8 },
  overdueText: { color: '#dc2626' },
  status: { fontSize: 12, marginTop: 6 },
  actions: { alignItems: 'center', gap: 4 },
  done: {
    minWidth: 62,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    backgroundColor: '#ecfdf5',
  },
  doneText: { fontSize: 13, fontWeight: '600', color: '#15803d' },
  delete: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  trashLid: {
    width: 18,
    height: 2,
    backgroundColor: '#dc2626',
    marginBottom: 2,
  },
  trashBody: {
    width: 14,
    height: 15,
    borderWidth: 1.5,
    borderColor: '#dc2626',
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    paddingVertical: 2,
  },
  trashLine: { width: 1, backgroundColor: '#dc2626' },
});
