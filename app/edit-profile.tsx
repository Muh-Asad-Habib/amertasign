import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useState } from 'react';
import { Alert, BackHandler, Image, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import BackHeader from '../components/ui/BackHeader';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import PressableScale from '../components/ui/PressableScale';
import Screen from '../components/ui/Screen';
import Stack from '../components/ui/Stack';
import Text from '../components/ui/Text';
import { colors, radius, shadow, spacing } from '../theme';
import { useAuthStore } from '../store/useAuthStore';
import { useThemeMode } from '../hooks/useThemeMode';

import { createSheet } from '../theme';
import {
  EMAIL_REGEX,
  PASSWORD_MAX_LENGTH,
  USERNAME_REGEX,
  VALIDATION_MESSAGES,
} from '../utils/validation';

export default function EditProfileScreen() {
  useThemeMode();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isGuest = useAuthStore((state) => state.isGuest);
  const isLoading = useAuthStore((state) => state.isLoading);
  const updateProfile = useAuthStore((state) => state.updateProfile);
  const changePassword = useAuthStore((state) => state.changePassword);

  const [name, setName] = useState(user?.name ?? '');
  const [username, setUsername] = useState(user?.username ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [avatarUri, setAvatarUri] = useState<string | null>(user?.avatarUrl ?? null);
  const [avatarChanged, setAvatarChanged] = useState(false);

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [isSavingPassword, setIsSavingPassword] = useState(false);

  const displayName = name.trim() || user?.name || 'Pengguna';
  const initial = displayName.trim().charAt(0).toUpperCase() || 'A';
  const isGoogleAccount = user?.hasPassword === false;

  // Perubahan belum tersimpan: data profil berbeda dari akun, atau field password terisi.
  const isDirty =
    Boolean(user) &&
    (name.trim() !== (user?.name ?? '') ||
      username.trim().toLowerCase() !== (user?.username ?? '') ||
      email.trim().toLowerCase() !== (user?.email ?? '') ||
      avatarChanged ||
      Boolean(currentPassword || newPassword || confirmNewPassword));

  const handleBack = useCallback(() => {
    if (!isDirty) {
      router.back();
      return;
    }

    Alert.alert('Buang perubahan?', 'Perubahan yang belum disimpan akan hilang.', [
      { text: 'Lanjut mengedit', style: 'cancel' },
      { text: 'Buang', style: 'destructive', onPress: () => router.back() },
    ]);
  }, [isDirty, router]);

  // Tombol back fisik Android juga melewati penjaga perubahan belum tersimpan.
  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (isDirty) {
        handleBack();
        return true;
      }
      return false;
    });

    return () => subscription.remove();
  }, [handleBack, isDirty]);

  if (isGuest || !user) {
    return (
      <Screen>
        <BackHeader title="Edit Profil" onBack={() => router.back()} />
        <View style={styles.guestState}>
          <Ionicons color={colors.textTertiary} name="person-circle-outline" size={64} />
          <Text variant="body" color="secondary" align="center">
            Masuk ke akun Anda terlebih dahulu untuk mengubah profil.
          </Text>
          <Button title="Masuk / Daftar" onPress={() => router.replace('/(auth)/login')} />
        </View>
      </Screen>
    );
  }

  const handlePickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Izin dibutuhkan', 'Izinkan akses galeri untuk mengganti foto profil.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (result.canceled || !result.assets[0]) {
      return;
    }

    try {
      // Kecilkan ke 512px + JPEG 60% → base64 ±30-80 KB, selalu muat di backend (batas ~1 MB).
      const context = ImageManipulator.manipulate(result.assets[0].uri);
      context.resize({ width: 512 });
      const rendered = await context.renderAsync();
      const saved = await rendered.saveAsync({
        base64: true,
        compress: 0.6,
        format: SaveFormat.JPEG,
      });

      if (!saved.base64) {
        Alert.alert('Gagal membaca foto', 'Silakan pilih foto lain.');
        return;
      }

      setAvatarUri(`data:image/jpeg;base64,${saved.base64}`);
      setAvatarChanged(true);
    } catch {
      Alert.alert('Gagal memproses foto', 'Silakan pilih foto lain.');
    }
  };

  const handleSaveProfile = async () => {
    const normalizedUsername = username.trim().toLowerCase();
    const normalizedEmail = email.trim().toLowerCase();
    const trimmedName = name.trim();

    if (!trimmedName) {
      Alert.alert('Nama kosong', 'Masukkan nama tampilan Anda.');
      return;
    }

    if (!USERNAME_REGEX.test(normalizedUsername)) {
      Alert.alert('Username tidak valid', VALIDATION_MESSAGES.username);
      return;
    }

    if (normalizedEmail && !EMAIL_REGEX.test(normalizedEmail)) {
      Alert.alert('Email tidak valid', VALIDATION_MESSAGES.email);
      return;
    }

    try {
      await updateProfile({
        name: trimmedName,
        username: normalizedUsername,
        email: normalizedEmail,
        ...(avatarChanged && avatarUri ? { avatarUrl: avatarUri } : {}),
      });
      setAvatarChanged(false);
      Alert.alert('Profil diperbarui', 'Perubahan profil Anda berhasil disimpan.');
    } catch (error) {
      Alert.alert(
        'Gagal menyimpan profil',
        error instanceof Error ? error.message : 'Terjadi kendala saat menyimpan. Silakan coba lagi.'
      );
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword || !newPassword || !confirmNewPassword) {
      Alert.alert('Data belum lengkap', 'Isi password saat ini, password baru, dan konfirmasinya.');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Password terlalu pendek', 'Password baru harus terdiri dari minimal 6 karakter.');
      return;
    }

    if (newPassword.length > PASSWORD_MAX_LENGTH) {
      Alert.alert('Password terlalu panjang', VALIDATION_MESSAGES.passwordMax);
      return;
    }

    if (newPassword !== confirmNewPassword) {
      Alert.alert('Password tidak sama', 'Pastikan konfirmasi password sesuai dengan password baru Anda.');
      return;
    }

    setIsSavingPassword(true);
    try {
      await changePassword(currentPassword, newPassword);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      Alert.alert('Password diganti', 'Password Anda berhasil diperbarui.');
    } catch (error) {
      Alert.alert(
        'Gagal mengganti password',
        error instanceof Error ? error.message : 'Terjadi kendala saat mengganti password. Silakan coba lagi.'
      );
    } finally {
      setIsSavingPassword(false);
    }
  };

  return (
    <Screen keyboardAvoiding scroll>
      <BackHeader title="Edit Profil" onBack={handleBack} />

      <Stack gap={spacing.lg} style={styles.body}>
        {/* Foto profil */}
        <View style={styles.avatarSection}>
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel="Ganti foto profil"
            onPress={handlePickPhoto}
            style={styles.avatarWrap}
          >
            {avatarUri ? (
              <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatarFallback}>
                <Text variant="bodyStrong" style={styles.avatarInitial}>
                  {initial}
                </Text>
              </View>
            )}
            <View style={styles.avatarBadge}>
              <Ionicons color={colors.textOnPrimary} name="camera" size={16} />
            </View>
          </PressableScale>
          <Text variant="caption" color="secondary">
            Ketuk foto untuk mengganti
          </Text>
        </View>

        {/* Data profil */}
        <View style={styles.card}>
          <Text variant="kicker" color="primary" style={styles.cardTitle}>
            Data Profil
          </Text>
          <Stack gap={spacing.md}>
            <Input
              autoComplete="name"
              editable={!isLoading}
              icon="id-card-outline"
              label="Nama tampilan"
              placeholder="Nama Anda"
              textContentType="name"
              value={name}
              onChangeText={setName}
            />
            <Input
              autoCapitalize="none"
              autoComplete="username"
              autoCorrect={false}
              editable={!isLoading}
              icon="person-outline"
              label="Username"
              placeholder="username_anda"
              textContentType="username"
              value={username}
              onChangeText={setUsername}
            />
            <Input
              autoCapitalize="none"
              autoComplete="email"
              autoCorrect={false}
              editable={!isLoading}
              icon="mail-outline"
              keyboardType="email-address"
              label="Email"
              helperText="Dipakai untuk reset password bila lupa."
              placeholder="nama@email.com"
              textContentType="emailAddress"
              value={email}
              onChangeText={setEmail}
            />
            <Button
              disabled={isLoading}
              fullWidth
              loading={isLoading}
              title="Simpan Profil"
              onPress={handleSaveProfile}
            />
          </Stack>
        </View>

        {/* Ganti password — akun Google tidak punya password sendiri */}
        {isGoogleAccount ? (
          <View style={styles.card}>
            <Text variant="kicker" color="primary" style={styles.cardTitle}>
              Password
            </Text>
            <View style={styles.googleInfoRow}>
              <View style={styles.googleIconWrap}>
                <Ionicons color={colors.primary} name="logo-google" size={20} />
              </View>
              <View style={styles.googleInfoCopy}>
                <Text variant="bodyStrong">Akun ini masuk dengan Google</Text>
                <Text variant="caption" color="secondary">
                  Keamanan akun dikelola oleh Google, jadi tidak ada password yang perlu
                  diganti di sini.
                </Text>
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.card}>
            <Text variant="kicker" color="primary" style={styles.cardTitle}>
              Ganti Password
            </Text>
            <Stack gap={spacing.md}>
              <Input
                autoCapitalize="none"
                autoComplete="current-password"
                autoCorrect={false}
                editable={!isSavingPassword}
                icon="lock-closed-outline"
                isPasswordVisible={showCurrentPassword}
                label="Password saat ini"
                maxLength={PASSWORD_MAX_LENGTH}
                onToggleVisibility={() => setShowCurrentPassword((value) => !value)}
                placeholder="Password lama Anda"
                secureTextEntry={!showCurrentPassword}
                textContentType="password"
                value={currentPassword}
                onChangeText={setCurrentPassword}
              />
              <Input
                autoCapitalize="none"
                autoComplete="password-new"
                autoCorrect={false}
                editable={!isSavingPassword}
                icon="key-outline"
                isPasswordVisible={showNewPassword}
                label="Password baru"
                maxLength={PASSWORD_MAX_LENGTH}
                onToggleVisibility={() => setShowNewPassword((value) => !value)}
                placeholder="Minimal 6 karakter"
                secureTextEntry={!showNewPassword}
                textContentType="newPassword"
                value={newPassword}
                onChangeText={setNewPassword}
              />
              <Input
                autoCapitalize="none"
                autoComplete="password-new"
                autoCorrect={false}
                editable={!isSavingPassword}
                icon="shield-checkmark-outline"
                isPasswordVisible={showConfirmNewPassword}
                label="Konfirmasi password baru"
                maxLength={PASSWORD_MAX_LENGTH}
                onToggleVisibility={() => setShowConfirmNewPassword((value) => !value)}
                placeholder="Ulangi password baru"
                secureTextEntry={!showConfirmNewPassword}
                textContentType="newPassword"
                value={confirmNewPassword}
                onChangeText={setConfirmNewPassword}
              />
              <Button
                disabled={isSavingPassword || !currentPassword || !newPassword || !confirmNewPassword}
                fullWidth
                loading={isSavingPassword}
                title="Ganti Password"
                variant="outline"
                onPress={handleChangePassword}
              />
            </Stack>
          </View>
        )}
      </Stack>
    </Screen>
  );
}

const styles = createSheet((colors) => ({
  body: {
    marginTop: spacing.lg,
    paddingBottom: spacing.xl,
  },
  guestState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.base,
    paddingHorizontal: spacing.lg,
  },
  avatarSection: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  avatarWrap: {
    width: 104,
    height: 104,
  },
  avatarImage: {
    width: 104,
    height: 104,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceMuted,
  },
  avatarFallback: {
    width: 104,
    height: 104,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: colors.textOnPrimary,
    fontSize: 40,
  },
  avatarBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 32,
    height: 32,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.xl,
    padding: spacing.base,
    gap: spacing.md,
    ...shadow.sm,
  },
  cardTitle: {
    marginLeft: 2,
  },
  googleInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  googleIconWrap: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  googleInfoCopy: {
    flex: 1,
    gap: 2,
  },
}));

