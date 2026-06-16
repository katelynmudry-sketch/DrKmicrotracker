import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

async function assertDoctor(supabase: any, userId: string) {
  const { data } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .eq("role", "doctor");
  if (!data || data.length === 0) throw new Error("Forbidden: doctor only");
}

export const getRubricFileUrl = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ path: z.string() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertDoctor(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: signed, error } = await supabaseAdmin.storage
      .from("rubrics")
      .createSignedUrl(data.path, 60 * 60);
    if (error || !signed) throw new Error("Sign failed");
    return { url: signed.signedUrl };
  });

export const promoteToDoctor = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ email: z.string().email() }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertDoctor(context.supabase, context.userId);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: list, error: lerr } = await supabaseAdmin
      .from("profiles")
      .select("id, email")
      .eq("email", data.email)
      .maybeSingle();
    if (lerr || !list) throw new Error("User with that email not found");
    const { error } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: list.id, role: "doctor" });
    if (error && !error.message.includes("duplicate")) throw error;
    return { ok: true };
  });

/**
 * Bootstrap: claim doctor role if no doctor exists yet.
 * Open by design for first-run setup of the practice.
 */
export const claimDoctorIfNone = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { count } = await supabaseAdmin
      .from("user_roles")
      .select("*", { count: "exact", head: true })
      .eq("role", "doctor");
    if ((count ?? 0) > 0) return { claimed: false };
    const { error } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: context.userId, role: "doctor" });
    if (error) throw error;
    return { claimed: true };
  });