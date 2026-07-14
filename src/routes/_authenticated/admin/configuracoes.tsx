import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout } from "@/components/admin-layout";

export const Route = createFileRoute("/_authenticated/admin/configuracoes")({
  head: () => ({ meta: [{ title: "Configurações — BBC Admin" }] }),
  component: () => (
    <AdminLayout>
      <h1 className="font-display text-3xl font-bold">Configurações</h1>
      <p className="text-muted-foreground mt-2">Painel de configurações em breve.</p>
    </AdminLayout>
  ),
});
