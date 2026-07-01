import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';

import DailyWord from '../../components/home/DailyWord';
import QuickActions from '../../components/home/QuickActions';
import Decor from '../../components/ui/Decor';
import GradientSurface from '../../components/ui/GradientSurface';
import Heading from '../../components/ui/Heading';
import Row from '../../components/ui/Row';
import Screen from '../../components/ui/Screen';
import Section from '../../components/ui/Section';
import Sparkles from '../../components/ui/Sparkles';
import Stack from '../../components/ui/Stack';
import Text from '../../components/ui/Text';
import { colors, layoutSpacing, radius, shadow, spacing } from '../../theme';
import { dailyWords as dailyWordIds, dictionaryEntries } from '../../constants/MockData';

export default function HomeScreen() {
  const featuredWord = useMemo(() => {
    const dayIndex = new Date().getDay();
    const featuredIds = dailyWordIds.length > 0 ? dailyWordIds : dictionaryEntries.map((entry) => entry.id);
    const entryId = featuredIds[dayIndex % featuredIds.length];

    return (
      dictionaryEntries.find((entry) => entry.id === entryId) ??
      dictionaryEntries[dayIndex % dictionaryEntries.length]
    );
  }, []);

  return (
    <Screen scroll>
      {/* Aksen dekoratif gestural + kilau ceria di balik header */}
      <Decor preset="header" />
      <Sparkles />

      <Stack gap={layoutSpacing.sectionGap}>
        <Animated.View entering={FadeInDown.springify().damping(15)}>
          <Row justify="space-between" align="center">
            <Text variant="kicker" color="primary" style={styles.brand}>
              AmertaSign
            </Text>
            <GradientSurface
              radius={radius.full}
              shadowLevel="md"
              style={styles.avatar}
              contentStyle={styles.avatarInner}
            >
              <Ionicons accessibilityLabel="Avatar pengguna" color={colors.textOnPrimary} name="person" size={22} />
            </GradientSurface>
          </Row>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(60).springify().damping(15)}>
          <View style={styles.welcomeBanner}>
            <View style={styles.welcomeDecor} />
            <Heading variant="hero" style={styles.welcomeTitle}>
              Halo, Pengguna!
            </Heading>
            <Text variant="body" style={styles.welcomeSubtitle}>
              Bahasa isyarat, satu gerakan setiap hari.
            </Text>
          </View>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(120).springify().damping(15)}>
          <QuickActions
            onDictionary={() => router.push('/(tabs)/dictionary')}
            onTranslate={() => router.push('/(tabs)/translate')}
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).springify().damping(15)}>
          <Section kicker="Hari Ini" title="Kata Pilihan">
            <DailyWord
              category={featuredWord.category}
              description={featuredWord.description}
              word={featuredWord.word}
            />
          </Section>
        </Animated.View>
      </Stack>
    </Screen>
  );
}

const styles = StyleSheet.create({
  brand: {
    fontSize: 18,
    letterSpacing: 0.5,
  },
  welcomeBanner: {
    backgroundColor: colors.accent,
    borderRadius: radius.xxl,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    overflow: 'hidden',
    ...shadow.sm,
  },
  welcomeDecor: {
    position: 'absolute',
    right: -40,
    top: -40,
    width: 128,
    height: 128,
    borderRadius: radius.full,
    backgroundColor: colors.accentStrong,
    opacity: 0.18,
  },
  welcomeTitle: {
    color: colors.textOnAccent,
    marginBottom: 4,
  },
  welcomeSubtitle: {
    color: colors.textOnAccent,
    opacity: 0.9,
  },
  avatar: {
    marginTop: 0,
  },
  avatarInner: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
