"use client";

import { createClient } from "@/api/supabase/client";
import { createContext, useContext, useEffect, useState } from "react";
import { User, SupabaseClient } from "@supabase/supabase-js";

interface AuthContextValue {
  user: User | null;
  role: string | null;
  loading: boolean;
  supabase: SupabaseClient;
}

const supabase = createClient();

const AuthContext = createContext<AuthContextValue>({
  user: null,
  role: null,
  loading: true,
  supabase,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchUserRole = async (userId: string) => {
    const { data, error } = await supabase.from("users").select("role").eq("id", userId).single();

    setRole(!error && data?.role ? data.role : null);
  };

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // INITIAL_SESSION fires once on mount; TOKEN_REFRESHED does not require a role re-fetch
      if (event === "TOKEN_REFRESHED") {
        setUser(session?.user ?? null);
        if (!session) {
          setTimeout(async () => {
            await supabase.auth.signOut({ scope: "global" });
          }, 0);
        }
        return;
      }

      const sessionUser = session?.user ?? null;
      setUser(sessionUser);

      if (event === "SIGNED_IN" && sessionUser) {
        setTimeout(async () => {
          await fetchUserRole(sessionUser.id);
        }, 0);
      } else if (sessionUser) {
        fetchUserRole(sessionUser.id);
      } else {
        setRole(null);
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <AuthContext.Provider value={{ user, role, loading, supabase }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
