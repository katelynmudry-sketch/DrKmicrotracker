# Nourish — The Dr. K Micronutrient Tracker: Ethos, Gaps, and Build Plan

## Part 1 — The ethos (what this app believes)

This is not a calorie counter. It is the opposite of one.

Dr. K's clinical philosophy (from the Notion "Guide to Eating More Plants" material and
TODO.md) translated into product principles that govern every screen, every AI prompt, and
every chart:

1. **No calories. Anywhere. Ever.** The app never counts, displays, stores, or charts
   calories. The story is what a meal *gives you* — micronutrients, protein, fiber, colour,
   variety — never what it "costs."
2. **No grades.** No 1–10 scores, no red/yellow/green verdicts, no "you failed today."
   Feedback is observational and warm: what this meal did well, what could make it work even
   harder, how it fits the doctor's plan. "Information, not failure" — Dr. K's own words
   about transition symptoms apply to every piece of feedback the app gives.
3. **Micronutrients are the plot.** The nutrients that actually matter in her practice:
   iron (+ the vitamin C pairing rule), B12, vitamin D, calcium (food-first — she rarely
   recommends supplements), omega-3/ALA, iodine, zinc, choline, magnesium, protein
   (grams matter — "protein at every meal is a hormonal intervention"), and fiber.
   And per her explicit position: **never flag selenium** as a gap for whole-food eaters.
4. **Absorption intelligence is the superpower.** Dr. K's clinical spine is full of
   pairing rules no consumer app knows: vitamin C with iron; coffee/tea an hour away from
   iron-rich meals; cooked brassicas for Hashimoto's patients; oxalates limiting spinach's
   calcium; phytates and soaking/sprouting for zinc; carminative spices with beans. The AI
   should surface these as gentle, specific tips on real meals — this is what makes the app
   unlike anything else.
5. **Cravings and gaps are data, not sins.** Low on iron this week? The app suggests
   pumpkin seeds and blackstrap molasses, it doesn't scold. Chocolate craving? That's
   often iron + magnesium talking — the app can say so.
6. **Plant-forward, not plant-policing.** More vegetables, more colours, more variety,
   more whole foods — celebrate additions ("3 colours on that plate!", "12 different plants
   this week"), never shame inclusions.
7. **The doctor's rubric is the lens, the doctor is the human in the loop.** Every analysis
   is read through Dr. K's uploaded guidelines; she reviews, corrects, and annotates. The AI
   assists her practice — it doesn't replace her judgment.

**Voice rule for all app copy and AI output:** warm, clinically grounded, zero judgment,
first-person-plural where natural — Katelyn's handout voice, not an app's nagging voice.

---

## Part 2 — What the app is (plain-English)

**Patients:** snap a photo of a meal (or describe it in words) → the AI reads it through
Dr. K's rubric → they see a nourishment breakdown: what the meal provided, which key
micronutrients it delivered, gentle food-first suggestions, absorption tips. Over time they
see their patterns: micronutrient coverage, plant variety, colour diversity, logging streaks.

**Dr. K:** uploads/edits her dietary rubrics (per program or per patient type) → opens any
patient → sees their meal history, their nutrient-coverage trends, adds visit notes, corrects
any AI estimate, re-runs analysis after a rubric change → eventually exports a summary for
the chart.

**The machinery (for the non-coder):**
- **Frontend** — the React web app (installable on a phone like a native app). All screens
  already exist structurally: landing, login, patient dashboard, meal detail, doctor pages.
- **Backend** — Firebase handles login, the database (Firestore), and photo storage. Small
  "server functions" bundled with the app do the privileged work and talk to the AI. The AI
  key never reaches anyone's browser (already true today).
- **AI engine** — Claude reads the photo/description plus the rubric and writes the entire
  analysis in a strict, typed format.

### Do we need a backup food database? **No — and doubly no given the ethos.**
The classic reason to bolt on a nutrient database (Canadian Nutrient File / USDA) is exact
milligram math on weighed portions. That's a huge sub-project (food matching, portion
modeling, database maintenance) that would make the app *worse* here, because:
- Nobody weighs food from a photo. Database precision on a guessed portion is fake precision.
- The product isn't milligram accounting — it's coverage, patterns, pairings, and the
  doctor's lens. Claude is genuinely good at "this meal is a strong iron source but the tea
  will inhibit it" — a database knows nothing about that.
