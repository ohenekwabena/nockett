import { redirect } from "next/navigation";
import { createClient } from "@/api/supabase/server";
import { isAdmin } from "@/lib/identity";
import { DEFAULT_AUDIT_PAGE_SIZE, listEvents } from "@/lib/audit-service";
import { AuditLogView } from "@/components/audit/audit-log-view";

// The Audit Log is Admin-only and must always reflect live writes — never cache.
export const dynamic = "force-dynamic";

/**
 * The Admin-only Audit Log page (AUDIT-1).
 *
 * Server Component: it gates access server-side (non-admins are redirected
 * before any Audit data is fetched or sent to the browser) and SSRs the first,
 * newest page. The client {@link AuditLogView} pages further via the same keyset
 * read seam. RLS is the real backstop — this guard is the friendly front door.
 */
export default async function AuditPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/auth/login");

  // Read the Role with the cookie-bound server client (the identity seam uses
  // the browser client, which has no session here). Non-admins go to /dashboard.
  const { data: profile } = await supabase.from("users").select("role").eq("id", user.id).single();
  if (!isAdmin(profile?.role)) redirect("/dashboard");

  const { events, nextCursor } = await listEvents({ limit: DEFAULT_AUDIT_PAGE_SIZE }, supabase);

  return (
    <AuditLogView initialEvents={events} initialCursor={nextCursor} pageSize={DEFAULT_AUDIT_PAGE_SIZE} />
  );
}
