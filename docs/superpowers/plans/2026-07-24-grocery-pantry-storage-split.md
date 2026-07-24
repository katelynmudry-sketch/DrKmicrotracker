# Grocery/Pantry Storage Split + Copy Pass Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split the nutrient-gap suggestion tier by storage type (fresh/fridge → Grocery, dried/shelf-stable → Pantry) and rewrite both pages' patient-facing copy per `docs/VOICE.md`.

**Architecture:** Add a required `storage: "fresh" | "dried"` field to every `NutrientFood` entry in `src/lib/nutrient-reference.ts` / `.data.ts`, add a `splitFoodsByStorage` query function next to the existing `splitFoodsForNutrient`, then wire each page's suggestion tier to its own storage filter and rewrite the surrounding copy.

**Tech Stack:** TanStack Start/Router, React Query, Firebase (Firestore), TypeScript. No test runner in this repo — verification is `tsc --noEmit`, `eslint`, `vite build`, and `scripts/ethos-lint.sh`, plus ad-hoc `npx tsx` spot-check scripts for data changes (the existing convention for this data file, see `docs/PLAN.md`'s Post-demo milestone #3 notes).

## Global Constraints

- Never add calorie/score/grade language (CLAUDE.md hard rules, enforced by `npm run ethos-lint`).
- All patient-facing copy follows `docs/VOICE.md` (plain, warm, first-person-plural where natural, no clinical/instructional tone, no exclamation-point stacking).
- Run `npm run typecheck && npm run lint && npm run build` before considering any task done; `npm run ethos-lint` at the end.
- Classification rule (confirmed with Katelyn): classify each food by **how the patient buys/stores it**, not by how the reason text describes serving it. Dried: grains, legumes/lentils/beans (dry or canned), nuts, seeds, spices, dried fruit, flours, shelf-stable pastes (molasses, tahini), canned fish/vegetables, fortified cereals, oils. Fresh: produce (raw or "cooked X"), meat, poultry, fish (fresh/frozen, not canned), dairy, eggs, tofu, tempeh. Borderline calls: "Lentils, cooked" / "Chickpeas, cooked" → `dried`; canned salmon/sardines/tuna → `dried`; frozen peas/spinach → `fresh`; tofu → `fresh`.
- Out of scope (do not touch): `patterns-panel.tsx`'s existing gap-suggestion card (still uses unfiltered `splitFoodsForNutrient`, byte-for-byte unchanged behavior), `GROCERY_REASON_LABELS` in `pantry.schema.ts`, `firestore.rules`, and any validation on what a patient can manually type into either list.

---

### Task 1: `storage` field + `splitFoodsByStorage` + tag `HAND_CURATED_FOODS`

**Files:**
- Modify: `src/lib/nutrient-reference.ts`

**Interfaces:**
- Produces: `NutrientFood.storage: "fresh" | "dried"` (required field, used by Tasks 2–5). `splitFoodsByStorage(nutrient: TrackedNutrient, storage: "fresh" | "dried", pantryItemNames: string[], limit = 3, cuisines?: string[] | null): { inPantry: NutrientFood[]; tryNew: NutrientFood[] }` (used by Tasks 4–5).

- [ ] **Step 1: Add the `storage` field to the type**

In `src/lib/nutrient-reference.ts`, change:

```ts
export type NutrientFood = {
  name: string;
  reason: string;
  cuisines?: string[];
  vegan?: boolean;
  amount?: number;
  servingSize?: string;
};
```

to:

```ts
export type NutrientFood = {
  name: string;
  reason: string;
  cuisines?: string[];
  vegan?: boolean;
  amount?: number;
  servingSize?: string;
  // How the patient buys/stores it, not how the reason text describes
  // serving it (e.g. "Lentils, cooked" is still `dried` — it's a shelf-stable
  // staple cooked at serving time). See CLAUDE.md/docs for the full rule.
  storage: "fresh" | "dried";
};
```

- [ ] **Step 2: Run typecheck to see the full list of entries needing the field**

Run: `npx tsc --noEmit 2>&1 | grep "nutrient-reference" | wc -l`
Expected: a large non-zero count (every `NutrientFood` object literal in both files is now missing a required property). This is expected — it's the checklist for Steps 3 and Task 2/3.

- [ ] **Step 3: Add `storage` to every entry in `HAND_CURATED_FOODS`**

Go through every nutrient's array in `HAND_CURATED_FOODS` (iron, vitamin_d, calcium, iodine, zinc, choline, magnesium, selenium, vitamin_a, vitamin_c, vitamin_e, vitamin_k, thiamin, riboflavin, niacin, folate, biotin, pantothenic_acid, phosphorus, potassium, copper, manganese, chromium, molybdenum — currently lines 48–698) and add `storage: "fresh"` or `storage: "dried"` to each object literal, per the Global Constraints classification rule. Examples from `iron` (lines 48–95) to calibrate:

```ts
{ name: "Pumpkin seeds", reason: "...", storage: "dried" },
{ name: "Blackstrap molasses", reason: "...", storage: "dried" },
{ name: "Lentils", reason: "...", storage: "dried" },
{ name: "Cooked spinach", reason: "...", storage: "fresh" },
{ name: "Tofu", reason: "...", storage: "fresh" },
{ name: "Masoor dal (red lentil dal)", reason: "...", cuisines: [...], storage: "dried" },
{ name: "Octopus", reason: "...", cuisines: [...], storage: "fresh" },
```

Apply the same judgment across all 24 nutrient arrays.

- [ ] **Step 4: Add the `splitFoodsByStorage` function**

Directly after the existing `splitFoodsForNutrient` function (end of file, ~line 754), add:

```ts
export function splitFoodsByStorage(
  nutrient: TrackedNutrient,
  storage: "fresh" | "dried",
  pantryItemNames: string[],
  limit = 3,
  cuisines?: string[] | null,
): { inPantry: NutrientFood[]; tryNew: NutrientFood[] } {
  const foods = prioritizeByCuisine(
    NUTRIENT_FOODS[nutrient].filter((f) => f.storage === storage),
    cuisines,
  );
  const inPantry = foods.filter((f) => pantryItemNames.some((p) => namesOverlap(f.name, p)));
  const tryNew = foods.filter((f) => !inPantry.includes(f)).slice(0, limit);
  return { inPantry, tryNew };
}
```

- [ ] **Step 5: Confirm this file's part of the job is done**

Run: `npx tsc --noEmit 2>&1 | grep "nutrient-reference.ts"`
Expected: no output (all `HAND_CURATED_FOODS` entries now carry `storage`; remaining errors, if any, are all in `nutrient-reference.data.ts`, handled in Tasks 2–3).

- [ ] **Step 6: Commit**

```bash
git add src/lib/nutrient-reference.ts
git commit -m "Add storage field to NutrientFood + splitFoodsByStorage, tag hand-curated foods"
```

---

### Task 2: Tag `IMPORTED_FOODS`, part A (iron → zinc)

**Files:**
- Modify: `src/lib/nutrient-reference.data.ts` (lines ~17–2035: `iron`, `vitamin_d`, `calcium`, `iodine`, `zinc`)

**Interfaces:**
- Consumes: `NutrientFood.storage` field from Task 1 (same required field, same classification rule).

- [ ] **Step 1: Tag every entry in the `iron`, `vitamin_d`, `calcium`, `iodine`, and `zinc` arrays**

These are the generated-from-CSV entries (header says "do not hand-edit" — that refers to *regenerating from the source CSV*, not to this one-time field addition; add the field directly). Example from the top of `iron` (lines 17–40) to calibrate:

```ts
{
  name: "Lentils, cooked",
  reason: "soups, shepherd's pie base, everyday pantry staple",
  cuisines: ["Canadian / North American"],
  vegan: true,
  amount: 6.6,
  servingSize: "1 cup",
  storage: "dried",
},
{
  name: "Fortified oats or cream of wheat",
  reason: "breakfast staple, iron-fortified",
  cuisines: ["Canadian / North American"],
  vegan: true,
  amount: 9.0,
  servingSize: "1 cup cooked",
  storage: "dried",
},
{
  name: "Pumpkin seeds",
  reason: "snack, salad topper, granola mix-in",
  cuisines: ["Canadian / North American"],
  vegan: true,
  amount: 2.5,
  servingSize: "1 oz / 28g",
  storage: "dried",
},
```

Apply the same judgment to every remaining entry in these five nutrient arrays (roughly lines 17–2035), per the Global Constraints classification rule.

- [ ] **Step 2: Confirm this section is done**

Run: `npx tsc --noEmit 2>&1 | grep "nutrient-reference.data.ts"`
Expected: remaining errors (if any) should all be at line numbers ≥ 2036 (the `choline` array onward — Task 3's scope). None should reference lines 17–2035.

- [ ] **Step 3: Commit**

```bash
git add src/lib/nutrient-reference.data.ts
git commit -m "Tag storage field on imported foods, part A (iron through zinc)"
```

---

### Task 3: Tag `IMPORTED_FOODS`, part B (choline → vitamin_a) + full typecheck

**Files:**
- Modify: `src/lib/nutrient-reference.data.ts` (lines ~2036–3937: `choline`, `magnesium`, `folate`, `potassium`, `vitamin_c`, `vitamin_a`)

**Interfaces:**
- Consumes: same as Task 2.

- [ ] **Step 1: Tag every entry in the `choline`, `magnesium`, `folate`, `potassium`, `vitamin_c`, and `vitamin_a` arrays**

Same process as Task 2, applied to the remaining six nutrient arrays (lines ~2036–3937).

- [ ] **Step 2: Run full typecheck — must be completely clean now**

Run: `npm run typecheck`
Expected: no errors anywhere (this is the objective, compiler-enforced proof that all ~700 `NutrientFood` entries across both files now carry `storage`).

- [ ] **Step 3: Spot-check classification sanity with an ad-hoc script**

Create a temporary file at the repo root, `scratch-storage-check.ts`:

```ts
import { NUTRIENT_FOODS } from "./src/lib/nutrient-reference";

for (const nutrient of ["iron", "vitamin_c", "zinc"] as const) {
  const foods = NUTRIENT_FOODS[nutrient];
  const fresh = foods.filter((f) => f.storage === "fresh").length;
  const dried = foods.filter((f) => f.storage === "dried").length;
  console.log(`${nutrient}: ${foods.length} total, ${fresh} fresh, ${dried} dried`);
  console.log(
    "  sample:",
    foods.slice(0, 8).map((f) => `${f.name} → ${f.storage}`),
  );
}
```

Run: `npx tsx scratch-storage-check.ts`
Expected: printed samples where produce/meat/dairy/tofu read `fresh` and seeds/lentils/molasses/canned items read `dried`. Eyeball for anything obviously wrong (e.g. "Yogurt" tagged `dried`, "Chia seeds" tagged `fresh`) and fix inline in `nutrient-reference.ts`/`.data.ts` if found.

- [ ] **Step 4: Delete the scratch script**

```bash
rm scratch-storage-check.ts
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/nutrient-reference.data.ts
git commit -m "Tag storage field on imported foods, part B (choline through vitamin_a)"
```

---

### Task 4: Grocery page — fresh-only suggestions + copy pass

**Files:**
- Modify: `src/routes/_authenticated/grocery-list.tsx`

**Interfaces:**
- Consumes: `splitFoodsByStorage` from Task 1 (`src/lib/nutrient-reference.ts`).

- [ ] **Step 1: Swap the suggestions memo to the fresh-only split**

In `grocery-list.tsx`, change the import (line 38):

```ts
import { splitFoodsForNutrient, type NutrientFood } from "@/lib/nutrient-reference";
```

to:

```ts
import { splitFoodsByStorage, type NutrientFood } from "@/lib/nutrient-reference";
```

Then in the `suggestions` memo (around lines 144–170), change:

```ts
  // "Worth adding" — nutrient gaps from recent readings, minus anything
  // already on the list or already sitting active in the pantry.
  const suggestions = useMemo(() => {
    if (!meals.data) return [];
    const activePantryNames = (pantryItems.data ?? [])
      .filter((p) => p.status === "active")
      .map((p) => p.name);
    const listedNames = new Set((groceryItems.data ?? []).map((i) => i.name.toLowerCase()));
    const gaps = computeNutrientCoverage(meals.data).filter((c) => c.isGap);
    const seen = new Set<string>();
    const suggested: (NutrientFood & { nutrient: TrackedNutrient })[] = [];
    for (const gap of gaps) {
      const { tryNew } = splitFoodsForNutrient(
        gap.nutrient,
        activePantryNames,
        3,
        effectiveCuisines,
      );
      for (const food of tryNew) {
        const key = food.name.toLowerCase();
        if (seen.has(key) || listedNames.has(key)) continue;
        seen.add(key);
        suggested.push({ ...food, nutrient: gap.nutrient });
      }
    }
    return suggested;
  }, [meals.data, pantryItems.data, groceryItems.data, effectiveCuisines]);
```

to:

```ts
  // Fresh/fridge nutrient-gap suggestions only — dried-goods gaps show on
  // the Pantry page instead (pantry.tsx). Minus anything already on the
  // list or already sitting active in the pantry.
  const suggestions = useMemo(() => {
    if (!meals.data) return [];
    const activePantryNames = (pantryItems.data ?? [])
      .filter((p) => p.status === "active")
      .map((p) => p.name);
    const listedNames = new Set((groceryItems.data ?? []).map((i) => i.name.toLowerCase()));
    const gaps = computeNutrientCoverage(meals.data).filter((c) => c.isGap);
    const seen = new Set<string>();
    const suggested: (NutrientFood & { nutrient: TrackedNutrient })[] = [];
    for (const gap of gaps) {
      const { tryNew } = splitFoodsByStorage(
        gap.nutrient,
        "fresh",
        activePantryNames,
        3,
        effectiveCuisines,
      );
      for (const food of tryNew) {
        const key = food.name.toLowerCase();
        if (seen.has(key) || listedNames.has(key)) continue;
        seen.add(key);
        suggested.push({ ...food, nutrient: gap.nutrient });
      }
    }
    return suggested;
  }, [meals.data, pantryItems.data, groceryItems.data, effectiveCuisines]);
```

- [ ] **Step 2: Rewrite the page intro copy**

Change (line 176–178):

```tsx
        <p className="mb-6 text-sm text-muted-foreground">
          Items you've marked used up, plus a few food-first ideas worth adding.
        </p>
```

to:

```tsx
        <p className="mb-6 text-sm text-muted-foreground">
          Fresh and fridge things worth picking up on your next trip.
        </p>
```

- [ ] **Step 3: Rewrite the suggestions card heading**

Change (lines 228–232):

```tsx
          <Card className="p-4">
            <p className="mb-1 text-sm font-semibold">Worth adding</p>
            <p className="mb-3 text-xs text-muted-foreground">
              Food-first ideas from your recent Patterns — see the Patterns page for why.
            </p>
```

to:

```tsx
          <Card className="p-4">
            <p className="mb-1 text-sm font-semibold">Try something new</p>
            <p className="mb-3 text-xs text-muted-foreground">
              Fresh, food-first ideas for the nutrients that have been a little light lately.
            </p>
```

- [ ] **Step 4: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/routes/_authenticated/grocery-list.tsx
git commit -m "Filter grocery suggestions to fresh/fridge foods, rewrite page copy"
```

---

### Task 5: Pantry page — dried-goods suggestion tier + copy pass

**Files:**
- Modify: `src/routes/_authenticated/pantry.tsx`

**Interfaces:**
- Consumes: `splitFoodsByStorage` from Task 1; `getLocalPreviewMeals` from `src/lib/preview-meals-store.ts`; `mockMeals` from `src/lib/mock-data.ts`; `computeNutrientCoverage` from `src/lib/trends.ts`; `formatAmount`/`rdiProgressPhrase` from `src/lib/rdi-reference.ts`. All of these already exist and are used the same way in `grocery-list.tsx` — mirror that page's patterns exactly.

- [ ] **Step 1: Add the new imports**

In `pantry.tsx`, add to the existing `useAuth` import line and add several new imports. Change:

```ts
import { useRef, useState } from "react";
```

to:

```ts
import { useMemo, useRef, useState } from "react";
```

Change:

```ts
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
```

to:

```ts
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
```

Change:

```ts
import { mockPantryItems } from "@/lib/mock-data";
```

to:

```ts
import { mockPantryItems, mockMeals } from "@/lib/mock-data";
```

Add after the `preview-pantry-store` import block:

```ts
import { getLocalPreviewMeals } from "@/lib/preview-meals-store";
import { computeNutrientCoverage } from "@/lib/trends";
import { splitFoodsByStorage, type NutrientFood } from "@/lib/nutrient-reference";
import { formatAmount, rdiProgressPhrase } from "@/lib/rdi-reference";
```

Change:

```ts
import type { PantryItem } from "@/lib/pantry.schema";
```

to:

```ts
import type { PantryItem } from "@/lib/pantry.schema";
import type { Meal, TrackedNutrient } from "@/lib/analysis.schema";
```

- [ ] **Step 2: Get `effectiveCuisines` from `useAuth`**

Change:

```ts
  const { user } = useAuth();
```

to:

```ts
  const { user, effectiveCuisines } = useAuth();
```

- [ ] **Step 3: Add a `meals` query**

Directly after the `items` query (after its closing `});`, before `const invalidate = ...`), add:

```ts
  const meals = useQuery({
    queryKey: ["meals", user?.uid],
    enabled: !!user,
    queryFn: async () => {
      if (isMockMode) return isInternalPreviewUnlocked() ? mockMeals : getLocalPreviewMeals();
      const q = query(
        collection(db, "meals"),
        where("patientId", "==", user!.uid),
        orderBy("eatenAt", "desc"),
      );
      const snap = await getDocs(q);
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Meal);
    },
  });
