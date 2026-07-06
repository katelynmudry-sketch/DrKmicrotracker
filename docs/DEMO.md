# Demo — seed data and walkthrough script

For showing Dr. K (or anyone else) the app end to end without waiting on real
patient history or spending on live AI calls. See `docs/PLAN.md` Phase 4d.

## Turning it on

1. Set `DEMO_MODE=true` in the environment (Vercel project settings, or your
   local `.env`). Leave it unset (or `false`) in the real production
   deployment patients use — the seed/clear actions refuse to run otherwise,
   even if someone finds the buttons.
2. Sign in as a doctor and go to the **Patients** page. A **Demo data** card
   appears with **Seed demo data** and **Clear demo data** buttons.
3. **Seed demo data** creates three demo patients, ~30 pre-written readings
   across three weeks, and one demo rubric — all in well under a second,
   with zero Anthropic API calls (the readings are hand-written, not
   AI-generated; see `src/lib/demo-data.ts`). Every seeded document is tagged
   `demo: true`.
4. **Clear demo data** removes everything tagged `demo: true` — patients,
   meals, and the rubric — in one click. Safe to run any time; it never
   touches real patient data.

Re-seeding is safe to run more than once (patient IDs are fixed, so it
overwrites rather than duplicating) — meal day offsets are relative to "now"
at seed time, so the streak and "this week" numbers always look current.

## The three patients

- **Jordan — the iron arc.** Iron reads light for the first week and a
  half, gets the vitamin-C-pairing tip (a squeeze of lemon on the spinach,
  spacing coffee away from iron-rich meals), and closes out the third week
  consistently strong. Best patient to open **Patterns** on and point at the
  iron row and the "Try something new" card early on, then flip to a later
  reading to show the pairing tip landing.
- **Morgan — the plant-variety arc.** Starts on a handful of repeated
  staples (toast, a plain sandwich, plain pasta), then the same meals
  gradually pick up more plants and colour — the "12 different plants this
  week" stat tile and the colour-diversity tile visibly climb across the
  three weeks.
- **Sam — steady protocol fit.** An anti-inflammatory/fertility-care
  patient who's consistently aligned with the demo rubric, omega-3 forward
  (chia, flax, salmon, sardines) at nearly every reading. Good patient to
  show the doctor's per-patient **Rubrics** / protocol-fit story on, since
  almost every reading already says "aligned."

## Walkthrough script (~10 minutes)

1. **Landing page** — the ethos in one screen: no calories, no grades, "a
   little love note from your body."
2. **Sign in as the doctor**, go to **Patients**, click **Seed demo data**.
3. Open **Jordan** → **Meals** tab. Click through two or three early readings
   (light iron, the lemon tip appearing in `absorption_notes`), then a late
   reading (iron strong, protocol fit "Aligned"). Point out there's no
   number anywhere — just "Strong source" / "A little light."
4. Switch to the **Patterns** tab on Jordan. Show the micronutrient coverage
   list, the protein/fiber rhythm charts, and (if any nutrient is still a
   gap) the **Try something new** card — food names and a one-line reason,
   never a percentage.
5. Open **Morgan** → **Patterns** tab. Point at the plant-variety and colour
   stat tiles — climbing week over week from the same handful of staples.
6. Open **Sam** → **Meals** tab. Show a couple of "Aligned" readings and the
   absorption notes tied to specific pairings (chia + walnuts, sardines +
   calcium). Open **Rubrics** and show the seeded protocol text, then click
   **Re-analyze with current rubric** on one of Sam's meals to show it's a
   live operation, not a fixture.
7. Back on **Rubrics**, upload any PDF and click **Extract from PDF** to show
   the auto-extraction landing in the summary box before saving.
8. **Clear demo data** to leave the account clean for real patients.

## What's real vs. seeded

Everything seeded is tagged `demo: true` end to end (patients, meals, the
rubric) so it's trivially distinguishable in Firestore and fully reversible.
Nothing in the seed path touches the Anthropic API — the readings are
authored text, not model output — so demoing costs nothing and never
produces a "pending"/"analyzing" state. Re-analyzing a seeded meal (step 6
above) *does* call the real model, since that's the one action in the demo
meant to prove the live pipeline still works.
