# Grocery/pantry storage split + copy pass — design

## Problem

Grocery list and pantry currently share one undifferentiated idea of "an
item" — nothing distinguishes a fresh/fridge thing you need to buy soon from
a dried/shelf-stable staple you keep stocked. This shows up as a UX/copy
problem in two places:

1. The nutrient-gap suggestion tier ("Worth adding" on the grocery page)
   mixes fresh and dried food ideas together, and only ever offers to add
   them to the grocery list — even for a dried staple that really belongs in
   pantry inventory instead.
2. The pages' intro copy doesn't say what belongs where. Grocery's current
   line — *"Items you've marked used up, plus a few food-first ideas worth
   adding."* — describes mechanics (where items came from) instead of
   telling the patient what the list is for.

## Scope

Two pages: `src/routes/_authenticated/grocery-list.tsx` and
`src/routes/_authenticated/pantry.tsx`. This does **not** redefine what a
patient can manually add to either list (a patient can still put anything
in pantry inventory or on the grocery list by hand) — the fresh/dried split
applies specifically to the **nutrient-gap suggestion tier**, and the copy
pass clarifies what each list is *for* at a glance.

## 1. Data: `storage` field on `NutrientFood`

Add to `src/lib/nutrient-reference.ts`:

```ts
export type NutrientFood = {
  name: string;
  reason: string;
  cuisines?: string[];
  vegan?: boolean;
  amount?: number;
  servingSize?: string;
  storage: "fresh" | "dried";
};
```

Hand-classify all existing entries in `HAND_CURATED_FOODS`
(`nutrient-reference.ts`, ~222 entries) and `IMPORTED_FOODS`
(`nutrient-reference.data.ts`, ~489 entries — the "GENERATED FILE, do not
hand-edit" header refers to *regenerating from the CSV*, not to this
one-time field addition; add the field directly to the existing entries).

**Classification rule** (confirmed): classify by how the patient buys/stores
it, not by how the reason text describes serving it.
- `dried`: grains, legumes/lentils/beans (dry or canned), nuts, seeds,
  spices, dried fruit, flours, shelf-stable pastes (e.g. blackstrap
  molasses, tahini), canned fish/vegetables, fortified cereals, oils.
- `fresh`: produce (raw or "cooked X"), meat, poultry, fish (fresh/frozen,
  not canned), dairy, eggs, tofu, tempeh — anything bought to be used within
  days/weeks and kept refrigerated or on the counter briefly.

