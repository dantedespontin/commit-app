import { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { Banner, Body, Button, Field, Screen, Title } from '@/components/ui';
import { Spacing, useColors } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import { friendlyError } from '@/lib/errors';
import { supabase } from '@/lib/supabase';

// Athlete plans. Payments aren't connected yet, so new athletes start on Starter.
const PLANS = [
  { id: 'starter', name: 'Starter', price: '€19.99', perks: '15 swipes a day, profile and 1 highlight video.' },
  { id: 'pro', name: 'Pro', price: '€29.99', perks: 'Unlimited swipes, 5 videos, and see which programs swiped yes on you.' },
  { id: 'elite', name: 'Elite', price: '€39.99', perks: 'Everything in Pro, plus priority in coach decks and a weekly profile boost.' },
] as const;

type AthleteRow = {
  user_id: string;
  sport: string;
  grad_year: number;
  parent_invite_code: string;
  parent_approved: boolean;
};

export default function Profile() {
  const c = useColors();
  const { profile } = useAuth();
  const [athlete, setAthlete] = useState<AthleteRow | null>(null);
  const [childCount, setChildCount] = useState(0);
  const [coach, setCoach] = useState<{ verified: boolean; school: string } | null>(null);
  const [code, setCode] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    if (profile.role === 'athlete') {
      supabase.from('athletes').select('*').eq('user_id', profile.id).maybeSingle()
        .then(({ data }) => setAthlete(data as AthleteRow | null));
    } else if (profile.role === 'parent') {
      supabase.from('athletes').select('user_id').eq('parent_id', profile.id)
        .then(({ data }) => setChildCount(data?.length ?? 0));
    } else {
      supabase.from('coaches').select('verified, programs(school_name)').eq('user_id', profile.id).maybeSingle()
        .then(({ data }) => {
          const row = data as { verified: boolean; programs: { school_name: string } | null } | null;
          if (row) setCoach({ verified: row.verified, school: row.programs?.school_name ?? '' });
        });
    }
  }, [profile]);

  async function linkChild() {
    const { data, error } = await supabase.rpc('link_child', { p_code: code });
    if (error) setMessage(friendlyError(error));
    else {
      setMessage(`You're now linked to ${data}. Their profile is visible to coaches.`);
      setChildCount((n) => n + 1);
      setCode('');
    }
  }

  if (!profile) return null;

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.wrap}>
        <Title>{profile.full_name}</Title>
        <Body muted>
          {profile.role === 'athlete' ? 'Athlete' : profile.role === 'coach' ? 'Coach' : 'Parent'}
          {profile.country ? ` · ${profile.country}` : ''}
        </Body>

        {athlete && (
          <View style={[styles.box, { backgroundColor: c.surface, borderColor: c.line }]}>
            <Text style={[styles.boxTitle, { color: c.text }]}>Parent link</Text>
            {athlete.parent_approved ? (
              <Body muted>A parent is linked. Coaches can see your profile.</Body>
            ) : (
              <>
                <Body muted>Share this code with a parent. They enter it in their own Commit account.</Body>
                <Text selectable style={[styles.code, { color: c.pitch }]}>{athlete.parent_invite_code}</Text>
                <Body muted style={{ fontSize: 13 }}>If you're 18 or older, you can skip this.</Body>
              </>
            )}
          </View>
        )}

        {profile.role === 'parent' && (
          <View style={[styles.box, { backgroundColor: c.surface, borderColor: c.line }]}>
            <Text style={[styles.boxTitle, { color: c.text }]}>Link your child</Text>
            <Body muted>
              {childCount ? `Linked athletes: ${childCount}. Add another with their code.` : "Enter the code shown on your child's Profile tab."}
            </Body>
            <Field label="Code" value={code} onChangeText={setCode} autoCapitalize="characters" placeholder="AB12CD34" />
            <Button title="Link account" onPress={linkChild} disabled={code.trim().length < 6} />
          </View>
        )}

        {coach && (
          <View style={[styles.box, { backgroundColor: c.surface, borderColor: c.line }]}>
            <Text style={[styles.boxTitle, { color: c.text }]}>{coach.school}</Text>
            <Body muted>
              {coach.verified
                ? 'Verified. Coach access is free.'
                : "Waiting for verification. We verify coaches who sign up with their school email; otherwise our team checks by hand."}
            </Body>
          </View>
        )}

        {profile.role === 'athlete' &&
          PLANS.map((plan) => {
            const current = plan.id === profile.plan;
            return (
              <View key={plan.id} style={[styles.box, { backgroundColor: c.surface, borderColor: current ? c.pitch : c.line }]}>
                <View style={styles.planHead}>
                  <Text style={[styles.boxTitle, { color: c.text }]}>{plan.name}</Text>
                  <Text style={[styles.boxTitle, { color: c.text }]}>
                    {plan.price}
                    <Text style={{ color: c.muted, fontSize: 13, fontWeight: '500' }}> a month</Text>
                  </Text>
                </View>
                <Body muted>{plan.perks}</Body>
                {current && <Text style={{ color: c.pitch, fontWeight: '700', fontSize: 13 }}>Your plan</Text>}
              </View>
            );
          })}

        {message && <Banner>{message}</Banner>}
        <Button variant="secondary" title="Sign out" onPress={() => supabase.auth.signOut()} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: Spacing.lg, gap: Spacing.md, maxWidth: 560, width: '100%', alignSelf: 'center' },
  box: { borderWidth: 1, borderRadius: 18, padding: Spacing.lg, gap: Spacing.sm },
  boxTitle: { fontSize: 17, fontWeight: '700' },
  planHead: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  code: { fontSize: 28, fontWeight: '800', letterSpacing: 4 },
});
