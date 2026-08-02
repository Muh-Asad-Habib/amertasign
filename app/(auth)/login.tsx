import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useRef, useState } from 'react';
import { Alert, Pressable, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Button from '../../components/ui/Button';
import BrandMark from '../../components/ui/BrandMark';
import Decor from '../../components/ui/Decor';
import GoogleButton from '../../components/ui/GoogleButton';
import Heading from '../../components/ui/Heading';
import Input from '../../components/ui/Input';
import KeyboardAwareScrollView from '../../components/ui/KeyboardAwareScrollView';
import Squiggle from '../../components/ui/Squiggle';
import Text from '../../components/ui/Text';
import { spacing } from '../../theme';
import { useAuthStore } from '../../store/useAuthStore';
import { useGoogleAuth } from '../../hooks/useGoogleAuth';

import { createSheet } from '../../theme';

import { useSettingsStore } from '../../store/useSettingsStore';
import { PASSWORD_MIN_LENGTH, USERNAME_REGEX, VALIDATION_MESSAGES } from '../../utils/validation';

interface FieldErrors {
  username?: string;
  password?: string;
}

export default function LoginScreen() {
  const router = useRouter();
  const themeMode = useSettingsStore((state) => state.themeMode);
  const signIn = useAuthStore((state) => state.signIn);
  const continueAsGuest = useAuthStore((state) => state.continueAsGuest);
  const isLoading = useAuthStore((state) => state.isLoading);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const passwordRef = useRef<TextInput>(null);

  const { isGoogleLoading, promptGoogleSignIn } = useGoogleAuth({
    onSuccess: () => router.replace('/(tabs)/'),
    onError: (message) => Alert.alert('Masuk dengan Google gagal', message),
  });

  /** Validasi lokal — error tampil inline di bawah field terkait. */
  const validate = (): boolean => {
    const normalizedUsername = username.trim().toLowerCase();
    const nextErrors: FieldErrors = {};

    if (!normalizedUsername) {
      nextErrors.username = 'Masukkan username Anda.';
    } else if (!USERNAME_REGEX.test(normalizedUsername)) {
      nextErrors.username = VALIDATION_MESSAGES.username;
    }

    if (!password) {
      nextErrors.password = 'Masukkan password Anda.';
    } else if (password.length < PASSWORD_MIN_LENGTH) {
      nextErrors.password = VALIDATION_MESSAGES.passwordMin;
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validate()) {
      return;
    }

    try {
      await signIn(username.trim().toLowerCase(), password);
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
      <KeyboardAwareScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <BrandMark size={92} />
          <Heading variant="title" align="center" style={styles.brandName}>
            Amerta Sign
          </Heading>
          <Squiggle width={84} />
          <Text variant="body" color="secondary" align="center" style={styles.subtitle}>
            Masuk ke akun Anda
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
              if (errors.username) {
                setErrors((prev) => ({ ...prev, username: undefined }));
              }
            }}
            onSubmitEditing={() => passwordRef.current?.focus()}
          />
          <Input
            ref={passwordRef}
            autoCapitalize="none"
            autoComplete="current-password"
            autoCorrect={false}
            editable={!isLoading}
            error={errors.password}
            icon="lock-closed-outline"
            isPasswordVisible={showPassword}
            label="Password"
            onToggleVisibility={() => setShowPassword((value) => !value)}
            placeholder="Minimal 6 karakter"
            returnKeyType="done"
            secureTextEntry={!showPassword}
            textContentType="password"
            value={password}
            onChangeText={(value) => {
              setPassword(value);
              if (errors.password) {
                setErrors((prev) => ({ ...prev, password: undefined }));
              }
            }}
            onSubmitEditing={handleLogin}
          />

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Lupa password"
            accessibilityHint="Buka halaman reset password"
            disabled={isLoading}
            hitSlop={12}
            onPress={() => router.push('/(auth)/forgot-password')}
            style={styles.forgotLink}
          >
            <Text variant="bodyStrong" color="primary">
              Lupa password?
            </Text>
          </Pressable>

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

          <GoogleButton
            disabled={isLoading}
            loading={isGoogleLoading}
            title="Masuk dengan Google"
            onPress={promptGoogleSignIn}
          />

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
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Daftar akun baru"
            disabled={isLoading}
            hitSlop={12}
            onPress={() => router.replace('/(auth)/register')}
          >
            <Text variant="bodyStrong" color="primary">
              Daftar
            </Text>
          </Pressable>
        </View>
      </KeyboardAwareScrollView>
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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
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
  forgotLink: {
    alignSelf: 'flex-end',
    marginTop: -spacing.xs,
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
