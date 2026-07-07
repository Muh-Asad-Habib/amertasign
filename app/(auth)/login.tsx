import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Button from '../../components/ui/Button';
import BrandMark from '../../components/ui/BrandMark';
import Decor from '../../components/ui/Decor';
import Heading from '../../components/ui/Heading';
import Input from '../../components/ui/Input';
import Squiggle from '../../components/ui/Squiggle';
import Text from '../../components/ui/Text';
import { colors, spacing } from '../../theme';
import { useAuthStore } from '../../store/useAuthStore';

import { createSheet } from '../../theme';

import { useSettingsStore } from '../../store/useSettingsStore';

const USERNAME_REGEX = /^[a-zA-Z0-9._-]{3,20}$/;

export default function LoginScreen() {
  const router = useRouter();
  const themeMode = useSettingsStore((state) => state.themeMode);
  const signIn = useAuthStore((state) => state.signIn);
  const continueAsGuest = useAuthStore((state) => state.continueAsGuest);
  const isLoading = useAuthStore((state) => state.isLoading);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async () => {
    const normalizedUsername = username.trim().toLowerCase();

    if (!normalizedUsername || !password) {
      Alert.alert('Data belum lengkap', 'Masukkan username dan password Anda terlebih dahulu.');
      return;
    }

    if (!USERNAME_REGEX.test(normalizedUsername)) {
      Alert.alert('Username tidak valid', 'Username 3-20 karakter, hanya huruf, angka, titik, garis bawah, atau strip.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Password terlalu pendek', 'Password harus terdiri dari minimal 6 karakter.');
      return;
    }

    try {
      await signIn(normalizedUsername, password);
      router.replace('/(tabs)/');
    } catch (error) {
      Alert.alert(
        'Masuk gagal',
        error instanceof Error ? error.message : 'Terjadi kendala saat masuk. Silakan coba lagi.'
      );
    }
  };

  const handleGuestLogin = async () => {
    try {
      await continueAsGuest();
      router.replace('/(tabs)/');
    } catch (error) {
      Alert.alert(
        'Gagal masuk sebagai tamu',
        error instanceof Error ? error.message : 'Silakan coba lagi dalam beberapa saat.'
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />
      <Decor preset="corner" />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <BrandMark size={92} />
          <Heading variant="title" align="center" style={styles.brandName}>
            AmertaSign
          </Heading>
          <Squiggle width={84} />
          <Text variant="body" color="secondary" align="center" style={styles.subtitle}>
            Masuk ke akun Anda
          </Text>
        </View>

        <View style={styles.form}>
          <Input
            autoCapitalize="none"
            autoCorrect={false}
            icon="person-outline"
            label="Username"
            placeholder="username_anda"
            textContentType="username"
            value={username}
            onChangeText={setUsername}
          />
          <Input
            autoCapitalize="none"
            autoCorrect={false}
            icon="lock-closed-outline"
            isPasswordVisible={showPassword}
            label="Password"
            onToggleVisibility={() => setShowPassword((value) => !value)}
            placeholder="Minimal 6 karakter"
            secureTextEntry={!showPassword}
            textContentType="password"
            value={password}
            onChangeText={setPassword}
          />

          <Button
            disabled={isLoading || !username.trim() || !password}
            fullWidth
            loading={isLoading}
            title="Masuk"
            onPress={handleLogin}
          />

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text variant="caption" color="secondary" style={styles.dividerText}>
              atau
            </Text>
            <View style={styles.dividerLine} />
          </View>

          <Button
            disabled={isLoading}
            fullWidth
            title="Lanjut sebagai Tamu"
            variant="ghost"
            onPress={handleGuestLogin}
          />

          <Text variant="caption" color="secondary" align="center">
            Mode tamu tidak menyimpan riwayat terjemahan.
          </Text>
        </View>

        <View style={styles.footer}>
          <Text variant="body" color="secondary">
            Belum punya akun?{' '}
          </Text>
          <Pressable disabled={isLoading} onPress={() => router.replace('/(auth)/register')}>
            <Text variant="bodyStrong" color="primary">
              Daftar
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = createSheet((colors) => ({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  brandName: {
    marginTop: spacing.xs,
  },
  subtitle: {
    marginTop: spacing.xs,
  },
  form: {
    gap: spacing.md,
  },
  dividerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginVertical: spacing.xs,
    gap: spacing.md,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {},
  footer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
}));
