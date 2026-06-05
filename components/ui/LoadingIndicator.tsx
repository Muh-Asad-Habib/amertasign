import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';

interface LoadingIndicatorProps {
  message?: string;
  size?: 'small' | 'large';
  color?: string;
}

export default function LoadingIndicator({
  message,
  size = 'large',
  color = Colors.light.primary,
}: LoadingIndicatorProps) {
  return (
    <View style={styles.container}>
      <ActivityIndicator color={color} size={size} />
      {message ? <Text style={styles.message}>{message}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Layout.spacing.lg,
  },
  message: {
    marginTop: Layout.spacing.md,
    fontSize: Layout.fontSize.body,
    color: Colors.light.textSecondary,
    textAlign: 'center',
  },
});
