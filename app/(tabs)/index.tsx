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
import Squiggle from '../../components/ui/Squiggle';
import Stack from '../../components/ui/Stack';
import Text from '../../components/ui/Text';
import { colors, layoutSpacing, radius, spacing } from '../../theme';
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
          <Row justify="space-between" align="flex-start">
            <View style={styles.headerCopy}>
              <Text variant="kicker" color="primary">
                AmertaSign
              </Text>
              <Heading variant="hero" style={styles.greeting}>
                Halo,{'\n'}Pengguna
              </Heading>
              <Squiggle width={96} height={12} />
              <Text variant="body" color="secondary" style={styles.subtitle}>
                Bahasa isyarat, satu gerakan setiap hari.
              </Text>
            </View>
            <GradientSurface
              radius={radius.full}
              shadowLevel="md"
              style={styles.avatar}
              contentStyle={styles.avatarInner}
            >
              <Ionicons accessibilityLabel="Avatar pengguna" color={colors.textOnPrimary} name="person" size={24} />
            </GradientSurface>
          </Row>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(80).springify().damping(15)}>
          <QuickActions
            onDictionary={() => router.push('/(tabs)/dictionary')}
            onTranslate={() => router.push('/(tabs)/translate')}
          />
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(160).springify().damping(15)}>
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
  headerCopy: {
    flex: 1,
    paddingRight: spacing.md,
    gap: 6,
  },
  greeting: {
    marginTop: 2,
  },
  subtitle: {
    marginTop: spacing.sm,
  },
  avatar: {
    marginTop: 4,
  },
  avatarInner: {
    width: 56,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
