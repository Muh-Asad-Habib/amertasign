import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';

import PressableScale from '../../components/ui/PressableScale';
import Text from '../../components/ui/Text';
import { colors, radius, shadow, spacing } from '../../theme';

const TAB_CONFIG: Record<
  string,
  {
    label: string;
    focused: keyof typeof Ionicons.glyphMap;
    unfocused: keyof typeof Ionicons.glyphMap;
  }
> = {
  index: { label: 'Home', focused: 'home', unfocused: 'home-outline' },
  live: { label: 'Live', focused: 'videocam', unfocused: 'videocam-outline' },
  settings: { label: 'Settings', focused: 'settings', unfocused: 'settings-outline' },
};

/** Bottom nav ala Stitch: item aktif dibungkus pill kuning. */
function StitchTabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
      {state.routes.map((route, index) => {
        const config = TAB_CONFIG[route.name] ?? TAB_CONFIG.index;
        const focused = state.index === index;

        return (
          <PressableScale
            key={route.key}
            accessibilityRole="button"
            accessibilityLabel={config.label}
            onPress={() => {
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!focused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            }}
            style={[styles.item, focused && styles.itemActive]}
          >
            <Ionicons
              color={focused ? colors.textOnAccent : colors.textSecondary}
              name={focused ? config.focused : config.unfocused}
              size={24}
            />
            <Text variant="label" style={focused ? styles.labelActive : styles.label}>
              {config.label}
            </Text>
          </PressableScale>
        );
      })}
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }} tabBar={(props) => <StitchTabBar {...props} />}>
      <Tabs.Screen name="index" options={{ title: 'Home' }} />
      <Tabs.Screen name="live" options={{ title: 'Live' }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.base,
    paddingTop: spacing.md,
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    ...shadow.lg,
  },
  item: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingHorizontal: spacing.lg,
    paddingVertical: 6,
    borderRadius: radius.full,
  },
  itemActive: {
    backgroundColor: colors.accent,
  },
  label: {
    color: colors.textSecondary,
  },
  labelActive: {
    color: colors.textOnAccent,
  },
});
