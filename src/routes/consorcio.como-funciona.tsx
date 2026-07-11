import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/page-shell";

export const Route = createFileRoute("/consorcio/como-funciona")({
  head: () => ({
    meta: [
      { title: "Como Funciona o Consórcio — BBC Consórcios" },
      {
        name: "description",
        content:
          "Entenda o passo a passo do consórcio: adesão, contribuição mensal, contemplação por sorteio ou lance, e entrega do bem via carta de crédito.",
      },
    ],
  }),
  component: Page,
});

const steps = [
  {
    n: "01",
    title: "Adesão",
    desc: "Você escolhe o valor do bem que deseja adquirir (crédito) e o prazo de pagamento. Ao assinar o contrato, você passa a integrar um grupo.",
  },
  {
    n: "02",
    title: "Contribuição Mensal",
    desc: "Todos os integrantes pagam parcelas mensais que, somadas, formam o fundo comum do grupo (o dinheiro usado para comprar os bens).",
  },
  {
    n: "03",
    title: "Contemplação",
    desc: "É o momento de receber o crédito. Ela ocorre exclusivamente por duas vias nas assembleias mensais: Sorteio (sua cota é extraída de forma aleatória e justa) ou Lance (você oferece um valor para antecipar parcelas — o maior lance do mês, conforme as regras do grupo, é o contemplado).",
  },
  {
    n: "04",
    title: "Entrega do Bem",
    desc: "Com a cota contemplada e as garantias aprovadas, a BBC Consórcios libera a carta de crédito para você adquirir o bem que escolher.",
  },
];

function Page() {
  return (
    <PageShell
      eyebrow="Consórcio"
      title="Como Funciona"
      subtitle="Do momento da adesão até a entrega do bem — um caminho claro, transparente e planejado."
    >
      <ol className="space-y-6">
        {steps.map((s) => (
          <li key={s.n} className="flex gap-6 rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground font-display text-xl font-bold">
              {s.n}
            </div>
            <div>
              <h3 className="font-display text-xl font-bold text-foreground">{s.title}</h3>
              <p className="mt-2 text-muted-foreground leading-relaxed">{s.desc}</p>
            </div>
          </li>
        ))}
      </ol>
    </PageShell>
  );
}