```

- [ ] **Step 4: Add the dried-goods suggestions memo**

Directly after the `meals` query (before `const invalidate = ...`), add:

```ts
  // Dried/shelf-stable nutrient-gap suggestions only — fresh/fridge gaps
  // show on the Grocery page instead (grocery-list.tsx). Minus anything
  // already sitting active in the pantry.
  const suggestions = useMemo(() => {
    if (!meals.data) return [];
    const activePantryNames = (items.data ?? [])
      .filter((p) => p.status === "active")
      .map((p) => p.name);
    const gaps = computeNutrientCoverage(meals.data).filter((c) => c.isGap);
    const seen = new Set<string>();
    const suggested: (NutrientFood & { nutrient: TrackedNutrient })[] = [];
    for (const gap of gaps) {
      const { tryNew } = splitFoodsByStorage(
        gap.nutrient,
        "dried",
        activePantryNames,
        3,
        effectiveCuisines,
      );
      for (const food of tryNew) {
        const key = food.name.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        suggested.push({ ...food, nutrient: gap.nutrient });
      }
    }
    return suggested;
  }, [meals.data, items.data, effectiveCuisines]);
```

- [ ] **Step 5: Add the add-to-pantry handler for suggestions**

Directly after the `remove` function, add:

```ts
  const addSuggestion = async (itemName: string) => {
    if (!user) return;
    if (isMockMode) {
      if (isInternalPreviewUnlocked()) return toast.info("Preview mode — items aren't saved.");
      addLocalPantryItem(itemName);
      toast.success(`Added ${itemName} to your pantry`);
      invalidate();
      return;
    }
    try {
      await addDoc(collection(db, "pantry_items"), {
        patientId: user.uid,
        name: itemName,
        status: "active",
        createdAt: serverTimestamp(),
      });
      toast.success(`Added ${itemName} to your pantry`);
      invalidate();
    } catch (e: any) {
      toast.error(e?.message ?? "Couldn't add item");
    }
  };
