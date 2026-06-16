import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import type { Json } from "@/integrations/supabase/types";

const AnalyzeInput = z.object({ mealId: z.string().uuid() });

export const analyzeMeal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => AnalyzeInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: meal, error: mealErr } = await supabase
      .from("meals")
      .select("id, patient_id, storage_path, meal_label, patient_notes")
      .eq("id", data.mealId)
      .single();
    if (mealErr || !meal) throw new Error("Meal not found");
    if (meal.patient_id !== userId) {
      const { data: roleRows } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "doctor");
      if (!roleRows || roleRows.length === 0) throw new Error("Forbidden");
    }

    // Use service role to download the image (private bucket)
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: blob, error: dlErr } = await supabaseAdmin.storage
      .from("meal-photos")
      .download(meal.storage_path);
    if (dlErr || !blob) throw new Error("Could not load meal photo");
    const buf = Buffer.from(await blob.arrayBuffer());
    const mime = blob.type || "image/jpeg";
    const dataUrl = `data:${mime};base64,${buf.toString("base64")}`;

    // Pull active rubrics for AI context
    const { data: rubrics } = await supabaseAdmin
      .from("rubrics")
      .select("title, description, extracted_text")
      .eq("is_active", true);
    const rubricContext = (rubrics ?? [])
      .map(
        (r) =>
          `### ${r.title}\n${r.description ?? ""}\n${r.extracted_text ?? ""}`.trim(),
      )
      .join("\n\n---\n\n");

    const systemPrompt = `You are a clinical nutrition assistant supporting a naturopathic doctor.
Analyze the meal photo and return STRICT JSON only matching this TypeScript type:

{
  "meal_name": string,
  "identified_items": string[],
  "estimated_portion": string,
  "macros": { "calories_kcal": number, "protein_g": number, "carbs_g": number, "fat_g": number, "fiber_g": number, "sugar_g": number },
  "key_micros": Array<{ "name": string, "amount": string, "daily_value_pct": number | null }>,
  "rubric_notes": string[],
  "naturopathic_recommendations": string[],
  "concerns": string[],
  "overall_score": number  // 1-10 alignment with the doctor's rubric
}

Use the doctor's rubric below to tailor every comment. If the photo is unclear, make reasonable estimates and flag uncertainty in concerns.
Return ONLY the JSON object, no markdown fences, no preface.

DOCTOR'S RUBRIC AND DIETARY GUIDELINES:
${rubricContext || "(no rubric provided yet — use evidence-based naturopathic nutrition defaults)"}`;

    const userText = `Patient label: ${meal.meal_label ?? "(none)"}\nPatient notes: ${meal.patient_notes ?? "(none)"}\nPlease analyze the attached meal photo.`;

    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI service is not configured");

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Lovable-API-Key": apiKey,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: [
              { type: "text", text: userText },
              { type: "image_url", image_url: { url: dataUrl } },
            ],
          },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (resp.status === 429) throw new Error("AI rate limit reached. Try again shortly.");
    if (resp.status === 402) throw new Error("AI credits exhausted. Please add credits in workspace settings.");
    if (!resp.ok) {
      const t = await resp.text();
      throw new Error(`AI error ${resp.status}: ${t.slice(0, 200)}`);
    }

    const json = await resp.json();
    const content: string = json?.choices?.[0]?.message?.content ?? "{}";
    let analysis: Json;
    try {
      analysis = JSON.parse(content) as Json;
    } catch {
      const m = content.match(/\{[\s\S]*\}/);
      analysis = m ? (JSON.parse(m[0]) as Json) : ({ raw: content } as Json);
    }

    const { error: upErr } = await supabase
      .from("meals")
      .update({ analysis, status: "analyzed" })
      .eq("id", meal.id);
    if (upErr) throw upErr;

    return { ok: true, analysis } as { ok: true; analysis: Json };
  });

const SignInput = z.object({ path: z.string().min(1) });

export const getMealPhotoUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => SignInput.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    // Check access: path must start with userId or caller must be doctor
    const owns = data.path.startsWith(`${userId}/`);
    if (!owns) {
      const { data: roleRows } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "doctor");
      if (!roleRows || roleRows.length === 0) throw new Error("Forbidden");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: signed, error } = await supabaseAdmin.storage
      .from("meal-photos")
      .createSignedUrl(data.path, 60 * 60);
    if (error || !signed) throw new Error("Could not sign URL");
    return { url: signed.signedUrl };
  });