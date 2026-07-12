import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageShell } from "@/components/page-shell";
import { Quote, Star, ChevronLeft, ChevronRight } from "lucide-react";

export const Route = createFileRoute("/depoimentos")({
  head: () => ({
    meta: [
      { title: "Depoimentos — BBC Consórcios" },
      {
        name: "description",
        content:
          "Histórias reais de clientes BBC Consórcios: 20 depoimentos de empresários e investidores de todo o Brasil.",
      },
    ],
  }),
  component: Page,
});

type Testimonial = {
  name: string;
  location: string;
  quote: string;
  photo: string;
};

// Photos: realistic executive-style portraits from randomuser.me (CC0).
const rm = (g: "men" | "women", n: number) => `https://randomuser.me/api/portraits/${g}/${n}.jpg`;

const testimonials: Testimonial[] = [
  { name: "Ricardo Mendes", location: "São Paulo - SP", quote: "Processo extremamente profissional. A mediação estratégica garantiu que a venda da minha empresa ocorresse sob total sigilo e valor justo.", photo: rm("men", 32) },
  { name: "Amanda Schutz", location: "Blumenau - SC", quote: "Excelente atendimento. O formato transparente me deu a segurança que eu precisava para investir no meu primeiro consórcio de alto padrão.", photo: rm("women", 44) },
  { name: "Carlos Eduardo Lima", location: "Goiânia - GO", quote: "Superou minhas expectativas. A equipe filtrou exatamente o público comprador correto, poupando meu tempo e fechando o negócio com maestria.", photo: rm("men", 15) },
  { name: "Mariana Fontes", location: "Rio de Janeiro - RJ", quote: "A atenção aos detalhes e o suporte jurídico durante a transição da minha empresa foram impecáveis. Recomendo de olhos fechados.", photo: rm("women", 68) },
  { name: "Roberto Alencar", location: "Recife - PE", quote: "O atendimento executivo é o grande diferencial. Fui tratado com muita exclusividade desde a primeira reunião até a assinatura do contrato.", photo: rm("men", 52) },
  { name: "Fernanda Prates", location: "Porto Alegre - RS", quote: "Consegui expandir minha frota através do consórcio planejado por eles. Economia real e parcelas que couberam perfeitamente no fluxo de caixa.", photo: rm("women", 12) },
  { name: "Marcos Vinícius", location: "Belo Horizonte - MG", quote: "Discrição e eficiência definem. Vender uma operação em funcionamento é complexo, mas a assessoria deles tornou tudo muito simples.", photo: rm("men", 76) },
  { name: "Juliana Carvalho", location: "Brasília - DF", quote: "Equipe extremamente preparada. O mapeamento de mercado que fizeram para avaliar meu negócio foi cirúrgico e muito realista.", photo: rm("women", 33) },
  { name: "Tiago Castelo", location: "Belém - PA", quote: "Um atendimento focado em soluções. A flexibilidade e a clareza nas explicações sobre as cotas me fizeram fechar o negócio na hora.", photo: rm("men", 41) },
  { name: "Letícia Albuquerque", location: "Curitiba - PR", quote: "O pós-venda deles é excelente. Mesmo após a conclusão da intermediação, continuaram prestando todo o suporte necessário.", photo: rm("women", 21) },
  { name: "Bruno Cavalcanti", location: "Salvador - BA", quote: "Transação rápida, segura e sem burocracia desnecessária. Focaram no que realmente importava para fechar a venda da minha distribuidora.", photo: rm("men", 8) },
  { name: "Camila Negrão", location: "Cuiabá - MT", quote: "Investimento seguro. A equipe desenhou uma estratégia de lances para o consórcio que deu certo muito antes do que eu esperava.", photo: rm("women", 57) },
  { name: "Rodrigo Fonseca", location: "Vitória - ES", quote: "Fiquei impressionado com o nível dos compradores que trouxeram para a mesa de negociação. Público altamente qualificado.", photo: rm("men", 60) },
  { name: "Patrícia Guedes", location: "Manaus - AM", quote: "A abordagem executiva e o posicionamento de mercado deles fazem toda a diferença para quem busca transações de alto valor.", photo: rm("women", 90) },
  { name: "Gustavo Morais", location: "Natal - RN", quote: "Pontuais, profissionais e honestos. Não prometem o impossível, mas entregam o melhor resultado viável com muita agilidade.", photo: rm("men", 23) },
  { name: "Vanessa Toledo", location: "Campinas - SP", quote: "Se você busca um atendimento que entende as dores de um empresário, encontrou. Me senti apoiada durante todo o processo de valuation.", photo: rm("women", 75) },
  { name: "André Junqueira", location: "Uberlândia - MG", quote: "Transparência total em relação às taxas e prazos do consórcio. Sem surpresas na hora da contemplação. Nota 10.", photo: rm("men", 85) },
  { name: "Beatriz Viana", location: "Florianópolis - SC", quote: "Conseguiram alinhar perfeitamente as expectativas entre comprador e vendedor. Uma mediação impecável e muito pacífica.", photo: rm("women", 5) },
  { name: "Marcelo Rocha", location: "Fortaleza - CE", quote: "A estrutura do atendimento remoto deles funciona tão bem que parecia que estavam na sala ao lado. Processo muito fluido.", photo: rm("men", 47) },
  { name: "Elaine Silveira", location: "Campo Grande - MS", quote: "Recomendo para qualquer empresário que queira vender seu legado com a certeza de que ele será entregue em boas mãos.", photo: rm("women", 82) },
];

