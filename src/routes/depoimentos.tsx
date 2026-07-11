import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/page-shell";
import { Quote, Star } from "lucide-react";

export const Route = createFileRoute("/depoimentos")({
  head: () => ({
    meta: [
      { title: "Depoimentos — BBC Consórcios" },
      {
        name: "description",
        content:
          "Histórias reais de quem conquistou o imóvel, o veículo ou a viagem dos sonhos com a BBC Consórcios.",
      },
    ],
  }),
  component: Page,
});

const testimonials = [
  {
    name: "Mariana Ribeiro",
    city: "São Paulo, SP",
    quote:
      "Sempre achei que financiar seria minha única opção. Com a BBC descobri que planejar valia muito mais a pena — em 18 meses fui contemplada e comprei meu apartamento sem juros.",
  },
  {
    name: "Rafael Oliveira",
    city: "Belo Horizonte, MG",
    quote:
      "Atendimento humano do início ao fim. Consegui um lance certeiro e troquei de carro sem me endividar. Recomendo de olhos fechados.",
  },
  {
    name: "Camila Souza",
    city: "Curitiba, PR",
    quote:
      "Transparência total nas assembleias. É o tipo de empresa que a gente sente segurança em confiar o planejamento financeiro da família.",
  },
  {
    name: "Eduardo Martins",
    city: "Recife, PE",
    quote:
      "Comprei a moto que sempre quis e ainda sobrou fôlego no orçamento. O melhor: sem os juros pesados do financiamento.",
  },
];

function Page() {
  return (
    <PageShell
      eyebrow="Clientes BBC"
      title="Depoimentos"
      subtitle="Histórias reais de quem já realizou o sonho da casa própria, do veículo novo ou de um novo negócio com a BBC Consórcios."
    >
      <div className="grid gap-6 md:grid-cols-2">
        {testimonials.map((t) => (
          <article key={t.name} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <Quote className="h-8 w-8 text-primary/40" />
            <p className="mt-4 text-foreground/90 leading-relaxed">“{t.quote}”</p>
            <div className="mt-6 flex items-center justify-between">
              <div>
                <div className="font-semibold text-foreground">{t.name}</div>
                <div className="text-sm text-muted-foreground">{t.city}</div>
              </div>
              <div className="flex gap-0.5 text-primary">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-current" />
                ))}
              </div>
            </div>
          </article>
        ))}
      </div>
    </PageShell>
  );
}
