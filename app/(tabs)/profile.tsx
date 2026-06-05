import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import Card from '../../components/ui/Card';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';
import { dictionaryEntries } from '../../constants/MockData';
import { useAuthStore } from '../../store/useAuthStore';
import { useDictionaryStore } from '../../store/useDictionaryStore';
import { useLearningStore } from '../../store/useLearningStore';
import type { DictionaryEntry, SignLanguageType } from '../../types';

interface StatItem {
  id: string;
  label: string;
  value: number;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  iconBackground: string;
}

function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionTitle}>{title}</Text>;
}

function initialsFromName(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
}

export default function ProfileScreen() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const favorites = useDictionaryStore((state) => state.favorites);
  const searchHistory = useDictionaryStore((state) => state.searchHistory);
  const signLanguageFilter = useDictionaryStore((state) => state.signLanguageFilter);
  const setSignLanguageFilter = useDictionaryStore((state) => state.setSignLanguageFilter);
  const completedModuleIds = useLearningStore((state) => state.completedModuleIds);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [darkModeEnabled] = useState(false);

  const displayName = user?.name?.trim() || 'Pengguna AmertaSign';
  const displayEmail = user?.email || 'pengguna@amertasign.app';
  const currentSignLanguage = (user?.preferredSignLanguage ?? signLanguageFilter) as SignLanguageType;
  const streak = user?.streak && user.streak > 0 ? user.streak : 5;
  const wordsLearned = favorites.length + searchHistory.length;

  const favoriteEntries = useMemo<DictionaryEntry[]>(() => {
    return favorites
      .map((favoriteId) => dictionaryEntries.find((entry) => entry.id === favoriteId))
      .filter((entry): entry is DictionaryEntry => Boolean(entry));
  }, [favorites]);

  const stats = useMemo<StatItem[]>(
    () => [
      {
        id: 'words',
        label: 'Kata Dipelajari',
        value: wordsLearned,
        icon: 'book-outline',
        iconColor: Colors.light.primary,
        iconBackground: '#DBEAFE',
      },
      {
        id: 'modules',
        label: 'Modul Selesai',
        value: completedModuleIds.length,
        icon: 'school-outline',
        iconColor: Colors.light.success,
        iconBackground: '#DCFCE7',
      },
      {
        id: 'streak',
        label: 'Hari Berturut',
        value: streak,
        icon: 'flame-outline',
        iconColor: Colors.light.accent,
        iconBackground: '#FEF3C7',
      },
    ],
    [completedModuleIds.length, streak, wordsLearned]
  );

  const applySignLanguage = (type: SignLanguageType) => {
    setSignLanguageFilter(type);
    useAuthStore.setState((state) => ({
      user: state.user ? { ...state.user, preferredSignLanguage: type } : state.user,
    }));
  };

  const handleLanguagePress = () => {
    Alert.alert('Bahasa Isyarat Default', 'Pilih bahasa isyarat default untuk pengalaman belajar Anda.', [
      {
        text: 'BISINDO',
        onPress: () => applySignLanguage('bisindo'),
      },
      {
        text: 'SIBI',
        onPress: () => applySignLanguage('sibi'),
      },
      {
        text: 'Batal',
        style: 'cancel',
      },
    ]);
  };

  const handleAboutPress = () => {
    Alert.alert(
      'Tentang Aplikasi',
      'AmertaSign membantu pengguna belajar, menerjemahkan, dan mengeksplorasi bahasa isyarat Indonesia secara lebih mudah.'
    );
  };

  const handleLogoutPress = () => {
    Alert.alert('Keluar dari akun?', 'Anda perlu masuk kembali untuk melanjutkan progres belajar.', [
      {
        text: 'Batal',
        style: 'cancel',
      },
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
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerSection}>
          <View style={styles.avatar}>
            {initialsFromName(displayName) ? (
              <Text style={styles.avatarText}>{initialsFromName(displayName)}</Text>
            ) : (
              <Ionicons color="#FFFFFF" name="person" size={32} />
            )}
          </View>

          <Text style={styles.userName}>{displayName}</Text>
          <Text style={styles.userEmail}>{displayEmail}</Text>

          <Button size="sm" title="Edit Profil" variant="outline" onPress={() => Alert.alert('Segera hadir', 'Fitur edit profil akan tersedia segera.')} />
        </View>

        <View style={styles.sectionDivider} />

        <View style={styles.section}>
          <SectionHeader title="Statistik Belajar" />
          <View style={styles.statsRow}>
            {stats.map((stat) => (
              <Card key={stat.id} style={styles.statCard}>
                <View style={[styles.statIconWrap, { backgroundColor: stat.iconBackground }]}> 
                  <Ionicons color={stat.iconColor} name={stat.icon} size={20} />
                </View>
                <Text style={styles.statValue}>{stat.value}</Text>
                <Text style={styles.statLabel}>{stat.label}</Text>
              </Card>
            ))}
          </View>
        </View>

        <View style={styles.sectionDivider} />

        <View style={styles.section}>
          <SectionHeader title="Pengaturan" />
          <Card style={styles.settingsCard}>
            <Pressable style={({ pressed }) => [styles.settingRow, pressed && styles.settingPressed]} onPress={handleLanguagePress}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingIcon}>🌐</Text>
                <Text style={styles.settingLabel}>Bahasa Isyarat Default</Text>
              </View>
              <View style={styles.settingMeta}>
                <Text style={styles.settingValue}>{currentSignLanguage.toUpperCase()}</Text>
                <Ionicons color={Colors.light.textSecondary} name="chevron-forward" size={18} />
              </View>
            </Pressable>

            <View style={styles.rowDivider} />

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingIcon}>🔔</Text>
                <Text style={styles.settingLabel}>Notifikasi</Text>
              </View>
              <Switch
                onValueChange={setNotificationsEnabled}
                thumbColor="#FFFFFF"
                trackColor={{ false: '#CBD5E1', true: Colors.light.primary }}
                value={notificationsEnabled}
              />
            </View>

            <View style={styles.rowDivider} />

            <View style={styles.settingRow}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingIcon}>🌙</Text>
                <Text style={styles.settingLabel}>Mode Gelap</Text>
              </View>
              <View style={styles.settingMeta}>
                <Badge size="sm" text="Segera hadir" variant="neutral" />
                <Switch
                  disabled
                  thumbColor="#FFFFFF"
                  trackColor={{ false: '#CBD5E1', true: Colors.light.primary }}
                  value={darkModeEnabled}
                />
              </View>
            </View>

            <View style={styles.rowDivider} />

            <Pressable style={({ pressed }) => [styles.settingRow, pressed && styles.settingPressed]} onPress={handleAboutPress}>
              <View style={styles.settingInfo}>
                <Text style={styles.settingIcon}>📖</Text>
                <Text style={styles.settingLabel}>Tentang Aplikasi</Text>
              </View>
              <Ionicons color={Colors.light.textSecondary} name="chevron-forward" size={18} />
            </Pressable>
          </Card>
        </View>

        <View style={styles.sectionDivider} />

        <View style={styles.section}>
          <SectionHeader title="Kata Favorit ⭐" />
          {favoriteEntries.length > 0 ? (
            <FlatList
              contentContainerStyle={styles.favoriteList}
              data={favoriteEntries}
              horizontal
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <Card style={styles.favoriteCard}>
                  <Text style={styles.favoriteWord}>{item.word}</Text>
                  <Text style={styles.favoriteType}>{item.type.toUpperCase()}</Text>
                  <Text numberOfLines={2} style={styles.favoriteDescription}>
                    {item.description}
                  </Text>
                </Card>
              )}
              showsHorizontalScrollIndicator={false}
            />
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>Belum ada favorit</Text>
              <Pressable onPress={() => router.push('/(tabs)/dictionary')}>
                <Text style={styles.emptyStateLink}>Jelajahi kamus</Text>
              </Pressable>
            </View>
          )}
        </View>

        <View style={styles.sectionDivider} />

        <View style={styles.section}>
          <SectionHeader title="Zona Bahaya" />
          <Pressable style={({ pressed }) => [styles.logoutButton, pressed && styles.logoutButtonPressed]} onPress={handleLogoutPress}>
            <Ionicons color={Colors.light.error} name="log-out-outline" size={18} />
            <Text style={styles.logoutText}>Keluar</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  content: {
    paddingHorizontal: Layout.spacing.lg,
    paddingTop: Layout.spacing.lg,
    paddingBottom: Layout.spacing.xxl,
  },
  headerSection: {
    alignItems: 'center',
    gap: Layout.spacing.sm,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: Layout.radius.full,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Layout.spacing.sm,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '800',
  },
  userName: {
    color: Colors.light.text,
    fontSize: Layout.fontSize.xxl,
    fontWeight: '800',
    textAlign: 'center',
  },
  userEmail: {
    color: Colors.light.textSecondary,
    fontSize: Layout.fontSize.body,
    textAlign: 'center',
  },
  section: {
    paddingVertical: Layout.spacing.md,
  },
  sectionTitle: {
    color: Colors.light.text,
    fontSize: Layout.fontSize.xl,
    fontWeight: '800',
    marginBottom: Layout.spacing.md,
  },
  sectionDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.light.border,
    marginVertical: Layout.spacing.xs,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Layout.spacing.sm,
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: Layout.spacing.sm,
    paddingVertical: Layout.spacing.md,
  },
  statIconWrap: {
    width: 40,
    height: 40,
    borderRadius: Layout.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Layout.spacing.sm,
  },
  statValue: {
    color: Colors.light.text,
    fontSize: Layout.fontSize.xl,
    fontWeight: '800',
    textAlign: 'center',
  },
  statLabel: {
    color: Colors.light.textSecondary,
    fontSize: Layout.fontSize.xs,
    fontWeight: '600',
    textAlign: 'center',
    marginTop: Layout.spacing.xs,
  },
  settingsCard: {
    paddingVertical: 0,
    paddingHorizontal: 0,
    overflow: 'hidden',
  },
  settingRow: {
    minHeight: Layout.touchTargetMin + 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.md,
  },
  settingPressed: {
    backgroundColor: '#F8FAFC',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: Layout.spacing.md,
  },
  settingIcon: {
    fontSize: 18,
    marginRight: Layout.spacing.sm,
  },
  settingLabel: {
    color: Colors.light.text,
    fontSize: Layout.fontSize.body,
    fontWeight: '600',
    flexShrink: 1,
  },
  settingMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Layout.spacing.sm,
  },
  settingValue: {
    color: Colors.light.textSecondary,
    fontSize: Layout.fontSize.sm,
    fontWeight: '700',
  },
  rowDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.light.border,
    marginLeft: Layout.spacing.md,
  },
  favoriteList: {
    paddingRight: Layout.spacing.sm,
  },
  favoriteCard: {
    width: 180,
    marginRight: Layout.spacing.md,
  },
  favoriteWord: {
    color: Colors.light.text,
    fontSize: Layout.fontSize.lg,
    fontWeight: '800',
  },
  favoriteType: {
    color: Colors.light.primary,
    fontSize: Layout.fontSize.xs,
    fontWeight: '700',
    marginTop: Layout.spacing.xs,
  },
  favoriteDescription: {
    color: Colors.light.textSecondary,
    fontSize: Layout.fontSize.sm,
    lineHeight: 20,
    marginTop: Layout.spacing.sm,
  },
  emptyState: {
    backgroundColor: Colors.light.surface,
    borderColor: Colors.light.border,
    borderRadius: Layout.radius.lg,
    borderWidth: 1,
    padding: Layout.spacing.md,
  },
  emptyStateText: {
    color: Colors.light.textSecondary,
    fontSize: Layout.fontSize.body,
  },
  emptyStateLink: {
    color: Colors.light.primary,
    fontSize: Layout.fontSize.body,
    fontWeight: '700',
    marginTop: Layout.spacing.sm,
  },
  logoutButton: {
    minHeight: Layout.touchTargetMin,
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: Layout.radius.md,
    backgroundColor: '#FEF2F2',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Layout.spacing.sm,
    paddingHorizontal: Layout.spacing.md,
    paddingVertical: Layout.spacing.md,
  },
  logoutButtonPressed: {
    opacity: 0.85,
  },
  logoutText: {
    color: Colors.light.error,
    fontSize: Layout.fontSize.body,
    fontWeight: '800',
  },
});
