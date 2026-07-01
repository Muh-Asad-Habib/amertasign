import { useRouter } from 'expo-router';
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';

import LanguageToggle from '../../components/translate/LanguageToggle';
import Decor from '../../components/ui/Decor';
import GradientSurface from '../../components/ui/GradientSurface';
import Heading from '../../components/ui/Heading';
import Screen from '../../components/ui/Screen';
import Squiggle from '../../components/ui/Squiggle';
import Stack from '../../components/ui/Stack';
import Text from '../../components/ui/Text';
import { gradients, overlay, radius, spacing } from '../../theme';
import { useTranslation } from '../../hooks/useTranslation';

type GradientStops = readonly [string, string, ...string[]];

function ModeCard({
  title,
  subtitle,
  icon,
  gradient,
  textColor,
  fg,
  onPress,
}: {
  title: string;
  subtitle: string;
  icon: React.ComponentProps<typeof Ionicons>['name'];
  gradient: GradientStops;
  textColor: 'onPrimary' | 'onAccent';
  fg: string;
  onPress: () => void;
}) {
  return (
    <GradientSurface
      accessibilityLabel={title}
      colors={gradient}
      onPress={onPress}
      radius={radius.xxl}
      shadowLevel="lg"
      contentStyle={styles.cardContent}
    >
      <View style={styles.cardTop}>
        <View style={styles.bubble}>
          <Ionicons color={fg} name={icon} size={30} />
        </View>
        <View style={styles.chevron}>
          <Ionicons color={fg} name="arrow-forward" size={20} />
        </View>
      </View>
      <Heading variant="title" color={textColor} style={styles.cardTitle}>
        {title}
      </Heading>
      <Text variant="body" color={textColor} style={styles.cardSubtitle}>
        {subtitle}
      </Text>
    </GradientSurface>
  );
}

export default function TranslateScreen() {
  const router = useRouter();
  const { signLanguageType, setSignLanguageType } = useTranslation();

  return (
    <Screen scroll>
      <Decor preset="header" />

      <Stack gap={spacing.lg}>
        <View>
          <Text variant="kicker" color="primary">
            Dua Arah
          </Text>
          <Heading variant="hero" style={styles.title}>
            Terjemah
          </Heading>
          <Squiggle width={92} height={12} />
          <Text variant="body" color="secondary" style={styles.subtitle}>
            Pilih mode terjemahan yang kamu butuhkan.
          </Text>
        </View>

        <LanguageToggle onChange={setSignLanguageType} value={signLanguageType} />

        <Stack gap={spacing.md}>
          <Animated.View entering={FadeInDown.duration(450)}>
            <ModeCard
              fg="#FFFDF8"
              gradient={gradients.primary}
              icon="scan"
              onPress={() => router.push('/translate/camera')}
              subtitle="Arahkan kamera untuk menerjemahkan bahasa isyarat secara langsung."
              textColor="onPrimary"
              title="Isyarat → Teks & Suara"
            />
          </Animated.View>

          <Animated.View entering={FadeInDown.duration(450).delay(90)}>
            <ModeCard
              fg="#1A1714"
              gradient={gradients.accent}
              icon="hand-left"
              onPress={() => router.push('/translate/text-to-sign')}
              subtitle="Ketik pesan untuk diterjemahkan ke gerakan bahasa isyarat."
              textColor="onAccent"
              title="Teks → Bahasa Isyarat"
            />
          </Animated.View>
        </Stack>
      </Stack>
    </Screen>
  );
}

const styles = StyleSheet.create({
  title: {
    marginTop: 2,
  },
  subtitle: {
    marginTop: spacing.sm,
  },
  cardContent: {
    minHeight: 196,
    padding: spacing.lg,
    justifyContent: 'space-between',
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bubble: {
    width: 58,
    height: 58,
    borderRadius: radius.xl,
    backgroundColor: overlay.onBrandStrong,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chevron: {
    width: 34,
    height: 34,
    borderRadius: radius.full,
    backgroundColor: overlay.onBrandSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardTitle: {
    marginTop: spacing.lg,
    maxWidth: '92%',
  },
  cardSubtitle: {
    marginTop: spacing.xs,
    opacity: 0.9,
    maxWidth: '94%',
  },
});
