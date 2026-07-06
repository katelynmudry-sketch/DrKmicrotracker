# Nourish — TODO / PR List

Running backlog against the Micronutrient Tracker PRD. Status reflects the
current state of `main`. Update this file in the same PR as the work it
tracks.

**Superseded by `docs/PLAN.md`** as of the Dr. K's Kitchen ethos rebuild — the
"Done" list below still describes the pre-rebuild calorie/score-based schema
in places; `docs/PLAN.md` Part 5 is the current source of truth for what's
shipped. This file is kept for the PRD-backlog framing but isn't the primary
plan doc anymore.

## Architecture decision

The PRD assumed a Canadian Nutrient File (CNF) database for nutrient lookups.
We're **not** building that — Claude (Anthropic SDK) is the entire nutrition
engine: it estimates macros/micros directly from a meal photo or a free-text
description, scored against the doctor's uploaded rubric. This avoids a large
separate project (importing/maintaining a nutrient database, food matching,
portion modeling) with no loss of functionality for the personas in the PRD.

## Done

- [x] Firebase auth (patient + doctor roles)
- [x] Photo-based meal logging → Claude analysis (macros, micros, rubric
      notes, naturopathic recommendations, concerns, overall score)
- [x] Doctor rubric upload + active-rubric injection into the analysis prompt
- [x] Doctor patient-review view (per-patient meal history, doctor notes)
- [x] Preview/mock mode (run the UI without Firebase configured)
- [x] Manual text-entry meal logging (free-text description, no photo
      required) — analyzed by the same Claude pipeline as photos
- [x] Inline editable AI analysis — patient or doctor can correct
      `meal_name`, `estimated_portion`, macros, and key micros after the
      fact; edits are a plain Firestore merge (no re-scoring, no
      `rubric_notes`/`concerns`/`overall_score` recompute), with an
      `analysisEditedAt`/`analysisEditedBy` audit trail

## Backlog (not started, prioritized)

1. ~~Re-analyze action (doctor-triggered)~~ — **done** (docs/PLAN.md Phase 2c):
   `analyzeMeal` serves the initial run, the patient/doctor Retry action, and
   the doctor's "Re-analyze with current rubric" button — all the same
   operation, re-scored against whatever rubrics are active now.
2. **Edit history / versioning** — currently only the most recent edit's
   timestamp+author is kept; no diff or history of prior values.
3. **Structured ingredient entry** — optional alternative to the single
   free-text box for patients who want per-ingredient logging instead of a
   paragraph description.
4. **Trends/insights dashboard** — aggregate macro/micro trends across a
   patient's meal history (referenced in PRD personas; not built).
5. **Notifications/reminders** — meal logging reminders for patients.
6. **Multi-rubric assignment per patient** — currently all active rubrics
   are injected globally; no per-patient rubric assignment.
7. **Export/reporting** — doctor-facing export of a patient's analyzed meal
   history (PDF/CSV) for charting or sharing.

## Known issues / tech debt

- ~~`analyzeMeal`'s return type triggers a pre-existing TanStack Start
  serialization type-check error~~ — **fixed** (docs/PLAN.md Phase 2d): the
  reading is now a typed `MealAnalysis`/`Meal` end to end instead of
  `unknown`; `tsc --noEmit` passes clean.
- General `@typescript-eslint/no-explicit-any` debt across several route
  files (pre-existing, not introduced by recent work) — limited to
  `catch (e: any)` blocks; not the same issue as the serialization error above.
