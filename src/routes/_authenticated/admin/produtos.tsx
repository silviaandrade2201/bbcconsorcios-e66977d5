import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout } from "@/components/admin-layout";

export const Route = createFileRoute("/_authenticated/admin/produtos")({
  head: () => ({ meta: [{ title: "Produtos — BBC Admin" }] }),
  component: () => (
    <AdminLayout>
      <h1 className="font-display text-3xl font-bold">Produtos</h1>
      <p className="text-muted-foreground mt-2">Gestão de produtos em breve.</p>
    </AdminLayout>
  ),
});
