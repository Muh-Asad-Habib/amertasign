import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

import { colors, fontFamily } from '../../theme';

const tabIcons: Record<
  string,
  {
    focused: keyof typeof Ionicons.glyphMap;
    unfocused: keyof typeof Ionicons.glyphMap;
  }
> = {
  index: { focused: 'home', unfocused: 'home-outline' },
  translate: { focused: 'camera', unfocused: 'camera-outline' },
  dictionary: { focused: 'book', unfocused: 'book-outline' },
  profile: { focused: 'person', unfocused: 'person-outline' },
};

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.border,
          borderTopWidth: 1,
          height: 64,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontFamily: fontFamily.bodySemiBold,
        },
        tabBarIcon: ({ color, size, focused }) => {
          const icons = tabIcons[route.name] ?? tabIcons.index;
          return <Ionicons color={color} name={focused ? icons.focused : icons.unfocused} size={size} />;
        },
      })}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarAccessibilityLabel: 'Beranda' }} />
      <Tabs.Screen name="translate" options={{ title: 'Translate', tabBarAccessibilityLabel: 'Terjemah' }} />
      <Tabs.Screen name="dictionary" options={{ title: 'Kamus', tabBarAccessibilityLabel: 'Kamus Isyarat' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profil', tabBarAccessibilityLabel: 'Profil Pengguna' }} />
    </Tabs>
  );
}
