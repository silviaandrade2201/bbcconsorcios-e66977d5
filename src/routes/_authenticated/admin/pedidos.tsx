import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout } from "@/components/admin-layout";

export const Route = createFileRoute("/_authenticated/admin/pedidos")({
  head: () => ({ meta: [{ title: "Pedidos — BBC Admin" }] }),
  component: () => (
    <AdminLayout>
      <h1 className="font-display text-3xl font-bold">Pedidos</h1>
      <p className="text-muted-foreground mt-2">Nenhum pedido registrado.</p>
    </AdminLayout>
  ),
});
