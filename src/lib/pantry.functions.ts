import { createServerFn } from "@tanstack/react-start";
import { requireFirebaseAuth } from "@/integrations/firebase/auth-middleware";
import { z } from "zod";
import { matchFoodToReference } from "@/lib/food-reference.functions";

const ParsedItem = z.object({
  food_name: z.string().min(1),
  quantity: z.number().nullable().optional(),
  unit: z.string().nullable().optional(),
});

async function assertOwnsOrDoctor(userId: string, patientId: string) {
  if (userId === patientId) return;
  const { adminDb } = await import("@/integrations/firebase/admin.server");
  const snap = await adminDb.collection("users").doc(userId).get();
  if (snap.data()?.role !== "doctor") throw new Error("Forbidden");
}

/**
 * Analyzes a pantry photo scan (already uploaded to Storage, doc already
 * created client-side with status "analyzing") and writes back the list of
 * identified items for the patient to confirm. Mirrors the meal-analysis
 * vision-call shape in meals.functions.ts.
 */
export const analyzePantryPhoto = createServerFn({ method: "POST" })
  .middleware([requireFirebaseAuth])
  .inputValidator((input: unknown) => z.object({ scanId: z.string().min(1) }).parse(input))
  .handler(async ({ data, context }) => {
    const { adminDb, adminStorage } = await import("@/integrations/firebase/admin.server");
    const scanRef = adminDb.collection("pantry_scans").doc(data.scanId);
    const scanSnap = await scanRef.get();
    if (!scanSnap.exists) throw new Error("Scan not found");
    const scan = scanSnap.data()!;
    await assertOwnsOrDoctor(context.userId, scan.patientId);
    if (!scan.storagePath) throw new Error("Scan has no photo");

    const file = adminStorage.bucket().file(scan.storagePath);
    const [buf] = await file.download();
    const [meta] = await file.getMetadata();
    const mime = meta.contentType || "image/jpeg";
    const base64 = buf.toString("base64");

    const systemPrompt = `You are a pantry-inventory assistant. Look at the photo of food items (a pantry shelf, fridge, or grocery haul) and return STRICT JSON only matching this TypeScript type:

{ "items": Array<{ "food_name": string, "quantity": number | null, "unit": string | null }> }

List each distinct food item you can identify, with your best estimate of quantity and unit (e.g. "2", "cans"; "1", "bag"). If a photo is unclear, make a reasonable estimate. Return ONLY the JSON object, no markdown fences, no preface.`;

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("AI service is not configured");
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const anthropic = new Anthropic({ apiKey });

    const response = await anthropic.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 1024,
      system: systemPrompt,
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: "Identify the pantry items in this photo." },
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mime as "image/jpeg" | "image/png" | "image/webp" | "image/gif",
                data: base64,
              },
            },
          ],
        },
      ],
    });

    const textBlock = response.content.find((b) => b.type === "text");
    const content = textBlock && textBlock.type === "text" ? textBlock.text : "{}";
    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
    } catch {
      const m = content.match(/\{[\s\S]*\}/);
      parsed = m ? JSON.parse(m[0]) : { items: [] };
    }
    const items = z
      .object({ items: z.array(ParsedItem) })
      .catch({ items: [] })
      .parse(parsed).items;

    await scanRef.update({ parsedItems: items, status: "analyzed" });
    return { items };
  });

/**
 * Writes a patient-confirmed list of parsed scan items into pantry_items,
 * attempting a CNF match for each. Shared by the photo flow now and the
 * voice flow once it ships (both produce the same parsedItems shape).
 */
export const confirmPantryScan = createServerFn({ method: "POST" })
  .middleware([requireFirebaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ scanId: z.string().min(1), items: z.array(ParsedItem) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { adminDb } = await import("@/integrations/firebase/admin.server");
    const scanRef = adminDb.collection("pantry_scans").doc(data.scanId);
    const scanSnap = await scanRef.get();
    if (!scanSnap.exists) throw new Error("Scan not found");
    const scan = scanSnap.data()!;
    await assertOwnsOrDoctor(context.userId, scan.patientId);

    const batch = adminDb.batch();
    for (const item of data.items) {
      const match = await matchFoodToReference(item.food_name);
      const ref = adminDb.collection("pantry_items").doc();
      batch.set(ref, {
        patientId: scan.patientId,
        foodName: item.food_name,
        quantity: item.quantity ?? null,
        unit: item.unit ?? null,
        cnfFoodCode: match.food?.food_code ?? null,
        matchConfidence: match.confidence,
        source: scan.source,
        addedAt: new Date().toISOString(),
        depletedAt: null,
        status: "active",
      });
    }
    batch.update(scanRef, { status: "applied" });
    await batch.commit();
    return { ok: true, count: data.items.length };
  });

