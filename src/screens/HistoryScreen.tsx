import React, { useMemo, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TaskCard } from '../components/TaskCard';
import { useAppSelector } from '../store';
import {
  dateKey,
  EMPTY_HISTORY_FILTER,
  HistoryFilter,
  HistorySort,
  historyFilterError,
  selectHistory,
} from '../utils/history';

export function HistoryScreen() {
  const tasks = useAppSelector(state => state.tasks.items);
  const categories = useAppSelector(state => state.categories.items);
  const [filter, setFilter] = useState<HistoryFilter>(EMPTY_HISTORY_FILTER);
  const [draft, setDraft] = useState<HistoryFilter>(EMPTY_HISTORY_FILTER);
  const [sort, setSort] = useState<HistorySort>('newest');
  const [sheet, setSheet] = useState<'filter' | 'sort' | null>(null);
  const [dateMode, setDateMode] = useState<'single' | 'range'>('range');
  const items = useMemo(
    () => selectHistory(tasks, filter, sort),
    [tasks, filter, sort],
  );
  const categoryOptions = useMemo(
    () =>
      [
        ...new Set([
          ...categories,
          ...tasks
            .filter(task => task.completedAt || task.deletedAt)
            .map(task => task.category)
            .filter((category): category is string => !!category),
        ]),
      ].sort(),
    [categories, tasks],
  );
  const error = historyFilterError(draft);
  const filtered = filter.category !== null || !!filter.from || !!filter.to;
  const openFilter = () => {
    setDraft({ ...filter });
    setDateMode(filter.from && filter.from === filter.to ? 'single' : 'range');
    setSheet('filter');
  };
  const preset = (days: number) => {
    const end = new Date();
    const start = new Date(end);
    start.setDate(start.getDate() - days + 1);
    setDateMode(days === 1 ? 'single' : 'range');
    setDraft(current => ({
      ...current,
      from: dateKey(start),
      to: dateKey(end),
    }));
  };
  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.header}>
        <Text accessibilityRole="header" style={styles.title}>
          History
        </Text>
        <Text style={styles.subtitle}>Completed and deleted tasks</Text>
        <View style={styles.toolbar}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Filter history"
            onPress={openFilter}
            style={[styles.tool, filtered && styles.selected]}
          >
            <Text style={styles.toolText}>Filter{filtered ? ' •' : ''}</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Sort history"
            onPress={() => setSheet('sort')}
            style={styles.tool}
          >
            <Text style={styles.toolText}>
              Sort · {sort === 'newest' ? 'Newest' : 'Oldest'}
            </Text>
          </Pressable>
        </View>
        <Text style={styles.summary}>
          {items.length} {items.length === 1 ? 'task' : 'tasks'}
          {filter.category !== null
            ? ` · ${filter.category || 'Uncategorized'}`
            : ''}
          {filter.from || filter.to
            ? ` · ${filter.from || 'Any date'} – ${filter.to || 'Any date'}`
            : ''}
        </Text>
        {filtered ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => setFilter(EMPTY_HISTORY_FILTER)}
            style={styles.clear}
          >
            <Text style={styles.link}>Clear filters</Text>
          </Pressable>
        ) : null}
      </View>
      <FlatList
        data={items}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <TaskCard task={item} history />}
        contentContainerStyle={styles.list}
        initialNumToRender={8}
        windowSize={7}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>
              {filtered ? 'No matching tasks' : 'Your history starts here'}
            </Text>
            <Text style={styles.subtitle}>
              {filtered
                ? 'Try another category or date range.'
                : 'Tasks you complete or delete will appear here.'}
            </Text>
          </View>
        }
      />
      <Modal
        visible={sheet !== null}
        transparent
        animationType="slide"
        onRequestClose={() => setSheet(null)}
      >
        <KeyboardAvoidingView
          style={styles.backdrop}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close options"
            style={StyleSheet.absoluteFill}
            onPress={() => setSheet(null)}
          />
          <SafeAreaView edges={['bottom']} style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text accessibilityRole="header" style={styles.sheetTitle}>
                {sheet === 'filter' ? 'Filter history' : 'Sort history'}
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Close options sheet"
                onPress={() => setSheet(null)}
                style={styles.close}
              >
                <Text style={styles.closeText}>×</Text>
              </Pressable>
            </View>
            {sheet === 'sort' ? (
              <View style={styles.sortOptions}>
                <Text style={styles.subtitle}>By scheduled date and time</Text>
                {(['newest', 'oldest'] as HistorySort[]).map(option => (
                  <Pressable
                    key={option}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: sort === option }}
                    onPress={() => {
                      setSort(option);
                      setSheet(null);
                    }}
                    style={[styles.sortRow, sort === option && styles.selected]}
                  >
                    <Text style={styles.toolText}>
                      {option === 'newest' ? 'Newest first' : 'Oldest first'}
                    </Text>
                    <Text style={styles.link}>
                      {sort === option ? '✓' : ''}
                    </Text>
                  </Pressable>
                ))}
              </View>
            ) : (
              <>
                <ScrollView
                  keyboardShouldPersistTaps="handled"
                  style={styles.sheetScroll}
                  contentContainerStyle={styles.sheetContent}
                >
                  <Text style={styles.label}>Category</Text>
                  <View style={styles.chips}>
                    {[null, '', ...categoryOptions].map(category => (
                      <Pressable
                        key={category === null ? 'all' : `category-${category}`}
                        accessibilityRole="button"
                        accessibilityState={{
                          selected: draft.category === category,
                        }}
                        onPress={() =>
                          setDraft(current => ({ ...current, category }))
                        }
                        style={[
                          styles.chip,
                          draft.category === category && styles.selected,
                        ]}
                      >
                        <Text style={styles.toolText}>
                          {category === null
                            ? 'All categories'
                            : category || 'Uncategorized'}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                  <Text style={styles.label}>Scheduled date</Text>
                  <View style={styles.chips}>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() =>
                        setDraft(current => ({ ...current, from: '', to: '' }))
                      }
                      style={styles.chip}
                    >
                      <Text style={styles.toolText}>Any time</Text>
                    </Pressable>
                    {[1, 7, 30].map(days => (
                      <Pressable
                        key={days}
                        accessibilityRole="button"
                        onPress={() => preset(days)}
                        style={styles.chip}
                      >
                        <Text style={styles.toolText}>
                          {days === 1 ? 'Today' : `Last ${days} days`}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                  <View style={styles.chips}>
                    {(['single', 'range'] as const).map(mode => (
                      <Pressable
                        key={mode}
                        accessibilityRole="button"
                        accessibilityState={{ selected: dateMode === mode }}
                        style={[
                          styles.chip,
                          dateMode === mode && styles.selected,
                        ]}
                        onPress={() => {
                          setDateMode(mode);
                          if (mode === 'single')
                            setDraft(current => ({
                              ...current,
                              to: current.from,
                            }));
                        }}
                      >
                        <Text style={styles.toolText}>
                          {mode === 'single' ? 'Specific date' : 'Date range'}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                  <Text style={styles.inputLabel}>
                    {dateMode === 'single' ? 'Date' : 'From (inclusive)'}
                  </Text>
                  <TextInput
                    accessibilityLabel={
                      dateMode === 'single' ? 'Filter date' : 'Start date'
                    }
                    testID="history-date-from"
                    value={draft.from}
                    onChangeText={from =>
                      setDraft(current => ({
                        ...current,
                        from,
                        ...(dateMode === 'single' ? { to: from } : {}),
                      }))
                    }
                    placeholder="YYYY-MM-DD"
                    placeholderTextColor="#94a3b8"
                    autoCorrect={false}
                    maxLength={10}
                    style={styles.input}
                  />
                  {dateMode === 'range' ? (
                    <>
                      <Text style={styles.inputLabel}>To (inclusive)</Text>
                      <TextInput
                        accessibilityLabel="End date"
                        testID="history-date-to"
                        value={draft.to}
                        onChangeText={to =>
                          setDraft(current => ({ ...current, to }))
                        }
                        placeholder="YYYY-MM-DD"
                        placeholderTextColor="#94a3b8"
                        autoCorrect={false}
                        maxLength={10}
                        style={styles.input}
                      />
                    </>
                  ) : null}
                  <Text style={styles.hint}>
                    Use YYYY-MM-DD, for example 2026-09-24. Leave a range
                    endpoint blank for no limit.
                  </Text>
                  {error ? (
                    <Text accessibilityRole="alert" style={styles.error}>
                      {error}
                    </Text>
                  ) : null}
                </ScrollView>
                <View style={styles.footer}>
                  <Pressable
                    accessibilityRole="button"
                    style={styles.reset}
                    onPress={() => {
                      setDraft(EMPTY_HISTORY_FILTER);
                      setDateMode('range');
                    }}
                  >
                    <Text style={styles.toolText}>Reset</Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Apply filters"
                    disabled={!!error}
                    onPress={() => {
                      setFilter({ ...draft });
                      setSheet(null);
                    }}
                    style={[styles.apply, !!error && styles.disabled]}
                  >
                    <Text style={styles.applyText}>Apply filters</Text>
                  </Pressable>
                </View>
              </>
            )}
          </SafeAreaView>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#ffffff' },
  header: { paddingHorizontal: 24, paddingTop: 20, paddingBottom: 12 },
  title: { fontSize: 28, fontWeight: '700', color: '#1e293b' },
  subtitle: { fontSize: 13, lineHeight: 20, color: '#64748b', marginTop: 6 },
  toolbar: { flexDirection: 'row', gap: 10, marginTop: 20 },
  tool: {
    minHeight: 44,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    borderRadius: 10,
    justifyContent: 'center',
  },
  toolText: { fontSize: 13, fontWeight: '500', color: '#334155' },
  selected: { backgroundColor: '#eff6ff', borderColor: '#93c5fd' },
  summary: { fontSize: 12, color: '#64748b', marginTop: 14 },
  clear: { minHeight: 44, justifyContent: 'center', alignSelf: 'flex-start' },
  link: { fontSize: 13, color: '#2563eb', fontWeight: '600' },
  list: { paddingHorizontal: 24, paddingBottom: 48 },
  empty: { paddingVertical: 48, alignItems: 'center' },
  emptyTitle: { fontSize: 17, fontWeight: '600', color: '#334155' },
  backdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: '#00000066',
  },
  sheet: {
    maxHeight: '90%',
    flexShrink: 1,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  sheetHeader: {
    paddingLeft: 24,
    paddingRight: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sheetTitle: { fontSize: 20, fontWeight: '700', color: '#1e293b' },
  close: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: { fontSize: 26, color: '#64748b' },
  sheetScroll: { flexShrink: 1 },
  sheetContent: { paddingHorizontal: 24, paddingBottom: 20 },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 12,
    marginTop: 12,
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: {
    minHeight: 44,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 12,
    justifyContent: 'center',
  },
  inputLabel: { fontSize: 12, color: '#64748b', marginBottom: 6 },
  input: {
    minHeight: 46,
    fontSize: 14,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
    color: '#1e293b',
    backgroundColor: '#f8fafc',
  },
  hint: { fontSize: 12, color: '#64748b', lineHeight: 18 },
  error: { fontSize: 12, color: '#dc2626', marginTop: 8 },
  footer: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  reset: {
    minWidth: 64,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  apply: {
    flex: 1,
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyText: { fontSize: 14, fontWeight: '600', color: '#ffffff' },
  disabled: { opacity: 0.4 },
  sortOptions: { paddingHorizontal: 24, paddingBottom: 24 },
  sortRow: {
    minHeight: 52,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    paddingHorizontal: 16,
    marginTop: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
});
