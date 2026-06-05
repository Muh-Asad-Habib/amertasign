import React from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import Button from '../ui/Button';

const COLORS = {
  background: '#FFFFFF',
  text: '#0F172A',
  textSecondary: '#64748B',
  border: '#E2E8F0',
};

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
        placeholderTextColor={COLORS.textSecondary}
        style={styles.input}
        textAlignVertical="top"
        value={value}
      />
      <View style={styles.footer}>
        <Text style={styles.count}>{characterCount} karakter</Text>
        <View style={styles.buttonContainer}>
          <Button disabled={isDisabled} fullWidth onPress={onSubmit} title="Terjemahkan" />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.background,
    borderColor: COLORS.border,
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  input: {
    color: COLORS.text,
    fontSize: 16,
    lineHeight: 24,
    minHeight: 140,
  },
  footer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  count: {
    color: COLORS.textSecondary,
    fontSize: 14,
  },
  buttonContainer: {
    minWidth: 140,
  },
});
