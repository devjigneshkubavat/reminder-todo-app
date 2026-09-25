import React, {useEffect, useRef, useState} from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import {formatDate, formatTime, isTimeInPast} from '../utils/dateTime';

interface DateTimePickerModalProps {
  value: Date;
  onChange: (newDate: Date) => void;
}

export function DateTimePickerModal({value, onChange}: DateTimePickerModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'date' | 'time'>('date');
  const [tempDate, setTempDate] = useState(() => new Date(value));
  const minutesScrollRef = useRef<React.ComponentRef<typeof ScrollView>>(null);

  const handleOpen = () => {
    setTempDate(new Date(value));
    setIsOpen(true);
  };

  const handleConfirm = () => {
    onChange(new Date(tempDate));
    setIsOpen(false);
  };

  const isTempPast = isTimeInPast(tempDate);

  // Quick shortcuts
  const selectToday = () => {
    const next = new Date(tempDate);
    const now = new Date();
    next.setFullYear(now.getFullYear(), now.getMonth(), now.getDate());
    setTempDate(next);
  };

  const selectTomorrow = () => {
    const next = new Date(tempDate);
    const tom = new Date();
    tom.setDate(tom.getDate() + 1);
    next.setFullYear(tom.getFullYear(), tom.getMonth(), tom.getDate());
    setTempDate(next);
  };

  // Adjust hours / minutes
  const currentHours = tempDate.getHours();
  const currentMinutes = tempDate.getMinutes();
  const isPM = currentHours >= 12;
  const displayHour = currentHours % 12 || 12;

  const setHour = (h12: number) => {
    const next = new Date(tempDate);
    let h24 = h12 % 12;
    if (isPM) h24 += 12;
    next.setHours(h24);
    setTempDate(next);
  };

  const toggleAmPm = (pm: boolean) => {
    const next = new Date(tempDate);
    let h24 = next.getHours() % 12;
    if (pm) h24 += 12;
    next.setHours(h24);
    setTempDate(next);
  };

  const setMinute = (m: number) => {
    const next = new Date(tempDate);
    next.setMinutes(m);
    setTempDate(next);
  };

  const hoursList = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const minutesList = Array.from({length: 60}, (_, i) => i);

  useEffect(() => {
    if (isOpen && activeTab === 'time') {
      const timer = setTimeout(() => {
        const targetOffset = Math.max(0, currentMinutes * 52 - 120);
        minutesScrollRef.current?.scrollTo({x: targetOffset, animated: true});
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isOpen, activeTab, currentMinutes]);

  // Days list for the current month
  const currentMonth = tempDate.getMonth();
  const currentYear = tempDate.getFullYear();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysArray = Array.from({length: daysInMonth}, (_, i) => i + 1);

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  const changeMonth = (delta: number) => {
    const next = new Date(tempDate);
    next.setMonth(next.getMonth() + delta);
    setTempDate(next);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>
        Date & Time <Text style={styles.requiredIndicator}>*</Text>
      </Text>
      <View style={styles.pickersRow}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Select Date"
          testID="date-picker-button"
          onPress={() => {
            setActiveTab('date');
            handleOpen();
          }}
          style={styles.pickerButton}>
          <Text style={styles.pickerIcon}>📅</Text>
          <Text style={styles.pickerText}>{formatDate(value)}</Text>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Select Time"
          testID="time-picker-button"
          onPress={() => {
            setActiveTab('time');
            handleOpen();
          }}
          style={styles.pickerButton}>
          <Text style={styles.pickerIcon}>⏰</Text>
          <Text style={styles.pickerText}>{formatTime(value)}</Text>
        </Pressable>
      </View>

      {isTimeInPast(value) ? (
        <Text style={styles.errorText} testID="time-past-error">
          ⚠️ Time cannot be before the current time
        </Text>
      ) : null}

      <Modal
        visible={isOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsOpen(false)}>
        <TouchableWithoutFeedback onPress={() => setIsOpen(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.dialogCard}>
                {/* Tabs */}
                <View style={styles.tabBar}>
                  <Pressable
                    accessibilityRole="button"
                    testID="tab-date"
                    onPress={() => setActiveTab('date')}
                    style={[
                      styles.tabItem,
                      activeTab === 'date' && styles.tabItemActive,
                    ]}>
                    <Text
                      style={[
                        styles.tabText,
                        activeTab === 'date' && styles.tabTextActive,
                      ]}>
                      Date
                    </Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    testID="tab-time"
                    onPress={() => setActiveTab('time')}
                    style={[
                      styles.tabItem,
                      activeTab === 'time' && styles.tabItemActive,
                    ]}>
                    <Text
                      style={[
                        styles.tabText,
                        activeTab === 'time' && styles.tabTextActive,
                      ]}>
                      Time
                    </Text>
                  </Pressable>
                </View>

                {activeTab === 'date' ? (
                  <View style={styles.tabContent}>
                    {/* Shortcuts */}
                    <View style={styles.shortcutsRow}>
                      <Pressable
                        accessibilityRole="button"
                        testID="btn-today"
                        onPress={selectToday}
                        style={styles.shortcutChip}>
                        <Text style={styles.shortcutText}>Today</Text>
                      </Pressable>
                      <Pressable
                        accessibilityRole="button"
                        testID="btn-tomorrow"
                        onPress={selectTomorrow}
                        style={styles.shortcutChip}>
                        <Text style={styles.shortcutText}>Tomorrow</Text>
                      </Pressable>
                    </View>

                    {/* Month Navigator */}
                    <View style={styles.monthNavRow}>
                      <Pressable
                        onPress={() => changeMonth(-1)}
                        style={styles.navArrowButton}>
                        <Text style={styles.navArrowText}>‹</Text>
                      </Pressable>
                      <Text style={styles.monthTitle}>
                        {monthNames[currentMonth]} {currentYear}
                      </Text>
                      <Pressable
                        onPress={() => changeMonth(1)}
                        style={styles.navArrowButton}>
                        <Text style={styles.navArrowText}>›</Text>
                      </Pressable>
                    </View>

                    {/* Days grid */}
                    <ScrollView
                      style={styles.daysScrollView}
                      contentContainerStyle={styles.daysGrid}>
                      {daysArray.map(day => {
                        const isDaySelected = tempDate.getDate() === day;
                        return (
                          <Pressable
                            key={day}
                            accessibilityRole="button"
                            testID={`day-${day}`}
                            onPress={() => {
                              const next = new Date(tempDate);
                              next.setDate(day);
                              setTempDate(next);
                            }}
                            style={[
                              styles.dayCell,
                              isDaySelected && styles.dayCellSelected,
                            ]}>
                            <Text
                              style={[
                                styles.dayText,
                                isDaySelected && styles.dayTextSelected,
                              ]}>
                              {day}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </ScrollView>
                  </View>
                ) : (
                  <View style={styles.tabContent}>
                    {/* AM / PM Selector */}
                    <View style={styles.ampmRow}>
                      <Pressable
                        accessibilityRole="button"
                        testID="btn-am"
                        onPress={() => toggleAmPm(false)}
                        style={[
                          styles.ampmChip,
                          !isPM && styles.ampmChipSelected,
                        ]}>
                        <Text
                          style={[
                            styles.ampmText,
                            !isPM && styles.ampmTextSelected,
                          ]}>
                          AM
                        </Text>
                      </Pressable>
                      <Pressable
                        accessibilityRole="button"
                        testID="btn-pm"
                        onPress={() => toggleAmPm(true)}
                        style={[
                          styles.ampmChip,
                          isPM && styles.ampmChipSelected,
                        ]}>
                        <Text
                          style={[
                            styles.ampmText,
                            isPM && styles.ampmTextSelected,
                          ]}>
                          PM
                        </Text>
                      </Pressable>
                    </View>

                    <Text style={styles.sectionSubtitle}>Hours</Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.chipsScroll}>
                      {hoursList.map(h => {
                        const isHSelected = displayHour === h;
                        return (
                          <Pressable
                            key={h}
                            accessibilityRole="button"
                            testID={`hour-${h}`}
                            onPress={() => setHour(h)}
                            style={[
                              styles.timeChip,
                              isHSelected && styles.timeChipSelected,
                            ]}>
                            <Text
                              style={[
                                styles.timeChipText,
                                isHSelected && styles.timeChipTextSelected,
                              ]}>
                              {h}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </ScrollView>

                    <Text style={styles.sectionSubtitle}>Minutes</Text>
                    <ScrollView
                      ref={minutesScrollRef}
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={styles.chipsScroll}>
                      {minutesList.map(m => {
                        const isMSelected = currentMinutes === m;
                        const label = m < 10 ? `0${m}` : `${m}`;
                        return (
                          <Pressable
                            key={m}
                            accessibilityRole="button"
                            testID={`minute-${m}`}
                            onPress={() => setMinute(m)}
                            style={[
                              styles.timeChip,
                              isMSelected && styles.timeChipSelected,
                            ]}>
                            <Text
                              style={[
                                styles.timeChipText,
                                isMSelected && styles.timeChipTextSelected,
                              ]}>
                              {label}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </ScrollView>
                  </View>
                )}

                {/* Warning inside modal */}
                {isTempPast ? (
                  <View style={styles.modalPastWarning}>
                    <Text style={styles.modalPastWarningText}>
                      ⚠️ Selected time is in the past!
                    </Text>
                  </View>
                ) : null}

                {/* Dialog Footer Actions */}
                <View style={styles.dialogFooter}>
                  <Pressable
                    accessibilityRole="button"
                    testID="btn-picker-cancel"
                    onPress={() => setIsOpen(false)}
                    style={styles.cancelButton}>
                    <Text style={styles.cancelText}>Cancel</Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    testID="btn-picker-confirm"
                    onPress={handleConfirm}
                    style={styles.confirmButton}>
                    <Text style={styles.confirmText}>Confirm</Text>
                  </Pressable>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  requiredIndicator: {
    color: '#dc2626',
  },
  pickersRow: {
    flexDirection: 'row',
    gap: 12,
  },
  pickerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 48,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 12,
    backgroundColor: '#f8fafc',
  },
  pickerIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  pickerText: {
    fontSize: 12,
    color: '#1e293b',
    fontWeight: '500',
    flex: 1,
  },
  errorText: {
    fontSize: 13,
    color: '#dc2626',
    marginTop: 6,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: '#00000066',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  dialogCard: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 20,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 20,
    shadowOffset: {width: 0, height: 6},
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    padding: 3,
    marginBottom: 16,
  },
  tabItem: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabItemActive: {
    backgroundColor: '#ffffff',
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  tabText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#0f172a',
    fontWeight: '700',
  },
  tabContent: {
    minHeight: 220,
  },
  shortcutsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  shortcutChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  shortcutText: {
    fontSize: 13,
    color: '#2563eb',
    fontWeight: '600',
  },
  monthNavRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  navArrowButton: {
    width: 32,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
    backgroundColor: '#f1f5f9',
  },
  navArrowText: {
    fontSize: 20,
    color: '#334155',
  },
  monthTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
  },
  daysScrollView: {
    maxHeight: 150,
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    justifyContent: 'center',
  },
  dayCell: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
  },
  dayCellSelected: {
    backgroundColor: '#2563eb',
  },
  dayText: {
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '500',
  },
  dayTextSelected: {
    color: '#ffffff',
    fontWeight: '700',
  },
  ampmRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  ampmChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
  ampmChipSelected: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  ampmText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#475569',
  },
  ampmTextSelected: {
    color: '#ffffff',
  },
  sectionSubtitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#94a3b8',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginTop: 6,
  },
  chipsScroll: {
    gap: 8,
    paddingVertical: 4,
  },
  timeChip: {
    minWidth: 44,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
    alignItems: 'center',
  },
  timeChipSelected: {
    backgroundColor: '#2563eb',
    borderColor: '#2563eb',
  },
  timeChipText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  timeChipTextSelected: {
    color: '#ffffff',
  },
  modalPastWarning: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 8,
    padding: 8,
    marginTop: 10,
    alignItems: 'center',
  },
  modalPastWarningText: {
    fontSize: 12,
    color: '#dc2626',
    fontWeight: '600',
  },
  dialogFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 18,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e2e8f0',
    paddingTop: 14,
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  cancelText: {
    fontSize: 15,
    color: '#64748b',
    fontWeight: '600',
  },
  confirmButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#0f172a',
  },
  confirmText: {
    fontSize: 15,
    color: '#ffffff',
    fontWeight: '600',
  },
});
