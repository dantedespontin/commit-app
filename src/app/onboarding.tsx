import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';

import { Banner, Body, Button, Choice, Field, Screen, Title } from '@/components/ui';
import { Spacing } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import { friendlyError } from '@/lib/errors';
import { supabase } from '@/lib/supabase';
import type { Role, Sport } from '@/lib/types';

type ProgramOption = { id: string; school_name: string; sport: Sport };

const thisYear = new Date().getFullYear();
const GRAD_YEARS = Array.from({ length: 6 }, (_, i) => String(thisYear + i));

export default function Onboarding() {
  const { refreshProfile } = useAuth();
  const [role, setRole] = useState<Role | null>(null);
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [country, setCountry] = useState('');
  const [sport, setSport] = useState<Sport | null>(null);
  const [gradYear, setGradYear] = useState<string | null>(null);
  const [position, setPosition] = useState('');
  const [utr, setUtr] = useState('');
  const [gpa, setGpa] = useState('');
  const [bio, setBio] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [programs, setPrograms] = useState<ProgramOption[]>([]);
  const [programId, setProgramId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (role !== 'coach') return;
    supabase
      .from('programs')
      .select('id, school_name, sport')
      .order('school_name')
      .then(({ data }) => setPrograms((data as ProgramOption[]) ?? []));
  }, [role]);

  const validDate = /^\d{4}-\d{2}-\d{2}$/.test(birthDate);
  const ready =
    role !== null &&
    name.trim().length >= 2 &&
    (role !== 'athlete' || (validDate && sport && gradYear)) &&
    (role !== 'coach' || programId);

  async function finish() {
    setBusy(true);
    setError(null);
    const { error } = await supabase.rpc('complete_onboarding', {
      p_role: role,
      p_full_name: name.trim(),
      p_birth_date: validDate ? birthDate : null,
      p_country: country.trim() || null,
      p_athlete:
        role === 'athlete'
          ? { sport, grad_year: gradYear, playing_position: position, utr, gpa, bio, video_url: videoUrl }
          : null,
      p_coach: role === 'coach' ? { program_id: programId, title } : null,
    });
    setBusy(false);
    if (error) setError(friendlyError(error));
    else await refreshProfile();
  }

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.wrap} keyboardShouldPersistTaps="handled">
          <Title>Set up your profile</Title>
          <Choice
            label="I am"
            value={role}
            onChange={setRole}
            options={[
              { value: 'athlete', label: 'An athlete' },
              { value: 'coach', label: 'A college coach' },
              { value: 'parent', label: 'A parent' },
            ]}
          />
          <Field label="Full name" value={name} onChangeText={setName} autoComplete="name" />
          <Field label="Country" value={country} onChangeText={setCountry} placeholder="Spain" />

          {role === 'athlete' && (
            <>
              <Field
                label="Date of birth"
                value={birthDate}
                onChangeText={setBirthDate}
                placeholder="YYYY-MM-DD"
                keyboardType="numbers-and-punctuation"
              />
              <Body muted style={{ fontSize: 13 }}>
                Under 18? A parent links to your account before coaches can see you.
              </Body>
              <Choice
                label="Sport"
                value={sport}
                onChange={setSport}
                options={[
                  { value: 'tennis', label: 'Tennis' },
                  { value: 'soccer', label: 'Soccer' },
                ]}
              />
              <Choice
                label="High school graduation year"
                value={gradYear}
                onChange={setGradYear}
                options={GRAD_YEARS.map((y) => ({ value: y, label: y }))}
              />
              {sport === 'tennis' && (
                <Field label="UTR rating" value={utr} onChangeText={setUtr} keyboardType="decimal-pad" placeholder="10.5" />
              )}
              {sport === 'soccer' && (
                <Field label="Position" value={position} onChangeText={setPosition} placeholder="Left winger" />
              )}
              <Field label="GPA (US scale, optional)" value={gpa} onChangeText={setGpa} keyboardType="decimal-pad" placeholder="3.5" />
              <Field label="Highlight video link (optional)" value={videoUrl} onChangeText={setVideoUrl} autoCapitalize="none" placeholder="https://" />
              <Field label="About you" value={bio} onChangeText={setBio} multiline maxLength={500} style={{ minHeight: 90 }} />
            </>
          )}

          {role === 'coach' && (
            <>
              <Choice
                label="Your program"
                value={programId}
                onChange={setProgramId}
                options={programs.map((p) => ({ value: p.id, label: `${p.school_name} · ${p.sport}` }))}
              />
              <Field label="Title" value={title} onChangeText={setTitle} placeholder="Head coach" />
            </>
          )}

          {role === 'parent' && (
            <Body muted>After this step, enter the code from your child's Profile tab to link your accounts.</Body>
          )}

          {error && <Banner tone="warn">{error}</Banner>}
          <View style={{ paddingBottom: Spacing.xxl }}>
            <Button title="Continue" onPress={finish} loading={busy} disabled={!ready} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: { padding: Spacing.xl, gap: Spacing.lg, maxWidth: 560, width: '100%', alignSelf: 'center' },
});
