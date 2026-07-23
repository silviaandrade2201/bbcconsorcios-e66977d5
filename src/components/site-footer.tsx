import { Link } from "@tanstack/react-router";
import { Facebook, Instagram, Linkedin, Mail, Phone, MessageCircle } from "lucide-react";

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
            <div className="flex gap-3 mt-5">
              <a href="#" aria-label="Instagram" className="grid h-9 w-9 place-items-center rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20">
                <Instagram className="h-4 w-4" />
              </a>
              <a href="#" aria-label="Facebook" className="grid h-9 w-9 place-items-center rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20">
                <Facebook className="h-4 w-4" />
              </a>
              <a href="#" aria-label="LinkedIn" className="grid h-9 w-9 place-items-center rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20">
                <Linkedin className="h-4 w-4" />
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-primary-foreground/15 flex flex-col md:flex-row items-center justify-between gap-4 text-xs opacity-70">
          <p>© {new Date().getFullYear()} BBC Consórcios. Todos os direitos reservados.</p>
          <p>Administradora de consórcios regulamentada pelo Banco Central do Brasil.</p>
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
