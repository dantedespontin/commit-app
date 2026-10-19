import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';

import { Banner, Body, Button, Field, Screen, Title } from '@/components/ui';
import { Spacing, useColors } from '@/constants/theme';
import { friendlyError } from '@/lib/errors';
import { supabase } from '@/lib/supabase';

export default function SignIn() {
  const c = useColors();
  const [mode, setMode] = useState<'sign-in' | 'sign-up'>('sign-up');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  async function submit() {
    setBusy(true);
    setError(null);
    setNotice(null);
    const { data, error } =
      mode === 'sign-up'
        ? await supabase.auth.signUp({ email: email.trim(), password })
        : await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) setError(friendlyError(error));
    else if (mode === 'sign-up' && !data.session) setNotice('Check your inbox and tap the link to confirm your email, then sign in.');
  }

  return (
    <Screen>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.wrap} keyboardShouldPersistTaps="handled">
          <View style={{ gap: Spacing.sm }}>
            <View style={[styles.ball, { backgroundColor: c.ball }]} />
            <Title style={{ fontSize: 40 }}>Commit</Title>
            <Body muted>Get recruited by US college tennis and soccer programs, without paying an agent.</Body>
          </View>

          <View style={{ gap: Spacing.lg }}>
            <Field
              label="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoComplete="email"
              keyboardType="email-address"
              placeholder="you@example.com"
            />
            <Field
              label="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete={mode === 'sign-up' ? 'new-password' : 'current-password'}
              placeholder="At least 8 characters"
            />
            <Body muted style={{ fontSize: 13 }}>
              Coaches: use your school email address so we can verify you automatically.
            </Body>
            {error && <Banner tone="warn">{error}</Banner>}
            {notice && <Banner>{notice}</Banner>}
            <Button
              title={mode === 'sign-up' ? 'Create account' : 'Sign in'}
              onPress={submit}
              loading={busy}
              disabled={!email || password.length < 8}
            />
            <Button
              variant="secondary"
              title={mode === 'sign-up' ? 'I already have an account' : 'Create a new account'}
              onPress={() => setMode(mode === 'sign-up' ? 'sign-in' : 'sign-up')}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  wrap: { flexGrow: 1, justifyContent: 'center', padding: Spacing.xl, gap: Spacing.xxl, maxWidth: 480, width: '100%', alignSelf: 'center' },
  ball: { width: 18, height: 18, borderRadius: 9 },
});
