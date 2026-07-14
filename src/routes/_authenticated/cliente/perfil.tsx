import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getMyProfile, updateMyProfile } from "@/lib/client-profile.functions";
import { mapError } from "@/lib/error-messages";

export const Route = createFileRoute("/_authenticated/cliente/perfil")({
  head: () => ({
    meta: [
      { title: "Meus dados — BBC Consórcios" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: PerfilPage,
});

function maskPhone(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 10) return d.replace(/(\d{2})(\d{4})(\d{0,4})/, "($1) $2-$3").trim();
  return d.replace(/(\d{2})(\d{5})(\d{0,4})/, "($1) $2-$3").trim();
}

function PerfilPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const fetchProfile = useServerFn(getMyProfile);
  const updateFn = useServerFn(updateMyProfile);

  const { data: profile } = useQuery({ queryKey: ["me"], queryFn: fetchProfile });
  const [form, setForm] = useState({ name: "", phone: "", whatsapp: "" });
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name || "",
        phone: maskPhone(profile.phone || ""),
        whatsapp: maskPhone(profile.whatsapp || ""),
      });
    }
  }, [profile]);

  const mutation = useMutation({
    mutationFn: (data: { name: string; phone: string; whatsapp: string }) => updateFn({ data }),
    onSuccess: async () => {
      setMsg({ type: "success", text: "Dados atualizados." });
      await qc.invalidateQueries({ queryKey: ["me"] });
    },
    onError: (e) => setMsg({ type: "error", text: mapError(e) }),
  });

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-xl flex-1 px-4 py-12">
        <h1 className="font-display text-3xl font-bold text-foreground">Meus dados</h1>
        <p className="text-muted-foreground">Atualize seu nome e contatos.</p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            setMsg(null);
            mutation.mutate({ name: form.name.trim(), phone: form.phone, whatsapp: form.whatsapp });
          }}
          className="mt-6 space-y-4 rounded-2xl border border-border bg-card p-6"
        >
          <div className="space-y-1.5">
            <Label>Nome completo</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>Telefone</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: maskPhone(e.target.value) })}
                inputMode="tel"
              />
            </div>
            <div className="space-y-1.5">
              <Label>WhatsApp</Label>
              <Input
                value={form.whatsapp}
                onChange={(e) => setForm({ ...form, whatsapp: maskPhone(e.target.value) })}
                inputMode="tel"
              />
            </div>
          </div>
          {msg && (
            <p className={`text-sm ${msg.type === "success" ? "text-primary" : "text-destructive"}`} role="alert">
              {msg.text}
            </p>
          )}
          <div className="flex justify-between">
            <Button type="button" variant="ghost" className="rounded-full" onClick={() => router.navigate({ to: "/cliente" })}>
              Voltar
            </Button>
            <Button type="submit" disabled={mutation.isPending} className="rounded-full">
              {mutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </div>
        </form>
      </main>
      <SiteFooter />
    </div>
  );
}
