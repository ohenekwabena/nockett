import { createClient } from "@/api/supabase/client";
import { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";

export default function useSupabase() {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchUserRole = async (userId?: string) => {
    if (!userId) {
      setRole(null);
      return;
    }

    const { data, error } = await supabase.from("users").select("role").eq("id", userId).single();

    if (!error && data?.role) {
      setRole(data.role);
      return;
    }

    setRole(null);
  };

  useEffect(() => {
    const initializeAuth = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      const sessionUser = session?.user ?? null;
      setUser(sessionUser);
      await fetchUserRole(sessionUser?.id);
      setLoading(false);
    };

    initializeAuth();

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const sessionUser = session?.user ?? null;
      setUser(sessionUser);
      await fetchUserRole(sessionUser?.id);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { user, role, loading, supabase };
}
