export type Role = 'athlete' | 'coach' | 'parent';
export type Sport = 'tennis' | 'soccer';

export type Profile = {
  id: string;
  role: Role;
  full_name: string;
  birth_date: string | null;
  country: string | null;
  plan: 'starter' | 'pro' | 'elite';
};

export type Program = {
  id: string;
  school_name: string;
  division: string;
  conference: string | null;
  state: string;
  sport: Sport;
  about: string | null;
  scholarship: string | null;
  min_gpa: number | null;
  min_utr: number | null;
  photo_url: string | null;
  cost_of_attendance: number | null;
  cost_low: number | null;
  cost_high: number | null;
  liked_you: boolean | null;
};

export type AthleteCard = {
  user_id: string;
  full_name: string;
  age: number;
  country: string | null;
  sport: Sport;
  grad_year: number;
  playing_position: string | null;
  utr: number | null;
  gpa: number | null;
  height_cm: number | null;
  bio: string | null;
  video_url: string | null;
  contact_unlocks_on: string | null;
};

export type MatchRow = {
  match_id: string;
  created_at: string;
  athlete_name: string;
  school_name: string;
  division: string;
  sport: Sport;
  last_message: string | null;
  last_at: string | null;
  can_send: boolean;
  contact_unlocks_on: string | null;
};

export type Message = {
  id: number;
  match_id: string;
  sender_id: string;
  body: string;
  created_at: string;
};
