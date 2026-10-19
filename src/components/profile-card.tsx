import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { SportColor, Spacing, useColors } from '@/constants/theme';
import { formatDate } from '@/lib/errors';
import type { AthleteCard, Program, Sport } from '@/lib/types';

function Card({
  sport,
  initials,
  name,
  meta,
  stats,
  text,
  flag,
  photo,
}: {
  photo?: string | null;
  sport: Sport;
  initials: string;
  name: string;
  meta: string;
  stats: [string, string][];
  text: string | null;
  flag: { label: string; warn?: boolean } | null;
}) {
  const c = useColors();
  return (
    <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.line }]}>
      <View style={[styles.hero, { backgroundColor: SportColor[sport] }]}>
        {photo ? (
          <>
            <Image source={photo} contentFit="cover" style={StyleSheet.absoluteFill} accessibilityIgnoresInvertColors />
            <View style={[StyleSheet.absoluteFill, styles.shade]} />
          </>
        ) : null}
        <Text style={styles.tag}>{sport.toUpperCase()}</Text>
        <View style={styles.crest}>
          <Text style={styles.crestText}>{initials}</Text>
        </View>
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.meta}>{meta}</Text>
      </View>
      <View style={styles.body}>
        <View style={styles.stats}>
          {stats.map(([value, label]) => (
            <View key={label} style={[styles.stat, { backgroundColor: c.background }]}>
              <Text numberOfLines={2} style={[styles.statValue, { color: c.text }]}>{value}</Text>
              <Text style={[styles.statLabel, { color: c.muted }]}>{label}</Text>
            </View>
          ))}
        </View>
        {text ? <Text style={{ color: c.muted, fontSize: 15, lineHeight: 21 }}>{text}</Text> : null}
        {flag && (
          <Text
            style={[
              styles.flag,
              { color: flag.warn ? c.clay : c.pitch, backgroundColor: flag.warn ? c.claySoft : c.pitchSoft },
            ]}>
            {flag.label}
          </Text>
        )}
      </View>
    </View>
  );
}

const initialsOf = (name: string) =>
  name
    .split(/\s+/)
    .filter((w) => /^[A-ZÀ-Ý]/.test(w))
    .slice(0, 2)
    .map((w) => w[0])
    .join('');

export function ProgramCard({ program }: { program: Program }) {
  return (
    <Card
      sport={program.sport}
      initials={initialsOf(program.school_name)}
      name={program.school_name}
      photo={program.photo_url}
      meta={[program.division, program.conference, `${program.state}, USA`].filter(Boolean).join(' · ')}
      stats={[
        program.sport === 'tennis'
          ? [program.min_utr ? `${program.min_utr}+` : 'Any', 'Min UTR']
          : [program.division.replace('NCAA ', ''), 'Division'],
        [program.min_gpa ? program.min_gpa.toFixed(1) : 'None', 'Min GPA'],
        [program.conference ?? 'n/a', 'Conference'],
      ]}
      text={[program.about, program.scholarship].filter(Boolean).join(' · ')}
      flag={program.liked_you ? { label: 'This program swiped yes on you' } : null}
    />
  );
}

export function AthleteProfileCard({ athlete }: { athlete: AthleteCard }) {
  const locked = athlete.contact_unlocks_on && new Date(athlete.contact_unlocks_on) > new Date();
  return (
    <Card
      sport={athlete.sport}
      initials={initialsOf(athlete.full_name)}
      name={athlete.full_name}
      meta={[`${athlete.age}`, athlete.country].filter(Boolean).join(' · ')}
      stats={[
        athlete.sport === 'tennis'
          ? [athlete.utr ? String(athlete.utr) : 'n/a', 'UTR']
          : [athlete.playing_position ?? 'n/a', 'Position'],
        [String(athlete.grad_year), 'Class'],
        [athlete.gpa ? athlete.gpa.toFixed(1) : 'n/a', 'GPA'],
      ]}
      text={athlete.bio}
      flag={
        locked
          ? { label: `You can message from ${formatDate(athlete.contact_unlocks_on!)}`, warn: true }
          : { label: 'Open to contact' }
      }
    />
  );
}

const styles = StyleSheet.create({
  card: { flex: 1, borderRadius: 22, borderWidth: 1, overflow: 'hidden' },
  hero: { flexBasis: '44%', minHeight: 150, justifyContent: 'flex-end', padding: Spacing.lg },
  shade: { backgroundColor: 'rgba(0,0,0,0.35)' },
  tag: {
    position: 'absolute', top: 16, left: 16, color: '#fff', fontSize: 11, letterSpacing: 1,
    backgroundColor: 'rgba(0,0,0,0.25)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, overflow: 'hidden',
  },
  crest: {
    position: 'absolute', top: 16, right: 16, width: 54, height: 54, borderRadius: 14,
    backgroundColor: 'rgba(255,255,255,0.18)', borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.5)',
    alignItems: 'center', justifyContent: 'center',
  },
  crestText: { color: '#fff', fontSize: 20, fontWeight: '800' },
  name: { color: '#fff', fontSize: 26, fontWeight: '800', letterSpacing: -0.3 },
  meta: { color: '#fff', opacity: 0.9, fontSize: 13, marginTop: 4 },
  body: { padding: Spacing.lg, gap: Spacing.md },
  stats: { flexDirection: 'row', gap: Spacing.sm },
  stat: { flex: 1, borderRadius: 12, paddingVertical: 8, paddingHorizontal: 10 },
  statValue: { fontSize: 15, fontWeight: '600', fontVariant: ['tabular-nums'] },
  statLabel: { fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.5 },
  flag: { alignSelf: 'flex-start', fontSize: 12, fontWeight: '600', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, overflow: 'hidden' },
});
