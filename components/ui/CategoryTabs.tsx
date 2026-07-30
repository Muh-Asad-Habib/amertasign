import React from 'react';
import { Pressable, ScrollView, Text } from 'react-native';

import { fontFamily, radius, shadow } from '../../theme';

import { createSheet } from '../../theme';

export interface CategoryTabItem {
  id: string;
  label: string;
}

export interface CategoryTabsProps {
  categories: CategoryTabItem[];
  activeCategory: string;
  onSelect: (id: string) => void;
  /** Padding horizontal konten scroll — untuk deretan chip full-bleed. */
  contentPadding?: number;
}

export default function CategoryTabs({
  categories,
  activeCategory,
  onSelect,
  contentPadding = 0,
}: CategoryTabsProps) {
  return (
    <ScrollView
      contentContainerStyle={[styles.contentContainer, contentPadding > 0 && { paddingHorizontal: contentPadding }]}
      horizontal
      showsHorizontalScrollIndicator={false}
    >
      {categories.map((category) => {
        const isActive = category.id === activeCategory;

        return (
          <Pressable
            accessibilityRole="tab"
            accessibilityLabel={`Kategori ${category.label}`}
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
    paddingVertical: 2,
  },
  tab: {
    alignItems: 'center',
    borderRadius: radius.full,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 44,
    minWidth: 76,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  activeTab: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
    ...shadow.sm,
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
