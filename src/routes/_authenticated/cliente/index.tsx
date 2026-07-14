import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { useClienteAuth } from "@/lib/auth-context";
import { User, FileText, Heart, ShoppingBag, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/cliente/")({
  head: () => ({
    meta: [
      { title: "Minha Conta — BBC Consórcios" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ClienteHome,
});

const cards = [
  { title: "Minha Conta", desc: "Dados pessoais e preferências.", href: "/minha-conta", icon: User },
  { title: "Meus Pedidos", desc: "Acompanhe pedidos e assembleias.", href: "/meus-pedidos", icon: ShoppingBag },
  { title: "Favoritos", desc: "Cartas e planos salvos.", href: "/favoritos", icon: Heart },
  { title: "Documentos", desc: "Contratos e comprovantes.", href: "/cliente", icon: FileText },
];

function ClienteHome() {
  const { user, signOut } = useClienteAuth();
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-12">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="font-display text-3xl font-bold text-foreground">
              Olá, {user?.email}
            </h1>
            <p className="text-muted-foreground">Bem-vindo à sua área de cliente.</p>
          </div>
          <Button variant="outline" className="rounded-full gap-2" onClick={() => signOut()}>
            <LogOut className="h-4 w-4" /> Sair
          </Button>
        </div>

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {cards.map((c) => (
            <Link
              key={c.title}
              to={c.href}
              className="rounded-2xl border border-border bg-card p-5 hover:shadow-card transition-shadow"
            >
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary mb-3">
                <c.icon className="h-5 w-5" />
              </div>
              <div className="font-semibold text-foreground">{c.title}</div>
              <p className="text-sm text-muted-foreground mt-1">{c.desc}</p>
            </Link>
          ))}
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
