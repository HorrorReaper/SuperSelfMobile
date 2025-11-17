import { Stack } from 'expo-router';

export default function MorningLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#000' },
        headerTintColor: '#fff',
        headerShadowVisible: false,
      }}
    >
      <Stack.Screen
        name="routine"
        options={{
          title: 'Morning Routine',
          headerBackTitle: 'Back',
        }}
      />
      <Stack.Screen
        name="planning"
        options={{
          title: 'Day Planning',
          headerBackTitle: 'Back',
        }}
      />
      <Stack.Screen
        name="journal"
        options={{
          title: 'Morning Journal',
          headerBackTitle: 'Back',
        }}
      />
    </Stack>
  );
}
