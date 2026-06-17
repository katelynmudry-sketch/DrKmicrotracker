-- Canadian Nutrient File (CNF) reference data, imported by scripts/import-cnf.ts.
-- Static/public dataset — no patient data, no RLS needed beyond read access.
CREATE TABLE public.food_reference (
  food_code INTEGER PRIMARY KEY,
  food_name TEXT NOT NULL,
  food_group TEXT,
  calories_kcal NUMERIC,
  protein_g NUMERIC,
  carbs_g NUMERIC,
  fat_g NUMERIC,
  fiber_g NUMERIC,
  sugar_g NUMERIC,
  vitamin_a_rae_mcg NUMERIC,
  vitamin_c_mg NUMERIC,
  vitamin_d_mcg NUMERIC,
  iron_mg NUMERIC,
  calcium_mg NUMERIC,
  zinc_mg NUMERIC,
  magnesium_mg NUMERIC,
  potassium_mg NUMERIC,
  source_version TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX food_reference_food_name_idx ON public.food_reference USING gin (to_tsvector('english', food_name));
CREATE INDEX food_reference_food_group_idx ON public.food_reference (food_group);

GRANT SELECT ON public.food_reference TO authenticated;
GRANT ALL ON public.food_reference TO service_role;
ALTER TABLE public.food_reference ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can read food reference data" ON public.food_reference
  FOR SELECT TO authenticated USING (true);
