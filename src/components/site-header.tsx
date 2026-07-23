import { Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Menu, X, ChevronDown, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useClienteAuth } from "@/lib/auth-context";
import logoAsset from "@/assets/logo-bbc.jpeg.asset.json";

const WHATSAPP_URL = "https://wa.me/551140966528";

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

type MenuKey = "consorcio" | "atendimento" | "sobre" | null;

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [menu, setMenu] = useState<MenuKey>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const { user, signOut } = useClienteAuth();
  const isCliente = !!user;

  useEffect(() => {
    if (!menu) return;
    const onDown = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setMenu(null);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenu(null);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [menu]);

  const toggle = (k: Exclude<MenuKey, null>) => setMenu((prev) => (prev === k ? null : k));
  const close = () => setMenu(null);

  const triggerCls = (active: boolean) =>
    `inline-flex h-10 items-center gap-1 rounded-md px-4 py-2 font-medium transition-colors ${
      active ? "bg-accent text-accent-foreground" : "hover:bg-accent"
    }`;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/85 backdrop-blur-lg">
      <div className="mx-auto flex h-24 max-w-screen-2xl items-center justify-between gap-6 px-4 sm:px-6 lg:px-10">
        <Link to="/" className="flex items-center gap-3 shrink-0" onClick={close}>
          <img
            src={logoAsset.url}
            alt="BBC Consórcios"
            className="h-16 w-16 rounded-2xl object-cover shadow-md ring-1 ring-border"
          />
          <div className="hidden sm:flex flex-col leading-tight">
            <span className="font-display font-extrabold text-2xl text-primary tracking-tight">BBC</span>
            <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-semibold">Consórcios</span>
          </div>
        </Link>

        <nav ref={navRef} className="hidden lg:block relative">
          <ul className="flex items-center gap-1">
            <li className="relative">
              <button
                type="button"
                onClick={() => toggle("consorcio")}
                aria-expanded={menu === "consorcio"}
                className={triggerCls(menu === "consorcio")}
              >
                Consórcio
                <ChevronDown className={`h-4 w-4 transition ${menu === "consorcio" ? "rotate-180" : ""}`} />
              </button>
              {menu === "consorcio" && (
                <div className="absolute left-0 top-full mt-2 rounded-lg border border-border bg-popover shadow-lg">
                  <ul className="grid w-[420px] gap-2 p-4">
                    {consorcioLinks.map((l) => (
                      <li key={l.href}>
                        <Link
                          to={l.href}
                          onClick={close}
                          className="block rounded-lg p-3 hover:bg-accent transition-colors"
                        >
                          <div className="font-semibold text-foreground">{l.title}</div>
                          <p className="text-sm text-muted-foreground mt-1">{l.desc}</p>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </li>

            <li className="relative">
              <button
                type="button"
                onClick={() => toggle("atendimento")}
                aria-expanded={menu === "atendimento"}
                className={triggerCls(menu === "atendimento")}
              >
                Atendimento
                <ChevronDown className={`h-4 w-4 transition ${menu === "atendimento" ? "rotate-180" : ""}`} />
              </button>
              {menu === "atendimento" && (
                <div className="absolute left-0 top-full mt-2 rounded-lg border border-border bg-popover shadow-lg">
                  <ul className="grid w-[320px] gap-1 p-3">
                    {atendimentoLinks.map((l) =>
                      l.external ? (
                        <li key={l.title}>
                          <a
                            href={l.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            onClick={close}
                            className="block rounded-lg px-3 py-2 hover:bg-accent transition-colors font-medium"
                          >
                            {l.title}
                          </a>
                        </li>
                      ) : (
                        <li key={l.title}>
                          <Link
                            to={l.href}
                            onClick={close}
                            className="block rounded-lg px-3 py-2 hover:bg-accent transition-colors font-medium"
                          >
                            {l.title}
                          </Link>
                        </li>
                      ),
                    )}
                  </ul>
                </div>
              )}
            </li>

            <li>
              <Link
                to="/depoimentos"
                onClick={close}
                className="inline-flex h-10 items-center rounded-md px-4 py-2 font-medium hover:bg-accent transition-colors"
              >
                Depoimentos
              </Link>
            </li>

            <li className="relative">
              <button
                type="button"
                onClick={() => toggle("sobre")}
                aria-expanded={menu === "sobre"}
                className={triggerCls(menu === "sobre")}
              >
                Sobre Nós
                <ChevronDown className={`h-4 w-4 transition ${menu === "sobre" ? "rotate-180" : ""}`} />
              </button>
              {menu === "sobre" && (
                <div className="absolute right-0 top-full mt-2 rounded-lg border border-border bg-popover shadow-lg">
                  <ul className="grid w-[280px] gap-1 p-3">
                    {sobreLinks.map((l) => (
                      <li key={l.href}>
                        <Link
                          to={l.href}
                          onClick={close}
                          className="block rounded-lg px-3 py-2 hover:bg-accent transition-colors font-medium"
                        >
                          {l.title}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </li>
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          {isCliente ? (
            <>
              <Button asChild variant="default" className="hidden sm:inline-flex gap-2 rounded-full">
                <Link to="/cliente">
                  <User className="h-4 w-4" />
                  Minha Conta
                </Link>
              </Button>
              <Button
                variant="outline"
                size="icon"
                className="hidden sm:inline-flex rounded-full"
                onClick={() => signOut()}
                title="Sair"
              >
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button asChild variant="default" className="hidden sm:inline-flex gap-2 rounded-full">
              <Link to="/login">
                <User className="h-4 w-4" />
                Área do Cliente
              </Link>
            </Button>
          )}
          <button
            onClick={() => setOpen(!open)}
            className="lg:hidden grid h-10 w-10 place-items-center rounded-lg hover:bg-accent"
            aria-label="Menu"
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden border-t border-border bg-background">
          <div className="mx-auto max-w-screen-2xl px-4 py-4 space-y-4">
            <MobileGroup title="Consórcio" items={consorcioLinks.map((l) => ({ title: l.title, href: l.href }))} />
            <MobileGroup title="Atendimento" items={atendimentoLinks} />
            <Link to="/depoimentos" className="block border-b border-border pb-3 font-semibold">
              Depoimentos
            </Link>
            <MobileGroup title="Sobre Nós" items={sobreLinks} />
            {isCliente ? (
              <>
                <Link
                  to="/cliente"
                  className="block w-full text-center rounded-full bg-primary text-primary-foreground px-4 py-3 font-medium"
                >
                  Minha Conta
                </Link>
                <button
                  onClick={() => signOut()}
                  className="block w-full text-center rounded-full border border-border px-4 py-3 font-medium"
                >
                  Sair
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="block w-full text-center rounded-full bg-primary text-primary-foreground px-4 py-3 font-medium"
              >
                Área do Cliente
              </Link>
            )}
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
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between py-2 font-semibold"
      >
        {title}
        <ChevronDown className={`h-4 w-4 transition ${expanded ? "rotate-180" : ""}`} />
      </button>
      {expanded && (
        <ul className="mt-2 space-y-1 pl-3">
          {items.map((i) =>
            i.external ? (
              <li key={i.title}>
                <a
                  href={i.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block py-2 text-muted-foreground"
                >
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
