import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, View } from 'react-native';
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

const USERNAME_REGEX = /^[a-zA-Z0-9._-]{3,20}$/;
const EMAIL_REGEX = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
/** bcrypt di backend hanya memproses 72 byte pertama — batasi agar tidak terpotong diam-diam. */
const PASSWORD_MAX_LENGTH = 72;

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

  const handleReset = async () => {
    const normalizedUsername = username.trim().toLowerCase();
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedUsername || !normalizedEmail || !newPassword || !confirmPassword) {
      Alert.alert('Data belum lengkap', 'Lengkapi semua field untuk mereset password Anda.');
      return;
    }

    if (!USERNAME_REGEX.test(normalizedUsername)) {
      Alert.alert('Username tidak valid', 'Username 3-20 karakter, hanya huruf, angka, titik, garis bawah, atau strip.');
      return;
    }

    if (!EMAIL_REGEX.test(normalizedEmail)) {
      Alert.alert('Email tidak valid', 'Masukkan alamat email yang benar, contoh: nama@email.com.');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Password terlalu pendek', 'Password baru harus terdiri dari minimal 6 karakter.');
      return;
    }

    if (newPassword.length > PASSWORD_MAX_LENGTH) {
      Alert.alert('Password terlalu panjang', `Password maksimal ${PASSWORD_MAX_LENGTH} karakter.`);
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Password tidak sama', 'Pastikan konfirmasi password sesuai dengan password baru Anda.');
      return;
    }

    try {
      await resetPassword(normalizedUsername, normalizedEmail, newPassword);
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
            icon="mail-outline"
            keyboardType="email-address"
            label="Email terdaftar"
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
            label="Password baru"
            maxLength={PASSWORD_MAX_LENGTH}
            onToggleVisibility={() => setShowPassword((value) => !value)}
            placeholder="Minimal 6 karakter"
            secureTextEntry={!showPassword}
            textContentType="newPassword"
            value={newPassword}
            onChangeText={setNewPassword}
          />
          <Input
            autoCapitalize="none"
            autoCorrect={false}
            icon="shield-checkmark-outline"
            isPasswordVisible={showConfirmPassword}
            label="Konfirmasi password baru"
            maxLength={PASSWORD_MAX_LENGTH}
            onToggleVisibility={() => setShowConfirmPassword((value) => !value)}
            placeholder="Ulangi password baru"
            secureTextEntry={!showConfirmPassword}
            textContentType="password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
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
          <Pressable disabled={isLoading} onPress={() => router.replace('/(auth)/login')}>
            <Text variant="bodyStrong" color="primary">
              Masuk
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
