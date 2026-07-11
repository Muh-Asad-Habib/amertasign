import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

import Heading from '../../components/ui/Heading';
import BrandMark from '../../components/ui/BrandMark';
import PressableScale from '../../components/ui/PressableScale';
import Screen from '../../components/ui/Screen';
import Stack from '../../components/ui/Stack';
import Text from '../../components/ui/Text';
import { colors, gradients, layoutSpacing, radius, shadow, spacing } from '../../theme';
import { useAuthStore } from '../../store/useAuthStore';
import { useHistoryStore, type TranslationHistoryItem } from '../../store/useHistoryStore';
import { useThemeMode } from '../../hooks/useThemeMode';

import { createSheet } from '../../theme';

const EMPTY_HISTORY: TranslationHistoryItem[] = [];

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

function ActionCard({
  icon,
  title,
  subtitle,
  onPress,
  delay,
}: {
  icon: IoniconName;
  title: string;
  subtitle: string;
  onPress: () => void;
  delay: number;
}) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).springify().damping(24).stiffness(160)}>
      <PressableScale
        accessibilityRole="button"
        accessibilityLabel={title}
        onPress={onPress}
        style={styles.actionCard}
      >
        <View style={styles.actionIcon}>
          <Ionicons color={colors.primary} name={icon} size={26} />
        </View>
        <View style={styles.actionCopy}>
          <Heading variant="h2">{title}</Heading>
          <Text variant="caption" color="secondary">
            {subtitle}
          </Text>
        </View>
        <View style={styles.actionChevron}>
          <Ionicons color={colors.textOnPrimary} name="arrow-forward" size={18} />
        </View>
      </PressableScale>
    </Animated.View>
  );
}

