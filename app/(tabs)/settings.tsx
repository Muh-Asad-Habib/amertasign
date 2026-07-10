import React from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import Heading from '../../components/ui/Heading';
import BrandMark from '../../components/ui/BrandMark';
import PressableScale from '../../components/ui/PressableScale';
import Screen from '../../components/ui/Screen';
import Stack from '../../components/ui/Stack';
import Text from '../../components/ui/Text';
import { colors, layoutSpacing, radius, shadow, spacing } from '../../theme';
import { useAuthStore } from '../../store/useAuthStore';
import { useHistoryStore } from '../../store/useHistoryStore';
import {
  useSettingsStore,
  type AvatarGender,
  type SpeechRateMultiplier,
  type VoiceGender,
} from '../../store/useSettingsStore';

import { createSheet } from '../../theme';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface SettingRowConfig {
  icon: IoniconName;
  label: string;
  value: string;
  onPress?: () => void;
  accent?: boolean;
}

function SettingRow({ icon, label, value, onPress, accent, isLast }: SettingRowConfig & { isLast: boolean }) {
  return (
    <>
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel={label}
        onPress={onPress}
        haptic={Boolean(onPress)}
        style={styles.row}
      >
        <View style={styles.rowLeft}>
          <View style={[styles.rowIcon, accent && styles.rowIconAccent]}>
            <Ionicons color={accent ? colors.primary : colors.textSecondary} name={icon} size={20} />
          </View>
          <View style={styles.rowText}>
            <Text variant="bodyStrong">{label}</Text>
            <Text variant="caption" color="secondary">
              {value}
            </Text>
          </View>
        </View>
        <Ionicons color={colors.textTertiary} name="chevron-forward" size={20} />
      </PressableScale>
      {!isLast ? <View style={styles.divider} /> : null}
    </>
  );
}

function SettingsGroup({ title, rows }: { title: string; rows: SettingRowConfig[] }) {
  return (
    <View style={styles.group}>
      <Text variant="kicker" color="primary" style={styles.groupTitle}>
        {title}
      </Text>
      <View style={styles.card}>
        {rows.map((row, index) => (
          <SettingRow key={row.label} {...row} isLast={index === rows.length - 1} />
        ))}
      </View>
    </View>
  );
}

/** Pilihan segmen dua/tiga opsi ala mockup (mis. Laki-laki / Perempuan, 0,5x / 1x / 1,5x). */
function SegmentedControl<T extends string | number>({
  options,
  value,
  onChange,
}: {
  options: Array<{ value: T; label: string; caption?: string; icon?: IoniconName }>;
  value: T;
  onChange: (next: T) => void;
}) {
  return (
    <View style={styles.segmentRow}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel={option.label}
            accessibilityState={{ selected: active }}
            key={String(option.value)}
            onPress={() => onChange(option.value)}
            style={[styles.segment, active ? styles.segmentActive : styles.segmentInactive]}
          >
            {option.icon ? (
              <Ionicons color={active ? colors.primary : colors.textSecondary} name={option.icon} size={18} />
            ) : null}
            <Text variant="bodyStrong" style={{ color: active ? colors.primary : colors.textSecondary }}>
              {option.label}
            </Text>
            {option.caption ? (
              <Text variant="label" color={active ? 'primary' : 'tertiary'}>
                {option.caption}
              </Text>
            ) : null}
          </PressableScale>
        );
      })}
    </View>
  );
}

function VoiceSettingsCard() {
  const speechRate = useSettingsStore((state) => state.speechRate);
  const voiceGender = useSettingsStore((state) => state.voiceGender);
  const avatarGender = useSettingsStore((state) => state.avatarGender);
  const setSpeechRate = useSettingsStore((state) => state.setSpeechRate);
  const setVoiceGender = useSettingsStore((state) => state.setVoiceGender);
  const setAvatarGender = useSettingsStore((state) => state.setAvatarGender);

  return (
    <View style={styles.group}>
      <Text variant="kicker" color="primary" style={styles.groupTitle}>
        Suara & Peraga
      </Text>
      <View style={[styles.card, styles.voiceCard]}>
        <View style={styles.voiceSection}>
          <Text variant="bodyStrong">Karakter Peraga</Text>
          <Text variant="caption" color="secondary" style={styles.voiceHint}>
            Pilih avatar penerjemah bahasa isyarat.
          </Text>
          <SegmentedControl<AvatarGender>
            onChange={setAvatarGender}
            options={[
              { value: 'male', label: 'Laki-laki', icon: 'man' },
              { value: 'female', label: 'Perempuan', icon: 'woman' },
            ]}
            value={avatarGender}
          />
        </View>

        <View style={styles.voiceDivider} />

        <View style={styles.voiceSection}>
          <Text variant="bodyStrong">Suara</Text>
          <Text variant="caption" color="secondary" style={styles.voiceHint}>
            Jenis suara untuk hasil terjemahan.
          </Text>
          <SegmentedControl<VoiceGender>
            onChange={setVoiceGender}
            options={[
              { value: 'male', label: 'Laki-laki', icon: 'man' },
              { value: 'female', label: 'Perempuan', icon: 'woman' },
            ]}
            value={voiceGender}
          />
        </View>

        <View style={styles.voiceDivider} />

        <View style={styles.voiceSection}>
          <Text variant="bodyStrong">Kecepatan Suara</Text>
          <Text variant="caption" color="secondary" style={styles.voiceHint}>
            Atur tempo pembacaan teks.
          </Text>
          <SegmentedControl<SpeechRateMultiplier>
            onChange={setSpeechRate}
            options={[
              { value: 0.5, label: '0,5x', caption: 'Lambat' },
              { value: 1, label: '1x', caption: 'Normal' },
              { value: 1.5, label: '1,5x', caption: 'Cepat' },
            ]}
            value={speechRate}
          />
        </View>
      </View>
    </View>
  );
}

