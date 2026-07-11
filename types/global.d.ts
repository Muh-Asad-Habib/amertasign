declare module '*.css';
declare module 'expo-router/entry';

// Dev-only globals exposed in app/_layout.tsx for the screenshot script.
interface Window {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  __authStore?: { getState: () => any; setState: (partial: any) => void };
  __router?: { replace: (route: string) => void };
}
