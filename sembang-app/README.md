# Agilist (web app)

The app itself: React 19 + TypeScript, bundled with esbuild, hand-written CSS. See the top-level
[README](../README.md) for what Agilist is and what it does. This file is for running and changing it.

Live: https://agilist-care-110217617.netlify.app

## Run it

```bash
npm install
npm run dev          # http://localhost:5173 (the microphone needs localhost or https)
npm run build        # production build into dist/
npm run typecheck
node scripts/pack.mjs   # after a build: dist/Agilist.html, one file
```

The app talks to the Supabase project set in `src/config.ts` (a project URL and a *publishable* key, both public by
design). To use your own project, change those two values, or paste them under "Connect shared sign-in" on the
sign-in screen.

## Backend (Supabase)

Run these in the SQL editor, in order:

| File | What it adds |
|---|---|
| `supabase/schema.sql` | Tables `elders`, `memberships`, `photos`, `notes`; row-level security; `create_elder`, `join_elder`, `my_elder` |
| `supabase/002_friends.sql` | The Friend role; a friend sees only their own photos and never the notes |
| `supabase/003_pause_sharing.sql` | "Pause sharing", enforced by the server |
| `supabase/004_elder_name.sql` | The name the family uses for him |

Sign-in uses Supabase Auth. In Authentication, turn off "Confirm email" if you do not want sign-up emails.
`supabase/clear_test_data.sql` is a three-step script to clear test albums; it deletes nothing unless you enable step 2.

**AI.** Claude is reached through the Edge Function in `supabase/functions/claude`. Deploy it (dashboard: Edge
Functions, new function named `claude`), set the secret `ANTHROPIC_API_KEY`, and turn off "Verify JWT with legacy
secret" in the function's settings (the function checks the caller's sign-in itself). Without it, the app still works:
pictures are found from key words only and the family sees general questions.

## Deploy

```bash
node scripts/build.mjs
npx netlify-cli deploy --dir dist --prod --no-build --site <your-site>
```

## Where things are

```
src/
  main.tsx, App.tsx          shell, header, routes
  Login.tsx, auth.ts         sign-up and sign-in (Supabase Auth over REST)
  config.ts                  Supabase URL and publishable key
  store.tsx                  app state (React reducer), kept on the device
  sync.ts, useSync.ts        shared album: pull, push, follow pause and name
  listen.ts                  speech recognition (browser or phone bridge) and picture matching
  realAI.ts                  every Claude call, through the Edge Function
  ai.ts                      what is shown for a photo when AI is off (general questions only)
  data.ts                    types, stages, moods, the small heritage set
  caregiver/                 home, live conversation, picture card, review, notes, album
  family/                    album, add photo, from home, stories, consent, friend home
  components/                picture frames, sheets, toggles, emoji row, icons
supabase/                    SQL and the Edge Function
scripts/                     build.mjs, pack.mjs
```

## Design rules worth knowing

- **Three kinds of picture never look alike.** A family photo is a print. A drawing has a dashed amber border and the
  label "A drawing, not a photograph" (photo-real AI images can plant false memories). A heritage picture has a slate
  frame and says it is not his own photo.
- **Questions are invitations, never tests.** "Tell me about..." rather than "What year...?". Questions follow the
  stage (early, middle, later) the family sets.
- **Built to dementia design guidance:** text at least 13px with a Large setting, 4.5:1 contrast, no all-caps or
  italics, left-aligned text, touch targets of 44px or more, no ambiguous icons, and nothing on the screen shown to him
  moves or advances on its own.
- **Privacy:** audio is never stored; a conversation runs only when the caregiver starts it and is always visible; a
  note is kept only with the caregiver's approval; the family decides what the care team sees.

## Known limits

See the top-level README. In short: Hokkien is not recognised, pronouns are not configurable yet, data is in the EU
region, roles are self-selected at sign-up, and nothing has been tested with real families and caregivers yet.
