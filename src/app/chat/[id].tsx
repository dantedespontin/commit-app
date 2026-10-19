import { Stack, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Banner } from '@/components/ui';
import { Spacing, useColors } from '@/constants/theme';
import { useAuth } from '@/lib/auth';
import { formatDate, friendlyError } from '@/lib/errors';
import { supabase } from '@/lib/supabase';
import type { MatchRow, Message } from '@/lib/types';

export default function Chat() {
  const c = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session, profile } = useAuth();
  const me = session?.user.id;
  const [match, setMatch] = useState<MatchRow | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const list = useRef<FlatList<Message>>(null);

  useEffect(() => {
    supabase.rpc('my_matches').then(({ data }) => {
      setMatch(((data as MatchRow[]) ?? []).find((m) => m.match_id === id) ?? null);
    });
    supabase
      .from('messages')
      .select('*')
      .eq('match_id', id)
      .order('created_at')
      .then(({ data }) => setMessages((data as Message[]) ?? []));

    const channel = supabase
      .channel(`messages:${id}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `match_id=eq.${id}` }, (payload) => {
        const msg = payload.new as Message;
        setMessages((prev) => (prev.some((m) => m.id === msg.id) ? prev : [...prev, msg]));
      })
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [id]);

  async function send() {
    const body = draft.trim();
    if (!body) return;
    setError(null);
    setDraft('');
    const { error } = await supabase.rpc('send_message', { p_match: id, p_body: body });
    if (error) {
      setDraft(body);
      setError(friendlyError(error));
    }
  }

  async function report() {
    const { error } = await supabase.from('reports').insert({ match_id: id, reason: 'Reported from chat' });
    setError(error ? friendlyError(error) : 'Thanks. Our team will review this conversation.');
  }

  async function close() {
    await supabase.rpc('close_match', { p_match: id });
    router.back();
  }

  const title = !match ? '' : profile?.role === 'coach' ? match.athlete_name : match.school_name;
  const locked = profile?.role === 'coach' && match && !match.can_send && match.contact_unlocks_on;

  return (
    <SafeAreaView edges={['bottom']} style={{ flex: 1, backgroundColor: c.background }}>
      <Stack.Screen
        options={{
          title,
          headerRight: () => (
            <View style={{ flexDirection: 'row', gap: Spacing.md }}>
              <Pressable accessibilityRole="button" onPress={report}>
                <Text style={{ color: c.clay, fontWeight: '600' }}>Report</Text>
              </Pressable>
              {profile?.role !== 'parent' && (
                <Pressable accessibilityRole="button" onPress={close}>
                  <Text style={{ color: c.muted, fontWeight: '600' }}>Unmatch</Text>
                </Pressable>
              )}
            </View>
          ),
        }}
      />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={90} style={{ flex: 1 }}>
        <View style={{ padding: Spacing.md, gap: Spacing.sm }}>
          {profile?.role === 'athlete' && <Banner>If you're under 18, your linked parent can read this chat.</Banner>}
          {profile?.role === 'athlete' && profile.plan === 'free' && (
            <Banner tone="warn">You matched! Upgrade to Starter on your Profile tab to message this coach.</Banner>
          )}
          {profile?.role === 'parent' && <Banner>You can read this conversation. Only your child and the coach can write.</Banner>}
          {locked && (
            <Banner tone="warn">
              NCAA rules: you can message this athlete from {formatDate(match.contact_unlocks_on!)}. They can write to you first.
            </Banner>
          )}
          {error && <Banner tone="warn">{error}</Banner>}
        </View>
        <FlatList
          ref={list}
          data={messages}
          keyExtractor={(m) => String(m.id)}
          contentContainerStyle={{ padding: Spacing.md, gap: Spacing.xs }}
          onContentSizeChange={() => list.current?.scrollToEnd({ animated: true })}
          renderItem={({ item }) => {
            const mine = item.sender_id === me;
            return (
              <View
                style={[
                  styles.bubble,
                  mine
                    ? { alignSelf: 'flex-end', backgroundColor: c.text }
                    : { alignSelf: 'flex-start', backgroundColor: c.surface, borderColor: c.line, borderWidth: 1 },
                ]}>
                <Text style={{ color: mine ? c.background : c.text, fontSize: 15 }}>{item.body}</Text>
              </View>
            );
          }}
        />
        {match?.can_send && (
          <View style={styles.compose}>
            <TextInput
              value={draft}
              onChangeText={setDraft}
              placeholder="Write a message"
              placeholderTextColor={c.muted}
              onSubmitEditing={send}
              returnKeyType="send"
              maxLength={2000}
              style={[styles.input, { color: c.text, backgroundColor: c.surface, borderColor: c.line }]}
            />
            <Pressable accessibilityRole="button" onPress={send} style={[styles.send, { backgroundColor: c.pitch }]}>
              <Text style={{ color: '#fff', fontWeight: '600' }}>Send</Text>
            </Pressable>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  bubble: { maxWidth: '78%', borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8 },
  compose: { flexDirection: 'row', gap: Spacing.sm, padding: Spacing.md },
  input: { flex: 1, borderWidth: 1, borderRadius: 999, paddingHorizontal: 14, paddingVertical: 10, fontSize: 16 },
  send: { borderRadius: 999, paddingHorizontal: 18, justifyContent: 'center' },
});
