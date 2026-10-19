import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { Body, Screen, Title } from '@/components/ui';
import { SportColor, Spacing, useColors } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';
import type { MatchRow } from '@/lib/types';

export default function Matches() {
  const c = useColors();
  const { profile } = useAuth();
  const [rows, setRows] = useState<MatchRow[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    const { data } = await supabase.rpc('my_matches');
    setRows((data as MatchRow[]) ?? []);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  // Coaches see the athlete's name; athletes see the school; parents see both.
  const titleOf = (m: MatchRow) =>
    profile?.role === 'coach' ? m.athlete_name : profile?.role === 'parent' ? `${m.athlete_name} and ${m.school_name}` : m.school_name;

  return (
    <Screen>
      <View style={{ paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md }}>
        <Title>Matches</Title>
      </View>
      <FlatList
        data={rows}
        keyExtractor={(m) => m.match_id}
        contentContainerStyle={{ paddingHorizontal: Spacing.lg, gap: Spacing.sm, paddingBottom: Spacing.xl }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={async () => {
              setRefreshing(true);
              await load();
              setRefreshing(false);
            }}
          />
        }
        ListEmptyComponent={
          <Body muted>No matches yet. When you and {profile?.role === 'coach' ? 'an athlete' : 'a program'} both swipe yes, the chat shows up here.</Body>
        }
        renderItem={({ item }) => (
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push({ pathname: '/chat/[id]', params: { id: item.match_id } })}
            style={[styles.row, { backgroundColor: c.surface, borderColor: c.line }]}>
            <View style={[styles.avatar, { backgroundColor: SportColor[item.sport] }]}>
              <Text style={styles.avatarText}>{titleOf(item).slice(0, 1)}</Text>
            </View>
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text style={{ color: c.text, fontWeight: '600', fontSize: 16 }} numberOfLines={1}>
                {titleOf(item)}
              </Text>
              <Text style={{ color: c.muted, fontSize: 13 }} numberOfLines={1}>
                {item.last_message ?? 'New match. Say hello.'}
              </Text>
            </View>
          </Pressable>
        )}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md, borderWidth: 1, borderRadius: 16, padding: Spacing.md },
  avatar: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  avatarText: { color: '#fff', fontSize: 18, fontWeight: '800' },
});
