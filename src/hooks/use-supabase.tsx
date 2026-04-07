import { useAuth } from "@/context/auth-context";

export default function useSupabase() {
  return useAuth();
}
