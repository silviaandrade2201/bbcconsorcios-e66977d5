import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/page-shell";
import { User, Lock } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Área do Cliente — BBC Consórcios" },
      { name: "description", content: "Acesse sua conta na BBC Consórcios para acompanhar seu grupo, boletos e assembleias." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <PageShell eyebrow="Acesso" title="Área do Cliente" subtitle="Acompanhe seu grupo, boletos e resultados das assembleias.">
      <form
        onSubmit={(e) => e.preventDefault()}
        className="mx-auto max-w-md rounded-2xl border border-border bg-card p-8 shadow-sm space-y-5"
      >
        <label className="block">
          <span className="text-sm font-medium text-foreground">CPF / CNPJ</span>
          <div className="mt-1 flex items-center gap-2 rounded-lg border border-input bg-background px-3 py-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <input className="w-full bg-transparent outline-none" placeholder="000.000.000-00" />
          </div>
        </label>
        <label className="block">
          <span className="text-sm font-medium text-foreground">Senha</span>
          <div className="mt-1 flex items-center gap-2 rounded-lg border border-input bg-background px-3 py-2">
            <Lock className="h-4 w-4 text-muted-foreground" />
            <input type="password" className="w-full bg-transparent outline-none" placeholder="••••••••" />
          </div>
        </label>
        <button className="w-full rounded-full bg-primary py-3 font-semibold text-primary-foreground hover:opacity-90 transition">
          Entrar
        </button>
        <p className="text-center text-sm text-muted-foreground">
          Ainda não é cliente?{" "}
          <Link to="/" className="text-primary font-medium hover:underline">
            Simule seu plano
          </Link>
        </p>
      </form>
    </PageShell>
  );
}
