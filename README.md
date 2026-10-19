# Commit

A swipe-to-match recruiting app. Athletes swipe on US college tennis and soccer programs, verified coaches swipe on athletes, and a mutual yes opens a chat.

## What's in this version

- Email sign-up and sign-in, then a profile setup for athletes, coaches and parents
- Swipe decks for athletes (programs) and coaches (athletes), with a match screen
- Live chat between matched athletes and coaches
- Safety and recruiting rules, enforced in the database:
  - Athletes must be 13 or older
  - Athletes under 18 stay hidden from coaches until a parent links to their account with a code
  - Linked parents can read their child's chats
  - Coaches are verified automatically when they sign up with a confirmed email on their school's domain
  - NCAA Division I and II coaches can't send messages before the contact date for the athlete's class (June 15 after sophomore year); athletes can always write first. The dates live in the `contact_rules` table and need a compliance lawyer's review before launch.
  - Free athletes get 15 swipes a day; coaches are free
- Report and unmatch on every chat

Not built yet: payments (Pro plan), video uploads, push notifications and an admin console for verification and reports.

## Run it

1. Create a free project at [supabase.com](https://supabase.com). Pick an EU region, since athletes are in Europe.
2. In the Supabase SQL editor, run `supabase/migrations/20261019000000_init.sql`, then `supabase/seed.sql` for sample programs.
3. Copy `.env.example` to `.env` and fill in the project URL and anon key from Project Settings > API.
4. Install and start:

   ```bash
   npm install
   npx expo start
   ```

5. Scan the QR code with the Expo Go app on your phone, or press `w` to open it in a browser.

## Code map

- `src/app/` screens (Expo Router): sign-in, onboarding, the Discover, Matches and Profile tabs, and chat
- `src/components/` the swipe deck, profile cards and shared UI
- `src/lib/` Supabase client, auth state, types and error messages
- `supabase/migrations/` tables, row-level security and the functions the app calls (`swipe`, `send_message`, `my_matches`, ...)
