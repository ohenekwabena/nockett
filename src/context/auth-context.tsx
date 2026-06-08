"use client";

import { createClient } from "@/api/supabase/client";
import { createContext, useContext, useEffect, useState } from "react";
import { User, SupabaseClient } from "@supabase/supabase-js";
import { getProfile, isAdmin as roleIsAdmin, type Role } from "@/lib/identity";

interface AuthContextValue {
  user: User | null;
  role: Role | null;
  isAdmin: boolean;
  loading: boolean;
  supabase: SupabaseClient;
}

const supabase = createClient();

const AuthContext = createContext<AuthContextValue>({
  user: null,
  role: null,
  isAdmin: false,
  loading: true,
  supabase,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState(true);

  // Role is read through the identity seam (the single source of truth). It
  // throws on failure, so we catch and fall back to no elevated Role rather
  // than crash the app — ADR-0002: continue-on-failure must be explicit.
  const fetchRole = async (userId: string) => {
    try {
      const profile = await getProfile(userId);
      setRole(profile.role);
    } catch {
      setRole(null);
    }
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
          await fetchRole(sessionUser.id);
        }, 0);
      } else if (sessionUser) {
        fetchRole(sessionUser.id);
      } else {
        setRole(null);
      }

      setLoading(false);
    });

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthContext.Provider value={{ user, role, isAdmin: roleIsAdmin(role), loading, supabase }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
