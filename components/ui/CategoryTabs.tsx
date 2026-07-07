import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';

import { colors, fontFamily, radius, touchTargetMin } from '../../theme';

import { createSheet } from '../../theme';

export interface CategoryTabItem {
  id: string;
  label: string;
}

export interface CategoryTabsProps {
  categories: CategoryTabItem[];
  activeCategory: string;
  onSelect: (id: string) => void;
}

export default function CategoryTabs({ categories, activeCategory, onSelect }: CategoryTabsProps) {
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
            accessibilityState={{ selected: isActive }}
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

const styles = createSheet((colors) => ({
  contentContainer: {
    gap: 10,
    paddingRight: 4,
  },
  tab: {
    alignItems: 'center',
    borderRadius: radius.full,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: touchTargetMin,
    minWidth: 96,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  activeTab: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  inactiveTab: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
  },
  label: {
    fontFamily: fontFamily.bodySemiBold,
    fontSize: 15,
    textAlign: 'center',
  },
  activeLabel: {
    color: colors.textOnPrimary,
  },
  inactiveLabel: {
    color: colors.text,
  },
  pressed: {
    opacity: 0.85,
  },
}));
