/**
 * One-time ETL: imports the Canadian Nutrient File (CNF) bulk dataset into
 * the Supabase `food_reference` table.
 *
 * Source data: download the CNF bulk CSV export from Health Canada
 * (https://food-nutrition.canada.ca/cnf-fce/, "Download the Canadian Nutrient
 * File" — Open Government Licence – Canada) and unzip it into ./data/cnf/.
 * Expected files (verify exact names/columns against your downloaded
 * version — CNF has revised its export format before):
 *   - FOOD NAME.csv          (FoodID, FoodCode, FoodGroupID, FoodDescription)
 *   - FOOD GROUP.csv         (FoodGroupID, FoodGroupName)
 *   - NUTRIENT NAME.csv      (NutrientID, NutrientSymbol, NutrientName, NutrientUnit)
 *   - NUTRIENT AMOUNT.csv    (FoodID, NutrientID, NutrientValue)
 *
 * Usage: npm run import:cnf
 */
import { readFile } from "node:fs/promises";
import path from "node:path";
import { parse } from "csv-parse/sync";
import { createClient } from "@supabase/supabase-js";

const DATA_DIR = path.join(process.cwd(), "data", "cnf");
const SOURCE_VERSION = process.env.CNF_SOURCE_VERSION ?? "unspecified";

// Maps CNF NutrientSymbol -> food_reference column. Extend as needed; any
// nutrient not listed here is ignored on import.
const NUTRIENT_SYMBOL_TO_COLUMN: Record<string, string> = {
  ENERC_KCAL: "calories_kcal",
  PROT: "protein_g",
  CHOCDF: "carbs_g",
  FAT: "fat_g",
  FIBTG: "fiber_g",
  SUGAR: "sugar_g",
  VITA_RAE: "vitamin_a_rae_mcg",
  VITC: "vitamin_c_mg",
  VITD: "vitamin_d_mcg",
  FE: "iron_mg",
  CA: "calcium_mg",
  ZN: "zinc_mg",
  MG: "magnesium_mg",
  K: "potassium_mg",
};

async function readCsv(fileName: string): Promise<Record<string, string>[]> {
  const raw = await readFile(path.join(DATA_DIR, fileName), "latin1");
  return parse(raw, { columns: true, skip_empty_lines: true, trim: true });
}

async function main() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running this script.");
  }
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  console.log("Reading CNF source files...");
  const [foodNames, foodGroups, nutrientNames, nutrientAmounts] = await Promise.all([
    readCsv("FOOD NAME.csv"),
    readCsv("FOOD GROUP.csv"),
    readCsv("NUTRIENT NAME.csv"),
    readCsv("NUTRIENT AMOUNT.csv"),
  ]);

  const foodGroupNameById = new Map(foodGroups.map((g) => [g.FoodGroupID, g.FoodGroupName]));
  const nutrientColumnById = new Map(
    nutrientNames
      .filter((n) => NUTRIENT_SYMBOL_TO_COLUMN[n.NutrientSymbol])
      .map((n) => [n.NutrientID, NUTRIENT_SYMBOL_TO_COLUMN[n.NutrientSymbol]]),
  );

  type Row = Record<string, unknown> & { food_code: number };
  const rowsByFoodId = new Map<string, Row>();
  for (const food of foodNames) {
    rowsByFoodId.set(food.FoodID, {
      food_code: Number(food.FoodCode ?? food.FoodID),
      food_name: food.FoodDescription,
      food_group: foodGroupNameById.get(food.FoodGroupID) ?? null,
      source_version: SOURCE_VERSION,
    });
  }

  for (const amount of nutrientAmounts) {
    const column = nutrientColumnById.get(amount.NutrientID);
    if (!column) continue;
    const row = rowsByFoodId.get(amount.FoodID);
    if (!row) continue;
    row[column] = Number(amount.NutrientValue);
  }

  const rows = Array.from(rowsByFoodId.values());
  console.log(`Importing ${rows.length} foods into food_reference...`);

  const BATCH_SIZE = 500;
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const { error } = await supabase
      .from("food_reference")
      .upsert(batch, { onConflict: "food_code" });
    if (error) throw new Error(`Batch ${i / BATCH_SIZE} failed: ${error.message}`);
    console.log(`  ${Math.min(i + BATCH_SIZE, rows.length)}/${rows.length}`);
  }

  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
