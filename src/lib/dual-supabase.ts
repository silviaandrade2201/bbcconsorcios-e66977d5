import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

function isNewKey(v: string) {
  return v.startsWith("sb_publishable_") || v.startsWith("sb_secret_");
}

function makeFetch(key: string): typeof fetch {
  return (input, init) => {
    const headers = new Headers(init?.headers);
    if (isNewKey(key) && headers.get("Authorization") === `Bearer ${key}`) {
      headers.delete("Authorization");
    }
    headers.set("apikey", key);
    return fetch(input, { ...init, headers });
  };
}

function make(storageKey: string): SupabaseClient<Database> {
  const URL =
    import.meta.env.VITE_SUPABASE_URL ||
    (typeof process !== "undefined" ? process.env.SUPABASE_URL : undefined);
  const KEY =
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    (typeof process !== "undefined" ? process.env.SUPABASE_PUBLISHABLE_KEY : undefined);
  if (!URL || !KEY) throw new Error("Missing Supabase env vars");
  return createClient<Database>(URL, KEY, {
    global: { fetch: makeFetch(KEY) },
    auth: {
      storage: typeof window !== "undefined" ? window.localStorage : undefined,
      storageKey,
      persistSession: true,
      autoRefreshToken: true,
    },
  });
}

let _c: SupabaseClient<Database> | undefined;
let _a: SupabaseClient<Database> | undefined;

/** Sessão exclusiva de CLIENTE (localStorage key: sb-bbc-cliente-auth). */
export const clienteSupabase = new Proxy({} as SupabaseClient<Database>, {
  get(_, p) {
    if (!_c) _c = make("sb-bbc-cliente-auth");
    return Reflect.get(_c, p);
  },
});

/** Sessão exclusiva de ADMIN/CONSULTOR (localStorage key: sb-bbc-admin-auth). */
export const adminSupabase = new Proxy({} as SupabaseClient<Database>, {
  get(_, p) {
    if (!_a) _a = make("sb-bbc-admin-auth");
    return Reflect.get(_a, p);
  },
});
