import React, { useEffect, useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const COLORS = {
  primary: '#2563EB',
  background: '#FFFFFF',
  text: '#0F172A',
  textSecondary: '#64748B',
  border: '#E2E8F0',
};

export interface TranslationOutputProps {
  text: string;
  isLoading: boolean;
  onSpeak: (text: string) => void;
}

export default function TranslationOutput({
  text,
  isLoading,
  onSpeak,
}: TranslationOutputProps) {
  const pulse = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    if (!isLoading) {
      pulse.stopAnimation();
      pulse.setValue(1);
      return;
    }

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 650,
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0.45,
          duration: 650,
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();

    return () => {
      animation.stop();
    };
  }, [isLoading, pulse]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Hasil Terjemahan</Text>
        {!isLoading ? (
          <Pressable
            accessibilityLabel="Putar suara hasil terjemahan"
            onPress={() => onSpeak(text)}
            style={({ pressed }) => [styles.speakButton, pressed && styles.pressed]}
          >
            <Ionicons color={COLORS.primary} name="volume-high" size={22} />
          </Pressable>
        ) : null}
      </View>

      {isLoading ? (
        <Animated.View style={[styles.loadingContainer, { opacity: pulse }]}> 
          <View style={styles.loadingLineLarge} />
          <View style={styles.loadingLineMedium} />
          <Text style={styles.loadingLabel}>Mendeteksi gerakan...</Text>
        </Animated.View>
      ) : (
        <Text style={styles.text}>{text || 'Belum ada hasil terjemahan.'}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.background,
    borderColor: COLORS.border,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    minHeight: 200,
    padding: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  header: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  eyebrow: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  speakButton: {
    alignItems: 'center',
    backgroundColor: '#EFF6FF',
    borderRadius: 20,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  text: {
    color: COLORS.text,
    fontSize: 24,
    fontWeight: '700',
    lineHeight: 34,
  },
  loadingContainer: {
    paddingTop: 8,
  },
  loadingLineLarge: {
    backgroundColor: '#E2E8F0',
    borderRadius: 999,
    height: 24,
    marginBottom: 12,
    width: '88%',
  },
  loadingLineMedium: {
    backgroundColor: '#E2E8F0',
    borderRadius: 999,
    height: 24,
    marginBottom: 16,
    width: '62%',
  },
  loadingLabel: {
    color: COLORS.textSecondary,
    fontSize: 16,
  },
  pressed: {
    opacity: 0.8,
  },
});