```

- [ ] **Step 6: Rewrite the page intro copy**

Change (lines 266–269):

```tsx
        <p className="mb-6 text-sm text-muted-foreground">
          Keep a running list of what's on hand — it helps "Try something new" suggestions on your
          Patterns page tell what you already have from what's worth a grocery trip.
        </p>
```

to:

```tsx
        <p className="mb-6 text-sm text-muted-foreground">
          Dried and shelf-stable staples you keep stocked — what's on hand shapes what your
          Patterns page and grocery list suggest.
        </p>
```

- [ ] **Step 7: Render the suggestions card**

Directly before the closing `</div>` `</AppShell>` (after the "Used up" section, i.e. after the `{usedUp.length > 0 && ( ... )}` block closes), add:

```tsx
        {suggestions.length > 0 && (
          <Card className="mt-6 p-4">
            <p className="mb-1 text-sm font-semibold">Try something new</p>
            <p className="mb-3 text-xs text-muted-foreground">
              Shelf-stable ideas for the nutrients that have been a little light lately.
            </p>
            <div className="space-y-2">
              {suggestions.map((s) => (
                <div key={s.name} className="flex items-center justify-between text-sm">
                  <div>
                    <span className="font-medium">{s.name}</span>
                    <span className="text-muted-foreground"> — {s.reason}</span>
                    {s.amount != null && (
                      <p className="text-xs text-muted-foreground">
                        {s.servingSize ? `${s.servingSize} · ` : ""}
                        about {formatAmount(s.nutrient, s.amount)} —{" "}
                        {rdiProgressPhrase(s.nutrient, s.amount)}
                      </p>
                    )}
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => addSuggestion(s.name)}>
                    <Plus className="mr-1 h-3 w-3" />
                    Add
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        )}
```

Note: the existing `usedUp` block above this is wrapped in a React fragment (`<>...</>`) with no trailing margin, so this new `Card` needs its own `mt-6` (shown above) to keep consistent spacing whether or not the "Used up" section rendered.

- [ ] **Step 8: Typecheck**

Run: `npx tsc --noEmit`
Expected: no errors.

- [ ] **Step 9: Commit**

```bash
git add src/routes/_authenticated/pantry.tsx
git commit -m "Add dried-goods suggestion tier to pantry page, rewrite page copy"
```

---

### Task 6: `docs/VOICE.md` vocabulary row + final full verification

**Files:**
- Modify: `docs/VOICE.md`

- [ ] **Step 1: Add a vocabulary-table row for the grocery/pantry scope split**

In `docs/VOICE.md`'s vocabulary table (after the "Gap suggestions" row, currently line 27), add:

```
| What belongs where | Grocery: "Fresh and fridge things worth picking up on your next trip." Pantry: "Dried and shelf-stable staples you keep stocked — what's on hand shapes what your Patterns page and grocery list suggest." |
```

(These strings must stay verbatim-identical to the copy shipped in Tasks 4 and 5 — if either page's copy changed during implementation, update this row to match, not the other way around.)

- [ ] **Step 2: Full verification suite**

Run each of these in order and confirm clean output:

```bash
npm run typecheck
npm run lint
npm run build
npm run ethos-lint
```

Expected: all four pass with no errors. (Pre-existing CRLF `prettier/prettier` lint noise across unrelated files in this repo is a known, pre-existing condition — not something this change needs to fix; only confirm no *new* lint errors were introduced in the files this plan touched.)

- [ ] **Step 3: Manual verification note for Katelyn**

Not automatable in this sandbox (no real browser) — leave a note for Katelyn to check in a real browser: log meals that create a nutrient gap (or use `/internal-preview` fixture mode, which won't reflect real gaps — a real logged-in or local-preview session is needed), confirm fresh-storage gap foods appear only on the Grocery page and dried-storage gap foods appear only on the Pantry page, and that each "Add" button writes to the correct list.

- [ ] **Step 4: Commit**

```bash
git add docs/VOICE.md
git commit -m "Document grocery/pantry scope in VOICE.md vocabulary table"
```
