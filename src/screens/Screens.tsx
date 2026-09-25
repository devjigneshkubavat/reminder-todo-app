import React, {useEffect, useState} from 'react';
import {Alert, BackHandler, Pressable, StyleSheet, Switch, Text, View} from 'react-native';
import {showHome, showSecurityPasscode} from '../navigation/routes';
import {getPasscodeChoice} from '../security/passcode';
import {disablePasscodeFromSecurity} from '../security/flow';
import {AddTaskModal} from './AddTaskModal';
import {withRedux} from '../store/withRedux';

import {HomeScreen as HomeScreenContent} from './HomeScreen';

export const HomeScreen = withRedux(HomeScreenContent);

function NamedScreen({name}: {name: string}) {
  return <View style={styles.screen}><Text>{name}</Text></View>;
}

export function AddScreen() {
  return <NamedScreen name="Add" />;
}

export { SettingsScreen } from './SettingsScreen';

export function SecurityScreen() {
  const [enabled, setEnabled] = useState(false);
  const [busy, setBusy] = useState(true);

  useEffect(() => {
    const back = BackHandler.addEventListener('hardwareBackPress', () => {
      showHome(4);
      return true;
    });
    getPasscodeChoice()
      .then(choice => setEnabled(choice === 'enabled'))
      .catch(() => Alert.alert('Unable to load passcode setting'))
      .finally(() => setBusy(false));
    return () => back.remove();
  }, []);

  const toggle = async () => {
    if (busy) return;
    if (!enabled) {
      showSecurityPasscode('enable').catch(() => Alert.alert('Unable to open passcode setup', 'Please try again.'));
      return;
    }
    setBusy(true);
    try {
      await disablePasscodeFromSecurity();
      setEnabled(false);
    } catch {
      Alert.alert('Unable to disable passcode', 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={styles.settingsScreen}>
      <View style={styles.headerBar}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back to Settings" onPress={() => showHome(4)} style={styles.backButton}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>
        <Text style={styles.header}>Security</Text>
      </View>
      <View style={styles.settingRow}>
        <Pressable accessibilityRole="button" disabled={busy} onPress={toggle} style={styles.settingLabel}>
          <Text style={styles.rowText}>{enabled ? 'Disable passcode' : 'Enable passcode'}</Text>
        </Pressable>
        <Switch accessibilityLabel="Passcode" value={enabled} disabled={busy} onValueChange={toggle} />
      </View>
      <Pressable accessibilityRole="button" accessibilityState={{disabled: !enabled || busy}} disabled={!enabled || busy} onPress={() => showSecurityPasscode('change')} style={styles.settingRow}>
        <Text style={[styles.rowText, !enabled && styles.disabledText]}>Change passcode</Text>
        <Text style={[styles.chevron, !enabled && styles.disabledText]}>›</Text>
      </Pressable>
    </View>
  );
}

import {TaskItem} from '../store/tasksSlice';

export const ModalScreen = withRedux(function ModalScreenComponent({
  componentId,
  taskToEdit,
}: {
  componentId: string;
  taskToEdit?: TaskItem;
}) {
  return <AddTaskModal componentId={componentId} taskToEdit={taskToEdit} />;
});

const styles = StyleSheet.create({
  screen: {flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#ffffff'},
  settingsScreen: {flex: 1, backgroundColor: '#ffffff'},
  header: {fontSize: 28, fontWeight: '600', color: '#1d1d1d', marginHorizontal: 24, marginTop: 28, marginBottom: 24},
  headerBar: {flexDirection: 'row', alignItems: 'center'},
  backButton: {width: 36, marginLeft: 18, alignItems: 'center', justifyContent: 'center'},
  backText: {fontSize: 36, color: '#1d1d1d'},
  settingRow: {minHeight: 60, paddingHorizontal: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: StyleSheet.hairlineWidth, borderColor: '#dddddd'},
  settingLabel: {flex: 1, minHeight: 60, justifyContent: 'center'},
  rowText: {fontSize: 17, color: '#1d1d1d'},
  chevron: {fontSize: 26, color: '#888888'},
  disabledText: {color: '#aaaaaa'},
});
