import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

type AppRole = "admin" | "consultor" | "cliente";

interface AuthState {
  user: User | null;
  role: AppRole | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: Error }>;
  signInWithCPF: (cpf: string, password: string) => Promise<{ error?: Error }>;
  signOut: () => Promise<void>;
  hasRole: (roles: AppRole[]) => boolean;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshRole = useCallback(async (uid: string) => {
    const { data, error } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", uid)
      .maybeSingle();
    if (!error && data) {
      setRole(data.role as AppRole);
    } else {
      setRole(null);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      setUser(data.user ?? null);
      if (data.user) {
        refreshRole(data.user.id).finally(() => setIsLoading(false));
      } else {
        setIsLoading(false);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!mounted) return;
      const nextUser = session?.user ?? null;
      setUser(nextUser);
      if (nextUser) {
        refreshRole(nextUser.id);
      } else {
        setRole(null);
      }
    });

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [refreshRole]);

  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error };
    if (data.user) await refreshRole(data.user.id);
    return {};
  }, [refreshRole]);

  const signInWithCPF = useCallback(async (cpf: string, password: string) => {
    const clean = cpf.replace(/\D/g, "");
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("email")
      .eq("cpf", clean)
      .maybeSingle();
    if (profileError || !profile?.email) {
      return { error: new Error("CPF não encontrado ou senha inválida.") };
    }
    return signIn(profile.email, password);
  }, [signIn]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setRole(null);
  }, []);

  const hasRole = useCallback(
    (roles: AppRole[]) => (role ? roles.includes(role) : false),
    [role],
  );

  return (
    <AuthContext.Provider
      value={{ user, role, isLoading, signIn, signInWithCPF, signOut, hasRole }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
