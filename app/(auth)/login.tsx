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

export default function LoginScreen() {
  const router = useRouter();
  const signIn = useAuthStore((state) => state.signIn);
  const googleSignIn = useAuthStore((state) => state.googleSignIn);
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <View style={styles.logoBadge}>
            <Text style={styles.logoEmoji}>🤟</Text>
          </View>
          <Text style={styles.title}>AmertaSign</Text>
          <Text style={styles.subtitle}>Masuk ke akun Anda</Text>
        </View>

        <View style={styles.form}>
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
            title="Masuk dengan Google"
            variant="outline"
            onPress={handleGoogleLogin}
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>Belum punya akun?</Text>
          <Pressable disabled={isLoading} onPress={() => router.replace('/(auth)/register')}>
            <Text style={styles.footerLink}>Daftar</Text>
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
    width: 96,
    height: 96,
    borderRadius: Layout.radius.full,
    backgroundColor: '#DBEAFE',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Layout.spacing.md,
  },
  logoEmoji: {
    fontSize: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: Colors.light.text,
  },
  subtitle: {
    marginTop: Layout.spacing.xs,
    fontSize: Layout.fontSize.body,
    color: Colors.light.textSecondary,
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
