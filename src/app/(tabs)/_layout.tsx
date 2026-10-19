import { Tabs } from 'expo-router';
import { Text, type ColorValue } from 'react-native';

import { useColors } from '@/constants/theme';

const icon = (glyph: string) =>
  function TabIcon({ color }: { color: ColorValue }) {
    return <Text style={{ color, fontSize: 20 }}>{glyph}</Text>;
  };

export default function TabLayout() {
  const c = useColors();
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: c.pitch,
        tabBarInactiveTintColor: c.muted,
        tabBarStyle: { backgroundColor: c.background, borderTopColor: c.line },
      }}>
      <Tabs.Screen name="index" options={{ title: 'Discover', tabBarIcon: icon('◧') }} />
      <Tabs.Screen name="matches" options={{ title: 'Matches', tabBarIcon: icon('✉') }} />
      <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: icon('◉') }} />
    </Tabs>
  );
}
