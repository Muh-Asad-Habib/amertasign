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

export default function RegisterScreen() {
  const router = useRouter();
  const signUp = useAuthStore((state) => state.signUp);
  const googleSignIn = useAuthStore((state) => state.googleSignIn);
  const isLoading = useAuthStore((state) => state.isLoading);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [activeAuthMethod, setActiveAuthMethod] = useState<'email' | 'google' | null>(null);

  const handleRegister = async () => {
    const normalizedName = name.trim();
    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedName || !normalizedEmail || !password || !confirmPassword) {
      Alert.alert('Data belum lengkap', 'Lengkapi semua field untuk membuat akun baru.');
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

    if (password !== confirmPassword) {
      Alert.alert('Password tidak sama', 'Pastikan konfirmasi password sesuai dengan password Anda.');
      return;
    }

    setActiveAuthMethod('email');

    try {
      await signUp(normalizedName, normalizedEmail, password);
      router.replace('/(tabs)/');
    } catch (error) {
      Alert.alert(
        'Pendaftaran gagal',
        error instanceof Error ? error.message : 'Terjadi kendala saat membuat akun. Silakan coba lagi.'
      );
    } finally {
      setActiveAuthMethod(null);
    }
  };

  const handleGoogleRegister = async () => {
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <Decor preset="corner" />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <BrandMark size={84} />
          <Heading variant="title" align="center" style={styles.brandName}>
            Buat Akun Baru
          </Heading>
          <Squiggle width={84} />
          <Text variant="body" color="secondary" align="center" style={styles.subtitle}>
            Mulai perjalanan komunikasi tanpa batas bersama AmertaSign
          </Text>
        </View>

        <View style={styles.form}>
          <Input
            autoCorrect={false}
            icon="person-outline"
            label="Nama lengkap"
            placeholder="Nama Anda"
            textContentType="name"
            value={name}
            onChangeText={setName}
          />
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
            textContentType="newPassword"
            value={password}
            onChangeText={setPassword}
          />
          <Input
            autoCapitalize="none"
            autoCorrect={false}
            icon="shield-checkmark-outline"
            isPasswordVisible={showConfirmPassword}
            label="Konfirmasi password"
            onToggleVisibility={() => setShowConfirmPassword((value) => !value)}
            placeholder="Ulangi password"
            secureTextEntry={!showConfirmPassword}
            textContentType="password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
          />

          <Button
            disabled={isLoading || !name.trim() || !email.trim() || !password || !confirmPassword}
            fullWidth
            loading={isLoading && activeAuthMethod === 'email'}
            title="Daftar"
            onPress={handleRegister}
          />

          <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text variant="caption" color="secondary">
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
            title="Daftar dengan Google"
            variant="outline"
            onPress={handleGoogleRegister}
          />
        </View>

        <View style={styles.footer}>
          <Text variant="body" color="secondary">
            Sudah punya akun?{' '}
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
  footer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
});