- The doctor is the accuracy backstop: every value is editable, and her review loop catches
  anything odd (already built).
**Mitigations instead of a database:** the AI reports honest ranges/levels rather than
false-precision decimals, flags uncertainty explicitly, cites what it recognized in the
photo, and everything stays editable. If the pilot ever shows a real accuracy problem, a
lightweight spot-check against a reference table can be added later — it's an add-on, not a
foundation, so nothing we build now gets thrown away.

---

## Part 3 — Where the code is today, and where it fights the ethos

### Solid and keepable
Every screen exists and works: landing → auth (email + Google, plus a no-backend preview
mode) → patient dashboard (camera + text logging, history) → meal detail with editable
analysis → doctor patient list / per-patient review with notes / rubric upload. The AI
pipeline (photo → Claude → saved analysis) works end to end. PWA and Vercel build are
configured. This skeleton is genuinely good — the plan keeps essentially all of it.

### Ethos violations (found in code — must change)
- `analyzeMeal` (src/lib/meals.functions.ts) demands `calories_kcal` and
  `overall_score: number // 1-10` from the AI, and the UI (analysis-view.tsx) renders a
  calories tile and a "Rubric score X/10" badge. **Both concepts get removed entirely** —
  schema, prompt, UI, mock data.
- The prompt's "concerns" framing invites deficit-speak; it gets rewritten into Dr. K's
  observational voice, and her clinical positions (vitamin C rule, no selenium flags,
  cravings-as-data, carminatives, cooked brassicas for Hashimoto's) get baked into the
  system prompt as the permanent clinical spine, with her uploaded rubrics layered on top.

### Engineering loopholes (found in code review — must fix)
1. **No database security rules exist in the repo at all** (`firestore.rules`,
   `storage.rules`, `firebase.json` missing). The browser talks to the database directly, so
   rules are the only thing stopping patient A from reading patient B's meals — and the
   user's role is currently written from the browser, so nothing stops self-promotion to
   "doctor" (src/hooks/use-auth.ts).
2. **Stuck meals:** the AI call is fire-and-forget from the browser; close the tab
   mid-analysis and the meal spins "analyzing…" forever. No retry, no timeout; a malformed
   AI reply can save junk as the analysis.
3. **First-visitor-wins doctor:** whoever opens /doctor first becomes THE doctor.
4. **Untyped analysis** (`unknown` end-to-end) → known TypeScript error, `as any` casts.
5. `getMealPhotoUrl` lets any doctor sign a link to ANY stored file (unscoped).
6. Rubric upload doesn't read the PDF — the doctor must hand-paste a summary.
7. Polish debt: PWA install colours are dark against a light app; stale copy about a
   nonexistent "Doctor Setup page"; dead code (old `supabase/` backend, demo endpoints,
   duplicate lockfiles); no README/setup docs/CI/demo data.

---

## Part 4 — The full feature spectrum

Everything from TODO.md's backlog plus what the ethos demands, mapped to when it lands:

| Feature | Source | When |
|---|---|---|
| Photo + text meal logging with AI analysis | built | keep |
| Editable analysis (patient/doctor corrections, audit trail) | built | keep |
| Rubric upload + active-rubric injection | built | keep |
| Doctor patient review + notes | built | keep |
| Preview/mock mode (UI review with no backend) | built | keep |
| **Calorie-free, grade-free analysis in Dr. K's voice** | ethos | **Demo** |
| **Absorption/pairing tips on every meal** | ethos | **Demo** |
| Security rules + real role management | loophole | **Demo** |
| Reliable analysis (no stuck meals, retry) | loophole | **Demo** |
| Re-analyze after rubric change (doctor-triggered) | TODO #1 | **Demo** |
| Rubric PDF auto-extraction (no hand-pasting) | TODO gap | **Demo** |
| **Nourishment trends: micro coverage, plant variety ("30 plants/week"), colour diversity, streaks — counts, never grades** | TODO #4 + ethos | **Demo** |
| Demo seed data + demo walkthrough script | new | **Demo** |
| Meal-logging reminders/notifications | TODO #5 | Pilot |
| Edit history / versioning of corrections | TODO #2 | Pilot |
| Per-patient rubric assignment (multi-rubric) | TODO #6 | Pilot |
| Structured per-ingredient entry (optional alt to free text) | TODO #3 | Later |
| Doctor export/reporting (PDF/CSV for the chart) | TODO #7 | Later |
| Visual reskin (the "combo of UI examples" — owner decides) + dark mode wiring | pending owner | Later |
| Optional nutrient-table spot-check layer | Part 2 answer | Only if pilot shows need |

---

## Part 5 — The build plan (5 phases)

### Phase 1 — Foundations: accounts, cleanup, security *(≈2 sessions + ~1 hr owner)*

**1a. `docs/SETUP.md` + owner account creation** *(Claude writes; owner clicks through, ~45 min)*
Non-coder checklist: create the Firebase project (enable Authentication with
Email/Password + Google, Firestore in production mode, Storage) → copy the 6 web-app values
and 4 service-account values into `.env` (template exists in `.env.example`, with exact
multi-line-key paste instructions) → create an Anthropic API key at console.anthropic.com
(~$20 credit + a monthly spend cap) → publish the security rules from the repo (console
paste, or two CLI commands — doc shows both).

**1b. Cleanup** *(Claude, small)* — delete the dead `supabase/` folder, the unauthenticated
demo endpoints (`src/lib/api/example.functions.ts`), duplicate bun lockfiles, `.lovable/`;
fix the stale "Doctor Setup page" login copy; `npm run build` green.

**1c. Security rules — the most important single deliverable** *(Claude, medium)*
New `firebase.json` + `firestore.rules` + `storage.rules` + indexes, matched to every
existing client query:
- `users`: readable by self or doctor; **role never writable from a browser** (also remove
  the role write from `src/hooks/use-auth.ts`).
- `meals`: created only by their owner (fresh status, no analysis); readable by owner or
  doctor; analysis/status fields writable only by the server; doctor edits limited to notes.
- `rubrics`: doctor-only. Photos: uploadable only to your own folder (images only, <10MB);
  all viewing through short-lived signed links; scope `getMealPhotoUrl` so even doctors can
  only sign meal-photo paths.
- **Real doctor management**: delete first-visitor-wins `claimDoctorIfNone`; replace with a
  `DOCTOR_EMAILS` setting (a list the owner edits in Vercel — matching emails become doctors
  on sign-in via a small `ensureRole` server function) plus the existing-but-unused
  `promoteToDoctor` as an "add a doctor" card for later.
- Known risk: rules can silently break existing screens (doctor pages query broadly).
  Mitigation: enumerate every client query against the rules and test against real Firebase
  in dev before publishing.

### Phase 2 — The analysis engine, rebuilt on the ethos *(≈2 sessions; the heart of the project)*

One coherent rewrite of `analyzeMeal` (src/lib/meals.functions.ts) so we touch it once:

**2a. New analysis schema — calorie-free, grade-free** (new `src/lib/analysis.schema.ts`,
a typed zod schema shared by server, UI, and mock data). Proposed shape (final field names
tuned with you):
- `meal_name`, `identified_items` (what the AI recognized — honesty about what it saw),
  `estimated_portion`
- `building_blocks`: protein (g, because Dr. K prescribes protein targets), fiber (g),
  healthy fats (qualitative: sources spotted), complex vs refined carbs (qualitative)
  — **no calories field exists**
- `micronutrients`: per nutrient from Dr. K's list (iron, B12, D, calcium, ALA/omega-3,
  iodine, zinc, choline, magnesium…): level `rich | present | low | not_detected` + which
  food delivered it — honest tiers instead of fake-precision milligrams (still editable)
