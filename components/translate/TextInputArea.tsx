import React from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { colors, fontFamily, radius, spacing } from '../../theme';
import Button from '../ui/Button';
import PressableScale from '../ui/PressableScale';
import Text from '../ui/Text';

import { createSheet } from '../../theme';

/**
 * Batas panjang teks yang diterjemahkan ke isyarat — sinkron dengan batas
 * yang direkomendasikan ke backend untuk endpoint /translate/text-to-sign.
 */
export const TEXT_TO_SIGN_MAX_LENGTH = 200;

export interface TextInputAreaProps {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  /** Tampilkan tombol mikrofon untuk input suara. */
  onMicPress?: () => void;
  isListening?: boolean;
  /** Dipanggil saat kolom teks mendapat fokus (mis. untuk menggulung ke input). */
  onFocus?: () => void;
}

export default function TextInputArea({
  value,
  onChangeText,
  onSubmit,
  onMicPress,
  isListening = false,
  onFocus,
}: TextInputAreaProps) {
  const characterCount = value.length;
  const isDisabled = value.trim().length === 0;
  const isNearLimit = characterCount >= TEXT_TO_SIGN_MAX_LENGTH * 0.9;

  return (
    <View style={styles.container}>
      <TextInput
        accessibilityLabel="Teks untuk diterjemahkan"
        maxLength={TEXT_TO_SIGN_MAX_LENGTH}
        multiline
        onChangeText={onChangeText}
        onFocus={onFocus}
        placeholder={isListening ? 'Mendengarkan... silakan bicara' : 'Ketik pesan untuk diterjemahkan...'}
        placeholderTextColor={colors.textTertiary}
        style={styles.input}
        textAlignVertical="top"
        value={value}
      />
      <View style={styles.footer}>
        <Text variant="caption" color={isNearLimit ? 'error' : 'secondary'}>
          {characterCount}/{TEXT_TO_SIGN_MAX_LENGTH}
        </Text>
        <View style={styles.actions}>
          {onMicPress ? (
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel={isListening ? 'Berhenti mendengarkan' : 'Input suara'}
              accessibilityState={{ selected: isListening }}
              onPress={onMicPress}
              style={[styles.micButton, isListening && styles.micButtonActive]}
            >
              <Ionicons
                color={isListening ? colors.textOnPrimary : colors.primary}
                name={isListening ? 'stop' : 'mic'}
                size={22}
              />
            </PressableScale>
          ) : null}
          <View style={styles.buttonContainer}>
            <Button disabled={isDisabled} fullWidth onPress={onSubmit} title="Terjemahkan" />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = createSheet((colors) => ({
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
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  micButton: {
    width: 48,
    height: 48,
    borderRadius: radius.full,
    borderWidth: 1.5,
    borderColor: colors.primary,
    backgroundColor: colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micButtonActive: {
    backgroundColor: colors.error,
    borderColor: colors.error,
  },
  buttonContainer: {
    minWidth: 140,
  },
}));
