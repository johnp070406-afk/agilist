# Agilist

**A conversation aid for older people with dementia and the people who sit with them.**
Built for Kaplan Singapore's *AI FOR IMPACT 2026* hackathon.

**Try it:** https://agilist-care-110217617.netlify.app (phone or computer; sign up as Family or Caregiver)

## The problem

Many older people in Singapore with dementia fall back to Hokkien. Their caregivers, often migrant domestic workers,
speak English. They spend all day together and cannot really talk. Research and news from Singapore keep naming
language and dialect as a barrier in eldercare, and as a safety issue.

## The idea

The family's own old photos give them something to talk about.

1. **The family** uploads old photos from their phone. Claude writes background and gentle questions for the caregiver.
2. **The caregiver** starts a conversation. Agilist listens (real microphone, or typing), and **AI picks the matching
   photo by meaning while they talk**. The caregiver sees the photo card and one open question.
3. **Afterwards** Claude drafts a memory note from what was said. **The caregiver approves it** before anything is saved.
   Audio is never stored.
4. **The family decides** what the care team sees, photo by photo, and can pause all sharing.

## What is built

| | |
|---|---|
| Two roles | Family and Caregiver. Real sign-up only; no demo accounts. |
| Real microphone | Browser speech recognition on computer and phone; typing when a device cannot listen. A native speech bridge for the Expo phone app. |
| AI picks the photo | Claude matches what was said to the album by meaning, with a key-word fallback when AI is off. |
| Photos from the device | Shrunk on the phone to a small JPEG before saving. |
| Humans decide | Notes are saved only when the caregiver approves. AI drawings need the family's OK. |
| Consent enforced by the server | Per-photo sharing, and "pause sharing" which stops the server sending the care team anything. |
| His stories | Approved notes gathered by the memory they were about (text only; no recording, no printed book). |
| Appreciation both ways | The family sends the care team a thank-you with one-tap emoji; the caregiver sends a word back. |
| Simple screens | Large buttons, large text option, dark mode, stage-aware questions (early / middle / later). Nothing auto-advances on the screen shown to him. |
| Shared across phones | Supabase (Auth, Postgres with row-level security). Changes reach other phones within about 15 seconds. |

## How it is made

```
sembang-app/      the app: React 19 + TypeScript, bundled with esbuild (no framework CSS)
  src/            screens, state, sync, speech, AI calls
  supabase/       SQL for the database and access rules (run in order) + the Claude proxy Edge Function
sembang-mobile/   Expo app: shows the same screens in a WebView and adds native speech recognition
```

- **Backend:** Supabase. Tables `elders`, `memberships`, `photos`, `notes`; row-level security decides who sees what.
- **AI:** Claude (Haiku) through a Supabase **Edge Function** (`supabase/functions/claude`). The Anthropic key lives
  on the server as a secret and is never in the app. Only signed-in people can call it.
- **Hosting:** Netlify (static). The phone app bundles the same screens.

## Run it

```bash
cd sembang-app
npm install
npm run dev          # http://localhost:5173  (the microphone needs localhost or https)
npm run build        # production build into dist/
```

To use your own backend: create a Supabase project, run `supabase/schema.sql`, then `002_friends.sql` (kept because later files build on it; the app no longer offers a Friend role),
`003_pause_sharing.sql`, `004_elder_name.sql` in the SQL editor, deploy `supabase/functions/claude` and set the
`ANTHROPIC_API_KEY` secret, then put the project URL and publishable key in `sembang-app/src/config.ts`.
More detail is in `sembang-app/README.md`.

Phone app (Android APK, built in Expo's cloud): see `sembang-mobile/README.md`.

## Honest limits

- **Hokkien is not recognised** by browsers or phones. The microphone listens in English, Mandarin or Cantonese, and
  the caregiver can type or choose a picture. A real Hokkien model would need a server.
- Not tested with real families and caregivers yet.
- Screens say "he/him" in places; names are configurable, pronouns are not yet.
- Data is stored in Supabase's EU (Ireland) region. A real service for Singapore would use a Singapore region.
- Sign-up roles are chosen by the person signing up; a real service would use invitations.
- Photos are stored inside database rows (small JPEGs), fine for a pilot, not for a large album.
- Sync is by polling, not live.
