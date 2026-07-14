import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { ClienteHeader } from "@/components/cliente-header";
import { ClienteFooter } from "@/components/cliente-footer";
import { useClienteAuth } from "@/lib/auth-context";
import { getMyProfile } from "@/lib/client-profile.functions";
import { formatCpf } from "@/lib/cpf";
import { User, KeyRound, LogOut, Phone, IdCard, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/cliente/")({
  head: () => ({
    meta: [
      { title: "Minha Conta — BBC Consórcios" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ClienteHome,
});

function ClienteHome() {
  const { signOut } = useClienteAuth();
  const router = useRouter();
  const fetchProfile = useServerFn(getMyProfile);
  const { data: profile, isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: fetchProfile,
  });

  async function handleSignOut() {
    await signOut();
    router.navigate({ to: "/login" });
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <ClienteHeader />
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 py-12">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">
              Olá, {isLoading ? "…" : profile?.name || "cliente"}
            </h1>
            <p className="text-muted-foreground">Seus dados cadastrais e acessos.</p>
          </div>
          <Button variant="outline" className="rounded-full gap-2" onClick={handleSignOut}>
            <LogOut className="h-4 w-4" /> Sair
          </Button>
        </div>

        <section className="mt-8 grid gap-4 sm:grid-cols-2">
          <InfoCard icon={User} label="Nome" value={profile?.name} loading={isLoading} />
          <InfoCard icon={IdCard} label="CPF" value={formatCpf(profile?.cpf || "")} loading={isLoading} />
          <InfoCard icon={Phone} label="Telefone" value={profile?.phone} loading={isLoading} />
          <InfoCard
            icon={Mail}
            label="E-mail"
            value={profile?.email?.endsWith("@clientes.bbc.local") ? "—" : profile?.email}
            loading={isLoading}
          />
        </section>

        <section className="mt-6 flex flex-wrap gap-3">
          <Button asChild className="rounded-full gap-2">
            <Link to="/cliente/perfil"><User className="h-4 w-4" /> Editar meus dados</Link>
          </Button>
          <Button asChild variant="outline" className="rounded-full gap-2">
            <Link to="/cliente/senha"><KeyRound className="h-4 w-4" /> Alterar senha</Link>
          </Button>
        </section>
      </main>
      <ClienteFooter />
    </div>
  );
}

function InfoCard({
  icon: Icon,
  label,
  value,
  loading,
}: {
  icon: typeof User;
  label: string;
  value?: string | null;
  loading?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className="font-medium text-foreground">{loading ? "…" : value || "—"}</div>
        </div>
      </div>
    </div>
  );
}
