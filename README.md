# Dr. K's Kitchen

A meal-logging app for a naturopathic doctor's patients: patients log meals (photo
or text), Claude reads them against the doctor's protocol, the doctor reviews and
annotates. It is deliberately **not** a calorie counter.

Practitioner: Dr. Katelyn Mudry, ND — Kimberley & Cranbrook, BC.

## The ethos

- **No calories. Anywhere. Ever.** The story is what a meal *gives you* —
  micronutrients, protein, fiber, colour, variety.
- **No grades.** No 1–10 scores, no red/yellow/green verdicts. Protocol fit and
  nutrient levels are qualitative tiers only ("Aligned," "Strong source").
- **Micronutrients are the plot**, not sugar or calories — a full nutrition-label
  -style set (minerals, fat-soluble vitamins, B-vitamins, vitamin C — including
  selenium), plus protein and fiber. Doctor- and patient-set "focus nutrients"
  determine what's emphasized on a reading, not what's evaluated.
- **Absorption intelligence** — vitamin C with iron, coffee/tea timing, cooked
  brassicas, oxalates vs. calcium, phytates and soaking/sprouting — surfaced as
  specific tips on real meals.
- **The doctor's rubric is the lens; the doctor is the human in the loop.**

Full detail: [`docs/ETHOS.md`](docs/ETHOS.md) (the principles and why),
[`docs/VOICE.md`](docs/VOICE.md) (the vocabulary and copy bank every
patient-facing string draws from), [`docs/PLAN.md`](docs/PLAN.md) (the build plan
and what's shipped so far, phase by phase).

## Architecture

- **Firebase** — Auth (email + Google), Firestore, Storage. No second backend.
  `firestore.rules` / `storage.rules` in this repo are the source of truth for
  access control.
- **Anthropic API** directly (no separate nutrition database) — Claude is the
  entire reading engine, using tool-use with a strict JSON schema
  (`src/lib/analysis.schema.ts`) so a reading can't drift outside the ethos (the
  schema has no calories field, ever). The AI's clinical positions and voice
  live in `src/lib/clinical-spine.ts` — edit wording there, never inline in
  the engine.
- **TanStack Start** (React 19 + TanStack Router/Query) deployed on **Vercel**
  via Nitro's `vercel` preset. Server functions (`src/lib/*.functions.ts`) use
  the Firebase Admin SDK and are the only thing that ever writes a meal's
  `status`/`analysis` — the client can create a `pending` meal and read, never
  score itself.
- **Preview/mock mode** — the app runs with fixture data
  (`src/lib/mock-data.ts`) and no Firebase config at all, for reviewing the UI
  without live credentials.

## Getting started

```bash
npm install
cp .env.example .env   # fill in Firebase + Anthropic values — see docs/SETUP.md
npm run dev
```

Leave `.env` empty (or unset `VITE_FIREBASE_API_KEY`) to run in preview mode
with no backend at all.

```bash
npm run typecheck   # tsc --noEmit
npm run lint        # eslint
npm run ethos-lint  # greps src/ for calorie/score/grade drift outside the schema
npm run build       # vite build (also regenerates the TanStack route tree)
```

Run all four before pushing (see `CLAUDE.md`).

## Docs

| Doc | What's in it |
|---|---|
| [`docs/ETHOS.md`](docs/ETHOS.md) | The clinical principles every screen and prompt must follow |
| [`docs/VOICE.md`](docs/VOICE.md) | Vocabulary table, microcopy bank, do/don't examples |
| [`docs/PLAN.md`](docs/PLAN.md) | The build plan, phase by phase, kept current as work ships |
| [`docs/SETUP.md`](docs/SETUP.md) | One-time Firebase + Anthropic + env var setup (~45 min) |
| [`docs/DEMO.md`](docs/DEMO.md) | Seeding demo patient data and a walkthrough script |
| [`docs/OWNER-TODO.md`](docs/OWNER-TODO.md) | **Start here if you're not coding** — the one consolidated checklist of everything that needs a human with real accounts (setup, publishing rules, deploying, verifying) |
| [`CLAUDE.md`](CLAUDE.md) | The hard rules, for any AI session touching this repo |