Borderline calls (make the call, don't leave ambiguous):
- "Lentils, cooked" / "Chickpeas, cooked" → `dried` (the pantry staple form,
  cooked at serving time).
- "Canned salmon/sardines/tuna" → `dried` (shelf-stable until opened).
- "Frozen peas/spinach" → `fresh` (lives in the fridge/freezer, not the
  pantry shelf).
- "Tofu" → `fresh` (refrigerated, short shelf life once opened).

This is a large, mechanical-but-judgment-requiring pass across two files —
implement it as its own step, reviewed as a diff before merging with the
rest of the change.

## 2. Splitting logic

Add a storage-aware split next to `splitFoodsForNutrient` in
`nutrient-reference.ts`:

```ts
export function splitFoodsByStorage(
  nutrient: TrackedNutrient,
  storage: "fresh" | "dried",
  pantryItemNames: string[],
  limit = 3,
  cuisines?: string[] | null,
): { inPantry: NutrientFood[]; tryNew: NutrientFood[] }
```

Same body as today's `splitFoodsForNutrient`, but first filters
`NUTRIENT_FOODS[nutrient]` down to `f.storage === storage` before the
cuisine-prioritize / pantry-match / limit steps. `splitFoodsForNutrient`
itself can stay (still used by `patterns-panel.tsx`, which isn't in scope
here and shouldn't change) or be reimplemented in terms of the new function
with `storage` unfiltered — pick whichever keeps `patterns-panel.tsx`'s
existing behavior byte-for-byte identical, since that page draws from both
categories together and isn't part of this change.

## 3. Grocery page (`grocery-list.tsx`)

- Suggestion tier (`suggestions` memo, `useMemo` block around line 127):
  call `splitFoodsByStorage(gap.nutrient, "fresh", activePantryNames, 3,
  effectiveCuisines)` instead of `splitFoodsForNutrient`. Only `tryNew`
  is used today (no `inPantry` rendering on this page) — keep that; a fresh
  item already sitting in pantry inventory is already excluded by the
  existing `inPantry`-exclusion logic inside the split function.
- Section heading: "Worth adding" → **"Try something new"** (VOICE.md
  vocabulary). Subhead follows Patterns' phrasing pattern: *"Fresh, food-first
  ideas for the nutrients that have been a little light lately."*
- Page intro (replaces *"Items you've marked used up, plus a few food-first
  ideas worth adding."*): **"Fresh and fridge things worth picking up on
  your next trip."**
- `GROCERY_REASON_LABELS` (`pantry.schema.ts`) stays as-is — those labels
  describe *why* an item is on the list (ran out / worth adding / added by
  you), a different axis from storage type, and aren't part of this scope.

## 4. Pantry page (`pantry.tsx`)

- New suggestion tier, same shape as grocery's today: needs the patient's
  recent meals to compute nutrient gaps (`computeNutrientCoverage`), which
  `pantry.tsx` doesn't currently query. Add a `meals` query mirroring
  `grocery-list.tsx`'s (including its `isMockMode` /
  `isInternalPreviewUnlocked()` / `getLocalPreviewMeals()` three-way branch
  from the local-only beta work).
- Suggestions call `splitFoodsByStorage(gap.nutrient, "dried",
  activePantryNames, 3, effectiveCuisines)`.
- "Add" button on a suggestion writes straight to pantry inventory — reuse
  the same three-way branch (`isInternalPreviewUnlocked()` fixture toast /
  `addLocalPantryItem` / real `addDoc`) already established for pantry's
  other add paths.
- Section heading: **"Try something new"**, subhead: *"Shelf-stable ideas
  for the nutrients that have been a little light lately."*
- Page intro (replaces *"Keep a running list of what's on hand — it helps
  'Try something new' suggestions on your Patterns page tell what you
  already have from what's worth a grocery trip."*): **"Dried and
  shelf-stable staples you keep stocked — what's on hand shapes what your
  Patterns page and grocery list suggest."**

## 5. Full copy pass (both pages)

Per `docs/VOICE.md` style notes (plain, warm, first-person-plural where
natural, no clinical/instructional tone):

- Grocery: h1 stays "Grocery list"; intro per §3 above.
- Pantry: h1 stays "Your pantry"; intro per §4 above.
- Empty states: "Nothing on your list yet." / "Nothing on hand yet — add
  above." — reviewed for tone but likely stay close to current (already
  plain, not clinical); finalize exact wording during implementation, not
  frozen here.
- Toasts ("Preview mode — items aren't saved.", "Marked used up — added to
  your grocery list", etc.) reviewed for consistency with VOICE.md's
  first-person-plural preference where it reads naturally; kept short.
- `docs/VOICE.md` vocabulary table gains one row distinguishing the two
  lists' scope, e.g.:

  | Concept | The word |
  |---|---|
  | What belongs where | **Grocery: fresh & fridge. Pantry: dried & shelf-stable.** |

  (Exact row wording finalized during implementation to match the page copy
  once drafted, so they stay verbatim-identical.)

## Out of scope

- Redefining what a patient can manually type into either list — no
  validation added to reject a "wrong-category" manual entry.
- `patterns-panel.tsx`'s existing "Try something new" / "In your pantry"
  card — unchanged, still draws from both storage categories together.
- `GROCERY_REASON_LABELS` — unchanged, orthogonal axis (why it's listed, not
  what kind of item it is).
- Any change to `pantry.schema.ts` / `firestore.rules` — items still don't
  carry a storage tag themselves; only the *suggestion source data*
  (`NutrientFood`) does. A patient's own pantry/grocery items have no
  category field before or after this change.

## Verification

- `npm run typecheck && npm run lint && npm run build`.
- Spot-check a sample of newly-tagged entries across a few nutrients (iron,
  vitamin C, zinc) for classification sanity.
- In mock/local-preview mode: log meals that create a gap, confirm the
  gap's fresh candidates appear only on Grocery and dried candidates appear
  only on Pantry, and that "Add" on each writes to the correct
  list/storage (local or Firestore, matching whichever mode is active).
- Read both pages' full copy against `docs/VOICE.md` once implemented.
