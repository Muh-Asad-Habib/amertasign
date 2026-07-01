import { Ionicons } from '@expo/vector-icons';
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

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginScreen() {
  const router = useRouter();
  const signIn = useAuthStore((state) => state.signIn);
  const googleSignIn = useAuthStore((state) => state.googleSignIn);
  const continueAsGuest = useAuthStore((state) => state.continueAsGuest);
  const isLoading = useAuthStore((state) => state.isLoading);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [activeAuthMethod, setActiveAuthMethod] = useState<'email' | 'google' | null>(null);

  const handleLogin = async () => {
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail || !password) {
      Alert.alert('Data belum lengkap', 'Masukkan email dan password Anda terlebih dahulu.');
      return;
    }

    if (!EMAIL_REGEX.test(normalizedEmail)) {
      Alert.alert('Email tidak valid', 'Gunakan format email yang benar, misalnya nama@email.com.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Password terlalu pendek', 'Password harus terdiri dari minimal 6 karakter.');
      return;
    }

    setActiveAuthMethod('email');

    try {
      await signIn(normalizedEmail, password);
      router.replace('/(tabs)/');
    } catch (error) {
      Alert.alert(
        'Masuk gagal',
        error instanceof Error ? error.message : 'Terjadi kendala saat masuk. Silakan coba lagi.'
      );
    } finally {
      setActiveAuthMethod(null);
    }
  };

  const handleGoogleLogin = async () => {
    setActiveAuthMethod('google');

    try {
      await googleSignIn();
      router.replace('/(tabs)/');
    } catch (error) {
      Alert.alert(
        'Google Sign-In gagal',
        error instanceof Error ? error.message : 'Silakan coba lagi dalam beberapa saat.'
      );
    } finally {
      setActiveAuthMethod(null);
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
      <StatusBar style="dark" />
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
            icon="mail-outline"
            keyboardType="email-address"
            label="Email"
            placeholder="nama@email.com"
            textContentType="emailAddress"
            value={email}
            onChangeText={setEmail}
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
            disabled={isLoading || !email.trim() || !password}
            fullWidth
            loading={isLoading && activeAuthMethod === 'email'}
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
            icon={
              isLoading && activeAuthMethod === 'google'
                ? undefined
                : <Ionicons color={colors.primary} name="logo-google" size={18} />
            }
            loading={isLoading && activeAuthMethod === 'google'}
            title="Masuk dengan Google"
            variant="outline"
            onPress={handleGoogleLogin}
          />

          <Button
            disabled={isLoading}
            fullWidth
            title="Lanjut sebagai Tamu"
            variant="ghost"
            onPress={handleGuestLogin}
          />
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

const styles = StyleSheet.create({
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
});
