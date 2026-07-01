import React from 'react';
import { StyleSheet, TextInput, View } from 'react-native';

import { colors, fontFamily, radius, spacing } from '../../theme';
import Button from '../ui/Button';
import Text from '../ui/Text';

export interface TextInputAreaProps {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
}

export default function TextInputArea({ value, onChangeText, onSubmit }: TextInputAreaProps) {
  const characterCount = value.length;
  const isDisabled = value.trim().length === 0;

  return (
    <View style={styles.container}>
      <TextInput
        multiline
        onChangeText={onChangeText}
        placeholder="Ketik pesan untuk diterjemahkan..."
        placeholderTextColor={colors.textTertiary}
        style={styles.input}
        textAlignVertical="top"
        value={value}
      />
      <View style={styles.footer}>
        <Text variant="caption" color="secondary">
          {characterCount} karakter
        </Text>
        <View style={styles.buttonContainer}>
          <Button disabled={isDisabled} fullWidth onPress={onSubmit} title="Terjemahkan" />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.base,
    gap: spacing.base,
  },
  input: {
    color: colors.text,
    fontFamily: fontFamily.bodyRegular,
    fontSize: 16,
    lineHeight: 24,
    minHeight: 140,
  },
  footer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  buttonContainer: {
    minWidth: 140,
  },
});
