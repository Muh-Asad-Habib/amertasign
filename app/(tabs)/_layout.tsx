import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

import PressableScale from '../../components/ui/PressableScale';
import Text from '../../components/ui/Text';
import { colors, radius, shadow, spacing } from '../../theme';

import { createSheet } from '../../theme';
import { useSettingsStore } from '../../store/useSettingsStore';

const TAB_CONFIG: Record<
  string,
  {
    label: string;
    focused: keyof typeof Ionicons.glyphMap;
    unfocused: keyof typeof Ionicons.glyphMap;
  }
> = {
  index: { label: 'Beranda', focused: 'home', unfocused: 'home-outline' },
  translate: { label: 'Terjemah', focused: 'swap-horizontal', unfocused: 'swap-horizontal-outline' },
  dictionary: { label: 'Kamus', focused: 'book', unfocused: 'book-outline' },
  settings: { label: 'Pengaturan', focused: 'settings', unfocused: 'settings-outline' },
};

/** Bottom nav mengambang: pill surface lembut, item aktif pill emas berlabel. */
function StitchTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  // Subscribe tema agar bar ikut berubah saat mode gelap/terang diganti.
  useSettingsStore((s) => s.themeMode);

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { paddingBottom: Math.max(insets.bottom, spacing.md) }]}>
      <View style={styles.bar}>
        {state.routes.map((route, index) => {
          const config = TAB_CONFIG[route.name] ?? TAB_CONFIG.index;
          const focused = state.index === index;

          const handlePress = () => {
            const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          if (focused) {
            return (
              <PressableScale
                key={route.key}
                accessibilityRole="button"
                accessibilityLabel={config.label}
                accessibilityState={{ selected: true }}
                onPress={handlePress}
                style={styles.itemActive}
              >
                <Ionicons color={colors.textOnAccent} name={config.focused} size={20} />
                <Text variant="label" style={styles.labelActive}>
                  {config.label}
                </Text>
              </PressableScale>
            );
          }

          return (
            <PressableScale
              key={route.key}
              accessibilityRole="button"
              accessibilityLabel={config.label}
              onPress={handlePress}
              style={styles.item}
            >
              <Ionicons color={colors.textSecondary} name={config.unfocused} size={22} />
            </PressableScale>
          );
        })}
      </View>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <StitchTabBar {...props} />}>
      <Tabs.Screen name="index" options={{ title: 'Beranda' }} />
      <Tabs.Screen name="translate" options={{ title: 'Terjemah' }} />
      <Tabs.Screen name="dictionary" options={{ title: 'Kamus' }} />
      <Tabs.Screen name="settings" options={{ title: 'Pengaturan' }} />
    </Tabs>
  );
}

const styles = createSheet((colors) => ({
  // Mengambang sungguhan: menempel di atas konten, latar tembus pandang.
  wrap: {
    backgroundColor: 'transparent',
    bottom: 0,
    left: 0,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.sm,
    position: 'absolute',
    right: 0,
  },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: radius.full,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    gap: spacing.xs,
    ...shadow.lg,
  },
  item: {
    width: 52,
    height: 52,
    borderRadius: radius.full,
    backgroundColor: colors.surfaceMuted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemActive: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 52,
    borderRadius: radius.full,
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.base,
    ...shadow.md,
  },
  labelActive: {
    color: colors.textOnAccent,
    fontSize: 13,
  },
}));
