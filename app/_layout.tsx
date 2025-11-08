import { Stack } from 'expo-router';

export default function RootLayout() {

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#000' },
      }}
    >
      <Stack.Screen name="index" />
      <Stack.Screen name="plan" />
      <Stack.Screen name="reflect" />
      <Stack.Screen name="redeem" />
      <Stack.Screen name="challenge" />
      <Stack.Screen name="blocking-settings" />

      <Stack.Screen name="stats" options={{ presentation: 'modal' }} />
    </Stack>
  );
}
