"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/api/supabase/client";
import { authService } from "@/services/auth-service";
import { AuthFrame, PasswordInput } from "@/components/auth/auth-frame";
import { Btn, Field, MIcon } from "@/components/nk/ui";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    // Listen for the PASSWORD_RECOVERY event to know when the session is set.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") setReady(true);
    });
    // Also check if there is already a session (in case the event already fired).
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
    });
    return () => subscription.unsubscribe();
  }, []);

  const mismatch = confirmPassword.length > 0 && password !== confirmPassword;
  const ok = password.length >= 6 && password === confirmPassword && ready;

  const handleSubmit = async () => {
    if (!ok || loading) return;
    setLoading(true);
    setError(null);
    try {
      const { error: updateError } = await authService.updatePassword(password);
      if (updateError) {
        setError(updateError.message);
      } else {
        await authService.signOut();
        router.push("/auth/login?reset=true");
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthFrame>
      <h2 className="auth-h">Choose a new password</h2>
      <p className="auth-sub dim">
        {ready
          ? "Recovery session verified — set your new password below."
          : "Waiting for your recovery link to be verified…"}
      </p>
      {error && (
        <div className="banner-err" style={{ marginBottom: 14 }}>
          <MIcon name="error" size={14} fill={1} /> {error}
        </div>
      )}
      <div className="auth-form">
        <Field label="New password (min 6 characters)">
          <PasswordInput value={password} onChange={setPassword} disabled={loading || !ready} />
        </Field>
        <Field label="Confirm new password">
          <PasswordInput value={confirmPassword} onChange={setConfirmPassword} disabled={loading || !ready} />
        </Field>
        {mismatch && (
          <div className="banner-err">
            <MIcon name="error" size={14} fill={1} /> Passwords don&apos;t match.
          </div>
        )}
        <Btn
          kind="primary"
          disabled={!ok || loading}
          onClick={handleSubmit}
          style={{ width: "100%", justifyContent: "center" }}
        >
          {loading ? "Updating…" : "Update password"}
        </Btn>
      </div>
      <div className="auth-demo dim">
        Link expired?{" "}
        <button type="button" className="link-btn" onClick={() => router.push("/auth/forgot-password")}>
          Request a new one
        </button>
      </div>
    </AuthFrame>
  );
}
