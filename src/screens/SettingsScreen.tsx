import React, {useState} from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { showSecurity } from '../navigation/routes';
import { useAppDispatch, useAppSelector } from '../store';
import {
  NotificationType,
  setNotificationType,
} from '../store/settingsSlice';
import { withRedux } from '../store/withRedux';
import {checkForOtaUpdate} from '../services/otaUpdateService';

export function SettingsScreenComponent() {
  const [checkingForUpdate, setCheckingForUpdate] = useState(false);
  const dispatch = useAppDispatch();
  const currentNotificationType = useAppSelector(
    state => state.settings?.notificationType ?? 'alarm',
  );

  const handleSelectNotificationType = (type: NotificationType) => {
    if (type !== currentNotificationType) {
      dispatch(setNotificationType(type));
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.header}>Settings</Text>

        {/* Notification Type Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>REMINDER STYLE</Text>
          <Text style={styles.sectionSubtitle}>
            Choose how you want to be alerted when a task is due.
          </Text>

          {/* Alarm Option */}
          <Pressable
            accessibilityRole="radio"
            accessibilityState={{ selected: currentNotificationType === 'alarm' }}
            accessibilityLabel="Alarm Notification: Loud looping alarm with screen wake and sticky reminder"
            testID="notification-type-alarm"
            onPress={() => handleSelectNotificationType('alarm')}
            style={({ pressed }) => [
              styles.optionCard,
              currentNotificationType === 'alarm' && styles.optionCardSelected,
              pressed && styles.cardPressed,
            ]}
          >
            <View style={styles.optionHeader}>
              <View style={[styles.iconContainer, styles.alarmIconContainer]}>
                <Text style={styles.iconText}>⏰</Text>
              </View>
              <View style={styles.optionTitleContainer}>
                <View style={styles.titleRow}>
                  <Text style={styles.optionTitle}>Alarm Notification</Text>
                  <View style={[styles.badge, styles.alarmBadge]}>
                    <Text style={styles.alarmBadgeText}>ALARM</Text>
                  </View>
                </View>
                <Text style={styles.optionDescription}>
                  Loud continuous sound, wakes screen, and stays sticky until you mark done or snooze. Ideal for urgent tasks.
                </Text>
              </View>
              <View
                style={[
                  styles.radioOuter,
                  currentNotificationType === 'alarm' && styles.radioOuterSelected,
                ]}
              >
                {currentNotificationType === 'alarm' && (
                  <View style={styles.radioInner} />
                )}
              </View>
            </View>
          </Pressable>

          {/* Simple Option */}
          <Pressable
            accessibilityRole="radio"
            accessibilityState={{ selected: currentNotificationType === 'simple' }}
            accessibilityLabel="Simple Push Notification: Standard notification chime that can be swiped away"
            testID="notification-type-simple"
            onPress={() => handleSelectNotificationType('simple')}
            style={({ pressed }) => [
              styles.optionCard,
              currentNotificationType === 'simple' && styles.optionCardSelected,
              pressed && styles.cardPressed,
            ]}
          >
            <View style={styles.optionHeader}>
              <View style={[styles.iconContainer, styles.simpleIconContainer]}>
                <Text style={styles.iconText}>🔔</Text>
              </View>
              <View style={styles.optionTitleContainer}>
                <View style={styles.titleRow}>
                  <Text style={styles.optionTitle}>Simple Notification</Text>
                  <View style={[styles.badge, styles.simpleBadge]}>
                    <Text style={styles.simpleBadgeText}>SIMPLE</Text>
                  </View>
                </View>
                <Text style={styles.optionDescription}>
                  Standard push chime with action buttons. Easily swipeable and quiet. Great for non-intrusive reminders.
                </Text>
              </View>
              <View
                style={[
                  styles.radioOuter,
                  currentNotificationType === 'simple' && styles.radioOuterSelected,
                ]}
              >
                {currentNotificationType === 'simple' && (
                  <View style={styles.radioInner} />
                )}
              </View>
            </View>
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>APP UPDATE</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Check for app updates"
            accessibilityState={{disabled: checkingForUpdate}}
            testID="check-for-updates-row"
            disabled={checkingForUpdate}
            onPress={async () => {
              setCheckingForUpdate(true);
              try {
                await checkForOtaUpdate();
              } catch {
                // The update service already presented the error.
              } finally {
                setCheckingForUpdate(false);
              }
            }}
            style={({pressed}) => [
              styles.securityCard,
              pressed && styles.cardPressed,
              checkingForUpdate && styles.cardDisabled,
            ]}
          >
            <View style={styles.securityLeft}>
              <View style={[styles.iconContainer, styles.updateIconContainer]}>
                <Text style={styles.iconText}>↻</Text>
              </View>
              <View style={styles.securityTextContainer}>
                <Text style={styles.securityTitle}>
                  {checkingForUpdate ? 'Checking…' : 'Check for updates'}
                </Text>
                <Text style={styles.securitySubtitle}>
                  Download feature updates without reinstalling
                </Text>
              </View>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        </View>

        {/* Security Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>SECURITY</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Passcode security settings"
            testID="security-row"
            onPress={() => showSecurity()}
            style={({ pressed }) => [
              styles.securityCard,
              pressed && styles.cardPressed,
            ]}
          >
            <View style={styles.securityLeft}>
              <View style={[styles.iconContainer, styles.securityIconContainer]}>
                <Text style={styles.iconText}>🔒</Text>
              </View>
              <View style={styles.securityTextContainer}>
                <Text style={styles.securityTitle}>Passcode Lock</Text>
                <Text style={styles.securitySubtitle}>
                  Protect app access with a secure PIN
                </Text>
              </View>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

export const SettingsScreen = withRedux(SettingsScreenComponent);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0f172a',
    marginHorizontal: 20,
    marginTop: 28,
    marginBottom: 20,
  },
  section: {
    marginHorizontal: 20,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748b',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    marginBottom: 12,
  },
  optionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  optionCardSelected: {
    borderColor: '#3b82f6',
    backgroundColor: '#f8faff',
  },
  cardPressed: {
    opacity: 0.85,
  },
  cardDisabled: {
    opacity: 0.6,
  },
  optionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  iconContainer: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  alarmIconContainer: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fee2e2',
  },
  simpleIconContainer: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#dbeafe',
  },
  securityIconContainer: {
    backgroundColor: '#f5f3ff',
    borderWidth: 1,
    borderColor: '#ede9fe',
  },
  updateIconContainer: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#d1fae5',
  },
  iconText: {
    fontSize: 20,
  },
  optionTitleContainer: {
    flex: 1,
    marginRight: 10,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 4,
  },
  optionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  badge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  alarmBadge: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  alarmBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#dc2626',
    letterSpacing: 0.5,
  },
  simpleBadge: {
    backgroundColor: '#eff6ff',
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  simpleBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#2563eb',
    letterSpacing: 0.5,
  },
  optionDescription: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  radioOuterSelected: {
    borderColor: '#3b82f6',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#3b82f6',
  },
  securityCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  securityLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  securityTextContainer: {
    flex: 1,
  },
  securityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  securitySubtitle: {
    fontSize: 13,
    color: '#64748b',
    marginTop: 2,
  },
  chevron: {
    fontSize: 24,
    color: '#94a3b8',
    marginLeft: 8,
  },
});
