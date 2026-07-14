import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout } from "@/components/admin-layout";
import { useAuth } from "@/lib/auth-context";
import { Users, UserCog, CreditCard, Award, UserPlus } from "lucide-react";

export const Route = createFileRoute("/_authenticated/admin/")({
  head: () => ({
    meta: [
      { title: "Dashboard — BBC Consórcios" },
      { name: "description", content: "Dashboard administrativo da BBC Consórcios." },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { role } = useAuth();
  const isAdmin = role === "admin";

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Visão geral da plataforma.</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard icon={Users} label="Clientes" value="0" />
          {isAdmin && <StatCard icon={UserCog} label="Consultores" value="0" />}
          <StatCard icon={CreditCard} label="Cartas disponíveis" value="0" />
          <StatCard icon={Award} label="Cartas vendidas" value="0" />
          {isAdmin && <StatCard icon={UserPlus} label="Novos cadastros" value="0" />}
        </div>

        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="font-semibold text-lg mb-4">Histórico de atividades</h2>
          <p className="text-sm text-muted-foreground">Nenhuma atividade recente.</p>
        </div>
      </div>
    </AdminLayout>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: typeof Users; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-5 hover:shadow-card transition-shadow">
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <div className="text-2xl font-display font-bold text-foreground">{value}</div>
          <div className="text-xs text-muted-foreground">{label}</div>
        </div>
      </div>
    </div>
  );
}
