import React, {useEffect, useRef, useState} from 'react';
import {Alert, BackHandler, Pressable, StyleSheet, Text, View} from 'react-native';
import {PasscodeMode, showSecurity} from '../navigation/routes';
import {matchesPasscode} from '../security/passcode';
import {
  beginConfirmation,
  confirmPasscode,
  restartPasscodeCreation,
  skipPasscode,
  savePasscodeFromSecurity,
  startPasscodeFlow,
  unlockWithPasscode,
} from '../security/flow';

type Props = {mode: PasscodeMode; message?: string; securityAction?: 'enable' | 'change'};

const titles: Record<PasscodeMode, string> = {
  create: 'Create passcode',
  confirm: 'Confirm passcode',
  unlock: 'Enter passcode',
  error: 'Passcode unavailable',
};

export function PasscodeScreen({mode, message, securityAction}: Props) {
  const [digits, setDigits] = useState('');
  const [feedback, setFeedback] = useState(message ?? '');
  const [securityStage, setSecurityStage] = useState<'verify' | 'create' | 'confirm'>(securityAction === 'change' ? 'verify' : 'create');
  const draft = useRef('');
  const submitting = useRef(false);

  useEffect(() => {
    if (!securityAction) return;
    const back = BackHandler.addEventListener('hardwareBackPress', () => {
      showSecurity();
      return true;
    });
    return () => back.remove();
  }, [securityAction]);

  const submit = async (value: string) => {
    try {
      if (securityAction) {
        if (securityStage === 'verify') {
          if (await matchesPasscode(value)) {
            setSecurityStage('create');
            setDigits('');
          } else {
            setFeedback('Incorrect passcode. Try again.');
            setDigits('');
          }
        } else if (securityStage === 'create') {
          draft.current = value;
          setSecurityStage('confirm');
          setDigits('');
        } else if (draft.current !== value) {
          draft.current = '';
          setSecurityStage('create');
          setFeedback('Passcodes did not match. Try again.');
          setDigits('');
        } else {
          await savePasscodeFromSecurity(value);
          await showSecurity();
        }
      } else if (mode === 'create') {
        await beginConfirmation(value);
      } else if (mode === 'confirm') {
        await confirmPasscode(value);
      } else if (mode === 'unlock') {
        const valid = await unlockWithPasscode(value);
        if (!valid) {
          setFeedback('Incorrect passcode. Try again.');
          setDigits('');
        }
      }
    } catch {
      setFeedback('Something went wrong. Please try again.');
      setDigits('');
    } finally {
      submitting.current = false;
    }
  };

  const pressDigit = (digit: string) => {
    if (submitting.current || digits.length >= 4) {
      return;
    }
    setFeedback('');
    const next = digits + digit;
    setDigits(next);
    if (next.length === 4) {
      submitting.current = true;
      submit(next);
    }
  };

  const eraseDigit = () => {
    if (!submitting.current) {
      setDigits(current => current.slice(0, -1));
      setFeedback('');
    }
  };

  if (mode === 'error') {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>{titles.error}</Text>
        <Text style={styles.feedback}>{feedback}</Text>
        <Pressable onPress={() => startPasscodeFlow()} style={styles.action}>
          <Text style={styles.actionText}>Retry</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {securityAction && <Pressable accessibilityRole="button" onPress={() => showSecurity()} style={styles.backButton}><Text style={styles.backText}>‹</Text></Pressable>}
      <Text style={styles.title}>{securityAction ? securityStage === 'verify' ? 'Enter current passcode' : titles[securityStage] : titles[mode]}</Text>
      <Text style={styles.subtitle}>
        {securityAction ? securityStage === 'verify' ? 'Enter your current 4-digit passcode' : securityStage === 'create' ? 'Choose a new 4-digit passcode' : 'Enter it again to confirm' : mode === 'create' ? 'Choose a 4-digit passcode' : mode === 'confirm' ? 'Enter it again to confirm' : 'Enter your 4-digit passcode'}
      </Text>
      <View style={styles.dots} accessibilityLabel={`${digits.length} of 4 digits entered`}>
        {[0, 1, 2, 3].map(index => (
          <View key={index} style={[styles.dot, index < digits.length && styles.dotFilled]} />
        ))}
      </View>
      <Text style={styles.feedback}>{feedback}</Text>
      <View style={styles.keypad}>
        {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map((key, index) => (
          <View key={index} style={styles.keyCell}>
            {key !== '' && (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={key === '⌫' ? 'Delete digit' : key}
                onPress={key === '⌫' ? eraseDigit : () => pressDigit(key)}
                style={styles.key}>
                <Text style={styles.keyText}>{key}</Text>
              </Pressable>
            )}
          </View>
        ))}
      </View>
      {!securityAction && mode === 'create' && (
        <Pressable accessibilityRole="button" onPress={() => skipPasscode().catch(() => setFeedback('Unable to save your choice. Try again.'))} style={styles.action}>
          <Text style={styles.actionText}>Skip</Text>
        </Pressable>
      )}
      {!securityAction && mode === 'confirm' && (
        <Pressable accessibilityRole="button" onPress={() => restartPasscodeCreation()} style={styles.action}>
          <Text style={styles.actionText}>Start over</Text>
        </Pressable>
      )}
      {!securityAction && mode === 'unlock' && (
        <Pressable
          accessibilityRole="button"
          onPress={() => Alert.alert('Backup passcode', 'Enter 0000 if you forgot your passcode.')}
          style={styles.action}>
          <Text style={styles.actionText}>Forgot passcode?</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#ffffff', alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24},
  title: {fontSize: 28, fontWeight: '600', color: '#1d1d1d'},
  subtitle: {fontSize: 15, color: '#666666', marginTop: 10},
  dots: {flexDirection: 'row', gap: 18, marginTop: 36},
  dot: {width: 14, height: 14, borderRadius: 7, borderWidth: 1.5, borderColor: '#333333'},
  dotFilled: {backgroundColor: '#222222'},
  feedback: {height: 24, marginTop: 20, color: '#b22222', textAlign: 'center'},
  keypad: {width: '100%', maxWidth: 320, flexDirection: 'row', flexWrap: 'wrap', marginTop: 12},
  keyCell: {width: '33.333%', height: 72, alignItems: 'center', justifyContent: 'center'},
  key: {width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center'},
  keyText: {fontSize: 28, color: '#1d1d1d'},
  action: {minHeight: 48, paddingHorizontal: 16, alignItems: 'center', justifyContent: 'center', marginTop: 20},
  actionText: {fontSize: 16, color: '#333333'},
  backButton: {position: 'absolute', top: 16, left: 16, width: 48, height: 48, alignItems: 'center', justifyContent: 'center'},
  backText: {fontSize: 36, color: '#1d1d1d'},
});
