import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';

import Badge from '../../components/ui/Badge';
import Heading from '../../components/ui/Heading';
import PressableScale from '../../components/ui/PressableScale';
import Screen from '../../components/ui/Screen';
import Stack from '../../components/ui/Stack';
import Text from '../../components/ui/Text';
import { colors, gradients, radius, shadow, spacing } from '../../theme';
import { useThemeMode } from '../../hooks/useThemeMode';

import { createSheet } from '../../theme';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];
type GradientStops = readonly [string, string, ...string[]];

function ModeCard({
  icon,
  title,
  description,
  gradient,
  textColor,
  delay,
  onPress,
}: {
  icon: IoniconName;
  title: string;
  description: string;
  gradient: GradientStops;
  textColor: string;
  delay: number;
  onPress: () => void;
}) {
  return (
    <Animated.View entering={FadeInDown.delay(delay).springify().damping(24).stiffness(160)}>
      <PressableScale accessibilityRole="button" accessibilityLabel={title} onPress={onPress}>
        <LinearGradient
          colors={gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1.2, y: 1.2 }}
          style={styles.modeCard}
        >
          <View style={styles.modeCircle} />
          <View style={styles.modeIcon}>
            <Ionicons color={textColor} name={icon} size={30} />
          </View>
          <Heading variant="title" style={{ color: textColor }}>
            {title}
          </Heading>
          <Text variant="body" style={[styles.modeDescription, { color: textColor }]}>
            {description}
          </Text>
          <View style={styles.modeFooter}>
            <Text variant="bodyStrong" style={{ color: textColor }}>
              Mulai
            </Text>
            <View style={styles.modeArrow}>
              <Ionicons color={colors.text} name="arrow-forward" size={18} />
            </View>
          </View>
        </LinearGradient>
      </PressableScale>
    </Animated.View>
  );
}

export default function TranslateScreen() {
  useThemeMode();
  const router = useRouter();

  return (
    <Screen scroll>
      <Stack gap={spacing.lg}>
        <Animated.View entering={FadeInDown.springify().damping(24).stiffness(160)}>
          <Stack gap={spacing.sm}>
            <Badge text="BISINDO" variant="primary" />
            <Heading variant="hero">Terjemahan</Heading>
            <Text variant="body" color="secondary">
              Pilih arah terjemahan yang kamu butuhkan.
            </Text>
          </Stack>
        </Animated.View>

        <Stack gap={spacing.base}>
          <ModeCard
            delay={80}
            description="Kamera mendeteksi gerakan isyarat BISINDO, lalu mengubahnya menjadi teks dan suara."
            gradient={gradients.primary}
            icon="scan"
            onPress={() => router.push('/translate/camera')}
            textColor={colors.textOnPrimary}
            title="Isyarat → Teks/Audio"
          />
          <ModeCard
            delay={160}
            description="Ketik atau ucapkan pesan, lalu lihat peragaan bahasa isyaratnya."
            gradient={gradients.accent}
            icon="chatbubble-ellipses"
            onPress={() => router.push('/translate/text-to-sign')}
            textColor={colors.textOnAccent}
            title="Teks/Audio → Isyarat"
          />
        </Stack>

        <Animated.View entering={FadeInDown.delay(240).springify().damping(24).stiffness(160)}>
          <View style={styles.tipCard}>
            <View style={styles.tipIcon}>
              <Ionicons color={colors.primary} name="bulb-outline" size={20} />
            </View>
            <Text variant="caption" color="secondary" style={styles.tipText}>
              Pastikan pencahayaan cukup dan tanganmu terlihat jelas di kamera untuk hasil deteksi terbaik.
            </Text>
          </View>
        </Animated.View>
      </Stack>
    </Screen>
  );
}

const styles = createSheet((colors) => ({
  modeCard: {
    borderRadius: radius.xxl,
    padding: spacing.lg,
    overflow: 'hidden',
    gap: spacing.sm,
    ...shadow.md,
  },
  modeCircle: {
    position: 'absolute',
    right: -60,
    top: -60,
    width: 170,
    height: 170,
    borderRadius: radius.full,
    backgroundColor: 'rgba(255,255,255,0.12)',
  },
  modeIcon: {
    width: 56,
    height: 56,
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  modeDescription: {
    opacity: 0.85,
    maxWidth: '92%',
  },
  modeFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  modeArrow: {
    width: 38,
    height: 38,
    borderRadius: radius.full,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.xl,
    padding: spacing.base,
  },
  tipIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.full,
    backgroundColor: colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tipText: {
    flex: 1,
  },
}));
