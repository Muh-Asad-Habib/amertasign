import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Alert, FlatList, StyleSheet, Switch, View } from 'react-native';

import Badge from '../../components/ui/Badge';
import Card from '../../components/ui/Card';
import Decor from '../../components/ui/Decor';
import Divider from '../../components/ui/Divider';
import GradientSurface from '../../components/ui/GradientSurface';
import Heading from '../../components/ui/Heading';
import IconBubble, { type IconTone } from '../../components/ui/IconBubble';
import PressableScale from '../../components/ui/PressableScale';
import Screen from '../../components/ui/Screen';
import Section from '../../components/ui/Section';
import Stack from '../../components/ui/Stack';
import Text from '../../components/ui/Text';
import { colors, fontFamily, gradients, overlay, radius, spacing, touchTargetMin } from '../../theme';
import { dictionaryEntries } from '../../constants/MockData';
import { useAuthStore } from '../../store/useAuthStore';
import { useDictionaryStore } from '../../store/useDictionaryStore';
import type { DictionaryEntry, SignLanguageType } from '../../types';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

function initialsFromName(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

function SettingRow({
  icon,
  tone,
  label,
  right,
  onPress,
}: {
  icon: IoniconName;
  tone: IconTone;
  label: string;
  right: React.ReactNode;
  onPress?: () => void;
}) {
  const body = (
    <View style={styles.settingRow}>
      <View style={styles.settingInfo}>
        <IconBubble name={icon} size="sm" tone={tone} />
        <Text variant="bodyStrong" style={styles.settingLabel}>
          {label}
        </Text>
      </View>
      <View style={styles.settingMeta}>{right}</View>
    </View>
  );

  if (onPress) {
    return (
      <PressableScale accessibilityRole="button" accessibilityLabel={label} onPress={onPress}>
        {body}
      </PressableScale>
    );
  }
  return body;
}

export default function ProfileScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isGuest = useAuthStore((state) => state.isGuest);
  const logout = useAuthStore((state) => state.logout);
  const favorites = useDictionaryStore((state) => state.favorites);
  const signLanguageFilter = useDictionaryStore((state) => state.signLanguageFilter);
  const setSignLanguageFilter = useDictionaryStore((state) => state.setSignLanguageFilter);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled] = useState(false);

  const displayName = user?.name?.trim() || 'Pengguna AmertaSign';
  const displayEmail = isGuest ? 'Belum masuk — mode tamu' : user?.email || 'pengguna@amertasign.app';
  const currentSignLanguage = (user?.preferredSignLanguage ?? signLanguageFilter) as SignLanguageType;

  const favoriteEntries = useMemo<DictionaryEntry[]>(() => {
    return favorites
      .map((favoriteId) => dictionaryEntries.find((entry) => entry.id === favoriteId))
      .filter((entry): entry is DictionaryEntry => Boolean(entry));
  }, [favorites]);

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

  const handleLogoutPress = () => {
    Alert.alert(
      isGuest ? 'Keluar dari mode tamu?' : 'Keluar dari akun?',
      isGuest
        ? 'Anda akan kembali ke halaman masuk. Progres mode tamu tidak tersimpan.'
        : 'Anda perlu masuk kembali untuk melanjutkan progres belajar.',
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
      <Decor preset="header" />

      <Stack gap={spacing.xl}>
        <GradientSurface colors={gradients.primary} radius={radius.xxl} shadowLevel="lg" contentStyle={styles.profileHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{initialsFromName(displayName) || 'AS'}</Text>
          </View>
          <Heading variant="title" color="onPrimary" align="center">
            {displayName}
          </Heading>
          <Text variant="body" color="onPrimary" align="center" style={styles.email}>
            {displayEmail}
          </Text>
          <View style={styles.headerActions}>
            {isGuest ? <Badge size="sm" text="Mode Tamu" variant="warning" /> : null}
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel={isGuest ? 'Masuk atau daftar' : 'Edit profil'}
              onPress={() =>
                isGuest
                  ? router.replace('/(auth)/login')
                  : Alert.alert('Segera hadir', 'Fitur edit profil akan tersedia segera.')
              }
              style={styles.headerAction}
            >
              <Ionicons color={colors.primary} name={isGuest ? 'log-in-outline' : 'create-outline'} size={16} />
              <Text variant="label" style={styles.headerActionText}>
                {isGuest ? 'Masuk / Daftar' : 'Edit Profil'}
              </Text>
            </PressableScale>
          </View>
        </GradientSurface>

        <Section kicker="Preferensi" title="Pengaturan">
          <Card padding={0} style={styles.settingsCard}>
            <SettingRow
              icon="language-outline"
              label="Bahasa Isyarat Default"
              onPress={handleLanguagePress}
              right={
                <>
                  <Text variant="caption" color="secondary">
                    {currentSignLanguage.toUpperCase()}
                  </Text>
                  <Ionicons color={colors.textTertiary} name="chevron-forward" size={18} />
                </>
              }
              tone="primary"
            />
            <Divider spacingY={0} style={styles.rowDivider} />
            <SettingRow
              icon="notifications-outline"
              label="Notifikasi"
              right={
                <Switch
                  ios_backgroundColor={colors.surfaceMuted}
                  onValueChange={setNotificationsEnabled}
                  thumbColor={colors.surface}
                  trackColor={{ false: colors.surfaceMuted, true: colors.primary }}
                  value={notificationsEnabled}
                />
              }
              tone="accent"
            />
            <Divider spacingY={0} style={styles.rowDivider} />
            <SettingRow
              icon="moon-outline"
              label="Mode Gelap"
              right={
                <>
                  <Badge size="sm" text="Segera" variant="neutral" />
                  <Switch
                    disabled
                    ios_backgroundColor={colors.surfaceMuted}
                    thumbColor={colors.surface}
                    trackColor={{ false: colors.surfaceMuted, true: colors.primary }}
                    value={darkModeEnabled}
                  />
                </>
              }
              tone="neutral"
            />
            <Divider spacingY={0} style={styles.rowDivider} />
            <SettingRow
              icon="information-circle-outline"
              label="Tentang Aplikasi"
              onPress={handleAboutPress}
              right={<Ionicons color={colors.textTertiary} name="chevron-forward" size={18} />}
              tone="primary"
            />
          </Card>
        </Section>

        <Section kicker="Tersimpan" title="Kata Favorit">
          {favoriteEntries.length > 0 ? (
            <FlatList
              contentContainerStyle={styles.favoriteList}
              data={favoriteEntries}
              horizontal
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <Card variant="elevated" style={styles.favoriteCard}>
                  <Badge
                    size="sm"
                    text={item.type.toUpperCase()}
                    variant={item.type === 'bisindo' ? 'primary' : 'accent'}
                  />
                  <Heading variant="h2" numberOfLines={1} style={styles.favoriteWord}>
                    {item.word}
                  </Heading>
                  <Text numberOfLines={2} variant="caption" color="secondary">
                    {item.description}
                  </Text>
                </Card>
              )}
              showsHorizontalScrollIndicator={false}
            />
          ) : (
            <Card style={styles.emptyFavorite}>
              <Text variant="body" color="secondary">
                Belum ada favorit.
              </Text>
              <PressableScale
                accessibilityRole="button"
                accessibilityLabel="Jelajahi kamus"
                onPress={() => router.push('/(tabs)/dictionary')}
              >
                <Text variant="bodyStrong" color="primary" style={styles.emptyLink}>
                  Jelajahi kamus →
                </Text>
              </PressableScale>
            </Card>
          )}
        </Section>

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
  profileHeader: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: radius.full,
    backgroundColor: overlay.onBrandStrong,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  avatarText: {
    color: colors.surface,
    fontSize: 30,
    fontFamily: fontFamily.displayExtraBold,
  },
  email: {
    opacity: 0.86,
  },
  headerActions: {
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  headerAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.surface,
    borderRadius: radius.full,
    paddingHorizontal: spacing.base,
    minHeight: 42,
  },
  headerActionText: {
    color: colors.primary,
  },
  settingsCard: {
    overflow: 'hidden',
  },
  settingRow: {
    minHeight: touchTargetMin + 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
    paddingRight: spacing.md,
  },
  settingLabel: {
    flexShrink: 1,
  },
  settingMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  rowDivider: {
    marginLeft: spacing.base + 40 + spacing.md,
  },
  favoriteList: {
    paddingRight: spacing.base,
    gap: spacing.md,
  },
  favoriteCard: {
    width: 190,
    gap: spacing.sm,
  },
  favoriteWord: {
    marginTop: spacing.xs,
  },
  emptyFavorite: {
    gap: spacing.sm,
  },
  emptyLink: {
    marginTop: spacing.xs,
  },
  logoutButton: {
    minHeight: touchTargetMin,
    borderWidth: 1.5,
    borderColor: colors.error,
    borderRadius: radius.lg,
    backgroundColor: colors.errorTint,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
  },
});
