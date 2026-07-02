import React from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import Heading from '../../components/ui/Heading';
import PressableScale from '../../components/ui/PressableScale';
import Screen from '../../components/ui/Screen';
import Stack from '../../components/ui/Stack';
import Text from '../../components/ui/Text';
import { colors, radius, shadow, spacing } from '../../theme';
import { useAuthStore } from '../../store/useAuthStore';
import { useDictionaryStore } from '../../store/useDictionaryStore';
import type { SignLanguageType } from '../../types';

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

export default function SettingsScreen() {
  const router = useRouter();
  const isGuest = useAuthStore((state) => state.isGuest);
  const logout = useAuthStore((state) => state.logout);
  const signLanguageFilter = useDictionaryStore((state) => state.signLanguageFilter);
  const setSignLanguageFilter = useDictionaryStore((state) => state.setSignLanguageFilter);

  const applySignLanguage = (type: SignLanguageType) => {
    setSignLanguageFilter(type);
    useAuthStore.setState((state) => ({
      user: state.user ? { ...state.user, preferredSignLanguage: type } : state.user,
    }));
  };

  const handleLanguagePress = () => {
    Alert.alert('Bahasa Isyarat Default', 'Pilih bahasa isyarat default untuk pengalaman belajar Anda.', [
      { text: 'BISINDO', onPress: () => applySignLanguage('bisindo') },
      { text: 'SIBI', onPress: () => applySignLanguage('sibi') },
      { text: 'Batal', style: 'cancel' },
    ]);
  };

  const handleAboutPress = () => {
    Alert.alert(
      'Tentang Aplikasi',
      'AmertaSign membantu pengguna belajar, menerjemahkan, dan mengeksplorasi bahasa isyarat Indonesia secara lebih mudah.'
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
    <Screen scroll>
      {/* Brand header ala Stitch */}
      <View style={styles.brandRow}>
        <Ionicons color={colors.primary} name="hand-left" size={22} />
        <Heading variant="h2" style={styles.brandText}>
          AmertaSign
        </Heading>
      </View>

      <Stack gap={spacing.lg} style={styles.body}>
        <View>
          <Heading variant="hero">Pengaturan</Heading>
          <Text variant="body" color="secondary" style={styles.subtitle}>
            Kelola akun dan preferensimu.
          </Text>
        </View>

        <SettingsGroup
          title="Akun"
          rows={[
            {
              icon: 'person-outline',
              label: 'Preferensi Aplikasi',
              value: `Bahasa isyarat: ${signLanguageFilter.toUpperCase()}`,
              accent: true,
              onPress: handleLanguagePress,
            },
          ]}
        />

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
              icon: 'moon-outline',
              label: 'Tampilan',
              value: 'Mode Terang',
              onPress: handleSoon,
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

const styles = StyleSheet.create({
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
});
