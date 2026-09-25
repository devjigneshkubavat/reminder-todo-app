import React, { useEffect, useMemo, useState } from 'react';
import {
  AppState,
  SectionList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TaskCard } from '../components/TaskCard';
import { useAppSelector } from '../store';
import { groupTasks, TaskSectionKey } from '../utils/taskSections';
import { getGreeting } from '../utils/greeting';

interface HomeScreenProps {
  onNotificationPress?: () => void;
}

export function HomeScreen({ onNotificationPress }: HomeScreenProps) {
  const [greeting, setGreeting] = useState(() => getGreeting());
  const [now, setNow] = useState(Date.now);
  const [overdueExpanded, setOverdueExpanded] = useState(false);
  const tasks = useAppSelector(state => state.tasks.items);
  const groups = useMemo(() => groupTasks(tasks, now), [tasks, now]);
  const sections = useMemo(
    () => [
      {
        key: 'today' as TaskSectionKey,
        title: "Today's tasks",
        data: groups.today,
        count: groups.today.length,
        empty: 'No tasks for today. Enjoy your day!',
      },
      {
        key: 'tomorrow' as TaskSectionKey,
        title: 'Upcoming · Tomorrow',
        data: groups.tomorrow,
        count: groups.tomorrow.length,
        empty: 'Nothing scheduled for tomorrow.',
      },
      {
        key: 'overdue' as TaskSectionKey,
        title: 'Overdue',
        data: overdueExpanded ? groups.overdue : [],
        count: groups.overdue.length,
        empty: 'You’re all caught up.',
      },
    ],
    [groups, overdueExpanded],
  );

  useEffect(() => {
    const updateGreeting = () => {
      setGreeting(getGreeting());
      setNow(Date.now());
    };
    const subscription = AppState.addEventListener('change', state => {
      if (state === 'active') updateGreeting();
    });
    const interval = setInterval(updateGreeting, 60000);
    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, []);

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.headerRow}>
        <Text accessibilityRole="header" style={styles.greetingText}>
          {greeting}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Notifications"
          testID="notification-button"
          onPress={onNotificationPress}
          style={({ pressed }) => [
            styles.notificationButton,
            pressed && styles.notificationButtonPressed,
          ]}
        >
          <Text style={styles.notificationIcon}>🔔</Text>
          <View style={styles.badgeDot} />
        </Pressable>
      </View>
      <SectionList
        style={styles.content}
        contentContainerStyle={styles.taskList}
        sections={sections}
        keyExtractor={item => item.id}
        stickySectionHeadersEnabled={false}
        initialNumToRender={8}
        windowSize={7}
        renderItem={({ item, section }) => (
          <TaskCard task={item} overdue={section.key === 'overdue'} />
        )}
        renderSectionHeader={({ section }) =>
          section.key === 'overdue' ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Overdue tasks"
              accessibilityState={{ expanded: overdueExpanded }}
              testID="overdue-toggle"
              onPress={() => setOverdueExpanded(value => !value)}
              style={styles.sectionHeader}
            >
              <Text style={[styles.sectionTitle, styles.overdueText]}>
                {section.title}
              </Text>
              <Text style={[styles.count, styles.overdueText]}>
                {section.count} {overdueExpanded ? '▴' : '▾'}
              </Text>
            </Pressable>
          ) : (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
              <Text style={styles.count}>{section.count}</Text>
            </View>
          )
        }
        renderSectionFooter={({ section }) =>
          section.count === 0 &&
          (section.key !== 'overdue' || overdueExpanded) ? (
            <Text style={styles.emptyText}>{section.empty}</Text>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 12,
  },
  greetingText: {
    fontSize: 26,
    fontWeight: '700',
    color: '#1d1d1d',
    flex: 1,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f5f5f7',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  notificationButtonPressed: {
    backgroundColor: '#e5e5ea',
  },
  notificationIcon: {
    fontSize: 20,
  },
  badgeDot: {
    position: 'absolute',
    top: 9,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff3b30',
  },
  taskList: { paddingHorizontal: 24, paddingBottom: 48 },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
    marginTop: 12,
    marginBottom: 4,
  },
  sectionTitle: { fontSize: 17, fontWeight: '600', color: '#1e293b' },
  count: { fontSize: 13, fontWeight: '600', color: '#64748b' },
  overdueText: { color: '#dc2626' },
  emptyText: {
    fontSize: 13,
    color: '#64748b',
    paddingVertical: 12,
    paddingBottom: 20,
  },
  content: {
    flex: 1,
  },
});
