import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import LanguageToggle from '../../components/translate/LanguageToggle';
import Card from '../../components/ui/Card';
import { Colors } from '../../constants/Colors';
import { Layout } from '../../constants/Layout';
import { useTranslation } from '../../hooks/useTranslation';

export default function TranslateScreen() {
  const router = useRouter();
  const { signLanguageType, setSignLanguageType } = useTranslation();

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Terjemah</Text>
          <Text style={styles.subtitle}>Pilih mode terjemahan</Text>
        </View>

        <LanguageToggle onChange={setSignLanguageType} value={signLanguageType} />

        <View style={styles.cards}>
          <Card elevated onPress={() => router.push('/translate/camera')} style={[styles.card, styles.cameraCard]}>
            <View style={[styles.glow, styles.cameraGlow]} />
            <Text style={styles.cardIcon}>📷</Text>
            <Text style={[styles.cardTitle, styles.lightCardText]}>Isyarat → Teks & Suara</Text>
            <Text style={[styles.cardDescription, styles.lightCardSubtext]}>
              Arahkan kamera untuk menerjemahkan bahasa isyarat
            </Text>
          </Card>

          <Card
            elevated
            onPress={() => router.push('/translate/text-to-sign')}
            style={[styles.card, styles.textCard]}
          >
            <View style={[styles.glow, styles.textGlow]} />
            <Text style={styles.cardIcon}>⌨️</Text>
            <Text style={styles.cardTitle}>Teks → Bahasa Isyarat</Text>
            <Text style={styles.cardDescription}>
              Ketik pesan untuk diterjemahkan ke bahasa isyarat
            </Text>
          </Card>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: Colors.light.background,
    flex: 1,
  },
  content: {
    padding: Layout.spacing.lg,
    paddingBottom: Layout.spacing.xxl,
  },
  header: {
    marginBottom: Layout.spacing.lg,
  },
  title: {
    color: Colors.light.text,
    fontSize: Layout.fontSize.title,
    fontWeight: '800',
    marginBottom: Layout.spacing.xs,
  },
  subtitle: {
    color: Colors.light.textSecondary,
    fontSize: Layout.fontSize.body,
    lineHeight: 24,
  },
  cards: {
    marginTop: Layout.spacing.lg,
  },
  card: {
    borderWidth: 0,
    minHeight: 220,
    overflow: 'hidden',
    padding: Layout.spacing.xl,
  },
  cameraCard: {
    backgroundColor: Colors.light.primary,
    marginBottom: Layout.spacing.md,
  },
  textCard: {
    backgroundColor: '#FCD34D',
  },
  glow: {
    borderRadius: 140,
    height: 140,
    position: 'absolute',
    right: -28,
    top: -28,
    width: 140,
  },
  cameraGlow: {
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  textGlow: {
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  cardIcon: {
    fontSize: 42,
    marginBottom: Layout.spacing.lg,
  },
  cardTitle: {
    color: Colors.light.text,
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 32,
    marginBottom: Layout.spacing.sm,
    maxWidth: '88%',
  },
  cardDescription: {
    color: '#78350F',
    fontSize: Layout.fontSize.body,
    lineHeight: 24,
    maxWidth: '88%',
  },
  lightCardText: {
    color: '#FFFFFF',
  },
  lightCardSubtext: {
    color: 'rgba(255,255,255,0.84)',
  },
});
