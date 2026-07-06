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

### Phase 2 — The reading engine, rebuilt on the ethos *(≈2 sessions; the heart)*
One coherent rewrite of `analyzeMeal`:
- **2a. New schema** (`src/lib/analysis.schema.ts`, zod, shared server/UI/mocks):
  `meal_name`, `identified_items`, `estimated_portion`; `opening_note` (the one-line
  love-note in Dr. K's voice); `building_blocks` (protein g, fiber g, healthy-fat
  sources, complex-vs-refined carbs — **no calories field exists**); `micronutrients[]`
  ({nutrient, level: strong|present|light|not_seen, from: which food}); `offered`
  (nourishment highlights); `worth_trying` (food-first additions); `absorption_notes`;
  `protocol_fit` ({tier: aligned|getting_there|worth_a_look, note}); `uncertainty`.
  Removed concepts: calories, sugar-as-shame, numeric score, "concerns".
- **2b. The Dr. K clinical spine** (`src/lib/clinical-spine.ts`, editable without touching
  engine code): her positions (vitamin C+iron, coffee/tea timing, never flag selenium,
  carminatives, cooked brassicas only for Hashimoto's, cravings-as-data, celebrate
  colours/variety) + the voice rule + vocabulary; uploaded rubrics layered on top.
- **2c. Bulletproofing**: server owns status (`pending → analyzing → analyzed | failed` +
  readable error; client never writes status); structured outputs so the reply always
  matches the schema; validation before save + one corrective retry + timeout; model via
  `ANTHROPIC_MODEL` env (default claude-sonnet-4-6); "Retry" for failed/stalled meals;
  doctor "Re-analyze with current rubric" button; record rubric IDs used per reading.
- **2d. Typed end-to-end**: kill `unknown`/`as any`; `typecheck` script passes; minimal CI.

### Phase 3 — Dr. K's Kitchen: rebrand + reading UI *(≈2 sessions)*
- **3a. Design tokens**: rewrite `src/styles.css` palette to the Garden Warmth values
  (as oklch, semantic token names preserved), self-host Fraunces + Nunito, radii/shape
  pass. Because the app already uses semantic tokens, most components reskin themselves.
- **3b. Reading UI v2** (`analysis-view.tsx`): opening note → reading rows (label →
  qualitative value, Botanical Clinic style) → What this meal offered → Worth trying →
  absorption notes → Protocol fit chip → Notes from Dr. K. Attribute pills on meal cards.
  Inline editing rewired to the new schema. No score badge, no calories tile anywhere.
- **3c. Landing page** rebuilt from the two drafts' shared skeleton with the microcopy
  bank; app shell/logo/nav renamed; PWA manifest (name "Dr. K's Kitchen", cream/terracotta
  theme colours, regenerate icons to match brand).
- **3d. Copy pass** on every button, empty state, toast in the Blend voice; mock data
  rewritten to the new schema so preview mode shows the real experience.

### Phase 4 — Stand-out features *(≈2–3 sessions)*
- **4a. Patterns page** (patient + doctor embed): micronutrient coverage map (how often
  each Dr. K nutrient showed up strong/present this week, gaps get food-first suggestions
  attached — never warnings); plant-variety counter ("12 different plants this week");
  colour diversity; protein & fiber rhythm vs the doctor's target as a gentle band;
  streaks/counts. Friendly empty state under 3 readings. Built on vendored recharts +
  theme tokens; dataviz skill applied.
- **4b. Nutrient-gap suggestions** (port from pantry branch): `computeNutrientGaps` +
  two-tier suggestions rewired to the new tier schema; CNF catalog → bundled JSON
  (whole foods, 8 nutrients — reuse branch's Fuse.js matching + ranking; drop Supabase).
  Lives on the Patterns page ("Try something new") — pantry tier activates post-demo.
- **4c. Rubric PDF auto-extraction**: server fn sends the uploaded PDF to Claude as a
  document block; prefills the review-and-edit box. Non-PDFs keep manual paste.
- **4d. Demo seed data + `docs/DEMO.md`**: doctor-only Seed/Clear buttons gated by
  `DEMO_MODE=true`; 3 demo patients × ~15 meals across 3 weeks with pre-written readings
  whose arcs tell stories (an iron gap closing after the lemon tip; plant variety
  climbing). Zero AI cost; `demo: true` tag for one-click removal; walkthrough script.

### Phase 5 — Deploy + prove it *(1 session + ~30 min owner)*
- Vercel import → env vars (+ `DOCTOR_EMAILS`, `DEMO_MODE` while demoing) → deploy →
  **add the Vercel domain to Firebase authorized domains** (Google login breaks
  otherwise). Claude: 60s serverless timeout for photo readings; production build + PWA
  verified locally first. `README.md` (what it is, the ethos, architecture, doc pointers).
- **Verification checklist** (live URL, phone + desktop): fresh signup → photo reading
  end-to-end; text meal; kill-tab → Retry recovers; bad API key → readable failure;
  edits persist; **nothing anywhere shows a calorie or a score**; patient can't reach
  doctor pages / others' meals / self-promote (rules test denied); allowlisted doctor
  auto-role; rubric PDF extract → re-analyze reflects it; Patterns + gap suggestions
  populated (and graceful when empty); seed/clear demo data; Google login on prod domain;
  PWA installs as "Dr. K's Kitchen" with cream/terracotta colours, camera works;
  build/typecheck/lint/CI green; preview mode still works with no env.

### Post-demo milestone #1 — Pantry suite port *(≈2 sessions)*
Pantry inventory (form / photo scan / voice via Web Speech + Claude parsing, with
textarea fallback for iOS), grocery list with reasons, "In your pantry" suggestion tier,
"mark used up → grocery" flow. Port onto current main (new routes/collections — low
conflict); never git-merge the branch (it would revert newer main work).

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
| 6 | Reading engine rebuild (schema, spine, reliability, typed, CI) | Claude | L |
| 7 | Rebrand: tokens, fonts, Reading UI v2, landing, PWA, copy pass | Claude | L |
| 8 | Patterns page + gap suggestions (CNF→JSON port) | Claude | L |
| 9 | Rubric PDF extraction + re-analyze button | Claude | S–M |
| 10 | Demo seed data + DEMO.md | Claude | M |
| 11 | Vercel deploy, README, verification pass | Claude + owner | M |
| 12 | *Post-demo:* pantry + grocery + voice port | Claude | M–L |

**Critical files:** `src/lib/meals.functions.ts` (engine), `src/lib/analysis.schema.ts` +
`src/lib/clinical-spine.ts` (new), `firestore.rules`/`storage.rules`/`firebase.json`
(new), `src/styles.css` (design tokens), `src/components/app/analysis-view.tsx` (reading
UI), `src/routes/index.tsx` (landing), `CLAUDE.md` + `docs/` (ethos rails),
`src/lib/trends.ts` + patterns panel (new), ported `suggestions.functions.ts` +
`nutrient-reference.ts` + CNF JSON (from pantry branch), `src/hooks/use-auth.ts` +
`src/lib/rubrics.functions.ts` (roles, PDF extraction), `src/lib/mock-data.ts` (v2).

**Model guidance for execution:** Sonnet executes most phases; use Fable (or a Fable
review pass) for the security rules, the reading-schema + clinical-spine writing, and a
final voice/design review. The in-app analysis model stays claude-sonnet-4-6 regardless.
