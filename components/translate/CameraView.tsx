import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const COLORS = {
  primary: '#2563EB',
  accent: '#F59E0B',
  dark: '#0F172A',
  darkSecondary: '#94A3B8',
  white: '#FFFFFF',
};

export interface CameraViewProps {
  isActive: boolean;
}

export default function CameraView({ isActive }: CameraViewProps) {
  return (
    <View style={styles.container}>
      <View style={styles.statusPill}>
        <Text style={styles.statusText}>{isActive ? 'Kamera aktif' : 'Kamera siaga'}</Text>
      </View>

      <View style={styles.content}>
        <View style={[styles.cameraGlyph, isActive && styles.cameraGlyphActive]}>
          <Ionicons color={COLORS.white} name="camera" size={52} />
        </View>
        <Text style={styles.title}>Arahkan kamera ke pengguna bahasa isyarat</Text>
        <Text style={styles.subtitle}>
          {isActive ? 'Kamera siap mendeteksi gerakan tangan.' : 'Aktifkan kamera untuk memulai terjemahan.'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.dark,
    borderRadius: 24,
    flex: 1,
    minHeight: 360,
    overflow: 'hidden',
    padding: 20,
  },
  statusPill: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  statusText: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 13,
    fontWeight: '700',
  },
  content: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  cameraGlyph: {
    alignItems: 'center',
    backgroundColor: 'rgba(37, 99, 235, 0.35)',
    borderColor: 'rgba(255,255,255,0.16)',
    borderRadius: 56,
    borderWidth: 1,
    height: 112,
    justifyContent: 'center',
    marginBottom: 20,
    width: 112,
  },
  cameraGlyphActive: {
    backgroundColor: COLORS.accent,
  },
  title: {
    color: COLORS.white,
    fontSize: 22,
    fontWeight: '700',
    textAlign: 'center',
  },
  subtitle: {
    color: COLORS.darkSecondary,
    fontSize: 16,
    lineHeight: 24,
    marginTop: 10,
    textAlign: 'center',
  },
});