- `nourishment_highlights`: what this meal did well (always present — every meal gives
  something)
- `gentle_additions`: food-first suggestions ("a squeeze of lemon would unlock that
  lentil iron")
- `absorption_notes`: the pairing intelligence (Principle 4)
- `rubric_alignment`: qualitative notes on how the meal fits the doctor's uploaded plan —
  prose, not a number
- `uncertainty`: what the AI couldn't tell from the photo
- **Removed concepts: `calories_kcal`, `sugar_g`-as-shame-metric, `overall_score`,
  "concerns" framing.**

**2b. The Dr. K clinical spine in the prompt.** System prompt rewritten in her voice and
positions (vitamin C + iron rule, coffee/tea timing, never flag selenium, carminatives,
cooked brassicas only for Hashimoto's, cravings-as-data reframes, celebrate colours/variety),
with her uploaded rubrics layered on top per analysis. The spine lives in one editable file
(`src/lib/clinical-spine.ts`) so refining the voice never requires touching engine code.

**2c. Bulletproofing.** Server owns the status lifecycle (`pending → analyzing → analyzed |
failed` with a readable error — the browser never writes status, so no more stuck meals);
Claude's reply is schema-enforced via structured outputs (the AI must fill the typed form —
no junk saves), validated before saving, one corrective retry, sensible timeout; model name
becomes a setting (`ANTHROPIC_MODEL`, default claude-sonnet-4-6); "Retry analysis" button for
failed/stalled meals; doctor-facing **"Re-analyze with current rubric"** button (TODO #1)
riding the same path; record which rubric versions were used per analysis.

**2d. Typed end-to-end.** The shared schema kills the `unknown`/`as any` debt and the known
TypeScript error; add a `typecheck` script + minimal CI (lint, typecheck, build).

### Phase 3 — Ethos-aligned UI *(≈1–2 sessions; structural, survives your later reskin)*

- **AnalysisView v2** (src/components/app/analysis-view.tsx): nourishment highlights first,
  then micronutrient levels (tiers, with the delivering food named), building blocks,
  gentle additions, absorption notes, rubric alignment. No score badge, no calories tile.
  Inline editing keeps working against the new schema.
- **Copy pass everywhere** in Dr. K's voice: buttons, empty states, toasts, the landing page
  ("Nourish" stays; tagline and copy re-checked against the no-judgment rule).
- Mock/preview data rewritten to the new schema so the UI is reviewable without a backend.

### Phase 4 — Stand-out features *(≈2–3 sessions)*

**4a. Nourishment trends — the demo centerpiece** *(large)*
Counts and coverage, never grades. Pure aggregation helpers (`src/lib/trends.ts`) + one
reusable panel used on the patient dashboard and the doctor's per-patient page:
- **Micronutrient coverage map**: for each Dr. K nutrient, how often it showed up
  rich/present across the week — the "where are the gaps" picture at a glance, with
  food-first suggestions attached to gaps (never warnings)
- **Plant variety counter**: distinct plants this week (the "30 plants a week" story) —
  a delightful, judgment-free number that gamifies exactly the right behaviour
- **Eat-the-rainbow**: colour diversity per week
- **Protein & fiber rhythm**: grams per day vs the doctor's target as a gentle band, not a
  pass/fail line
- Logging streaks and meal counts; friendly empty state under 3 analyzed meals
- Doctor view adds: most-frequent absorption opportunities and rubric-alignment themes
Built on the already-vendored chart tooling (recharts + chart.tsx), theme tokens only
(reskin-proof), dataviz skill applied.

**4b. Demo seed data + script** *(medium)* — a doctor-only "Seed demo data" button (gated by
a `DEMO_MODE` setting): 3 realistic demo patients × ~15 meals across 3 weeks with
pre-written analyses telling visible stories in the trends (an iron gap closing after the
vitamin-C tip; plant variety climbing). Zero AI cost, one-click removal, plus `docs/DEMO.md`
— the exact walkthrough script for demo day.

**4c. Rubric PDF auto-extraction** *(small–medium)* — on upload, the server sends the PDF
itself to Claude and pre-fills the extracted dietary rules for the doctor to review/edit.
No more mandatory hand-pasting.

**4d. Polish** *(small)* — PWA install colours match the light theme; loading skeletons;
friendly empty states; icons verified.

### Phase 5 — Deploy + prove it *(1 session + ~30 min owner)*

- **Vercel deploy** (owner, guided): import the GitHub repo → paste the settings (the env
  values plus `DOCTOR_EMAILS`, `DEMO_MODE` while demoing) → deploy → **add the Vercel domain
  to Firebase's authorized sign-in domains** (Google login breaks without this — bolded in
  the doc). Claude raises the serverless timeout to 60s for photo analyses and pre-verifies
  the production build.
- **README.md**: what the app is, the ethos, architecture sketch, pointers to SETUP/DEMO docs.
- **Verification checklist** (live URL, phone + desktop):
  1. Fresh patient signup → dashboard; photo meal from the phone camera → analyzing →
     a warm, calorie-free, grade-free analysis with absorption tips.
  2. Text meal → same. Kill the tab mid-analysis → reopen → Retry recovers it.
  3. Break the AI key on purpose → readable "failed" + Retry works after fixing.
  4. Inline-edit values → persists. **Nothing anywhere shows a calorie or a score.**
  5. Patient can't open doctor pages, can't read another patient's meal, can't self-promote
     (rules test → denied).
  6. `DOCTOR_EMAILS` email signs in → is a doctor; reviews a patient, adds a note, uploads a
     rubric PDF (auto-extracted), re-analyzes a meal → alignment notes reflect the rubric.
  7. Trends populated for an active patient; graceful empty state for a new one.
  8. Seed demo data → charts tell their stories; clear → gone; buttons absent when the demo
     setting is off.
  9. Google sign-in works on the live domain; PWA installs with correct colours; camera
     works from the installed app.
  10. Build/typecheck/lint/CI clean; preview mode still works with no settings (safety net).

---

## Part 6 — Order of work

| # | Item | Who | Size |
|---|------|-----|------|
| 1 | SETUP.md; owner creates Firebase + Anthropic accounts | Claude + owner | 1h + 45m |
| 2 | Cleanup, copy fixes, build green | Claude | S |
| 3 | Security rules + role management (`DOCTOR_EMAILS`) | Claude | M |
| 4 | Owner publishes rules (paste or 2 commands) | owner | 10m |
| 5 | Analysis engine rebuild: ethos schema + Dr. K spine + reliability + typed | Claude | L |
| 6 | AnalysisView v2 + app-wide copy pass + mock data v2 | Claude | M |
| 7 | Nourishment trends (patient + doctor) | Claude | L |
| 8 | Demo seed data + DEMO.md | Claude | M |
| 9 | Rubric PDF auto-extraction | Claude | S–M |
| 10 | Re-analyze button + PWA colours + empty states | Claude | S |
| 11 | Vercel deploy, README, full verification | Claude + owner | M |

**Critical files:** `src/lib/meals.functions.ts` (engine rebuild), `src/lib/analysis.schema.ts`
+ `src/lib/clinical-spine.ts` (new — the ethos in code), `firestore.rules`/`storage.rules`/
`firebase.json` (new — security), `src/components/app/analysis-view.tsx` (UI v2),
`src/lib/trends.ts` + trends panel (new), `src/hooks/use-auth.ts` +
`src/lib/rubrics.functions.ts` (roles, PDF extraction), `src/lib/mock-data.ts` (schema v2).

**Two notes for you:**
- I reconstructed the ethos from your Notion (the Eating More Plants ebook material — clinical
  positions, voice, evidence spine) plus the repo's TODO.md. The app's own philosophy/feature
  doc appears to live in a claude.ai Project or chat, which this coding session cannot open
  (searched: repo + git history, GitHub PRs/issues, Notion, Gmail; Drive was blocked).
  Decision made: proceed with this plan as-is and fold that doc in whenever it surfaces —
  paste its text into the chat or drop it in the repo (e.g. docs/PHILOSOPHY.md) at any time.
- Exact wording of the new analysis sections (e.g. "nourishment highlights" vs "what this
  meal gave you") and the final micronutrient list are easy to tune as we build — the
  structure above is what gets locked in now.
