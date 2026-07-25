# Dr. K's Kitchen

A meal-logging app for a naturopathic doctor's patients: patients log meals (photo
or text), Claude reads them against the doctor's protocol, the doctor reviews and
annotates. It is deliberately **not** a calorie counter.

Before touching product code, read:
- `docs/ETHOS.md` — the clinical principles every screen and prompt must follow
- `docs/VOICE.md` — the vocabulary and copy every patient-facing string must use
- `docs/PLAN.md` — the build plan and current phase
- `docs/OWNER-TODO.md` — the consolidated checklist of everything blocked on the owner
  (accounts, deploy, verification) — keep it current whenever a phase adds a new
  owner-only step; don't duplicate its content back into PLAN.md's phase notes

## Hard rules (non-negotiable)

- Never add calories, calorie math, or a calorie field — anywhere, in the schema,
  the prompt, the UI, or a chart.
- Never add an evaluative score or grade — no 1–10 rating, no letter grade, no
  colour-coded verdict on the patient. `protocol_fit` stays a qualitative tier
  only, never a number, no exception (see `docs/VOICE.md`). This is distinct
  from a nutrient *amount*: vibes-first, never vibes-only. Nutrient levels are
  qualitative tiers by default (Simple mode); in **Detailed mode** only, a
  micronutrient may additionally show an approximate mg/mcg range (real
  numbers, and roughly what portion of a typical day's target that range
  covers), and the Nutrient Profile page may show a daily percentage against a
  general adult reference value (see `docs/ETHOS.md` principle 2, `docs/VOICE.md`)
  — both deliberate, scoped exceptions directed by Dr. K, not a precedent for
  adding numbers to protocol fit or calories, both of which remain untouched.
  A number is the problem when it's a verdict on the patient (a score); it's
  the point when it's informational (how much iron is in a cup of lentils).
- Focus nutrients (doctor- and patient-set, see `docs/ETHOS.md` principle 3)
  change what's emphasized and displayed, never what's evaluated — every
  tracked nutrient is scored on every reading regardless of focus.
- Never use shaming, warning-red, or diet-culture language — numeric or not.
- There is no standing nutrient exclusion today. (History: selenium was
  excluded until the ~27-nutrient expansion, when Dr. K explicitly reversed
  that — see `docs/ETHOS.md` principle 3. Don't re-add it by habit.)
- All patient-facing wording follows `docs/VOICE.md`. The AI prompt spine lives in
  `src/lib/clinical-spine.ts` — edit wording there, never inline in engine code.

## Workflow

- Do all new edits on the `preview` branch unless Katelyn explicitly says
  otherwise for a given change.

## Architecture rules

- Firebase only (Auth, Firestore, Storage) — no second backend.
- `analysis` and `status` on a meal are server-owned; never trust or reproduce
  Claude's schema output on the client without validation.
- `firestore.rules` / `storage.rules` in this repo are the source of truth for
  access control — update them in the same change as any new client query.
- Run `npm run typecheck && npm run lint && npm run build` before pushing.
- **The current no-account beta deploy is local-storage-only, on purpose** (see
  `docs/OWNER-TODO.md` §0b). Meal logging, pantry, and the grocery list all
  keep their data in that one browser's `localStorage` — never written to
  Firestore — because Firestore/Storage haven't gone through a PHI/PIPEDA
  review yet. This is why: a logged-in, server-persisted beta could tie a
  real meal/pantry description to whatever identifying info leaks in a
  breach; a local-only, no-account beta can't, because nothing survives past
  that device. Applies whenever `isMockMode` is true (`src/lib/mock-mode.ts`)
  and `isInternalPreviewUnlocked()` is false — see `src/lib/preview-meals-store.ts`,
  `src/lib/preview-pantry-store.ts`, `src/lib/meals-preview.functions.ts`,
  `src/lib/pantry-scan-preview.functions.ts`. Any new feature added to this
  path must not write to Firestore/Storage or collect new identifying info —
  this whole local-only branch is meant to go away once real accounts launch.

## Design rules

- Use semantic tokens in `src/styles.css` — never raw hex values in components.
- Fonts: Cormorant (display) + EB Garamond (body), self-hosted — the
  Dr. Katelyn Mudry brand system (KM-clinical half only; no Solarium/
  astrology fonts or colors belong in this app). **Scoped exception:** Jost
  (`--font-label`), self-hosted the same way, is allowed for tracked-caps
  eyebrow labels and small tags only (e.g. nutrient tile labels, "Worth
  trying" pills on the nutrient reading card) — never for headings, body
  copy, or anywhere Cormorant/EB Garamond already apply. Directed by Dr. K
  for the nutrient-card redesign; don't extend it to other Solarium elements.
- No "Sunny Kitchen" elements: no confetti, no achievement badges, no gamified
  arcs, minimal emoji.
