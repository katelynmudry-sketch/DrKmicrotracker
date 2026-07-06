# Dr. K's Kitchen — Ethos, Design System, and Build Plan

*(Supersedes the earlier "Nourish" plan. Decisions confirmed by Katelyn: the app is
**Dr. K's Kitchen**; visual direction is **Garden Warmth + Botanical Clinic — no Sunny
Kitchen elements**; analysis wording is the **Blend** system below; nutrient-gap
suggestions ship in the demo, the rest of the pantry suite right after.)*

## Part 1 — The ethos (what this app believes)

This is not a calorie counter. It is the opposite of one.

Dr. K's clinical philosophy (Notion "Eating More Plants" material + the three design
drafts + TODO.md) as product principles governing every screen, prompt, and chart:

1. **No calories. Anywhere. Ever.** Never counted, displayed, stored, or charted. The
   story is what a meal *gives you* — micronutrients, protein, fiber, colour, variety.
2. **No grades.** No 1–10 scores, no red/yellow/green verdicts. The drafts say it best:
   *"without scores designed to shame"*, *"no spreadsheets, no guilt, no clinical
   coldness — just gentle clarity between visits."* Protocol fit is expressed
   qualitatively ("Aligned"), never numerically.
3. **Micronutrients are the plot.** Iron (+ the vitamin C pairing rule), B12, vitamin D,
   calcium (food-first — she rarely recommends supplements), omega-3/ALA, iodine, zinc,
   choline, magnesium, protein (grams matter — "protein at every meal is a hormonal
   intervention"), fiber. Per her explicit position: **never flag selenium**.
4. **Absorption intelligence is the superpower.** Vitamin C with iron; coffee/tea an hour
   away from iron-rich meals; cooked brassicas for Hashimoto's; oxalates vs spinach
   calcium; phytates and soaking/sprouting for zinc; carminative spices with beans.
   Surfaced as gentle, specific tips on real meals — no other app does this.
5. **Cravings and gaps are data, not sins.** Low iron week → suggest pumpkin seeds and
   blackstrap molasses; chocolate craving → that's often iron + magnesium talking.
6. **Plant-forward, not plant-policing.** Celebrate additions ("beautiful colours on
   that plate", "12 different plants this week"), never shame inclusions.
7. **The doctor's rubric is the lens; the doctor is the human in the loop.** Every
   reading is scored against *her* written protocol — "Scored to YOUR plan, not a
   generic database" — and she reviews, corrects, annotates, and re-runs.

**Voice rule:** warm, clinically grounded, zero judgment — "like a note from your ND."
One warm opening line (the *"love note from your body"* moment), then quiet clear detail.
Emoji sparing. First-person-plural where natural.

---

## Part 2 — Name, design system, and vocabulary (now decided)

### Name: **Dr. K's Kitchen**
Replaces "Nourish" everywhere: app header/logo, PWA install name, login + landing copy,
manifest, README. Practitioner line: Dr. Katelyn Mudry, ND — Kimberley & Cranbrook, BC.

### Design system: Garden Warmth skin × Botanical Clinic structure — **no Sunny Kitchen**
Source of truth: `design-drafts/1-garden-warmth.html` and `3-botanical-clinic.html` on
branch `claude/drkmudry-html-drafts-2ssq76` (bring the drafts folder onto the working
branch for reference).
- **Palette (from Garden Warmth):** cream background `#fbf6ec` / deep cream `#f3e9d4`,
  terracotta primary `#d97a52` (deep `#b85f3a`), sage `#7c9473` (deep `#56684c`),
  ink `#3a352b`, soft ink `#6b6557`, hairline `#e3d8c2`. Mapped into the existing
  Tailwind token system in `src/styles.css` (convert to oklch, keep semantic token names
  so every component inherits the reskin).
- **Type:** Fraunces (display, serif, italic accents) + Nunito (body) — self-hosted
  (PWA must work offline; no Google Fonts CDN at runtime).
- **Shape:** generous radii (cards ~22px, pill buttons), warm cards, dashed dividers used
  sparingly — but adopt Botanical Clinic's *restraint*: thin hairlines, whitespace,
  no blobs/rotations/confetti, no achievement badges, minimal emoji.
- **Signature components (from the drafts):**
  - **Meal card** = photo hero + attribute pills ("Iron-rich", "Anti-inflammatory",
    "Fibre +12g") + dashed-top note in Dr. K's voice (Garden Warmth hero card).
  - **Reading rows** = label → qualitative value: "Iron → Strong source",
    "Inflammatory load → Low", "Protocol fit → Aligned" (Botanical Clinic report panel).
  - **Protocol tag chips**: Fertility care · Anti-inflammatory · Gut healing · Hormone
    support (Botanical Clinic).
  - Landing page rebuilt from the drafts' shared skeleton, reusing their best verbatim
    copy (below).

### Vocabulary system (the Blend — used by UI, AI prompt, and all docs)
| Concept | The word |
|---|---|
| The analysis | **a reading** |
| What it contains | **What this meal offered** |
| Suggestions | **Worth trying** |
| Doctor's notes | **Notes from Dr. K** |
| Rubric fit | **Protocol fit: Aligned / Getting there / Worth a look** (qualitative — final tier labels tuned with Katelyn) |
| Micronutrient levels | **Strong source / Present / A little light** (tiers, not milligrams) |
| Uncertainty | "We couldn't quite see…" |
| Trends page | **Patterns** |
| Gap suggestions | "In your pantry" / "Try something new" (from the pantry branch — already perfectly phrased) |

**Microcopy bank (preserve verbatim from the drafts):** "Snap your meal, get a little
love note from your body." · "This bowl is doing exactly what we hoped for your energy
this week — nice work!" · "No spreadsheets, no guilt, no clinical coldness — just gentle
clarity between visits." · "See trends over weeks, not just one snapshot — without
judgment, just information." · "Without scores designed to shame." · "Three steps, zero
stress." · "Considered, not clinical." · "Food is medicine — but only when you can
actually see what it's doing for you." — Dr. Katelyn Mudry, ND

### Do we need a backup food database? **Not for readings — but yes to a small food catalog.**
- **No database for meal analysis.** Claude remains the reading engine; database math on a
  photo-guessed portion is fake precision, and the product is coverage/patterns/pairings.
  The doctor's editable review loop is the accuracy backstop.
- **Yes to the whole-foods catalog the pantry branch already built:** a trimmed Canadian
  Nutrient File (CNF) list used *only* to rank suggestion foods ("worth adding for
  iron: pumpkin seeds…") and match pantry items — never to grade meals. Port it off the
  branch's Supabase into a **bundled static JSON** (whole foods only, ~8 tracked
  nutrients), killing the second backend. Its fuzzy-matching and ranking code is reusable
  as-is.

---

## Part 3 — What exists today (verified across all 6 branches)

### On `main` (working)
Landing → auth (email + Google; no-backend preview mode) → patient dashboard (photo +
describe-in-text logging, history) → meal detail with editable analysis → doctor patient
list / per-patient review + notes / rubric upload. Server fns for analysis, edits, signed
photo URLs, rubrics. PWA + Vercel build configured.

### On other branches (discovered, feeding this plan)
- `claude/drkmudry-html-drafts-2ssq76` — the three Dr. K's Kitchen design drafts
  (now the design source of truth).
- `claude/pantry-inventory-nutrients-xdqaru` — complete pantry suite: pantry inventory
  (add by form / photo scan / **voice** via browser speech + Claude parsing), grocery
  list with reasons, **nutrient-gap suggestions** (pure-function gap math + two-tier
  pantry-first suggestions), CNF food reference (on Supabase — must be ported), analog
  CNF meal logging. Forked before main's latest work → **port by re-implementing on
  main, never git-merge** (it would revert main's editable analysis + text entry).
- `claude/extra-prd-prioritization-o6npca`, `claude/new-app-loveable-review-qlf9pd` —
  no unique commits; ignore.

### Ethos violations in current code (must change)
- Analysis schema demands `calories_kcal` and `overall_score` (1–10); UI shows a calories
  tile and "Rubric score X/10" badge (`src/lib/meals.functions.ts`,
  `src/components/app/analysis-view.tsx`). Remove both concepts everywhere.
- "Concerns" framing → rewritten to observational Dr. K voice; her clinical positions
  become the permanent prompt spine.
- App name/branding says "Nourish" with a generic clinic-minimal theme → becomes
  Dr. K's Kitchen with the design system above.

### Engineering loopholes (must fix)
1. **No Firestore/Storage security rules in the repo at all** — browser reads/writes the
   DB directly; the user's role is client-writable (self-promotion to doctor possible).
2. **Stuck meals** — client fire-and-forget AI call; closed tab = stuck "analyzing"; no
   retry/timeout; malformed reply can save junk.
3. **First-visitor-wins doctor** (`claimDoctorIfNone`).
4. Untyped analysis (`unknown` end-to-end; known tsc error, `as any` casts).
5. `getMealPhotoUrl` lets a doctor sign ANY storage path.
6. Rubric PDF isn't read — doctor hand-pastes a summary.
7. Dead code (`supabase/` dir on main, demo endpoints, duplicate lockfiles), PWA colours
   mismatch, no README/CI/docs/seed data.

---

## Part 4 — Feature spectrum → when it lands

| Feature | Source | When |
|---|---|---|
| Photo + text meal logging → AI reading | built (main) | keep |
| Editable reading (patient/doctor corrections, audit trail) | built (main) | keep |
| Rubric upload + injection | built (main) | keep |
| Doctor review + notes | built (main) | keep |
| Preview/mock mode | built (main) | keep |
| **Dr. K's Kitchen rebrand + design system + landing page** | drafts | **Demo** |
| **Calorie-free, grade-free reading in the Blend vocabulary** | ethos | **Demo** |
| **Absorption/pairing tips on every reading** | ethos | **Demo** |
| Security rules + real role management | loophole | **Demo** |
| Reliable analysis (server status, retry, schema-enforced) | loophole | **Demo** |
| Re-analyze with current rubric (doctor button) | TODO #1 | **Demo** |
| Rubric PDF auto-extraction | TODO gap | **Demo** |
| **Patterns page: micro coverage, plant variety, colour diversity, streaks — counts, never grades** | TODO #4 + ethos | **Demo** |
| **Nutrient-gap suggestions ("In your pantry" / "Try something new")** | pantry branch | **Demo** (CNF→bundled JSON) |
| Demo seed data + walkthrough script | new | **Demo** |
| **Pantry inventory (form / photo scan / voice) + grocery list** | pantry branch | **Post-demo #1** (port ≈2 sessions) |
| Voice meal describe (reuse voice-capture on the meal flow) | extension | Post-demo |
| Meal reminders/notifications | TODO #5 | Pilot |
| Edit history / versioning | TODO #2 | Pilot |
| Per-patient rubric assignment | TODO #6 | Pilot |
| Analog CNF meal logging (third tab) | pantry branch | Later (only if Dr. K wants gram-precise entry) |
| Doctor export/reporting (PDF/CSV) | TODO #7 | Later |
| Dark mode wiring | tokens exist | Later |

---

## Part 5 — Build phases

### Phase 1 — Foundations *(≈2 sessions + ~1 hr owner)* — **shipped**
- [x] **1a. `docs/SETUP.md` + owner accounts** (~45 min owner): Firebase project (Auth
  email+Google, Firestore production mode, Storage), copy 6 web + 4 server values into
  `.env` (exact multi-line key instructions), Anthropic key (~$20 + spend cap), publish
  rules from repo (console paste or 2 CLI commands — doc shows both). *Doc written;
  owner still needs to actually create the Firebase/Anthropic accounts and publish
  the rules (step 5 below) before the app is live.*
- [x] **1b. Cleanup**: delete `supabase/` (main), `src/lib/api/example.functions.ts`, bun
  lockfiles, `.lovable/`; fix stale "Doctor Setup page" copy; build green. Cherry-pick
  `design-drafts/` onto the working branch for reference.
- [x] **1c. Security rules** (the most important deliverable): `firebase.json` +
  `firestore.rules` + `storage.rules` + indexes matched to every client query — role
  never client-writable; meals created only by owner, analysis/status server-only
  (except the narrow client "mark my stuck upload failed" case — full server-owned
  status lands with Phase 2's reliability work), doctor edits limited to notes;
  rubrics doctor-only; photos owner-upload-only, reads via signed URLs; scoped
  `getMealPhotoUrl` to `meal-photos/`. **Doctor management:** deleted `claimDoctorIfNone`;
  added `DOCTOR_EMAILS` env allowlist + `ensureRole` server fn; wired existing
  `promoteToDoctor` as an "add a doctor" card on the Patients page. Rules haven't been
  published to a live Firebase project yet (no project exists) — that's owner step 5.

### Phase 2 — The reading engine, rebuilt on the ethos *(≈2 sessions; the heart)* — **shipped**
One coherent rewrite of `analyzeMeal`:
- [x] **2a. New schema** (`src/lib/analysis.schema.ts`, zod, shared server/UI/mocks):
  `meal_name`, `identified_items`, `estimated_portion`; `opening_note` (the one-line
  love-note in Dr. K's voice); `building_blocks` (protein g, fiber g, healthy-fat
  sources, complex-vs-refined carbs — **no calories field exists**); `micronutrients[]`
  ({nutrient, level: strong|present|light|not_seen, from: which food} — `nutrient` is a
  closed enum that doesn't include selenium, so a reading can't flag it even if the
  model tries); `offered` (nourishment highlights); `worth_trying` (food-first
  additions); `absorption_notes`; `protocol_fit` ({tier: aligned|getting_there|
  worth_a_look, note}); `uncertainty`. Removed concepts: calories, sugar-as-shame,
  numeric score, "concerns".
- [x] **2b. The Dr. K clinical spine** (`src/lib/clinical-spine.ts`, editable without
  touching engine code): her positions (vitamin C+iron, coffee/tea timing, never flag
  selenium, carminatives, cooked brassicas only for Hashimoto's, cravings-as-data,
  celebrate colours/variety) + the voice rule + vocabulary; uploaded rubrics layered on
  top. Uses Anthropic tool-use (`strict: true`) so the reply is schema-validated by the
  API itself, not just parsed hopefully.
- [x] **2c. Bulletproofing**: server owns status (`pending → analyzing → analyzed | failed`
  + readable error; client never writes status — `firestore.rules` no longer grants the
  client any meal-update path except doctor `doctorNotes`); structured outputs so the
  reply always matches the schema (zod-validated); one corrective retry + a 45s timeout
  per attempt; model via `ANTHROPIC_MODEL` env (default claude-sonnet-4-6); "Retry"
  button on pending/analyzing/failed meals (patient-facing, shows the failure reason);
  doctor "Re-analyze with current rubric" button; rubric IDs used are recorded on the
  meal (`rubricIds`). `analyzeMeal` serves all three triggers — same operation.
- [x] **2d. Typed end-to-end**: `MealAnalysis`/`Meal` types flow through
  `analyzeMeal`/`updateMealAnalysis`/every route that reads a meal — no more `unknown`
  analysis (this also fixed the pre-existing TanStack Start serialization `tsc` error
  noted in TODO.md, since the return type is no longer `unknown`); `typecheck` passes
  clean. Added `.github/workflows/ci.yml` (typecheck/lint/build) and
  `scripts/ethos-lint.sh` (`npm run ethos-lint`) — greps `src/` for calorie/kcal/score/
  grade outside an allowlist of the 3 files that legitimately discuss them to define the
  exclusion, wired into CI.
- **Bug found + fixed during verification (not originally scoped, but blocking):**
  `doctor.tsx` was a layout route with children (`doctor.rubrics.tsx`,
  `doctor.patient.$patientId.tsx`) but never rendered `<Outlet />` — so the Rubrics page
  and the per-patient review page (including the new Re-analyze button) silently never
  appeared; navigating there just kept showing the Patients list. Fixed by moving the
  Patients-list content to `doctor.index.tsx` and making `doctor.tsx` a pure
  `<Outlet />` layout. Verified in a real browser (Playwright) end to end: patient
  reading view, doctor patient review + re-analyze, rubrics page, failed/pending Retry
  states — all render correctly in preview mode with no console errors.

### Phase 3 — Dr. K's Kitchen: rebrand + reading UI *(≈2 sessions)* — **shipped**
- [x] **3a. Design tokens**: rewrote `src/styles.css` palette to the Garden Warmth values
  (converted to oklch, semantic token names preserved — primary=terracotta,
  accent=sage, secondary/muted=cream-deep, border=hairline); self-hosted Fraunces +
  Nunito via `@fontsource/*` (bundled by Vite, no Google Fonts CDN — works offline for
  the PWA); radii bumped (`--radius: 0.875rem` → cards ~22px) and buttons are pill-shaped
  (`rounded-full`). Confirmed in a real browser: existing components reskinned
  themselves with almost no changes needed, as predicted.
- [x] **3b. Reading UI v2** (`analysis-view.tsx`): opening note → identified-item chips →
  building blocks (protein/fiber/carb quality) → micronutrients → What this meal offered
  → Worth trying → Absorption notes → Protocol fit chip. Attribute pills added to
  dashboard meal cards (protocol-fit tier + up to 2 "strong" nutrients, e.g. "Aligned",
  "Omega-3-rich"). Inline editing still wired to the Phase 2 schema. No score badge, no
  calories tile — verified visually. (The exact Botanical Clinic full-width report-line
  treatment for the micronutrient rows is a further polish opportunity, not done —
  current rows are card-style, same qualitative content.)
- [x] **3c. Landing page** rebuilt from the two drafts' shared skeleton (hero with
  report-line card, three-step section, Dr. K quote band, feature grid, final CTA) with
  the microcopy bank; renamed "Nourish" → "Dr. K's Kitchen" everywhere (app shell, auth
  page, all route titles, PWA manifest, og/meta tags); PWA manifest now cream/terracotta
  with the real name; icons regenerated (terracotta rounded square + cream leaf mark, at
  192/512/512-maskable, plus a matching favicon.ico) via a small Playwright-rendered SVG
  — no external asset pipeline needed.
- [x] **3d. Copy pass**: toasts/empty-states/status badges rewritten in the Blend voice
  ("Reading ready", "Reading failed", status badge labels "Logged/Reading…/Ready/Needs a
  retry", rubric page copy talks about "shaping the reading" instead of "AI analysis").
  Mock data was already rewritten to the new schema in Phase 2, so preview mode shows
  the real experience end to end. Added `NUTRIENT_LABELS`/`LEVEL_LABELS`/
  `CARB_QUALITY_LABELS`/`TIER_LABELS` to `analysis.schema.ts` as the single source for
  display labels (shared by analysis-view.tsx and the new attribute pills).

### Phase 4 — Stand-out features *(≈2–3 sessions)* — **shipped**
- [x] **4a. Patterns page** (`src/lib/trends.ts` + `src/components/app/patterns-panel.tsx`,
  patient route at `/patterns` + a "Patterns" tab embedded in the doctor's per-patient
  view): micronutrient coverage (how many of the last 14 days' readings called each
  nutrient out as a strong source — plain "X of Y readings" counts, never a percentage),
  gaps feed straight into 4b's suggestions; plant-variety and colour-diversity stat tiles
  (keyword-heuristic, not a botanical database — see the code comment); protein/fiber
  rhythm as two small-multiple line charts against a generic food-first band (there's no
  per-patient doctor-set target in the schema yet, so the band is general guidance, not a
  number); logging streak. Friendly empty state under 3 readings. dataviz skill applied —
  chart mark colours (`--chart-4`/`--chart-5`, i.e. sage-deep/terracotta-deep) were picked
  because they're the two existing theme tokens that clear the skill's contrast validator
  against the cream surface; the brand's softer default chart tokens (`--chart-2`/`-3`)
  don't. Coverage rows are plain HTML bars with real numbers in the DOM, not recharts —
  simpler and satisfies the accessibility bar for what's fundamentally a small list.
- [x] **4b. Nutrient-gap suggestions**: `computeNutrientCoverage`'s gaps (below a 40%
  strong-source rate) surface as "Try something new" on the Patterns page. No CNF import —
  there's no live dataset to pull in this environment, and the ethos already rules out
  grading meals against a food database — instead `src/lib/nutrient-reference.ts` is a
  small hand-curated whole-foods list (top foods per tracked nutrient, food-first,
  Dr. K-voiced reasons), never surfaced with a number. The pantry-first tier is still
  post-demo per the table below (no pantry inventory exists yet to check against).
- [x] **4c. Rubric PDF auto-extraction**: `extractRubricPdf` (`src/lib/rubrics.functions.ts`)
  sends the uploaded PDF to Claude as a document content block and returns a plain-text
  summary; an "Extract from PDF" button in `doctor.rubrics.tsx` prefills the
  review-and-edit box (doctor still reviews/edits before saving). Non-PDF uploads
  (doc/docx) keep the manual paste flow — Claude only takes PDF as a document block today.
- [x] **4d. Demo seed data + `docs/DEMO.md`**: doctor-only Seed/Clear buttons
  (`src/lib/demo.functions.ts`, gated server-side by `DEMO_MODE=true`) on the Patients
  page; 3 demo patients × ~10 hand-written readings each across 3 weeks
  (`src/lib/demo-data.ts`) whose arcs tell stories (Jordan's iron gap closing after the
  lemon/vitamin-C tip; Morgan's plant variety and colour climbing from a handful of
  staples; Sam steady on an omega-3-forward protocol). Zero AI cost — readings are
  authored text, not model output. Every seeded doc (`users`, `meals`, one demo `rubrics`
  doc) is tagged `demo: true` for one-click removal. Walkthrough script in `docs/DEMO.md`.

**Not yet visually verified in a browser** — this session's sandbox couldn't bind a dev
server (no IPv6 support in the container; the nitro/vercel-dev-emulation listener needs
it regardless of `vite.config.ts`'s `server.host`, which the app doesn't otherwise need to
change). Verified instead via `tsc --noEmit`, `eslint`, a full `vite build`, `ethos-lint`,
and running `trends.ts`/`demo-data.ts` directly against real fixture data with `tsx` to
confirm the numbers are sane. Phase 5's owner should do a real browser pass on all of
Phase 4 before the live demo.

### Phase 5 — Deploy + prove it *(1 session + ~30 min owner)*
- [x] **60s serverless timeout for photo readings**: `vite.config.ts`'s nitro plugin now
  sets `vercel.functions.maxDuration: 60`. This also surfaced a latent bug — the analysis
  retry (one corrective retry on a schema mismatch) could previously total ~90s worst case
  (two sequential 45s attempts), which no realistic Vercel timeout covers. Tightened
  `ANALYSIS_TIMEOUT_MS` in `meals.functions.ts` to 25s so first-attempt+retry fits in ~50s,
  leaving headroom under the 60s function budget for the photo download/upload around it.
- [x] **`README.md`**: what it is, the ethos, architecture, doc pointers, local setup.
- [ ] Vercel import → env vars (+ `DOCTOR_EMAILS`, `DEMO_MODE` while demoing) → deploy →
  **add the Vercel domain to Firebase authorized domains** (Google login breaks
  otherwise). *Owner action — needs real Vercel/Firebase accounts, not done this session.*
- [ ] **Verification checklist** (live URL, phone + desktop) — *owner action, blocked on
  the deploy above and on step 5 (no live Firebase project yet):* fresh signup → photo
  reading end-to-end; text meal; kill-tab → Retry recovers; bad API key → readable
  failure; edits persist; **nothing anywhere shows a calorie or a score**; patient can't
  reach doctor pages / others' meals / self-promote (rules test denied); allowlisted
  doctor auto-role; rubric PDF extract → re-analyze reflects it; Patterns + gap
  suggestions populated (and graceful when empty); seed/clear demo data; Google login on
  prod domain; PWA installs as "Dr. K's Kitchen" with cream/terracotta colours, camera
  works; build/typecheck/lint/CI green (already true locally); preview mode still works
  with no env (already true locally, but worth reconfirming on the deployed build — this
  session still couldn't open a real browser; see Phase 4's note above).

### Post-demo milestone #1 — Pantry suite port *(≈2 sessions)* — **partially shipped**
- [x] **Pantry inventory (form entry)**: `src/routes/_authenticated/pantry.tsx` —
  patient-owned `pantry_items` collection (`src/lib/pantry.schema.ts`), add/remove, mark
  used up / restock. Direct client Firestore reads/writes under new owner-scoped
  `firestore.rules` (no server fn needed — there's no server-owned lifecycle field here,
  unlike meals), matching the equality-only-filter/no-orderBy pattern used elsewhere to
  avoid new composite indexes.
- [x] **Grocery list with reasons**: `src/routes/_authenticated/grocery-list.tsx` — a
  `grocery_list_items` collection with a `reason` (`used_up` | `gap_suggestion` |
  `manual`), checkbox to check off, manual add.
- [x] **"Mark used up → grocery" flow**: `pantry.tsx`'s `markUsedUp` sets the pantry item
  to `used_up` and adds a `grocery_list_items` entry in the same action (de-duplicated
  against an already-unchecked entry for the same item).
- [x] **"In your pantry" suggestion tier**: `nutrient-reference.ts`'s
  `splitFoodsForNutrient` checks a gap nutrient's candidate foods against the patient's
  active pantry item names first — "In your pantry" surfaces ahead of "Try something
  new" on the Patterns page, and the grocery list's "Worth adding" section only offers
  what isn't already sitting active in the pantry. Verified against fixture data with
  `tsx` (pumpkin/chia seeds correctly matched to iron/zinc/magnesium/omega-3).
- [x] **Photo scan**: `scanPantryPhoto` (`src/lib/pantry-scan.functions.ts`) sends the
  photo to Claude as a base64 image with a tool-use call (same reliability pattern as
  `analyzeMeal`), returning identified item names. No Storage upload — the photo is never
  persisted, same "send base64 directly, discard after" shape as `extractRubricPdf`.
- [x] **Voice capture**: `src/components/app/voice-capture.tsx` uses the browser's Web
  Speech API where available (Chrome/Edge desktop, Android). **iOS/iPadOS (Safari,
  DuckDuckGo, Chrome-for-iOS — all WebKit under the hood) has never implemented that API
  at all**, and there's no way to add real in-page speech recognition there without a
  third-party speech-to-text vendor (a bigger architectural call than this component
  should make alone — Claude/Anthropic has no audio input, and adding one would mean a
  paid service outside Firebase+Anthropic; see CLAUDE.md). Instead, the fallback there
  leans into the platform's own answer: iOS's keyboard has a built-in dictation
  microphone that works in any text field, in any browser, with no web API needed — the
  fallback UI points at it explicitly ("tap the microphone on your keyboard") rather than
  saying voice isn't available. Detection also treats a first-attempt recognition error
  (`not-allowed`/`service-not-allowed`/`audio-capture`) as "not really supported here" and
  switches to the same fallback, since some WebKit builds define the API's symbol without
  actually implementing it. Either path ends at a transcript that `parsePantryVoiceText`
  turns into item names the same way the photo flow does.
- [x] **Shared confirm step**: `src/components/app/confirm-pantry-items.tsx` — Claude's
  guess from either flow is never written to `pantry_items` directly; the patient
  edits/removes/adds names first, the same "AI proposes, human confirms" shape as the
  meal reading's inline edit.
- **Not visually verified this session** — this sandbox still has no IPv6 at all (a raw
  Node `.listen('::')` fails), so the dev server can't start here; typecheck/lint/
  ethos-lint/build are all clean, but the camera/mic UI itself needs a real-browser pass
  (the user has said they'll test it directly).

---

## Part 6 — Carrying the ethos through every future session: CLAUDE.md setup

Create these files in the repo (first implementation session) so *any* Claude session —
Sonnet, Fable, web, CLI — automatically absorbs the ethos before touching code:

1. **`CLAUDE.md` (repo root — auto-loaded by every Claude Code session).** Short and
   commanding, pointing to the deeper docs:
   - What the app is (2 lines) + link to `docs/ETHOS.md`, `docs/PLAN.md`, `docs/VOICE.md`.
   - **Hard rules (non-negotiable):** never add calories, calorie math, or calorie
     fields; never add numeric/letter/colour-coded scores or grades; never use shaming,
     warning-red, or diet-culture language; never flag selenium; all patient-facing
     wording follows `docs/VOICE.md`; the AI prompt spine lives in
     `src/lib/clinical-spine.ts` — edit wording there, never inline in engine code.
   - **Architecture rules:** Firebase only (no second backend); analysis/status writes
     server-side only; security rules in repo are source of truth; run
     `npm run typecheck && npm run lint && npm run build` before pushing.
   - **Design rules:** use semantic tokens in `src/styles.css` only (never raw hex in
     components); fonts Fraunces/Nunito; no Sunny Kitchen elements (confetti, badges,
     gamified arcs).
2. **`docs/ETHOS.md`** — Part 1 of this plan verbatim + the "why" (her positions with
   sources), so future sessions understand intent, not just rules.
3. **`docs/VOICE.md`** — the vocabulary table + microcopy bank + do/don't examples
   (e.g. do: "This bowl is doing exactly what we hoped for your energy this week";
   don't: "You exceeded your sugar target"). Both the UI copy AND the AI prompt import
   their language from this single source.
4. **`docs/PLAN.md`** — this plan (kept current as phases complete; each session checks
   off what it shipped).
5. Optional but recommended: a tiny **ethos lint** — CI greps `src/` for forbidden
   patterns (`calorie`, `kcal`, `score`, `grade`) outside an allowlist, so a regression
   can't even build. Cheap, catches model drift forever.

Session workflow for you (non-coder): start each session with *"Read CLAUDE.md and
docs/PLAN.md, then continue with Phase N."* That's the whole ritual — the files do the
ethos-carrying.

---

## Part 7 — Order of work

| # | Item | Who | Size | Status |
|---|------|-----|------|--------|
| 1 | SETUP.md; owner creates Firebase + Anthropic accounts | Claude + owner | 1h + 45m | doc done; owner accounts still pending |
| 2 | CLAUDE.md + docs/ETHOS.md + docs/VOICE.md (ethos rails first) | Claude | S | done |
| 3 | Cleanup, copy fixes, bring design-drafts over, build green | Claude | S | done |
| 4 | Security rules + DOCTOR_EMAILS role management | Claude | M | done |
| 5 | Owner publishes rules | owner | 10m | pending — no live Firebase project yet |
| 6 | Reading engine rebuild (schema, spine, reliability, typed, CI) | Claude | L | done |
| 7 | Rebrand: tokens, fonts, Reading UI v2, landing, PWA, copy pass | Claude | L | done |
| 8 | Patterns page + gap suggestions (bundled whole-foods JSON, not a CNF import) | Claude | L | done |
| 9 | Rubric PDF extraction + re-analyze button | Claude | S–M | done (re-analyze button was done in #6; PDF extraction done this session) |
| 10 | Demo seed data + DEMO.md | Claude | M | done |
| 11 | Vercel deploy, README, verification pass | Claude + owner | M | not started — still blocked on step 5 (no live Firebase project); Phase 4 also needs a real-browser pass first, see Phase 4's note above |
| 12 | *Post-demo:* pantry + grocery + voice port | Claude | M–L | done — inventory (form/photo/voice), grocery list, and the pantry-first suggestion tier all shipped; needs a real-browser pass (see note above) |

**Critical files:** `src/lib/meals.functions.ts` (engine), `src/lib/analysis.schema.ts` +
`src/lib/clinical-spine.ts` (new), `firestore.rules`/`storage.rules`/`firebase.json`
(new), `src/styles.css` (design tokens), `src/components/app/analysis-view.tsx` (reading
UI), `src/routes/index.tsx` (landing), `CLAUDE.md` + `docs/` (ethos rails),
`src/lib/trends.ts` + `src/components/app/patterns-panel.tsx` (Phase 4a, new),
`src/lib/nutrient-reference.ts` (Phase 4b, new — hand-curated, not a CNF port),
`src/lib/rubrics.functions.ts` (roles + Phase 4c's `extractRubricPdf`),
`src/lib/demo-data.ts` + `src/lib/demo.functions.ts` + `docs/DEMO.md` (Phase 4d, new),
`src/lib/pantry.schema.ts` + `src/routes/_authenticated/pantry.tsx` +
`src/routes/_authenticated/grocery-list.tsx` (Post-demo #1, new),
`src/hooks/use-auth.ts`, `src/lib/mock-data.ts` (v2).

**Model guidance for execution:** Sonnet executes most phases; use Fable (or a Fable
review pass) for the security rules, the reading-schema + clinical-spine writing, and a
final voice/design review. The in-app analysis model stays claude-sonnet-4-6 regardless.
