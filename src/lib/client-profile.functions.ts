import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const updateSchema = z.object({
  name: z.string().min(2, "Informe seu nome"),
  phone: z.string().optional(),
  whatsapp: z.string().optional(),
});

export const getMyProfile = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("profiles")
      .select("id, name, cpf, phone, whatsapp, email, status, consultor_id, consultor:consultor_id(name)")
      .eq("user_id", context.userId)
      .maybeSingle();
    if (error) throw error;
    return data;
  });

export const updateMyProfile = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input) => updateSchema.parse(input))
  .handler(async ({ data, context }) => {
    const phone = data.phone?.replace(/\D/g, "") || null;
    const whatsapp = data.whatsapp?.replace(/\D/g, "") || phone;
    const { error } = await context.supabase
      .from("profiles")
      .update({ name: data.name.trim(), phone, whatsapp })
      .eq("user_id", context.userId);
    if (error) throw error;
    return { ok: true };
  });
