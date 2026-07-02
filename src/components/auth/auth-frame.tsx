"use client";

/** Shared auth-screen chrome (design auth.jsx): brand card + footer. */

import { useState, type ReactNode } from "react";
import { MIcon } from "@/components/nk/ui";

export function AuthFrame({ children, wide }: { children: ReactNode; wide?: boolean }) {
  return (
    <div className="auth-wrap">
      <div className="auth-card" style={wide ? { width: 480 } : undefined}>
        <div className="auth-brand">
          <span className="ws-logo">N</span>
          <span className="ws-name" style={{ fontSize: 16 }}>
            Nockett
          </span>
        </div>
        {children}
      </div>
      <div className="auth-foot dim">Afriwave Telecom · NOC incident management</div>
    </div>
  );
}

export function PasswordInput({
  value,
  onChange,
  placeholder,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
}) {
  const [show, setShow] = useState(false);
  return (
    <div className="pw-box">
      <input
        className="input"
        type={show ? "text" : "password"}
        placeholder={placeholder || "Password"}
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
      />
      <button
        type="button"
        className="icon-btn"
        onClick={() => setShow(!show)}
        title={show ? "Hide password" : "Show password"}
      >
        <MIcon name={show ? "visibility_off" : "visibility"} size={17} />
      </button>
    </div>
  );
}
