import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Button from '../../components/ui/Button';
import BrandMark from '../../components/ui/BrandMark';
import Decor from '../../components/ui/Decor';
import GoogleButton from '../../components/ui/GoogleButton';
import Heading from '../../components/ui/Heading';
import Input from '../../components/ui/Input';
import Squiggle from '../../components/ui/Squiggle';
import Text from '../../components/ui/Text';
import { spacing } from '../../theme';
import { useAuthStore } from '../../store/useAuthStore';
import { useGoogleAuth } from '../../hooks/useGoogleAuth';

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
  password?: string;
  confirmPassword?: string;
}

export default function RegisterScreen() {
  const router = useRouter();
  const themeMode = useSettingsStore((state) => state.themeMode);
  const signUp = useAuthStore((state) => state.signUp);
  const isLoading = useAuthStore((state) => state.isLoading);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const confirmPasswordRef = useRef<TextInput>(null);

  const { isGoogleLoading, promptGoogleSignIn } = useGoogleAuth({
    onSuccess: () => router.replace('/(tabs)/'),
    onError: (message) => Alert.alert('Daftar dengan Google gagal', message),
  });

  const clearError = (field: keyof FieldErrors) => {
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  };

  /** Validasi lokal — error tampil inline di bawah field terkait. */
  const validate = (): boolean => {
    const normalizedUsername = username.trim().toLowerCase();
    const normalizedEmail = email.trim().toLowerCase();
    const nextErrors: FieldErrors = {};

    if (!normalizedUsername) {
      nextErrors.username = 'Masukkan username pilihan Anda.';
    } else if (!USERNAME_REGEX.test(normalizedUsername)) {
      nextErrors.username = VALIDATION_MESSAGES.username;
    }

    if (!normalizedEmail) {
      nextErrors.email = 'Masukkan alamat email Anda.';
    } else if (!EMAIL_REGEX.test(normalizedEmail)) {
      nextErrors.email = VALIDATION_MESSAGES.email;
    }

    if (!password) {
      nextErrors.password = 'Masukkan password pilihan Anda.';
    } else if (password.length < PASSWORD_MIN_LENGTH) {
      nextErrors.password = VALIDATION_MESSAGES.passwordMin;
    } else if (password.length > PASSWORD_MAX_LENGTH) {
      nextErrors.password = VALIDATION_MESSAGES.passwordMax;
    }

    if (!confirmPassword) {
      nextErrors.confirmPassword = 'Ulangi password Anda.';
    } else if (password !== confirmPassword) {
      nextErrors.confirmPassword = 'Konfirmasi password tidak sama dengan password.';
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) {
      return;
    }

    try {
      await signUp(username.trim().toLowerCase(), password, email.trim().toLowerCase());
      router.replace('/(tabs)/');
    } catch (error) {
      Alert.alert(
        'Pendaftaran gagal',
        error instanceof Error ? error.message : 'Terjadi kendala saat membuat akun. Silakan coba lagi.'
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
              Buat Akun Baru
            </Heading>
            <Squiggle width={84} />
            <Text variant="body" color="secondary" align="center" style={styles.subtitle}>
              Mulai perjalanan komunikasi tanpa batas bersama Amerta Sign
            </Text>
          </View>

          <View style={styles.form}>
            <Input
              autoCapitalize="none"
              autoComplete="username-new"
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
              label="Email"
              placeholder="nama@email.com"
              returnKeyType="next"
              textContentType="emailAddress"
              value={email}
              onChangeText={(value) => {
                setEmail(value);
                clearError('email');
              }}
              onSubmitEditing={() => passwordRef.current?.focus()}
            />
            <Input
              ref={passwordRef}
              autoCapitalize="none"
              autoComplete="password-new"
              autoCorrect={false}
              editable={!isLoading}
              error={errors.password}
              icon="lock-closed-outline"
              isPasswordVisible={showPassword}
              label="Password"
              maxLength={PASSWORD_MAX_LENGTH}
              onToggleVisibility={() => setShowPassword((value) => !value)}
              placeholder="Minimal 6 karakter"
              returnKeyType="next"
              secureTextEntry={!showPassword}
              textContentType="newPassword"
              value={password}
              onChangeText={(value) => {
                setPassword(value);
                clearError('password');
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
              label="Konfirmasi password"
              maxLength={PASSWORD_MAX_LENGTH}
              onToggleVisibility={() => setShowConfirmPassword((value) => !value)}
              placeholder="Ulangi password"
              returnKeyType="done"
              secureTextEntry={!showConfirmPassword}
              textContentType="newPassword"
              value={confirmPassword}
              onChangeText={(value) => {
                setConfirmPassword(value);
                clearError('confirmPassword');
              }}
              onSubmitEditing={handleRegister}
            />

            <Button
              disabled={isLoading || !username.trim() || !email.trim() || !password || !confirmPassword}
              fullWidth
              loading={isLoading}
              title="Daftar"
              onPress={handleRegister}
            />

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text variant="caption" color="secondary" style={styles.dividerText}>
                atau
              </Text>
              <View style={styles.dividerLine} />
            </View>

            <GoogleButton
              disabled={isLoading}
              loading={isGoogleLoading}
              title="Daftar dengan Google"
              onPress={promptGoogleSignIn}
            />
          </View>

          <View style={styles.footer}>
            <Text variant="body" color="secondary">
              Sudah punya akun?{' '}
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
