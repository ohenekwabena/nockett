"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authService } from "@/services/auth-service";
import { safeInternalPath } from "@/lib/safe-redirect";
import { AuthFrame, PasswordInput } from "@/components/auth/auth-frame";
import { Btn, Field, MIcon } from "@/components/nk/ui";

function LoginPageContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const registered = searchParams.get("registered") === "true";
  const passwordReset = searchParams.get("reset") === "true";
  // Where to land after sign-in: the validated `redirect` target the proxy set
  // when it bounced an unauthenticated deep link here, else the dashboard.
  const redirectTo = safeInternalPath(searchParams.get("redirect"));

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { user, error: authError } = await authService.signIn({ email, password });
      if (authError) {
        setError(authError.message);
      } else if (user) {
        router.push(redirectTo);
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthFrame>
      <h2 className="auth-h">Sign in</h2>
      <p className="auth-sub dim">Welcome back. Use your workspace credentials.</p>
      {registered && (
        <div className="banner-ok">
          <MIcon name="check_circle" size={15} fill={1} /> Account created — sign in with your new credentials.
        </div>
      )}
      {passwordReset && (
        <div className="banner-ok">
          <MIcon name="check_circle" size={15} fill={1} /> Password updated — the recovery link can no longer be
          used.
        </div>
      )}
      {error && (
        <div className="banner-err" style={{ marginBottom: 14 }}>
          <MIcon name="error" size={14} fill={1} /> {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="auth-form">
        <Field label="Email">
          <input
            className="input"
            type="email"
            placeholder="you@afriwave.com"
            value={email}
            required
            disabled={loading}
            onChange={(event) => setEmail(event.target.value)}
          />
        </Field>
        <Field label="Password">
          <PasswordInput value={password} onChange={setPassword} disabled={loading} placeholder="Enter your password" />
        </Field>
        <div className="auth-row">
          <label className="pop-check" style={{ padding: 0 }}>
            <input type="checkbox" checked={rememberMe} onChange={() => setRememberMe(!rememberMe)} />
            <span>Remember me for 30 days</span>
          </label>
          <button type="button" className="link-btn" onClick={() => router.push("/auth/forgot-password")}>
            Forgot password?
          </button>
        </div>
        <Btn kind="primary" type="submit" disabled={loading} style={{ width: "100%", justifyContent: "center" }}>
          {loading ? "Signing in…" : "Sign in"}
        </Btn>
      </form>
      <div className="auth-demo dim">Invite-only workspace — no self-signup.</div>
    </AuthFrame>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="nk-loading">Loading…</div>}>
      <LoginPageContent />
    </Suspense>
  );
}
