import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, radius } from '../../theme';
import Button from './Button';
import Heading from './Heading';
import Text from './Text';

import { createSheet } from '../../theme';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

export interface EmptyStateProps {
  icon: IoniconName;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({ icon, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <Ionicons color={colors.primary} name={icon} size={36} />
      </View>
      <Heading variant="h2" align="center" style={styles.title}>
        {title}
      </Heading>
      <Text variant="body" color="secondary" align="center" style={styles.description}>
        {description}
      </Text>
      {actionLabel && onAction ? (
        <View style={styles.actionContainer}>
          <Button onPress={onAction} title={actionLabel} />
        </View>
      ) : null}
    </View>
  );
}

const styles = createSheet((colors) => ({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  iconContainer: {
    alignItems: 'center',
    backgroundColor: colors.primarySurface,
    borderRadius: radius.full,
    height: 80,
    justifyContent: 'center',
    marginBottom: 16,
    width: 80,
  },
  title: {
    marginBottom: 8,
  },
  description: {
    maxWidth: 320,
  },
  actionContainer: {
    marginTop: 20,
    minWidth: 180,
  },
}));
