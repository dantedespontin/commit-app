// Turns error codes raised by the database functions into messages people can act on.
const MESSAGES: Record<string, string> = {
  too_young: 'You need to be at least 13 to join Commit.',
  daily_limit: "You've used today's 15 swipes on Starter. Come back tomorrow, or upgrade to Pro for unlimited swipes.",
  parent_approval_required: 'A parent needs to link to your account first. Share the code on your Profile tab with them.',
  coach_not_verified: "Your coach account isn't verified yet. Sign up with your school email address, or wait for our team to check it.",
  athlete_not_available: 'This athlete is no longer available.',
  contact_locked: "NCAA rules don't let you message this athlete yet. They can still write to you first.",
  match_closed: 'This conversation has been closed.',
  invalid_code: "That code doesn't match any athlete, or a parent is already linked.",
  unknown_program: 'Pick your program from the list.',
};

export function friendlyError(error: unknown): string {
  const message = error instanceof Error ? error.message : (error as { message?: string })?.message ?? '';
  for (const code of Object.keys(MESSAGES)) {
    if (message.includes(code)) return MESSAGES[code];
  }
  return message || 'Something went wrong. Try again.';
}

export function formatDate(iso: string): string {
  return new Date(iso + 'T12:00:00').toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}
