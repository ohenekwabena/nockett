"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authService } from "@/services/auth-service";
import { AuthFrame, PasswordInput } from "@/components/auth/auth-frame";
import { Btn, Field, MIcon } from "@/components/nk/ui";

async function validateInvite(token: string) {
  const response = await fetch(`/api/auth/invite/validate?token=${token}`);
  if (!response.ok) return null;
  return await response.json();
}

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteValid, setInviteValid] = useState(false);
  const [role, setRole] = useState<string>("user");
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("invite");

  useEffect(() => {
    if (!inviteToken) {
      setError("Missing invite token.");
      setInviteValid(false);
      return;
    }
    validateInvite(inviteToken).then((data) => {
      if (!data || !data.email) {
        setError("Invalid or expired invite token.");
        setInviteValid(false);
      } else {
        setInviteValid(true);
        setEmail(data.email);
        if (data.role) setRole(data.role);
      }
    });
  }, [inviteToken]);

  const ok = firstName.trim() && lastName.trim() && password.length >= 6 && inviteValid;

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    if (!inviteToken || !inviteValid) {
      setError(inviteToken ? "Invalid invite token." : "Missing invite token.");
      setLoading(false);
      return;
    }
    try {
      const { user, error: signUpError } = await authService.signUp({
        email,
        password,
        firstName,
        lastName,
        inviteToken,
        role,
      });
      if (signUpError) {
        setError(signUpError.message);
      } else if (user) {
        // Mark invite as used
        await fetch(`/api/auth/invite/validate?token=${inviteToken}`, { method: "PATCH" });
        // Sign out the auto-created session so the user must log in manually
        await authService.signOut();
        router.push("/auth/login?registered=true");
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthFrame wide>
      <h2 className="auth-h">Create your account</h2>
      <p className="auth-sub dim">You were invited to the Afriwave NOC workspace.</p>
      {inviteValid && (
        <div className="banner-info">
          <MIcon name="mark_email_read" size={15} fill={1} />
          <span>
            Invited as <strong>{role === "admin" ? "Admin" : "User"}</strong> · single-use link
          </span>
        </div>
      )}
      {error && (
        <div className="banner-err" style={{ marginBottom: 14 }}>
          <MIcon name="error" size={14} fill={1} /> {error}
        </div>
      )}
      <div className="auth-form">
        <Field label="Email (from your invite)">
          <div className="pw-box">
            <input className="input" value={email} disabled />
            <span className="icon-btn" style={{ cursor: "default" }} title="Locked to the invitation">
              <MIcon name="lock" size={15} />
            </span>
          </div>
        </Field>
        <div className="form-grid" style={{ gap: 12 }}>
          <Field label="First name">
            <input
              className="input"
              value={firstName}
              disabled={loading}
              onChange={(event) => setFirstName(event.target.value)}
              placeholder="First name"
            />
          </Field>
          <Field label="Last name">
            <input
              className="input"
              value={lastName}
              disabled={loading}
              onChange={(event) => setLastName(event.target.value)}
              placeholder="Last name"
            />
          </Field>
        </div>
        <Field label="Password (min 6 characters)">
          <PasswordInput value={password} onChange={setPassword} disabled={loading} />
        </Field>
        <Btn
          kind="primary"
          disabled={!ok || loading}
          style={{ width: "100%", justifyContent: "center" }}
          onClick={handleSubmit}
        >
          {loading ? "Creating account…" : "Create account"}
        </Btn>
      </div>
      <div className="auth-demo dim">
        Wrong link?{" "}
        <button type="button" className="link-btn" onClick={() => router.push("/auth/login")}>
          Back to sign in
        </button>
      </div>
    </AuthFrame>
  );
}
