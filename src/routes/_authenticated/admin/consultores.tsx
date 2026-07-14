import { createFileRoute, Link } from "@tanstack/react-router";
import { AdminLayout } from "@/components/admin-layout";

export const Route = createFileRoute("/_authenticated/admin/consultores")({
  head: () => ({ meta: [{ title: "Consultores — BBC Admin" }] }),
  component: () => (
    <AdminLayout>
      <h1 className="font-display text-3xl font-bold">Consultores</h1>
      <p className="text-muted-foreground mt-2">
        Consultores são cadastrados via <Link className="text-primary underline" to="/admin/usuarios">Usuários</Link> selecionando o papel "Consultor".
      </p>
    </AdminLayout>
  ),
});
