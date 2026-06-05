import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Button from './Button';

const COLORS = {
  primary: '#2563EB',
  text: '#0F172A',
  textSecondary: '#64748B',
  surface: '#EFF6FF',
};

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

export interface EmptyStateProps {
  icon: IoniconName;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons color={COLORS.primary} name={icon} size={36} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
      {actionLabel && onAction ? (
        <View style={styles.actionContainer}>
          <Button onPress={onAction} title={actionLabel} />
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  iconContainer: {
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 40,
    height: 80,
    justifyContent: 'center',
    marginBottom: 16,
    width: 80,
  },
  title: {
    color: COLORS.text,
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    color: COLORS.textSecondary,
    fontSize: 16,
    lineHeight: 24,
    maxWidth: 320,
    textAlign: 'center',
  },
  actionContainer: {
    marginTop: 20,
    minWidth: 180,
  },
});
