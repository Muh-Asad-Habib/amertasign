import { Stack } from 'expo-router';

export default function TranslateLayout() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="camera" />
      <Stack.Screen name="live" />
      <Stack.Screen name="text-to-sign" />
    </Stack>
  );
}
