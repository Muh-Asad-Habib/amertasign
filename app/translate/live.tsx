import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

import PressableScale from '../../components/ui/PressableScale';
import Text from '../../components/ui/Text';
import Heading from '../../components/ui/Heading';
import { colors, overlay, radius, shadow, spacing, touchTargetMin } from '../../theme';

interface TranslationBubble {
  id: string;
  text: string;
  time: string;
  current?: boolean;
}

const HISTORY: TranslationBubble[] = [
  { id: '1', text: 'Halo, nama saya Alex.', time: '10:42' },
  { id: '2', text: 'Saya memakai aplikasi ini untuk berkomunikasi.', time: '10:43' },
  { id: '3', text: 'Terima kasih atas bantuannya. Saya sangat menghargainya.', time: '10:44', current: true },
];

export default function LiveTranslatorScreen() {
  const router = useRouter();

  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <StatusBar style="light" />

      {/* Top App Bar */}
      <View style={styles.header}>
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel="Kembali"
          onPress={() => router.back()}
          style={styles.iconBtn}
        >
          <Ionicons color={colors.text} name="chevron-back" size={26} />
        </PressableScale>
        <Heading variant="h2" numberOfLines={1} style={styles.headerTitle}>
          Penerjemah Langsung
        </Heading>
        <PressableScale
          accessibilityRole="button"
          accessibilityLabel="Pengaturan"
          onPress={() => router.push('/settings')}
          style={styles.iconBtn}
        >
          <Ionicons color={colors.text} name="settings-outline" size={22} />
        </PressableScale>
      </View>

      {/* Camera feed area */}
      <View style={styles.feed}>
        <View style={styles.feedPlaceholder}>
          <Ionicons color={overlay.onInkBorder} name="videocam" size={64} />
          <Text variant="caption" style={styles.feedHint}>
            Arahkan kamera ke gerakan isyarat
          </Text>
        </View>

        {/* AI bounding box */}
        <View style={styles.boundingWrap} pointerEvents="none">
          <View style={styles.boundingBox}>
            <View style={styles.confidenceBadge}>
              <Text variant="label" style={styles.confidenceText}>
                Terima Kasih · 98%
              </Text>
            </View>
          </View>
        </View>

        {/* Recording indicator */}
        <View style={styles.livePill}>
          <View style={styles.liveDot} />
          <Text variant="label" style={styles.liveText}>
            Langsung
          </Text>
        </View>
      </View>

      {/* Translation panel */}
      <View style={styles.panel}>
        <View style={styles.dragHandle} />
        <ScrollView
          contentContainerStyle={styles.chatContent}
          showsVerticalScrollIndicator={false}
        >
          {HISTORY.map((item, index) =>
            item.current ? (
              <Animated.View
                key={item.id}
                entering={FadeInUp.delay(index * 60)}
                style={styles.currentBubble}
              >
                <Heading variant="title" style={styles.currentText}>
                  {item.text}
                </Heading>
                <View style={styles.typist}>
                  <View style={styles.typistDot} />
                  <View style={[styles.typistDot, styles.typistDotDim]} />
                  <View style={styles.typistDot} />
                </View>
              </Animated.View>
            ) : (
              <View key={item.id} style={styles.pastBubbleWrap}>
                <View style={styles.pastBubble}>
                  <Text variant="body">{item.text}</Text>
                </View>
                <Text variant="label" color="tertiary" style={styles.timeText}>
                  {item.time}
                </Text>
              </View>
            )
          )}
        </ScrollView>

        {/* Controls */}
        <View style={styles.controls}>
          <PressableScale
            accessibilityRole="button"
            accessibilityLabel="Ganti kamera"
            style={styles.ctrlSecondary}
          >
            <Ionicons color={colors.primary} name="camera-reverse-outline" size={24} />
          </PressableScale>

          <PressableScale
            accessibilityRole="button"
            accessibilityLabel="Berhenti merekam"
            style={styles.ctrlPrimary}
          >
            <Ionicons color={colors.textOnPrimary} name="stop" size={28} />
          </PressableScale>

          <PressableScale
            accessibilityRole="button"
            accessibilityLabel="Salin teks"
            style={styles.ctrlSecondary}
          >
            <Ionicons color={colors.primary} name="copy-outline" size={22} />
          </PressableScale>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.base,
    paddingVertical: spacing.sm,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
  },
  iconBtn: {
    width: touchTargetMin,
    height: touchTargetMin,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  feed: {
    flex: 1,
    backgroundColor: '#12151C',
    overflow: 'hidden',
    position: 'relative',
  },
  feedPlaceholder: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  feedHint: {
    color: overlay.onBrandStrong,
  },
  boundingWrap: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  boundingBox: {
    width: '68%',
    height: '58%',
    borderWidth: 3,
    borderColor: colors.primarySoft,
    borderRadius: radius.lg,
  },
  confidenceBadge: {
    position: 'absolute',
    top: -34,
    left: -3,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderTopLeftRadius: radius.sm,
    borderTopRightRadius: radius.sm,
    borderBottomRightRadius: radius.sm,
    ...shadow.sm,
  },
  confidenceText: {
    color: colors.textOnPrimary,
  },
  livePill: {
    position: 'absolute',
    top: spacing.base,
    right: spacing.base,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: 'rgba(11,18,32,0.7)',
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.error,
  },
  liveText: {
    color: colors.white,
  },
  panel: {
    height: '46%',
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.xxl,
    borderTopRightRadius: radius.xxl,
    marginTop: -spacing.lg,
    paddingHorizontal: spacing.base,
    ...shadow.lg,
  },
  dragHandle: {
    alignSelf: 'center',
    width: 48,
    height: 5,
    borderRadius: radius.full,
    backgroundColor: colors.border,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  chatContent: {
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  pastBubbleWrap: {
    alignSelf: 'flex-start',
    maxWidth: '85%',
  },
  pastBubble: {
    backgroundColor: colors.surfaceMuted,
    padding: spacing.base,
    borderRadius: radius.xl,
    borderTopLeftRadius: radius.sm,
  },
  timeText: {
    marginTop: 4,
    marginLeft: spacing.xs,
    opacity: 0.7,
  },
  currentBubble: {
    backgroundColor: colors.primarySurface,
    borderWidth: 1.5,
    borderColor: colors.primarySoft,
    padding: spacing.lg,
    borderRadius: radius.xxl,
    borderTopLeftRadius: radius.md,
    ...shadow.md,
  },
  currentText: {
    color: colors.primaryStrong,
  },
  typist: {
    flexDirection: 'row',
    gap: 6,
    marginTop: spacing.md,
  },
  typistDot: {
    width: 8,
    height: 8,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
  },
  typistDotDim: {
    opacity: 0.5,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    paddingVertical: spacing.base,
  },
  ctrlSecondary: {
    width: 52,
    height: 52,
    borderRadius: radius.full,
    backgroundColor: colors.primarySurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ctrlPrimary: {
    width: 68,
    height: 68,
    borderRadius: radius.full,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.md,
  },
});
