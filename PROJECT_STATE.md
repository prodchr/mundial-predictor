# Mundial Predictor — Project State

DO NOT REDO AUTH.

Current working status:
- App deploys on Vercel.
- Supabase is connected.
- Login works.
- Admin tab appears.
- Admin email: prodchr96@gmail.com.
- Repo: prodchr/mundial-predictor.
- Main app file: app/page.tsx.
- Tables: profiles, matches, predictions, app_settings.
- Invite code: mundial2026hermanos.
- Scoring: exact score = 3, correct winner/draw = 1, wrong = 0.
- Predictions editable only by owner until kickoff.
- Other users see Submitted before kickoff, actual score after kickoff.

Important fixes already done:
- Vercel Framework Preset = Next.js.
- Output Directory issue fixed.
- app_settings RLS select policy fixed.
- profiles RLS select policy fixed.
- login works after fixing loadEverything/profile lookup.
- Do not switch to magic link.
- Keep password login.

Next tasks:
1. Clean up admin panel.
2. Improve predictions UI.
3. Add/edit fixtures properly.
4. Leaderboard polish.
5. Mobile UI polish.
