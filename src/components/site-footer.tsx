import { Link } from "@tanstack/react-router";
import { Mail, Phone, MessageCircle, Building2, MapPin, Clock, FileText, Award } from "lucide-react";

const WHATSAPP_URL = "https://wa.me/551140966528";

export function SiteFooter() {
  return (
    <footer className="bg-primary text-primary-foreground">
      <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid gap-10 md:grid-cols-4">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary-foreground text-primary font-display font-bold">
                B
              </div>
              <div className="leading-tight">
                <div className="font-display font-bold text-lg">BBC</div>
                <div className="text-[10px] uppercase tracking-widest opacity-70">Consórcios</div>
              </div>
            </div>
            <p className="text-sm opacity-80 leading-relaxed">
              Consórcios planejados, seguros e transparentes. Regulamentados pelo Banco Central do Brasil.
            </p>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Consórcio</h4>
            <ul className="space-y-2 text-sm opacity-80">
              <li><Link to="/consorcio/o-que-e" className="hover:opacity-100">O que é Consórcio</Link></li>
              <li><Link to="/consorcio/como-funciona" className="hover:opacity-100">Como Funciona</Link></li>
              <li><Link to="/consorcio/vantagens" className="hover:opacity-100">Vantagens</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Institucional</h4>
            <ul className="space-y-2 text-sm opacity-80">
              <li><Link to="/sobre/historia" className="hover:opacity-100">Nossa História</Link></li>
              <li><Link to="/depoimentos" className="hover:opacity-100">Depoimentos</Link></li>
              <li><Link to="/trabalhe-conosco" className="hover:opacity-100">Trabalhe Conosco</Link></li>
              <li><Link to="/lgpd" className="hover:opacity-100">LGPD</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Contato</h4>
            <ul className="space-y-3 text-sm opacity-80">
              <li>
                <a href="tel:+551140966528" className="flex items-center gap-2 hover:opacity-100">
                  <Phone className="h-4 w-4" /> (11) 4096-6528
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Mail className="h-4 w-4" /> contato@bbcconsorcios.com.br
              </li>
              <li>
                <a
                  href={WHATSAPP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-full bg-[var(--color-whatsapp)] px-4 py-2 font-medium text-white hover:opacity-90"
                >
                  <MessageCircle className="h-4 w-4" /> WhatsApp
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-primary-foreground/15">
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 text-sm opacity-90">
            <div className="flex items-start gap-3">
              <Building2 className="h-4 w-4 mt-0.5 opacity-70 shrink-0" />
              <div>
                <p className="font-medium">BBC Administradora de Consórcios Ltda</p>
                <p className="text-xs opacity-70 mt-1">Regulamentada pelo Banco Central do Brasil</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <FileText className="h-4 w-4 mt-0.5 opacity-70 shrink-0" />
              <div>
                <p className="font-medium">CNPJ</p>
                <p className="opacity-80">36.770.683/0001-03</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <MapPin className="h-4 w-4 mt-0.5 opacity-70 shrink-0" />
              <div>
                <p className="font-medium">Endereço</p>
                <p className="opacity-80">R. Dr. Renato Paes de Barros, 1017</p>
                <p className="opacity-80">Itaim Bibi – São Paulo/SP</p>
                <p className="opacity-80">CEP: 04530-001</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Clock className="h-4 w-4 mt-0.5 opacity-70 shrink-0" />
              <div>
                <p className="font-medium">Horário de Atendimento</p>
                <p className="opacity-80">Segunda a Sexta-feira</p>
                <p className="opacity-80">das 09h às 18h</p>
              </div>
            </div>
          </div>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 rounded-2xl bg-primary-foreground/95 p-5 md:p-6 text-center text-primary">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider opacity-80">
              <Award className="h-3.5 w-3.5" />
              Reconhecimento
            </div>
            <img
              src="/selo-premio-ra-2025.png"
              alt="Selo Prêmio RA 2025 - Empresa Indicada"
              loading="lazy"
              width={256}
              height={128}
              className="h-auto max-w-[200px] md:max-w-[240px]"
            />
            <p className="max-w-md text-[11px] opacity-70">
              BBC Consórcios indicada ao Prêmio RA 2025 na categoria Empresa Indicada.
            </p>
          </div>

          <div className="mt-8 pt-6 border-t border-primary-foreground/10 flex flex-col md:flex-row items-center justify-between gap-4 text-xs opacity-60">
            <p>© {new Date().getFullYear()} BBC Consórcios. Todos os direitos reservados.</p>
            <p>Administradora de consórcios regulamentada pelo Banco Central do Brasil.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}

export function WhatsappFloat() {
  return (
    <a
      href={WHATSAPP_URL}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Fale conosco no WhatsApp"
      className="fixed bottom-6 right-6 z-40 grid h-14 w-14 place-items-center rounded-full bg-[var(--color-whatsapp)] text-white shadow-elegant hover:scale-110 transition-transform"
    >
      <MessageCircle className="h-6 w-6" />
    </a>
  );
}
