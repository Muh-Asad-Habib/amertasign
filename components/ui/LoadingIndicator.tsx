import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';

import { colors, spacing } from '../../theme';
import Text from './Text';

import { createSheet } from '../../theme';

interface LoadingIndicatorProps {
  message?: string;
  size?: 'small' | 'large';
  color?: string;
}

export default function LoadingIndicator({
  message,
  size = 'large',
  color = colors.primary,
}: LoadingIndicatorProps) {
  return (
    <View style={styles.container}>
      <ActivityIndicator color={color} size={size} />
      {message ? (
        <Text variant="body" color="secondary" align="center" style={styles.message}>
          {message}
        </Text>
      ) : null}
    </View>
  );
}

const styles = createSheet((colors) => ({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
  },
  message: {
    marginTop: spacing.md,
  },
}));
