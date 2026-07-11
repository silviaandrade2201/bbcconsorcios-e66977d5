import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X, ChevronDown, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";

const WHATSAPP_URL = "https://wa.me/5500000000000";

const consorcioLinks = [
  { title: "O que é Consórcio", href: "/consorcio/o-que-e", desc: "Conceito oficial regulamentado pelo Banco Central." },
  { title: "Como Funciona", href: "/consorcio/como-funciona", desc: "Passo a passo da adesão à contemplação." },
  { title: "Vantagens", href: "/consorcio/vantagens", desc: "Compare consórcio e financiamento." },
];

const atendimentoLinks = [
  { title: "Fale Conosco", href: WHATSAPP_URL, external: true },
  { title: "Atendimento via WhatsApp", href: WHATSAPP_URL, external: true },
  { title: "LGPD", href: "/lgpd", external: false },
];

const sobreLinks = [
  { title: "Nossa História", href: "/sobre/historia" },
  { title: "Trabalhe Conosco", href: "/trabalhe-conosco" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/85 backdrop-blur-lg">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2 shrink-0">
          <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground font-display font-bold text-lg">
            B
          </div>
          <div className="hidden sm:flex flex-col leading-tight">
            <span className="font-display font-bold text-lg text-primary">BBC</span>
            <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Consórcios</span>
          </div>
        </Link>

        <NavigationMenu className="hidden lg:flex">
          <NavigationMenuList>
            <NavigationMenuItem>
              <NavigationMenuTrigger className="bg-transparent font-medium">Consórcio</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[420px] gap-2 p-4">
                  {consorcioLinks.map((l) => (
                    <li key={l.href}>
                      <Link to={l.href} className="block rounded-lg p-3 hover:bg-accent transition-colors">
                        <div className="font-semibold text-foreground">{l.title}</div>
                        <p className="text-sm text-muted-foreground mt-1">{l.desc}</p>
                      </Link>
                    </li>
                  ))}
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuTrigger className="bg-transparent font-medium">Atendimento</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[320px] gap-1 p-3">
                  {atendimentoLinks.map((l) =>
                    l.external ? (
                      <li key={l.title}>
                        <a href={l.href} target="_blank" rel="noopener noreferrer" className="block rounded-lg px-3 py-2 hover:bg-accent transition-colors font-medium">
                          {l.title}
                        </a>
                      </li>
                    ) : (
                      <li key={l.title}>
                        <Link to={l.href} className="block rounded-lg px-3 py-2 hover:bg-accent transition-colors font-medium">
                          {l.title}
                        </Link>
                      </li>
                    ),
                  )}
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <Link
                to="/depoimentos"
                className="inline-flex h-10 items-center rounded-md bg-transparent px-4 py-2 font-medium hover:bg-accent transition-colors"
              >
                Depoimentos
              </Link>
            </NavigationMenuItem>

            <NavigationMenuItem>
              <NavigationMenuTrigger className="bg-transparent font-medium">Sobre Nós</NavigationMenuTrigger>
              <NavigationMenuContent>
                <ul className="grid w-[280px] gap-1 p-3">
                  {sobreLinks.map((l) => (
                    <li key={l.href}>
                      <Link to={l.href} className="block rounded-lg px-3 py-2 hover:bg-accent transition-colors font-medium">
                        {l.title}
                      </Link>
                    </li>
                  ))}
                </ul>
              </NavigationMenuContent>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>

        <div className="flex items-center gap-2">
          <Button asChild variant="default" className="hidden sm:inline-flex gap-2 rounded-full">
            <Link to="/login">
              <User className="h-4 w-4" />
              Área do Cliente
            </Link>
          </Button>
          <button onClick={() => setOpen(!open)} className="lg:hidden grid h-10 w-10 place-items-center rounded-lg hover:bg-accent" aria-label="Menu">
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden border-t border-border bg-background">
          <div className="mx-auto max-w-7xl px-4 py-4 space-y-4">
            <MobileGroup title="Consórcio" items={consorcioLinks.map((l) => ({ title: l.title, href: l.href }))} />
            <MobileGroup title="Atendimento" items={atendimentoLinks} />
            <Link to="/depoimentos" className="block border-b border-border pb-3 font-semibold">
              Depoimentos
            </Link>
            <MobileGroup title="Sobre Nós" items={sobreLinks} />
            <Link to="/login" className="block w-full text-center rounded-full bg-primary text-primary-foreground px-4 py-3 font-medium">
              Área do Cliente
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}

function MobileGroup({
  title,
  items,
}: {
  title: string;
  items: { title: string; href: string; external?: boolean }[];
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="border-b border-border pb-3">
      <button onClick={() => setExpanded(!expanded)} className="flex w-full items-center justify-between py-2 font-semibold">
        {title}
        <ChevronDown className={`h-4 w-4 transition ${expanded ? "rotate-180" : ""}`} />
      </button>
      {expanded && (
        <ul className="mt-2 space-y-1 pl-3">
          {items.map((i) =>
            i.external ? (
              <li key={i.title}>
                <a href={i.href} target="_blank" rel="noopener noreferrer" className="block py-2 text-muted-foreground">
                  {i.title}
                </a>
              </li>
            ) : (
              <li key={i.title}>
                <Link to={i.href} className="block py-2 text-muted-foreground">
                  {i.title}
                </Link>
              </li>
            ),
          )}
        </ul>
      )}
    </div>
  );
}
