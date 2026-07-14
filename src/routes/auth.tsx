import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Lock, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Acesso — BBC Consórcios" },
      { name: "description", content: "Acesse sua conta administrativa ou de cliente na BBC Consórcios." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const [mode, setMode] = useState<"admin" | "cliente">("admin");
  const [email, setEmail] = useState("");
  const [cpf, setCpf] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signIn, signInWithCPF } = useAuth();
  const navigate = useNavigate();
  const search = useSearch({ from: "/auth" });
  const redirect = (search as { redirect?: string }).redirect || "/admin";

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const result =
        mode === "admin"
          ? await signIn(email, password)
          : await signInWithCPF(cpf, password);
      if (result.error) throw result.error;
      navigate({ to: redirect });
    } catch (err) {
      setError((err as Error).message || "Credenciais inválidas.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <main className="mx-auto max-w-md px-4 py-16">
        <div className="text-center mb-8">
          <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-primary text-primary-foreground">
            <ShieldCheck className="h-7 w-7" />
          </div>
          <h1 className="mt-4 font-display text-2xl font-bold text-foreground">Área Restrita</h1>
          <p className="mt-2 text-sm text-muted-foreground">Acesse sua conta administrativa ou de cliente.</p>
        </div>

        <Tabs value={mode} onValueChange={(v) => setMode(v as "admin" | "cliente")} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="admin">Admin / Consultor</TabsTrigger>
            <TabsTrigger value="cliente">Cliente</TabsTrigger>
          </TabsList>

          <TabsContent value="admin">
            <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
              <label className="block">
                <span className="text-sm font-medium text-foreground">E-mail</span>
                <div className="mt-1 flex items-center gap-2 rounded-lg border border-input bg-background px-3 py-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-transparent outline-none"
                    placeholder="seu@email.com"
                    required
                  />
                </div>
              </label>
              <label className="block">
                <span className="text-sm font-medium text-foreground">Senha</span>
                <div className="mt-1 flex items-center gap-2 rounded-lg border border-input bg-background px-3 py-2">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-transparent outline-none"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </label>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" disabled={loading} className="w-full rounded-full">
                {loading ? "Entrando..." : "Entrar"}
              </Button>
            </form>
          </TabsContent>

          <TabsContent value="cliente">
            <form onSubmit={handleSubmit} className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-4">
              <label className="block">
                <span className="text-sm font-medium text-foreground">CPF</span>
                <div className="mt-1 flex items-center gap-2 rounded-lg border border-input bg-background px-3 py-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <input
                    value={cpf}
                    onChange={(e) => setCpf(e.target.value)}
                    className="w-full bg-transparent outline-none"
                    placeholder="000.000.000-00"
                    required
                  />
                </div>
              </label>
              <label className="block">
                <span className="text-sm font-medium text-foreground">Senha</span>
                <div className="mt-1 flex items-center gap-2 rounded-lg border border-input bg-background px-3 py-2">
                  <Lock className="h-4 w-4 text-muted-foreground" />
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-transparent outline-none"
                    placeholder="••••••••"
                    required
                  />
                </div>
              </label>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" disabled={loading} className="w-full rounded-full">
                {loading ? "Entrando..." : "Entrar"}
              </Button>
            </form>
          </TabsContent>
        </Tabs>

        <div className="mt-6 text-center">
          <Link to="/" className="text-sm text-muted-foreground hover:text-foreground">
            Voltar para o site
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
