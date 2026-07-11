import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/page-shell";
import { ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/lgpd")({
  head: () => ({
    meta: [
      { title: "LGPD — BBC Consórcios" },
      {
        name: "description",
        content:
          "Como a BBC Consórcios trata seus dados pessoais em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018).",
      },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <PageShell
      eyebrow="Privacidade"
      title="LGPD — Lei Geral de Proteção de Dados"
      subtitle="Sua privacidade é levada a sério. Aqui está como tratamos seus dados."
    >
      <div className="rounded-2xl border border-border bg-card p-8 shadow-sm">
        <div className="flex items-start gap-4">
          <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <p className="text-lg leading-relaxed text-foreground/90">
            A <strong>BBC Consórcios</strong> respeita a sua privacidade. Em conformidade com a LGPD
            (Lei nº 13.709/2018), informamos que seus dados pessoais coletados em nossos canais são utilizados
            estritamente para o atendimento de suas solicitações, simulações de crédito e relacionamento comercial.
            Garantimos a transparência, segurança e o direito de acesso ou exclusão dos seus dados a qualquer momento.
            Para dúvidas sobre como tratamos seus dados, entre em contato com nosso encarregado pelo canal de atendimento.
          </p>
        </div>
      </div>
    </PageShell>
  );
}
