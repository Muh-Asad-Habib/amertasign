import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useRef, useState } from 'react';
import {
  FlatList,
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import Button from '../../components/ui/Button';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';

interface OnboardingSlide {
  id: string;
  icon: string;
  title: string;
  description: string;
}

const ONBOARDING_SLIDES: OnboardingSlide[] = [
  {
    id: 'translate',
    icon: '📷',
    title: 'Terjemah Isyarat',
    description: 'Arahkan kamera untuk menerjemahkan bahasa isyarat secara real-time',
  },
  {
    id: 'chat',
    icon: '💬',
    title: 'Komunikasi Dua Arah',
    description: 'Ketik pesan dan lihat terjemahan dalam bahasa isyarat',
  },
  {
    id: 'learn',
    icon: '📚',
    title: 'Belajar & Kamus',
    description: 'Pelajari bahasa isyarat dengan video tutorial dan kamus lengkap',
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const flatListRef = useRef<FlatList<OnboardingSlide>>(null);
  const [currentSlide, setCurrentSlide] = useState(0);

  const handleSkip = () => {
    router.replace('/(auth)/login');
  };

  const handleNext = () => {
    if (currentSlide === ONBOARDING_SLIDES.length - 1) {
      router.replace('/(auth)/login');
      return;
    }

    flatListRef.current?.scrollToIndex({
      index: currentSlide + 1,
      animated: true,
    });
  };

  const handleScrollEnd = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const nextSlide = Math.round(event.nativeEvent.contentOffset.x / width);
    setCurrentSlide(nextSlide);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <View style={styles.container}>
        <View style={styles.topBar}>
          <Pressable hitSlop={8} onPress={handleSkip}>
            <Text style={styles.skipText}>Lewati</Text>
          </Pressable>
        </View>

        <FlatList
          ref={flatListRef}
          data={ONBOARDING_SLIDES}
          getItemLayout={(_, index) => ({
            length: width,
            offset: width * index,
            index,
          })}
          horizontal
          keyExtractor={(item) => item.id}
          onMomentumScrollEnd={handleScrollEnd}
          pagingEnabled
          renderItem={({ item }) => (
            <View style={[styles.slide, { width }]}>
              <View style={styles.illustrationCircle}>
                <Text style={styles.slideIcon}>{item.icon}</Text>
              </View>
              <Text style={styles.slideTitle}>{item.title}</Text>
              <Text style={styles.slideDescription}>{item.description}</Text>
            </View>
          )}
          showsHorizontalScrollIndicator={false}
        />

        <View style={styles.footer}>
          <View style={styles.dotsRow}>
            {ONBOARDING_SLIDES.map((slide, index) => (
              <View
                key={slide.id}
                style={[styles.dot, index === currentSlide ? styles.activeDot : undefined]}
              />
            ))}
          </View>
          <Button
            fullWidth
            title={currentSlide === ONBOARDING_SLIDES.length - 1 ? 'Mulai' : 'Lanjut'}
            onPress={handleNext}
          />
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.light.surface,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.light.surface,
  },
  topBar: {
    alignItems: 'flex-end',
    paddingHorizontal: Layout.spacing.lg,
    paddingTop: Layout.spacing.sm,
  },
  skipText: {
    color: Colors.light.primary,
    fontSize: Layout.fontSize.body,
    fontWeight: '700',
  },
  slide: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Layout.spacing.xl,
    paddingBottom: Layout.spacing.xl,
  },
  illustrationCircle: {
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: '#DBEAFE',
    borderWidth: 6,
    borderColor: '#FDE68A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Layout.spacing.xl,
  },
  slideIcon: {
    fontSize: 88,
  },
  slideTitle: {
    color: Colors.light.text,
    fontSize: Layout.fontSize.xxl,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: Layout.spacing.md,
  },
  slideDescription: {
    color: Colors.light.textSecondary,
    fontSize: Layout.fontSize.body,
    lineHeight: 24,
    textAlign: 'center',
    maxWidth: 320,
  },
  footer: {
    paddingHorizontal: Layout.spacing.lg,
    paddingBottom: Layout.spacing.lg,
    gap: Layout.spacing.lg,
  },
  dotsRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: Layout.radius.full,
    backgroundColor: '#BFDBFE',
    marginHorizontal: Layout.spacing.xs,
  },
  activeDot: {
    width: 28,
    backgroundColor: Colors.light.accent,
  },
});
