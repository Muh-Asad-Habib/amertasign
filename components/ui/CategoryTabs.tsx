import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

const COLORS = {
  primary: '#2563EB',
  surface: '#F1F5F9',
  text: '#0F172A',
  white: '#FFFFFF',
};

export interface CategoryTabItem {
  id: string;
  label: string;
}

export interface CategoryTabsProps {
  categories: CategoryTabItem[];
  activeCategory: string;
  onSelect: (id: string) => void;
}

export default function CategoryTabs({
  categories,
  activeCategory,
  onSelect,
}: CategoryTabsProps) {
  return (
    <ScrollView
      contentContainerStyle={styles.contentContainer}
      horizontal
      showsHorizontalScrollIndicator={false}
    >
      {categories.map((category) => {
        const isActive = category.id === activeCategory;

        return (
          <Pressable
            accessibilityRole="button"
            key={category.id}
            onPress={() => onSelect(category.id)}
            style={({ pressed }) => [
              styles.tab,
              isActive ? styles.activeTab : styles.inactiveTab,
              pressed && styles.pressed,
            ]}
          >
            <Text style={[styles.label, isActive ? styles.activeLabel : styles.inactiveLabel]}>
              {category.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  contentContainer: {
    paddingRight: 8,
  },
  tab: {
    alignItems: 'center',
    borderRadius: 999,
    justifyContent: 'center',
    marginRight: 8,
    minHeight: 48,
    minWidth: 96,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  activeTab: {
    backgroundColor: COLORS.primary,
  },
  inactiveTab: {
    backgroundColor: COLORS.surface,
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'center',
  },
  activeLabel: {
    color: COLORS.white,
  },
  inactiveLabel: {
    color: COLORS.text,
  },
  pressed: {
    opacity: 0.85,
  },
});
