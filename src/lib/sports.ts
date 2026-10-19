import { SportColor } from '@/constants/theme';
import type { AthleteCard, Program, Sport } from '@/lib/types';

export const SPORTS: { id: Sport; label: string; line: string; color: string }[] = [
  { id: 'tennis', label: 'Tennis', line: 'Matched by UTR and GPA', color: SportColor.tennis },
  { id: 'soccer', label: 'Soccer', line: 'Matched by position and GPA', color: SportColor.soccer },
  { id: 'basketball', label: 'Basketball', line: 'Matched by position, height and GPA', color: SportColor.basketball },
  { id: 'golf', label: 'Golf', line: 'Matched by scoring average and GPA', color: SportColor.golf },
  { id: 'swimming', label: 'Swimming', line: 'Matched by event, best time and GPA', color: SportColor.swimming },
];

export const sportLabel = (sport: Sport) => SPORTS.find((s) => s.id === sport)?.label ?? sport;

// The one number each sport recruits on, as [value, label] for a card's first stat.
export function programKeyStat(p: Program): [string, string] {
  if (p.sport === 'tennis') return [p.min_utr ? `${p.min_utr}+` : 'Any', 'Min UTR'];
  if (p.sport === 'golf') return [p.max_scoring_avg ? `${p.max_scoring_avg} or less` : 'Any', 'Scoring avg'];
  return [p.division.replace('NCAA ', ''), 'Division'];
}

export function athleteKeyStat(a: AthleteCard): [string, string] {
  switch (a.sport) {
    case 'tennis':
      return [a.utr ? String(a.utr) : 'n/a', 'UTR'];
    case 'golf':
      return [a.scoring_avg ? String(a.scoring_avg) : 'n/a', 'Scoring avg'];
    case 'swimming':
      return [a.best_time && a.main_event ? `${a.best_time} ${a.main_event}` : 'n/a', 'Best time'];
    case 'basketball':
      return [a.points_per_game ? `${a.points_per_game} ppg` : (a.playing_position ?? 'n/a'), a.points_per_game ? 'Points' : 'Position'];
    default:
      return [a.playing_position ?? 'n/a', 'Position'];
  }
}

// Sports where the cost estimate uses a rating (UTR or scoring average) rather than a range.
export const ratedSport = (sport: Sport) => sport === 'tennis' || sport === 'golf';