export default function SettingsScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isGuest = useAuthStore((state) => state.isGuest);
  const logout = useAuthStore((state) => state.logout);
  const clearHistory = useHistoryStore((state) => state.clearHistory);
  const themeMode = useSettingsStore((state) => state.themeMode);
  const setThemeMode = useSettingsStore((state) => state.setThemeMode);
  const historyCount = useHistoryStore((state) =>
    user && !isGuest ? (state.itemsByUser[user.id]?.length ?? 0) : 0
  );

  const displayName = isGuest ? 'Tamu' : user?.name || 'Pengguna';
  const initial = displayName.trim().charAt(0).toUpperCase() || 'A';

  const handleLanguagePress = () => {
    Alert.alert(
      'Bahasa Isyarat',
      'Amerta Sign menggunakan BISINDO (Bahasa Isyarat Indonesia) untuk seluruh fitur terjemahan dan kamus.'
    );
  };

  const handleClearHistory = () => {
    if (isGuest || !user) {
      Alert.alert('Mode Tamu', 'Riwayat tidak tersimpan di mode tamu, jadi tidak ada yang perlu dihapus.');
      return;
    }

    if (historyCount === 0) {
      Alert.alert('Riwayat Kosong', 'Belum ada riwayat terjemahan yang tersimpan.');
      return;
    }

    Alert.alert('Hapus Riwayat?', `Semua ${historyCount} riwayat terjemahan akan dihapus permanen.`, [
      { text: 'Batal', style: 'cancel' },
      { text: 'Hapus', style: 'destructive', onPress: () => clearHistory(user.id) },
    ]);
  };

  const handleAboutPress = () => {
    Alert.alert(
      'Tentang Aplikasi',
      'Amerta Sign membantu pengguna belajar, menerjemahkan, dan mengeksplorasi bahasa isyarat Indonesia secara lebih mudah.'
    );
  };

  const handleSoon = () => {
    Alert.alert('Segera hadir', 'Fitur ini akan tersedia segera.');
  };

  const handleLogoutPress = () => {
    Alert.alert(
      isGuest ? 'Keluar dari mode tamu?' : 'Keluar dari akun?',
      isGuest
        ? 'Anda akan kembali ke halaman masuk. Progres mode tamu tidak tersimpan.'
        : 'Anda perlu masuk kembali untuk melanjutkan.',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Keluar',
          style: 'destructive',
          onPress: () => {
            void (async () => {
              try {
                await logout();
                router.replace('/(auth)/login');
              } catch (error) {
                Alert.alert(
                  'Keluar gagal',
                  error instanceof Error ? error.message : 'Terjadi kendala saat keluar. Silakan coba lagi.'
                );
              }
            })();
          },
        },
      ]
    );
  };

  return (
    <Screen scroll contentStyle={{ paddingBottom: layoutSpacing.tabBarClearance }}>
      {/* Brand header dengan logo resmi */}
      <View style={styles.brandRow}>
        <BrandMark size={36} />
        <Heading variant="h2" style={styles.brandText}>
          Amerta Sign
        </Heading>
      </View>

      <Stack gap={spacing.lg} style={styles.body}>
        <View>
          <Heading variant="hero">Pengaturan</Heading>
          <Text variant="body" color="secondary" style={styles.subtitle}>
            Kelola akun dan preferensimu.
          </Text>
        </View>

        {/* Kartu profil ala mockup */}
        <View style={styles.profileCard}>
          <View style={styles.profileAvatar}>
            <Text variant="bodyStrong" style={styles.profileInitial}>
              {initial}
            </Text>
          </View>
          <View style={styles.profileCopy}>
            <Heading variant="h2" numberOfLines={1}>
              {displayName}
            </Heading>
            <Text variant="caption" color="secondary" numberOfLines={1}>
              {isGuest ? 'Mode tamu — riwayat tidak tersimpan' : `@${user?.username ?? 'pengguna'}`}
            </Text>
          </View>
          {isGuest ? (
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel="Masuk atau daftar"
              onPress={() => router.replace('/(auth)/login')}
              style={styles.profileAction}
            >
              <Text variant="label" style={styles.profileActionText}>
                Masuk
              </Text>
            </PressableScale>
          ) : null}
        </View>

        <SettingsGroup
          title="Akun"
          rows={[
            {
              icon: 'time-outline',
              label: 'Riwayat Terjemahan',
              value: isGuest ? 'Tidak tersimpan di mode tamu' : `${historyCount} riwayat tersimpan`,
              accent: true,
              onPress: () => router.push('/history'),
            },
            {
              icon: 'hand-left-outline',
              label: 'Bahasa Isyarat',
              value: 'BISINDO — Bahasa Isyarat Indonesia',
              accent: true,
              onPress: handleLanguagePress,
            },
          ]}
        />

        <VoiceSettingsCard />

        <SettingsGroup
          title="Preferensi"
          rows={[
            {
              icon: 'notifications-outline',
              label: 'Notifikasi',
              value: 'Push, Email',
              onPress: handleSoon,
            },
            {
              icon: themeMode === 'dark' ? 'moon' : 'sunny-outline',
              label: 'Tampilan',
              value: themeMode === 'dark' ? 'Mode Gelap — ketuk untuk mode terang' : 'Mode Terang — ketuk untuk mode gelap',
              accent: true,
              onPress: () => setThemeMode(themeMode === 'dark' ? 'light' : 'dark'),
            },
            {
              icon: 'lock-closed-outline',
              label: 'Privasi & Keamanan',
              value: 'Biometrik, berbagi data',
              onPress: handleSoon,
            },
          ]}
        />

        <SettingsGroup
          title="Dukungan"
          rows={[
            {
              icon: 'help-circle-outline',
              label: 'Bantuan & Dukungan',
              value: 'FAQ, hubungi kami',
              onPress: handleSoon,
            },
            {
              icon: 'information-circle-outline',
              label: 'Tentang',
              value: 'Versi 1.0.0',
              onPress: handleAboutPress,
            },
          ]}
        />

        <PressableScale
          accessibilityRole="button"
          accessibilityLabel="Hapus riwayat terjemahan"
          onPress={handleClearHistory}
          style={styles.dangerButton}
        >
          <Ionicons color={colors.error} name="trash-outline" size={18} />
          <Text variant="bodyStrong" color="error">
            Hapus Riwayat
          </Text>
        </PressableScale>

        <PressableScale
          accessibilityRole="button"
          accessibilityLabel={isGuest ? 'Keluar mode tamu' : 'Keluar'}
          onPress={handleLogoutPress}
          style={styles.logoutButton}
        >
          <Ionicons color={colors.error} name="log-out-outline" size={18} />
          <Text variant="bodyStrong" color="error">
            {isGuest ? 'Keluar Mode Tamu' : 'Keluar'}
          </Text>
        </PressableScale>
      </Stack>
    </Screen>
  );
}

