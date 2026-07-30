import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, radius, spacing } from '../../theme';
import Heading from '../ui/Heading';
import Text from '../ui/Text';

import { createSheet } from '../../theme';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

export interface CategoryListItem {
  id: string;
  label: string;
  count: number;
  icon: IoniconName;
}

export interface CategoryListProps {
  categories: CategoryListItem[];
  onSelect: (category: CategoryListItem) => void;
}

export default function CategoryList({ categories, onSelect }: CategoryListProps) {
  return (
    <View style={styles.grid}>
      {categories.map((category) => (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Kategori ${category.label}, ${category.count} kata`}
          key={category.id}
          onPress={() => onSelect(category)}
          style={({ pressed }) => [styles.card, pressed && styles.pressed]}
        >
          <View style={styles.iconWrap}>
            <Ionicons color={colors.primary} name={category.icon} size={24} />
          </View>
          <Heading variant="h2">{category.label}</Heading>
          <Text variant="caption" color="secondary">
            {category.count} kata
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = createSheet((colors) => ({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    minHeight: 132,
    padding: spacing.base,
    width: '47%',
    flexGrow: 1,
    gap: spacing.xs,
  },
  iconWrap: {
    alignItems: 'center',
    backgroundColor: colors.primarySurface,
    borderRadius: radius.md,
    height: 44,
    justifyContent: 'center',
    marginBottom: spacing.md,
    width: 44,
  },
  pressed: {
    opacity: 0.88,
  },
}));
