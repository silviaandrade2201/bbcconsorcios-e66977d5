import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ClienteHeader } from "@/components/cliente-header";
import { ClienteFooter } from "@/components/cliente-footer";
import { useClienteAuth } from "@/lib/auth-context";
import { getMyProfile } from "@/lib/client-profile.functions";
import { listMinhasCartas } from "@/lib/cartas.functions";
import { formatCpf } from "@/lib/cpf";
import {
  User, KeyRound, LogOut, Phone, IdCard, Mail, CreditCard, CalendarClock,
} from "lucide-react";
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

const BRL = new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" });
const fmtBRL = (n: number | null | undefined) =>
  n == null ? "—" : BRL.format(Number(n));
const fmtDate = (s?: string | null) =>
  s ? new Date(s + "T12:00:00").toLocaleDateString("pt-BR") : "—";

function ClienteHome() {
  const { signOut } = useClienteAuth();
  const router = useRouter();
  const fetchProfile = getMyProfile;
  const fetchCartas = listMinhasCartas;
  const { data: profile, isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: fetchProfile,
  });
  const { data: cartas, isLoading: loadingCartas } = useQuery({
    queryKey: ["me", "cartas"],
    queryFn: fetchCartas,
    refetchOnWindowFocus: true,
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
            <p className="text-muted-foreground">Seus dados cadastrais e cartas.</p>
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

        <section className="mt-10">
          <h2 className="font-display text-xl font-semibold text-foreground flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            Minhas cartas
          </h2>
          <p className="text-sm text-muted-foreground">
            Cartas em que você está cadastrado como titular.
          </p>

          <div className="mt-4 grid gap-4">
            {loadingCartas ? (
              <div className="rounded-2xl border border-border bg-card p-6 text-muted-foreground">
                Carregando cartas…
              </div>
            ) : !cartas || cartas.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-card p-6 text-center text-muted-foreground">
                Nenhuma carta vinculada ao seu CPF até o momento.
              </div>
            ) : (
              (cartas as any[]).map((c) => {
                const pagas = c.parcelas_pagas ?? 0;
                const totais = c.parcelas_totais ?? 0;
                const pct = totais > 0 ? Math.round((pagas / totais) * 100) : 0;
                return (
                  <article
                    key={c.id}
                    className="rounded-2xl border border-border bg-card p-5 space-y-4"
                  >
                    <header className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="text-xs uppercase tracking-wide text-muted-foreground">
                          {c.administradora}
                        </div>
                        <div className="font-semibold text-foreground">
                          Grupo {c.grupo} · Cota {c.cota}
                        </div>
                      </div>
                      <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary capitalize">
                        {c.situacao}
                      </span>
                    </header>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                      <MiniInfo label="Valor do bem" value={fmtBRL(c.valor_bem)} />
                      <MiniInfo label="Parcela" value={fmtBRL(c.parcela)} />
                      <MiniInfo label="Parcelas" value={`${pagas}/${totais}`} />
                      <MiniInfo label="Adesão" value={fmtDate(c.data_adesao)} />
                    </div>

                    <div>
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>Progresso</span>
                        <span>{pct}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>

                    {c.proxima_parcela && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <CalendarClock className="h-4 w-4" />
                        Próxima parcela: <strong className="text-foreground">
                          {fmtBRL(c.proxima_parcela.valor)}
                        </strong>{" "}
                        · vence em {fmtDate(c.proxima_parcela.vencimento)}
                      </div>
                    )}
                  </article>
                );
              })
            )}
          </div>
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

function MiniInfo({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="font-medium text-foreground">{value}</div>
    </div>
  );
}
