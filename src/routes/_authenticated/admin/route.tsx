import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";

export const Route = createFileRoute("/_authenticated/admin")({
  component: AdminLayout,
  beforeLoad: async () => {
    // Re-checked client-side by useAuth below.
  },
});

function AdminLayout() {
  const { hasRole, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="grid min-h-screen place-items-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!hasRole(["admin", "consultor"])) {
    throw redirect({ to: "/auth", search: { redirect: "/admin" } });
  }

  return <Outlet />;
}