function Page() {
  const [index, setIndex] = useState(0);
  const total = testimonials.length;
  const t = testimonials[index];

  const prev = () => setIndex((i) => (i - 1 + total) % total);
  const next = () => setIndex((i) => (i + 1) % total);

  return (
    <PageShell
      eyebrow="Clientes BBC"
      title="Depoimentos"
      subtitle="Histórias reais de empresários e investidores que confiaram na BBC Consórcios para transformar seus planos em conquistas."
    >
      <article className="relative rounded-3xl border border-border bg-card p-8 md:p-12 shadow-sm">
        <Quote className="h-10 w-10 text-primary/30" />

        <div className="mt-6 grid gap-8 md:grid-cols-[auto,1fr] md:items-center">
          <img
            src={t.photo}
            alt={`Foto de ${t.name}`}
            loading="lazy"
            className="h-28 w-28 md:h-36 md:w-36 rounded-full object-cover ring-4 ring-primary/10 mx-auto md:mx-0"
          />
          <div>
            <p className="text-lg md:text-xl leading-relaxed text-foreground/90">“{t.quote}”</p>
            <div className="mt-6 flex items-center justify-between flex-wrap gap-3">
              <div>
                <div className="font-semibold text-foreground text-lg">{t.name}</div>
                <div className="text-sm text-muted-foreground">{t.location}</div>
              </div>
              <div className="flex gap-0.5 text-primary" aria-label="5 estrelas">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-current" />
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="mt-10 flex items-center justify-center gap-3">
          <button
            onClick={prev}
            aria-label="Depoimento anterior"
            className="grid h-10 w-10 place-items-center rounded-full border border-border hover:bg-accent transition-colors"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>

          <div className="flex flex-wrap items-center justify-center gap-2 max-w-xl">
            {testimonials.map((_, i) => {
              const active = i === index;
              return (
                <button
                  key={i}
                  onClick={() => setIndex(i)}
                  aria-label={`Ir para depoimento ${i + 1}`}
                  aria-current={active}
                  className={`h-9 w-9 rounded-full text-sm font-semibold transition-colors border ${
                    active
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground hover:bg-accent hover:text-foreground"
                  }`}
                >
                  {i + 1}
                </button>
              );
            })}
          </div>

          <button
            onClick={next}
            aria-label="Próximo depoimento"
            className="grid h-10 w-10 place-items-center rounded-full border border-border hover:bg-accent transition-colors"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>

        <p className="mt-4 text-center text-xs text-muted-foreground">
          {index + 1} de {total}
        </p>
      </article>
    </PageShell>
  );
}
