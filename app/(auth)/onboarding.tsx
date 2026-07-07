import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

import BrandMark from '../../components/ui/BrandMark';
import Button from '../../components/ui/Button';
import GradientSurface from '../../components/ui/GradientSurface';
import Heading from '../../components/ui/Heading';
import Sparkles from '../../components/ui/Sparkles';
import Squiggle from '../../components/ui/Squiggle';
import Text from '../../components/ui/Text';
import { colors, gradients, radius, spacing } from '../../theme';
import { useAuthStore } from '../../store/useAuthStore';

import { createSheet } from '../../theme';

import { useSettingsStore } from '../../store/useSettingsStore';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];
type GradientStops = readonly [string, string, ...string[]];

/** Jeda pergantian otomatis antar tampilan carousel. */
const AUTO_SLIDE_INTERVAL_MS = 5_000;

interface OnboardingSlide {
  id: string;
  icon: IoniconName;
  gradient: GradientStops;
  iconColor: string;
  ringColor: string;
  title: string;
  description: string;
}

const ONBOARDING_SLIDES: OnboardingSlide[] = [
  {
    id: 'translate',
    icon: 'scan',
    gradient: gradients.primary,
    iconColor: colors.textOnPrimary,
    ringColor: colors.accentSurface,
    title: 'Terjemah Isyarat',
    description: 'Arahkan kamera untuk menerjemahkan bahasa isyarat BISINDO menjadi teks dan suara.',
  },
  {
    id: 'chat',
    icon: 'chatbubbles',
    gradient: gradients.accent,
    iconColor: colors.textOnAccent,
    ringColor: colors.primarySurface,
    title: 'Komunikasi Dua Arah',
    description: 'Ketik atau ucapkan pesan dan lihat terjemahannya dalam bahasa isyarat.',
  },
  {
    id: 'learn',
    icon: 'library',
    gradient: gradients.primary,
    iconColor: colors.textOnPrimary,
    ringColor: colors.accentSurface,
    title: 'Belajar & Kamus',
    description: 'Pelajari bahasa isyarat dengan video tutorial dan kamus BISINDO lengkap.',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const themeMode = useSettingsStore((state) => state.themeMode);
  const { width } = useWindowDimensions();
  const flatListRef = useRef<FlatList<OnboardingSlide>>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const continueAsGuest = useAuthStore((state) => state.continueAsGuest);
  const isLoading = useAuthStore((state) => state.isLoading);

  // Carousel berganti otomatis; timer di-reset setiap slide berubah (termasuk geser manual).
  useEffect(() => {
    const timer = setInterval(() => {
      const nextSlide = (currentSlide + 1) % ONBOARDING_SLIDES.length;
      flatListRef.current?.scrollToIndex({ index: nextSlide, animated: true });
      setCurrentSlide(nextSlide);
    }, AUTO_SLIDE_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [currentSlide]);

  const handleLogin = () => {
    router.replace('/(auth)/login');
  };

  const handleGuest = async () => {
    try {
      await continueAsGuest();
      // Navigasi ditangani routing guard di _layout.tsx saat isAuthenticated berubah.
    } catch {
      router.replace('/(auth)/login');
    }
  };

  const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const nextSlide = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentSlide(nextSlide);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style={themeMode === 'dark' ? 'light' : 'dark'} />
      <View style={styles.container}>
        <Sparkles />

        {/* Logo brand di atas */}
        <View style={styles.topBar}>
          <BrandMark size={72} />
          <Heading variant="h2" style={styles.brandName}>
            AmertaSign
          </Heading>
        </View>

        <FlatList
          ref={flatListRef}
          data={ONBOARDING_SLIDES}
          getItemLayout={(_, index) => ({ length: width, offset: width * index, index })}
          horizontal
          keyExtractor={(item) => item.id}
          onMomentumScrollEnd={handleScrollEnd}
          pagingEnabled
          renderItem={({ item }) => (
            <View style={[styles.slide, { width }]}>
              <View style={styles.illustration}>
                <View style={[styles.ring, { borderColor: item.ringColor }]} />
                <GradientSurface
                  colors={item.gradient}
                  radius={radius.full}
                  shadowLevel="lg"
                  contentStyle={styles.illustrationInner}
                >
                  <Ionicons color={item.iconColor} name={item.icon} size={64} />
                </GradientSurface>
              </View>

              <Heading variant="hero" align="center" style={styles.slideTitle}>
                {item.title}
              </Heading>
              <Squiggle width={88} height={12} />
              <Text variant="body" color="secondary" align="center" style={styles.slideDescription}>
                {item.description}
              </Text>
            </View>
          )}
          showsHorizontalScrollIndicator={false}
        />

        <View style={styles.footer}>
          <View style={styles.dotsRow}>
            {ONBOARDING_SLIDES.map((slide, index) => (
              <View key={slide.id} style={[styles.dot, index === currentSlide ? styles.activeDot : undefined]} />
            ))}
          </View>
          <Button fullWidth title="Masuk / Daftar" onPress={handleLogin} />
          <Button disabled={isLoading} fullWidth title="Lanjut sebagai Tamu" variant="ghost" onPress={handleGuest} />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = createSheet((colors) => ({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
  },
  topBar: {
    alignItems: 'center',
    gap: spacing.xs,
    paddingTop: spacing.md,
  },
  brandName: {
    color: colors.primary,
  },
  slide: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  illustration: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  ring: {
    position: 'absolute',
    width: 196,
    height: 196,
    borderRadius: 999,
    borderWidth: 10,
  },
  illustrationInner: {
    width: 156,
    height: 156,
    alignItems: 'center',
    justifyContent: 'center',
  },
  slideTitle: {
    marginTop: spacing.sm,
  },
  slideDescription: {
    maxWidth: 320,
    marginTop: spacing.xs,
  },
  footer: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  dotsRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: radius.full,
    backgroundColor: colors.primarySoft,
    marginHorizontal: spacing.xs,
  },
  activeDot: {
    width: 28,
    backgroundColor: colors.accent,
  },
}));
