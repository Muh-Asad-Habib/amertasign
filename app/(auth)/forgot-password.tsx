import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Button from '../../components/ui/Button';
import BrandMark from '../../components/ui/BrandMark';
import Decor from '../../components/ui/Decor';
import Heading from '../../components/ui/Heading';
import Input from '../../components/ui/Input';
import Squiggle from '../../components/ui/Squiggle';
import Text from '../../components/ui/Text';
import { spacing } from '../../theme';
import { useAuthStore } from '../../store/useAuthStore';

import { createSheet } from '../../theme';

import { useSettingsStore } from '../../store/useSettingsStore';
import {
  EMAIL_REGEX,
  PASSWORD_MAX_LENGTH,
  PASSWORD_MIN_LENGTH,
  USERNAME_REGEX,
  VALIDATION_MESSAGES,
} from '../../utils/validation';

interface FieldErrors {
  username?: string;
  email?: string;
  newPassword?: string;
  confirmPassword?: string;
}

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const themeMode = useSettingsStore((state) => state.themeMode);
  const resetPassword = useAuthStore((state) => state.resetPassword);
  const isLoading = useAuthStore((state) => state.isLoading);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const emailRef = useRef<TextInput>(null);
  const newPasswordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);

  const clearError = (field: keyof FieldErrors) => {
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  };

  /** Validasi lokal — error tampil inline di bawah field terkait. */
  const validate = (): boolean => {
    const normalizedUsername = username.trim().toLowerCase();
    const normalizedEmail = email.trim().toLowerCase();
    const nextErrors: FieldErrors = {};

    if (!normalizedUsername) {
      nextErrors.username = 'Masukkan username Anda.';
    } else if (!USERNAME_REGEX.test(normalizedUsername)) {
      nextErrors.username = VALIDATION_MESSAGES.username;
    }

    if (!normalizedEmail) {
      nextErrors.email = 'Masukkan email terdaftar Anda.';
    } else if (!EMAIL_REGEX.test(normalizedEmail)) {
      nextErrors.email = VALIDATION_MESSAGES.email;
    }

    if (!newPassword) {
      nextErrors.newPassword = 'Masukkan password baru Anda.';
    } else if (newPassword.length < PASSWORD_MIN_LENGTH) {
      nextErrors.newPassword = VALIDATION_MESSAGES.passwordMin;
    } else if (newPassword.length > PASSWORD_MAX_LENGTH) {
      nextErrors.newPassword = VALIDATION_MESSAGES.passwordMax;
    }

    if (!confirmPassword) {
      nextErrors.confirmPassword = 'Ulangi password baru Anda.';
    } else if (newPassword !== confirmPassword) {
      nextErrors.confirmPassword = 'Konfirmasi password tidak sama dengan password baru.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleReset = async () => {
    if (!validate()) {
      return;
    }

    try {
      await resetPassword(username.trim().toLowerCase(), email.trim().toLowerCase(), newPassword);
      Alert.alert(
        'Password berhasil direset',
        'Silakan masuk kembali menggunakan password baru Anda.',
        [{ text: 'Masuk', onPress: () => router.replace('/(auth)/login') }]
      );
    } catch (error) {
      Alert.alert(
        'Reset password gagal',
        error instanceof Error ? error.message : 'Terjadi kendala saat mereset password. Silakan coba lagi.'
      );
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />
      <Decor preset="corner" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.header}>
            <BrandMark size={84} />
            <Heading variant="title" align="center" style={styles.brandName}>
              Lupa Password
            </Heading>
            <Squiggle width={84} />
            <Text variant="body" color="secondary" align="center" style={styles.subtitle}>
              Verifikasi username dan email terdaftar untuk membuat password baru
            </Text>
          </View>

          <View style={styles.form}>
            <Input
              autoCapitalize="none"
              autoComplete="username"
              autoCorrect={false}
              editable={!isLoading}
              error={errors.username}
              icon="person-outline"
              label="Username"
              placeholder="username_anda"
              returnKeyType="next"
              textContentType="username"
              value={username}
              onChangeText={(value) => {
                setUsername(value);
                clearError('username');
              }}
              onSubmitEditing={() => emailRef.current?.focus()}
            />
            <Input
              ref={emailRef}
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect={false}
              editable={!isLoading}
              error={errors.email}
              icon="mail-outline"
              keyboardType="email-address"
              label="Email terdaftar"
              placeholder="nama@email.com"
              returnKeyType="next"
              textContentType="emailAddress"
              value={email}
              onChangeText={(value) => {
                setEmail(value);
                clearError('email');
              }}
              onSubmitEditing={() => newPasswordRef.current?.focus()}
            />
            <Input
              ref={newPasswordRef}
              autoCapitalize="none"
              autoComplete="password-new"
              autoCorrect={false}
              editable={!isLoading}
              error={errors.newPassword}
              icon="lock-closed-outline"
              isPasswordVisible={showPassword}
              label="Password baru"
              maxLength={PASSWORD_MAX_LENGTH}
              onToggleVisibility={() => setShowPassword((value) => !value)}
              placeholder="Minimal 6 karakter"
              returnKeyType="next"
              secureTextEntry={!showPassword}
              textContentType="newPassword"
              value={newPassword}
              onChangeText={(value) => {
                setNewPassword(value);
                clearError('newPassword');
              }}
              onSubmitEditing={() => confirmPasswordRef.current?.focus()}
            />
            <Input
              ref={confirmPasswordRef}
              autoCapitalize="none"
              autoComplete="password-new"
              autoCorrect={false}
              editable={!isLoading}
              error={errors.confirmPassword}
              icon="shield-checkmark-outline"
              isPasswordVisible={showConfirmPassword}
              label="Konfirmasi password baru"
              maxLength={PASSWORD_MAX_LENGTH}
              onToggleVisibility={() => setShowConfirmPassword((value) => !value)}
              placeholder="Ulangi password baru"
              returnKeyType="done"
              secureTextEntry={!showConfirmPassword}
              textContentType="newPassword"
              value={confirmPassword}
              onChangeText={(value) => {
                setConfirmPassword(value);
                clearError('confirmPassword');
              }}
              onSubmitEditing={handleReset}
            />

            <Button
              disabled={isLoading || !username.trim() || !email.trim() || !newPassword || !confirmPassword}
              fullWidth
              loading={isLoading}
              title="Reset Password"
              onPress={handleReset}
            />
          </View>

          <View style={styles.footer}>
            <Text variant="body" color="secondary">
              Ingat password Anda?{' '}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Masuk ke akun"
              disabled={isLoading}
              hitSlop={12}
              onPress={() => router.replace('/(auth)/login')}
            >
              <Text variant="bodyStrong" color="primary">
                Masuk
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = createSheet((colors) => ({
  safeArea: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: spacing.xs,
  },
  brandName: {
    marginTop: 0,
  },
  subtitle: {
    marginTop: 0,
  },
  form: {
    gap: spacing.md,
  },
  footer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
}));
