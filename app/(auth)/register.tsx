import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import AuthInput from '../../components/auth/AuthInput';
import Button from '../../components/ui/Button';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';
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
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoEmoji}>🤟</Text>
          </View>
          <Text style={styles.title}>Buat Akun Baru</Text>
          <Text style={styles.subtitle}>Mulai perjalanan komunikasi tanpa batas bersama AmertaSign</Text>
        </View>

        <View style={styles.form}>
          <AuthInput
            autoCorrect={false}
            icon="person-outline"
            placeholder="Nama lengkap"
            textContentType="name"
            value={name}
            onChangeText={setName}
          />
          <AuthInput
            autoCapitalize="none"
            autoCorrect={false}
            icon="mail-outline"
            keyboardType="email-address"
            placeholder="Email"
            textContentType="emailAddress"
            value={email}
            onChangeText={setEmail}
          />
          <AuthInput
            autoCapitalize="none"
            autoCorrect={false}
            icon="lock-closed-outline"
            isPasswordVisible={showPassword}
            onToggleVisibility={() => setShowPassword((value) => !value)}
            placeholder="Password"
            secureTextEntry={!showPassword}
            textContentType="newPassword"
            value={password}
            onChangeText={setPassword}
          />
          <AuthInput
            autoCapitalize="none"
            autoCorrect={false}
            icon="shield-checkmark-outline"
            isPasswordVisible={showConfirmPassword}
            onToggleVisibility={() => setShowConfirmPassword((value) => !value)}
            placeholder="Konfirmasi password"
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
            <Text style={styles.dividerText}>atau</Text>
            <View style={styles.dividerLine} />
          </View>

          <Button
            disabled={isLoading}
            fullWidth
            icon={
              isLoading && activeAuthMethod === 'google'
                ? undefined
                : <Ionicons color={Colors.light.primary} name="logo-google" size={18} />
            }
            loading={isLoading && activeAuthMethod === 'google'}
            title="Daftar dengan Google"
            variant="outline"
            onPress={handleGoogleRegister}
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Sudah punya akun?</Text>
          <Pressable disabled={isLoading} onPress={() => router.replace('/(auth)/login')}>
            <Text style={styles.footerLink}>Masuk</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.light.surface,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: Layout.spacing.lg,
    paddingVertical: Layout.spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: Layout.spacing.xl,
  },
  logoBadge: {
    width: 88,
    height: 88,
    borderRadius: Layout.radius.full,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Layout.spacing.md,
  },
  logoEmoji: {
    fontSize: 44,
  },
  title: {
    fontSize: Layout.fontSize.title,
    fontWeight: '800',
    color: Colors.light.text,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: Layout.spacing.xs,
    fontSize: Layout.fontSize.body,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  form: {
    gap: Layout.spacing.md,
  },
  dividerRow: {
    alignItems: 'center',
    flexDirection: 'row',
    marginVertical: Layout.spacing.xs,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.light.border,
  },
  dividerText: {
    marginHorizontal: Layout.spacing.md,
    fontSize: Layout.fontSize.sm,
    color: Colors.light.textSecondary,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Layout.spacing.xl,
  },
  footerText: {
    fontSize: Layout.fontSize.body,
    color: Colors.light.textSecondary,
    marginRight: Layout.spacing.xs,
  },
  footerLink: {
    fontSize: Layout.fontSize.body,
    color: Colors.light.primary,
    fontWeight: '700',
  },
});
