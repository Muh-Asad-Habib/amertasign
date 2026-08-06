import React from 'react';
import { ScrollView, Text } from 'react-native';

import { fontFamily, radius, shadow, touchTargetMin } from '../../theme';
import PressableScale from './PressableScale';

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
  /** `sm` = chip ringkas untuk area kontrol yang sempit. */
  size?: 'md' | 'sm';
  /** Pusatkan deretan chip saat muat dalam satu baris. */
  centered?: boolean;
}

export default function CategoryTabs({
  categories,
  activeCategory,
  onSelect,
  contentPadding = 0,
  size = 'md',
  centered = false,
}: CategoryTabsProps) {
  const isSmall = size === 'sm';

  return (
    <ScrollView
      contentContainerStyle={[
        styles.contentContainer,
        isSmall && styles.contentContainerSmall,
        centered && styles.contentContainerCentered,
        contentPadding > 0 && { paddingHorizontal: contentPadding },
      ]}
      horizontal
      showsHorizontalScrollIndicator={false}
    >
      {categories.map((category) => {
        const isActive = category.id === activeCategory;

        return (
          <PressableScale
            accessibilityRole="tab"
            accessibilityLabel={`Kategori ${category.label}`}
            accessibilityState={{ selected: isActive }}
            key={category.id}
            onPress={() => onSelect(category.id)}
            style={[
              styles.tab,
              isSmall && styles.tabSmall,
              isActive ? styles.activeTab : styles.inactiveTab,
            ]}
          >
            <Text
              style={[
                styles.label,
                isSmall && styles.labelSmall,
                isActive ? styles.activeLabel : styles.inactiveLabel,
              ]}
            >
              {category.label}
            </Text>
          </PressableScale>
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
  contentContainerSmall: {
    gap: 8,
    paddingRight: 0,
  },
  contentContainerCentered: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  tab: {
    alignItems: 'center',
    borderRadius: radius.full,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: touchTargetMin,
    minWidth: 76,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  tabSmall: {
    minHeight: 34,
    minWidth: 60,
    paddingHorizontal: 14,
    paddingVertical: 6,
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
  labelSmall: {
    fontSize: 13,
  },
  activeLabel: {
    color: colors.textOnPrimary,
  },
  inactiveLabel: {
    color: colors.text,
  },
}));
