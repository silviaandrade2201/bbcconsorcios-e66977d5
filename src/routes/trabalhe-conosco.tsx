import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/page-shell";
import { Mail } from "lucide-react";

const RH_EMAIL = "rh@bbcconsorcios.com.br";

export const Route = createFileRoute("/trabalhe-conosco")({
  head: () => ({
    meta: [
      { title: "Trabalhe Conosco — BBC Consórcios" },
      {
        name: "description",
        content:
          "Faça parte do time da BBC Consórcios. Enviamos oportunidades no mercado que mais cresce no Brasil.",
      },
    ],
  }),
  component: Page,
});

function Page() {
  return (
    <PageShell
      eyebrow="Carreiras"
      title="Faça Parte do Nosso Time!"
      subtitle="Cresça profissionalmente no mercado que mais se expande no Brasil."
    >
      <div className="space-y-6 text-lg leading-relaxed text-foreground/90">
        <p>
          Quer crescer profissionalmente no mercado que mais se expande no Brasil? Na <strong>BBC Consórcios</strong>,
          valorizamos talentos que buscam desafios e querem transformar a vida financeira de nossos clientes.
        </p>
        <p>
          Se você é focado em resultados e busca um ambiente dinâmico, envie seu currículo atualizado para o e-mail
          abaixo com o assunto <strong>“Vaga - [Sua Área]”</strong>.
        </p>
      </div>

      <a
        href={`mailto:${RH_EMAIL}?subject=Vaga%20-%20%5BSua%20%C3%81rea%5D`}
        className="mt-8 inline-flex items-center gap-3 rounded-full bg-primary px-6 py-4 font-semibold text-primary-foreground shadow-elegant hover:opacity-90 transition"
      >
        <Mail className="h-5 w-5" />
        Enviar currículo para {RH_EMAIL}
      </a>
    </PageShell>
  );
}
