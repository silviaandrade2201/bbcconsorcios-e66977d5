import { createMiddleware } from "@tanstack/react-start";
import { clienteSupabase, adminSupabase } from "./dual-supabase";

/**
 * Escolhe o bearer token conforme a área de origem da chamada:
 * - rotas administrativas → sessão admin
 * - rotas de cliente → sessão cliente
 * - fallback (páginas públicas chamando serverFn) → tenta admin, depois cliente
 */
export const attachDualSupabaseAuth = createMiddleware({ type: "function" }).client(
  async ({ next }) => {
    let token: string | undefined;
    if (typeof window !== "undefined") {
      const path = window.location.pathname;
      const isClienteArea =
        path.startsWith("/cliente") ||
        path.startsWith("/minha-conta") ||
        path.startsWith("/meus-pedidos") ||
        path.startsWith("/favoritos");
      const isAdminArea = path.startsWith("/admin");
      if (isAdminArea) {
        token = (await adminSupabase.auth.getSession()).data.session?.access_token;
      } else if (isClienteArea) {
        token = (await clienteSupabase.auth.getSession()).data.session?.access_token;
      } else {
        token =
          (await adminSupabase.auth.getSession()).data.session?.access_token ||
          (await clienteSupabase.auth.getSession()).data.session?.access_token;
      }
    }
    return next({ headers: token ? { Authorization: `Bearer ${token}` } : {} });
  },
);