export const addPantryItemManual = createServerFn({ method: "POST" })
  .middleware([requireFirebaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        foodName: z.string().min(1),
        quantity: z.number().nullable().optional(),
        unit: z.string().nullable().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { adminDb } = await import("@/integrations/firebase/admin.server");
    const match = await matchFoodToReference(data.foodName);
    const ref = await adminDb.collection("pantry_items").add({
      patientId: context.userId,
      foodName: data.foodName,
      quantity: data.quantity ?? null,
      unit: data.unit ?? null,
      cnfFoodCode: match.food?.food_code ?? null,
      matchConfidence: match.confidence,
      source: "manual",
      addedAt: new Date().toISOString(),
      depletedAt: null,
      status: "active",
    });
    return { id: ref.id };
  });

export const markPantryItemDepleted = createServerFn({ method: "POST" })
  .middleware([requireFirebaseAuth])
  .inputValidator((input: unknown) => z.object({ itemId: z.string().min(1) }).parse(input))
  .handler(async ({ data, context }) => {
    const { adminDb } = await import("@/integrations/firebase/admin.server");
    const itemRef = adminDb.collection("pantry_items").doc(data.itemId);
    const itemSnap = await itemRef.get();
    if (!itemSnap.exists) throw new Error("Pantry item not found");
    const item = itemSnap.data()!;
    await assertOwnsOrDoctor(context.userId, item.patientId);

    await itemRef.update({ status: "depleted", depletedAt: new Date().toISOString() });
    await adminDb.collection("grocery_list_items").add({
      patientId: item.patientId,
      foodName: item.foodName,
      cnfFoodCode: item.cnfFoodCode ?? null,
      reason: "depleted",
      addedAt: new Date().toISOString(),
      checkedAt: null,
      sourcePantryItemId: data.itemId,
    });
    return { ok: true };
  });

export const removePantryItem = createServerFn({ method: "POST" })
  .middleware([requireFirebaseAuth])
  .inputValidator((input: unknown) => z.object({ itemId: z.string().min(1) }).parse(input))
  .handler(async ({ data, context }) => {
    const { adminDb } = await import("@/integrations/firebase/admin.server");
    const itemRef = adminDb.collection("pantry_items").doc(data.itemId);
    const itemSnap = await itemRef.get();
    if (!itemSnap.exists) throw new Error("Pantry item not found");
    const item = itemSnap.data()!;
    await assertOwnsOrDoctor(context.userId, item.patientId);
    await itemRef.update({ status: "removed" });
    return { ok: true };
  });

export const addGroceryListItem = createServerFn({ method: "POST" })
  .middleware([requireFirebaseAuth])
  .inputValidator((input: unknown) => z.object({ foodName: z.string().min(1) }).parse(input))
  .handler(async ({ data, context }) => {
    const { adminDb } = await import("@/integrations/firebase/admin.server");
    const match = await matchFoodToReference(data.foodName);
    const ref = await adminDb.collection("grocery_list_items").add({
      patientId: context.userId,
      foodName: data.foodName,
      cnfFoodCode: match.food?.food_code ?? null,
      reason: "manual",
      addedAt: new Date().toISOString(),
      checkedAt: null,
      sourcePantryItemId: null,
    });
    return { id: ref.id };
  });

export const checkOffGroceryItem = createServerFn({ method: "POST" })
  .middleware([requireFirebaseAuth])
  .inputValidator((input: unknown) => z.object({ itemId: z.string().min(1) }).parse(input))
  .handler(async ({ data, context }) => {
    const { adminDb } = await import("@/integrations/firebase/admin.server");
    const itemRef = adminDb.collection("grocery_list_items").doc(data.itemId);
    const itemSnap = await itemRef.get();
    if (!itemSnap.exists) throw new Error("Grocery item not found");
    const item = itemSnap.data()!;
    await assertOwnsOrDoctor(context.userId, item.patientId);
    await itemRef.update({ checkedAt: new Date().toISOString() });
    return { ok: true };
  });

export const getPantryPhotoUrl = createServerFn({ method: "POST" })
  .middleware([requireFirebaseAuth])
  .inputValidator((input: unknown) => z.object({ path: z.string().min(1) }).parse(input))
  .handler(async ({ data, context }) => {
    const { userId } = context;
    const { adminDb, adminStorage } = await import("@/integrations/firebase/admin.server");
    const owns = data.path.startsWith(`pantry-photos/${userId}/`);
    if (!owns) {
      const userSnap = await adminDb.collection("users").doc(userId).get();
      if (userSnap.data()?.role !== "doctor") throw new Error("Forbidden");
    }
    const [url] = await adminStorage
      .bucket()
      .file(data.path)
      .getSignedUrl({ action: "read", expires: Date.now() + 60 * 60 * 1000 });
    return { url };
  });
