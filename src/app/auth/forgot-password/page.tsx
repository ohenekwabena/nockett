"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/services/auth-service";
import { AuthFrame } from "@/components/auth/auth-frame";
import { Btn, Field, MIcon } from "@/components/nk/ui";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const router = useRouter();

  const send = async () => {
    if (!email.trim() || loading) return;
    setLoading(true);
    setError(null);
    try {
      const { error: resetError } = await authService.resetPassword(email);
      if (resetError) setError(resetError.message);
      else setSent(true);
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthFrame>
      <h2 className="auth-h">Reset your password</h2>
      <p className="auth-sub dim">We&apos;ll email you a recovery link.</p>
      {error && (
        <div className="banner-err" style={{ marginBottom: 14 }}>
          <MIcon name="error" size={14} fill={1} /> {error}
        </div>
      )}
      {sent ? (
        <div className="banner-ok" style={{ marginBottom: 14 }}>
          <MIcon name="outgoing_mail" size={15} fill={1} />
          If that address is registered, a reset link is on its way.
        </div>
      ) : (
        <div className="auth-form">
          <Field label="Email">
            <input
              className="input"
              type="email"
              placeholder="you@afriwave.com"
              value={email}
              disabled={loading}
              onChange={(event) => setEmail(event.target.value)}
              onKeyDown={(event) => event.key === "Enter" && send()}
            />
          </Field>
          <Btn
            kind="primary"
            disabled={!email.trim() || loading}
            onClick={send}
            style={{ width: "100%", justifyContent: "center" }}
          >
            {loading ? "Sending…" : "Send reset link"}
          </Btn>
        </div>
      )}
      <div className="auth-demo dim">
        <button type="button" className="link-btn" onClick={() => router.push("/auth/login")}>
          Back to sign in
        </button>
      </div>
    </AuthFrame>
  );
}
