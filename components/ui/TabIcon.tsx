import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const COLORS = {
  primary: '#2563EB',
  textSecondary: '#64748B',
};

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

export interface TabIconProps {
  name: IoniconName;
  color?: string;
  focused?: boolean;
  label: string;
}

export default function TabIcon({
  name,
  color = COLORS.textSecondary,
  focused = false,
  label,
}: TabIconProps) {
  const activeColor = focused ? COLORS.primary : color;
  const iconSize = focused ? 26 : 22;

  return (
    <View style={styles.container}>
      <Ionicons color={activeColor} name={name} size={iconSize} />
      <Text style={[styles.label, { color: activeColor }, focused && styles.focusedLabel]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
  focusedLabel: {
    fontWeight: '700',
  },
});
