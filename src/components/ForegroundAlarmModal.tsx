import React, { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {Navigation} from 'react-native-navigation';
import {
  ActiveAlarmTask,
  addAlarmListener,
  applySnooze,
  handleMarkDone,
  handleOnIt,
} from '../services/notificationService';
import { formatTime } from '../utils/dateTime';

export function ForegroundAlarmModal({componentId}: {componentId?: string}) {
  const [alarmTask, setAlarmTask] = useState<ActiveAlarmTask | null>(null);
  const isVisible = React.useRef(true);

  useEffect(() => {
    if (!componentId) {
      return;
    }
    const appeared = Navigation.events().registerComponentDidAppearListener(event => {
      if (event.componentId === componentId) isVisible.current = true;
    });
    const disappeared = Navigation.events().registerComponentDidDisappearListener(event => {
      if (event.componentId === componentId) isVisible.current = false;
    });
    return () => {
      appeared.remove();
      disappeared.remove();
    };
  }, [componentId]);

  useEffect(() => {
    const unsubscribe = addAlarmListener(task => {
      if (isVisible.current) setAlarmTask(task);
    });
    return unsubscribe;
  }, []);

  if (!alarmTask) {
    return null;
  }

  const due = alarmTask.dueDate ? new Date(alarmTask.dueDate) : new Date();
  const timeFormatted = isNaN(due.getTime()) ? '' : formatTime(due);

  const onDonePress = async () => {
    const id = alarmTask.id;
    setAlarmTask(null);
    await handleMarkDone(id);
  };

  const onOnItPress = async () => {
    const id = alarmTask.id;
    setAlarmTask(null);
    await handleOnIt(id);
  };

  const onSnoozePress = async (minutes: number) => {
    const id = alarmTask.id;
    const taskDetails = {
      title: alarmTask.title,
      description: alarmTask.description,
      dueDate: alarmTask.dueDate,
    };
    setAlarmTask(null);
    await applySnooze(id, minutes, taskDetails);
  };

  return (
    <Modal
      transparent
      visible={Boolean(alarmTask)}
      animationType="fade"
      statusBarTranslucent
      // Do not cancel a ringing notification because Android temporarily
      // closes a React Native modal during full-screen alarm transitions.
      onRequestClose={() => {}}
    >
      <View style={styles.backdrop}>
        <View style={styles.card} testID="foreground-alarm-modal">
          {/* Header indicator */}
          <View style={styles.header}>
            <View style={styles.iconCircle}>
              <Text style={styles.alarmIcon}>⏰</Text>
            </View>
            <View style={styles.headerTextContainer}>
              <Text style={styles.badge}>TASK ALARM</Text>
              {timeFormatted ? (
                <Text style={styles.timeText}>{timeFormatted}</Text>
              ) : null}
            </View>
          </View>

          {/* Task Info */}
          <View style={styles.content}>
            <Text style={styles.title} numberOfLines={3}>
              {alarmTask.title}
            </Text>
            {alarmTask.description ? (
              <Text style={styles.description} numberOfLines={4}>
                {alarmTask.description}
              </Text>
            ) : null}
          </View>

          {/* Actions */}
          <View style={styles.actionsContainer}>
            {/* Primary Done Button */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Mark Done"
              testID="alarm-done-button"
              onPress={onDonePress}
              style={({ pressed }) => [
                styles.doneButton,
                pressed && styles.doneButtonPressed,
              ]}
            >
              <Text style={styles.doneButtonText}>✓ Done</Text>
            </Pressable>

            {/* On it Button */}
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="On it"
              testID="alarm-on-it-button"
              onPress={onOnItPress}
              style={({ pressed }) => [
                styles.onItButton,
                pressed && styles.onItButtonPressed,
              ]}
            >
              <Text style={styles.onItButtonText}>On it (Dismiss)</Text>
            </Pressable>

            {/* Snooze Options */}
            <View style={styles.snoozeSection}>
              <Text style={styles.snoozeLabel}>Snooze for:</Text>
              <View style={styles.snoozeButtonsRow}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Snooze 5 minutes"
                  testID="snooze-5-button"
                  onPress={() => onSnoozePress(5)}
                  style={({ pressed }) => [
                    styles.snoozePill,
                    pressed && styles.snoozePillPressed,
                  ]}
                >
                  <Text style={styles.snoozePillText}>5 min</Text>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Snooze 10 minutes"
                  testID="snooze-10-button"
                  onPress={() => onSnoozePress(10)}
                  style={({ pressed }) => [
                    styles.snoozePill,
                    pressed && styles.snoozePillPressed,
                  ]}
                >
                  <Text style={styles.snoozePillText}>10 min</Text>
                </Pressable>

                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Snooze 15 minutes"
                  testID="snooze-15-button"
                  onPress={() => onSnoozePress(15)}
                  style={({ pressed }) => [
                    styles.snoozePill,
                    pressed && styles.snoozePillPressed,
                  ]}
                >
                  <Text style={styles.snoozePillText}>15 min</Text>
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fef2f2',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#fee2e2',
  },
  alarmIcon: {
    fontSize: 24,
  },
  headerTextContainer: {
    flex: 1,
  },
  badge: {
    fontSize: 11,
    fontWeight: '800',
    color: '#dc2626',
    letterSpacing: 0.8,
  },
  timeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
    marginTop: 2,
  },
  content: {
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    lineHeight: 24,
  },
  description: {
    fontSize: 14,
    color: '#475569',
    marginTop: 6,
    lineHeight: 20,
  },
  actionsContainer: {
    gap: 10,
  },
  doneButton: {
    backgroundColor: '#16a34a',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  doneButtonPressed: {
    backgroundColor: '#15803d',
  },
  doneButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  onItButton: {
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  onItButtonPressed: {
    backgroundColor: '#e2e8f0',
  },
  onItButtonText: {
    color: '#334155',
    fontSize: 14,
    fontWeight: '600',
  },
  snoozeSection: {
    marginTop: 6,
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: '#f1f5f9',
  },
  snoozeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
    textAlign: 'center',
  },
  snoozeButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  snoozePill: {
    flex: 1,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  snoozePillPressed: {
    backgroundColor: '#dbeafe',
  },
  snoozePillText: {
    color: '#2563eb',
    fontSize: 13,
    fontWeight: '700',
  },
});