const styles = createSheet((colors) => ({
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  brandText: {
    color: colors.primary,
  },
  body: {
    marginTop: spacing.lg,
  },
  subtitle: {
    marginTop: spacing.xs,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.base,
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.xl,
    padding: spacing.base,
    ...shadow.sm,
  },
  profileAvatar: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInitial: {
    color: colors.textOnPrimary,
    fontSize: 24,
  },
  profileCopy: {
    flex: 1,
    gap: 2,
  },
  profileAction: {
    minHeight: 36,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.base,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileActionText: {
    color: colors.textOnPrimary,
  },
  group: {
    gap: spacing.sm,
  },
  groupTitle: {
    marginLeft: spacing.base,
  },
  card: {
    backgroundColor: colors.surface,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.xl,
    overflow: 'hidden',
    ...shadow.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.base,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  rowIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowIconAccent: {
    backgroundColor: colors.primarySurface,
  },
  rowText: {
    flex: 1,
    gap: 2,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginLeft: spacing.base + 40 + spacing.md,
  },
  voiceCard: {
    padding: spacing.base,
    gap: spacing.base,
  },
  voiceSection: {
    gap: spacing.xs,
  },
  voiceHint: {
    marginBottom: spacing.xs,
  },
  voiceDivider: {
    height: 1,
    backgroundColor: colors.border,
  },
  segmentRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  segment: {
    flex: 1,
    minHeight: 56,
    borderRadius: radius.lg,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingVertical: spacing.sm,
  },
  segmentActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySurface,
  },
  segmentInactive: {
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  dangerButton: {
    minHeight: 52,
    borderWidth: 1.5,
    borderColor: colors.errorTint,
    backgroundColor: colors.errorTint,
    borderRadius: radius.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.base,
  },
  logoutButton: {
    minHeight: 52,
    borderWidth: 1.5,
    borderColor: colors.error,
    borderRadius: radius.full,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.base,
  },
}));
