import { router, useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { AthleteProfileCard, ProgramCard } from '@/components/profile-card';
import { SwipeDeck } from '@/components/swipe-deck';
import { Banner, Body, Screen, Title } from '@/components/ui';
import { Spacing, useColors } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import { friendlyError } from '@/lib/errors';
import { supabase } from '@/lib/supabase';
import type { AthleteCard, Program } from '@/lib/types';

type Item = { kind: 'program'; program: Program } | { kind: 'athlete'; athlete: AthleteCard };

export default function Discover() {
  const c = useColors();
  const { profile } = useAuth();
  const [items, setItems] = useState<Item[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [matchId, setMatchId] = useState<string | null>(null);
  const [matchName, setMatchName] = useState('');

  const load = useCallback(async () => {
    setError(null);
    if (profile?.role === 'athlete') {
      const { data, error } = await supabase.rpc('get_program_deck', { p_limit: 20 });
      if (error) setError(friendlyError(error));
      setItems(((data as Program[]) ?? []).map((program) => ({ kind: 'program', program })));
    } else if (profile?.role === 'coach') {
      const { data, error } = await supabase.rpc('get_athlete_deck', { p_limit: 20 });
      if (error) setError(friendlyError(error));
      setItems(((data as AthleteCard[]) ?? []).map((athlete) => ({ kind: 'athlete', athlete })));
    }
  }, [profile?.role]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  async function swipe(item: Item, liked: boolean) {
    setItems((prev) => prev.slice(1));
    const target = item.kind === 'program' ? item.program.id : item.athlete.user_id;
    const { data, error } = await supabase.rpc('swipe', { p_target: target, p_liked: liked });
    if (error) {
      setError(friendlyError(error));
      setItems((prev) => [item, ...prev]);
      return;
    }
    if (data) {
      setMatchName(item.kind === 'program' ? item.program.school_name : item.athlete.full_name);
      setMatchId(data as string);
    }
    if (items.length <= 3) load();
  }

  if (profile?.role === 'parent') {
    return (
      <Screen style={{ padding: Spacing.xl, gap: Spacing.md }}>
        <Title>Discover</Title>
        <Body muted>
          Athletes and coaches swipe here. As a parent, you can read your child's conversations on the Matches tab.
        </Body>
      </Screen>
    );
  }

  return (
    <Screen>
      <View style={styles.header}>
        <Title>Discover</Title>
        <Body muted style={{ fontSize: 13 }}>
          {profile?.role === 'coach'
            ? 'Free for coaches'
            : profile?.plan === 'free'
              ? '3 swipes a day'
              : profile?.plan === 'starter'
                ? '25 swipes a day'
                : 'Unlimited swipes'}
        </Body>
      </View>
      {error && (
        <View style={{ paddingHorizontal: Spacing.lg, paddingBottom: Spacing.sm }}>
          <Banner tone="warn">{error}</Banner>
        </View>
      )}
      <SwipeDeck
        items={items}
        keyOf={(i) => (i.kind === 'program' ? i.program.id : i.athlete.user_id)}
        renderCard={(i) => (i.kind === 'program' ? <ProgramCard program={i.program} /> : <AthleteProfileCard athlete={i.athlete} />)}
        onSwipe={swipe}
        empty={
          <View style={{ alignItems: 'center', gap: Spacing.sm }}>
            <Title style={{ fontSize: 22 }}>You've seen everyone</Title>
            <Body muted style={{ textAlign: 'center' }}>New {profile?.role === 'coach' ? 'athletes' : 'programs'} show up here as they join.</Body>
          </View>
        }
      />

      <Modal visible={!!matchId} transparent animationType="fade" onRequestClose={() => setMatchId(null)}>
        <View style={styles.overlay}>
          <Text style={[styles.matchTitle, { color: c.ball }]}>It's a match</Text>
          <Text style={styles.matchText}>You and {matchName} both swiped yes.</Text>
          <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
            <Pressable
              accessibilityRole="button"
              style={[styles.matchButton, { backgroundColor: c.ball }]}
              onPress={() => {
                const id = matchId;
                setMatchId(null);
                router.push({ pathname: '/chat/[id]', params: { id: id! } });
              }}>
              <Text style={{ fontWeight: '600', color: '#14211b' }}>Send a message</Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              style={[styles.matchButton, { backgroundColor: 'rgba(255,255,255,0.15)' }]}
              onPress={() => setMatchId(null)}>
              <Text style={{ fontWeight: '600', color: '#fff' }}>Keep swiping</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md },
  overlay: { flex: 1, backgroundColor: 'rgba(8,20,14,0.85)', alignItems: 'center', justifyContent: 'center', gap: Spacing.lg, padding: Spacing.xl },
  matchTitle: { fontSize: 44, fontWeight: '800', letterSpacing: -0.8 },
  matchText: { color: '#fff', fontSize: 16, textAlign: 'center' },
  matchButton: { borderRadius: 12, paddingVertical: 12, paddingHorizontal: 16 },
});