function formatTime(iso: string) {
  const date = new Date(iso);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export default function HomeScreen() {
  useThemeMode();
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const isGuest = useAuthStore((state) => state.isGuest);
  const history = useHistoryStore((state) =>
    user && !isGuest ? (state.itemsByUser[user.id] ?? EMPTY_HISTORY) : EMPTY_HISTORY
  );
  const recentHistory = history.slice(0, 5);
  const displayName = isGuest ? 'Tamu' : user?.name?.split(' ')[0] || 'Pengguna';

  return (
    <Screen scroll contentStyle={{ paddingBottom: layoutSpacing.tabBarClearance }}>
      <Stack gap={spacing.lg}>
        {/* Top App Bar */}
        <Animated.View entering={FadeInDown.springify().damping(24).stiffness(160)}>
          <View style={styles.topBar}>
            <View style={styles.brandRow}>
              <BrandMark size={40} />
              <Heading variant="h2" style={styles.brand}>
                Amerta Sign
              </Heading>
            </View>
            <PressableScale
              accessibilityRole="button"
              accessibilityLabel="Profil pengguna"
              style={styles.avatarBtn}
            >
              <Ionicons color={colors.textSecondary} name="person" size={20} />
            </PressableScale>
          </View>
        </Animated.View>

        {/* Hero */}
        <Animated.View entering={FadeInDown.delay(60).springify().damping(24).stiffness(160)}>
          <LinearGradient
            colors={gradients.primary}
            start={{ x: 0, y: 0 }}
            end={{ x: 1.2, y: 1.2 }}
            style={styles.hero}
          >
            <View style={styles.heroCircleLg} />
            <View style={styles.heroCircleSm} />

            <View style={styles.heroBadge}>
              <View style={styles.heroBadgeDot} />
              <Text variant="label" style={styles.heroBadgeText}>
                Penerjemah isyarat real-time
              </Text>
            </View>

            <Heading variant="hero" style={styles.heroTitle}>
              Halo,{'\n'}{displayName}!
            </Heading>
            <Text variant="body" style={styles.heroSubtitle}>
              Jembatani percakapan dengan satu gerakan.
            </Text>

            <View style={styles.heroFooter}>
              <PressableScale
                accessibilityRole="button"
                accessibilityLabel="Mulai terjemahan"
                onPress={() => router.push('/(tabs)/translate')}
                style={styles.heroCta}
              >
                <Ionicons color={colors.textOnAccent} name="swap-horizontal" size={20} />
                <Text variant="bodyStrong" style={styles.heroCtaText}>
                  Mulai Terjemahan
                </Text>
              </PressableScale>

              <BrandMark onDark size={58} />
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Mode terjemahan */}
        <Animated.View entering={FadeInDown.delay(120).springify().damping(24).stiffness(160)}>
          <Text variant="kicker" color="primary" style={styles.sectionKicker}>
            Mode Terjemahan
          </Text>
        </Animated.View>

        <Stack gap={spacing.md}>
          <ActionCard
            delay={160}
            icon="scan-outline"
            onPress={() => router.push('/translate/camera')}
            subtitle="Kamera mendeteksi isyarat jadi teks & suara"
            title="Isyarat → Teks/Audio"
          />
          <ActionCard
            delay={220}
            icon="chatbubble-ellipses-outline"
            onPress={() => router.push('/translate/text-to-sign')}
            subtitle="Ubah tulisan atau ucapan jadi peragaan isyarat"
            title="Teks/Audio → Isyarat"
          />
        </Stack>

        {/* Riwayat terjemahan */}
        <Animated.View entering={FadeInDown.delay(280).springify().damping(24).stiffness(160)}>
          <View style={styles.sectionHeader}>
            <Text variant="kicker" color="primary">
              Riwayat Terjemahan
            </Text>
            {!isGuest && recentHistory.length > 0 ? (
              <PressableScale
                accessibilityRole="button"
                accessibilityLabel="Lihat semua riwayat"
                haptic={false}
                onPress={() => router.push('/history')}
                style={styles.sectionLink}
              >
                <Text variant="label" color="primary">
                  Lihat Semua
                </Text>
                <Ionicons color={colors.primary} name="chevron-forward" size={14} />
              </PressableScale>
            ) : null}
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(320).springify().damping(24).stiffness(160)}>
          {isGuest ? (
            <View style={styles.historyEmpty}>
              <View style={styles.historyEmptyIcon}>
                <Ionicons color={colors.textTertiary} name="lock-closed-outline" size={22} />
              </View>
              <Text variant="bodyStrong" align="center">
                Riwayat tidak tersimpan di mode tamu
              </Text>
              <Text variant="caption" color="secondary" align="center">
                Masuk dengan akun untuk menyimpan hasil terjemahanmu.
              </Text>
              <PressableScale
                accessibilityRole="button"
                accessibilityLabel="Masuk atau daftar"
                onPress={() => router.replace('/(auth)/login')}
                style={styles.historyLoginBtn}
              >
                <Text variant="bodyStrong" style={styles.historyLoginText}>
                  Masuk / Daftar
                </Text>
              </PressableScale>
            </View>
          ) : recentHistory.length === 0 ? (
            <View style={styles.historyEmpty}>
              <View style={styles.historyEmptyIcon}>
                <Ionicons color={colors.textTertiary} name="time-outline" size={22} />
              </View>
              <Text variant="bodyStrong" align="center">
                Belum ada riwayat
              </Text>
              <Text variant="caption" color="secondary" align="center">
                Hasil terjemahanmu akan otomatis tersimpan di sini.
              </Text>
            </View>
          ) : (
            <View style={styles.historyList}>
              {recentHistory.map((item: TranslationHistoryItem) => (
                <View key={item.id} style={styles.historyItem}>
                  <View style={styles.historyIcon}>
                    <Ionicons
                      color={colors.primary}
                      name={item.kind === 'isyarat-ke-teks' ? 'scan-outline' : 'chatbubble-ellipses-outline'}
                      size={18}
                    />
                  </View>
                  <View style={styles.historyCopy}>
                    <Text variant="bodyStrong" numberOfLines={1}>
                      {item.text}
                    </Text>
                    <Text variant="caption" color="secondary">
                      {item.kind === 'isyarat-ke-teks' ? 'Isyarat → Teks' : 'Teks → Isyarat'} ·{' '}
                      {item.signLanguageType.toUpperCase()}
                    </Text>
                  </View>
                  <Text variant="label" color="tertiary">
                    {formatTime(item.createdAt)}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </Animated.View>
      </Stack>
    </Screen>
  );
}

const styles = createSheet((colors) => ({
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  brand: {
    color: colors.primary,
    fontSize: 19,
  },
  avatarBtn: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hero: {
    borderRadius: radius.xxl,
    padding: spacing.lg,
    paddingVertical: spacing.xl,
    overflow: 'hidden',
    ...shadow.md,
  },
  heroCircleLg: {
    position: 'absolute',
    right: -70,
    top: -70,
    width: 200,
    height: 200,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  heroCircleSm: {
    position: 'absolute',
    right: 20,
    bottom: -50,
    width: 120,
    height: 120,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  heroBadge: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderRadius: radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    marginBottom: spacing.base,
  },
  heroBadgeDot: {
    width: 7,
    height: 7,
    borderRadius: radius.full,
    backgroundColor: colors.accent,
  },
  heroBadgeText: {
    color: colors.textOnPrimary,
  },
  heroTitle: {
    color: colors.textOnPrimary,
  },
  heroSubtitle: {
    color: colors.textOnPrimary,
    opacity: 0.82,
    marginTop: spacing.sm,
    maxWidth: '82%',
  },
  heroFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.lg,
  },
  heroCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.accent,
    borderRadius: radius.full,
    paddingHorizontal: spacing.lg,
    minHeight: 48,
    ...shadow.sm,
  },
  heroCtaText: {
    color: colors.textOnAccent,
  },
  sectionKicker: {
    marginBottom: -spacing.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: -spacing.sm,
  },
  sectionLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    minHeight: 32,
    paddingHorizontal: spacing.xs,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.base,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    padding: spacing.base,
    ...shadow.sm,
  },
  actionIcon: {
    width: 52,
    height: 52,
    borderRadius: radius.lg,
    backgroundColor: colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionCopy: {
    flex: 1,
    gap: 2,
  },
  actionChevron: {
    width: 34,
    height: 34,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyEmpty: {
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    padding: spacing.lg,
  },
  historyEmptyIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  historyLoginBtn: {
    minHeight: 44,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.sm,
  },
  historyLoginText: {
    color: colors.textOnPrimary,
  },
  historyList: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    overflow: 'hidden',
    ...shadow.sm,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  historyIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    backgroundColor: colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  historyCopy: {
    flex: 1,
    gap: 2,
  },
}));
