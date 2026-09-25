import React from 'react';
import {StyleSheet, Text, View} from 'react-native';

type Props = {label: string; tabIndex: number; selected?: boolean};

export function TabButton({label, tabIndex, selected}: Props) {
  const isAdd = tabIndex === 2;

  return (
    <View style={styles.slot}>
      <View style={isAdd ? styles.addButton : styles.tabButton}>
        {isAdd ? (
          <Text style={styles.addText}>+</Text>
        ) : (
          <>
            <Text style={[styles.iconText, selected && styles.selectedIcon]}>
              {({0: '🏠', 1: '🕘', 3: '🗓️', 4: '⚙️'} as Record<number, string>)[tabIndex]}
            </Text>
            <Text style={[styles.tabText, selected && styles.selectedText]}>{label}</Text>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  slot: {flex: 1, alignItems: 'center', justifyContent: 'center', overflow: 'visible'},
  tabButton: {flex: 1, width: '100%', alignItems: 'center', justifyContent: 'center'},
  tabText: {fontSize: 12, color: '#9a9a9a', marginTop: 2, fontWeight: '500'},
  selectedText: {color: '#111111', fontWeight: '600'},
  iconText: {fontSize: 22, opacity: 0.45},
  selectedIcon: {opacity: 1},
  addButton: {width: 50, height: 50, borderRadius: 25, backgroundColor: '#222222', alignItems: 'center', justifyContent: 'center', elevation: 6, shadowColor: '#000000', shadowOpacity: 0.2, shadowRadius: 8, shadowOffset: {width: 0, height: 3}},
  addText: {fontSize: 34, lineHeight: 39, color: '#ffffff'},
});
