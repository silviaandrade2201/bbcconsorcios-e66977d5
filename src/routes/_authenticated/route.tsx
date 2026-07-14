import { createFileRoute, Outlet, redirect, useRouter } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth-context";
import { QueryClient } from "@tanstack/react-query";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ context, location }) => {
    const { queryClient } = context as { queryClient: QueryClient };
    // AuthProvider will mount the session listener; on first server pass we redirect to login.
    if (typeof window !== "undefined") {
      const {
        data: { user },
      } = await import("@/integrations/supabase/client").then((m) => m.supabase.auth.getUser());
      if (!user) {
        throw redirect({ to: "/auth", search: { redirect: location.href } });
      }
    }
    return {};
  },
  component: AuthenticatedLayout,
});

function AuthenticatedLayout() {
  const { isLoading, user } = useAuth();
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="grid min-h-screen place-items-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!user) {
    router.navigate({ to: "/auth" });
    return null;
  }

  return <Outlet />;
}
