import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const COLORS = {
  primary: '#2563EB',
  background: '#FFFFFF',
  border: '#E2E8F0',
  text: '#0F172A',
  textSecondary: '#64748B',
};

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
          key={category.id}
          onPress={() => onSelect(category)}
          style={({ pressed }) => [styles.card, pressed && styles.pressed]}
        >
          <View style={styles.iconWrap}>
            <Ionicons color={COLORS.primary} name={category.icon} size={24} />
          </View>
          <Text style={styles.label}>{category.label}</Text>
          <Text style={styles.count}>{category.count} kata</Text>
        </Pressable>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  card: {
    backgroundColor: COLORS.background,
    borderColor: COLORS.border,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 12,
    minHeight: 132,
    padding: 16,
    width: '48%',
  },
  iconWrap: {
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 14,
    height: 44,
    justifyContent: 'center',
    marginBottom: 16,
    width: 44,
  },
  label: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: '700',
  },
  count: {
    color: COLORS.textSecondary,
    fontSize: 14,
    marginTop: 6,
  },
  pressed: {
    opacity: 0.88,
  },
});
