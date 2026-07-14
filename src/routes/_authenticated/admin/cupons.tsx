import { createFileRoute } from "@tanstack/react-router";
import { AdminLayout } from "@/components/admin-layout";

export const Route = createFileRoute("/_authenticated/admin/cupons")({
  head: () => ({ meta: [{ title: "Cupons — BBC Admin" }] }),
  component: () => (
    <AdminLayout>
      <h1 className="font-display text-3xl font-bold">Cupons</h1>
      <p className="text-muted-foreground mt-2">Gestão de cupons em breve.</p>
    </AdminLayout>
  ),
});
