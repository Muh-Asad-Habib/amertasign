import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';

import { Colors } from '../../constants/Colors';

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
  learn: { focused: 'school', unfocused: 'school-outline' },
  profile: { focused: 'person', unfocused: 'person-outline' },
};

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: Colors.light.primary,
        tabBarInactiveTintColor: Colors.light.textSecondary,
        tabBarStyle: {
          backgroundColor: Colors.light.surface,
          borderTopColor: Colors.light.border,
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 6,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        tabBarIcon: ({ color, size, focused }) => {
          const icons = tabIcons[route.name] ?? tabIcons.index;
          return (
            <Ionicons
              color={color}
              name={focused ? icons.focused : icons.unfocused}
              size={size}
            />
          );
        },
      })}
    >
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarAccessibilityLabel: 'Beranda' }} />
      <Tabs.Screen name="translate" options={{ title: 'Translate', tabBarAccessibilityLabel: 'Terjemah' }} />
      <Tabs.Screen name="dictionary" options={{ title: 'Kamus', tabBarAccessibilityLabel: 'Kamus Isyarat' }} />
      <Tabs.Screen name="learn" options={{ title: 'Belajar', tabBarAccessibilityLabel: 'Belajar Isyarat' }} />
      <Tabs.Screen name="profile" options={{ title: 'Profil', tabBarAccessibilityLabel: 'Profil Pengguna' }} />
    </Tabs>
  );
}
