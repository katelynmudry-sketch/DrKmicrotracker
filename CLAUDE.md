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
- Never add a numeric, letter, or colour-coded score or grade. Protocol fit and
  nutrient levels are qualitative tiers only (see `docs/VOICE.md`).
- Never use shaming, warning-red, or diet-culture language.
- Never flag selenium.
- All patient-facing wording follows `docs/VOICE.md`. The AI prompt spine lives in
  `src/lib/clinical-spine.ts` — edit wording there, never inline in engine code.

## Architecture rules

- Firebase only (Auth, Firestore, Storage) — no second backend.
- `analysis` and `status` on a meal are server-owned; never trust or reproduce
  Claude's schema output on the client without validation.
- `firestore.rules` / `storage.rules` in this repo are the source of truth for
  access control — update them in the same change as any new client query.
- Run `npm run typecheck && npm run lint && npm run build` before pushing.

## Design rules

- Use semantic tokens in `src/styles.css` — never raw hex values in components.
- Fonts: Fraunces (display) + Nunito (body), self-hosted.
- No "Sunny Kitchen" elements: no confetti, no achievement badges, no gamified
  arcs, minimal emoji.
