import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAppSelector } from '../store';

interface CategoryPickerProps {
  selectedCategory?: string;
  onSelectCategory: (category: string | undefined) => void;
}

export function CategoryPicker({
  selectedCategory,
  onSelectCategory,
}: CategoryPickerProps) {
  const categories = useAppSelector(state => state.categories.items);
  const [isOpen, setIsOpen] = useState(false);

  const handleSelect = (cat?: string) => {
    onSelectCategory(cat);
    setIsOpen(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Category</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Select Category"
        testID="category-picker-trigger"
        accessibilityState={{ expanded: isOpen }}
        onPress={() => setIsOpen(open => !open)}
        style={styles.triggerButton}
      >
        <Text
          style={[
            styles.triggerText,
            !selectedCategory && styles.placeholderText,
          ]}
        >
          {selectedCategory || 'Select category (Optional)'}
        </Text>
        <Text style={styles.chevron}>{isOpen ? '▴' : '▾'}</Text>
      </Pressable>

      {isOpen ? (
        <ScrollView
          testID="category-dropdown"
          style={styles.dropdownCard}
          nestedScrollEnabled
          keyboardShouldPersistTaps="handled"
        >
          {selectedCategory ? (
            <Pressable
              accessibilityRole="button"
              testID="category-item-none"
              onPress={() => handleSelect(undefined)}
              style={[styles.itemRow, styles.clearRow]}
            >
              <Text style={styles.clearText}>None (Clear category)</Text>
            </Pressable>
          ) : null}

          {categories.map(category => {
            const isSelected = selectedCategory === category;
            return (
              <Pressable
                key={category}
                accessibilityRole="button"
                accessibilityLabel={`Category ${category}`}
                accessibilityState={{ selected: isSelected }}
                testID={`category-item-${category}`}
                onPress={() => handleSelect(category)}
                style={[styles.itemRow, isSelected && styles.itemRowSelected]}
              >
                <Text
                  style={[
                    styles.itemText,
                    isSelected && styles.itemTextSelected,
                  ]}
                >
                  {category}
                </Text>
                {isSelected ? <Text style={styles.checkmark}>✓</Text> : null}
              </Pressable>
            );
          })}
        </ScrollView>
      ) : null}
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
  triggerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 48,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    backgroundColor: '#f8fafc',
  },
  triggerText: {
    flex: 1,
    fontSize: 14,
    color: '#1e293b',
    fontWeight: '500',
  },
  placeholderText: {
    color: '#94a3b8',
    fontWeight: '400',
  },
  chevron: {
    fontSize: 16,
    color: '#64748b',
  },
  dropdownCard: {
    marginTop: 6,
    maxHeight: 220,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 4,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginVertical: 2,
  },
  itemRowSelected: {
    backgroundColor: '#eff6ff',
  },
  clearRow: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#f1f5f9',
    marginBottom: 4,
  },
  clearText: {
    fontSize: 15,
    color: '#ef4444',
    fontWeight: '500',
  },
  itemText: {
    fontSize: 16,
    color: '#334155',
  },
  itemTextSelected: {
    color: '#2563eb',
    fontWeight: '600',
  },
  checkmark: {
    fontSize: 16,
    color: '#2563eb',
    fontWeight: '700',
  },
});
