"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { authService } from "@/services/auth-service";

async function validateInvite(token: string) {
  const res = await fetch(`/api/auth/invite/validate?token=${token}`);
  if (!res.ok) return null;
  return await res.json();
}

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [inviteValid, setInviteValid] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
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
        setInviteEmail(data.email);
        setEmail(data.email);
        if (data.role) setRole(data.role);
      }
    });
  }, [inviteToken]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    if (!inviteToken) {
      setError("Missing invite token.");
      setLoading(false);
      return;
    }
    if (!inviteValid) {
      setError("Invalid invite token.");
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
        await fetch(`/api/auth/invite/validate?token=${inviteToken}`, {
          method: "PATCH",
        });
        router.push("/dashboard");
      }
    } catch (_) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col justify-center overflow-hidden bg-gray-50 dark:bg-gray-900 pb-6">
      {/* Background SVG Pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">{/* ...existing code... */}</div>
      <div className="relative z-10">
        <div className="flex flex-col items-center px-6 pt-16 pb-8">
          <div
            className="flex items-center justify-center gap-2 rounded-2xl bg-primary dark:text-white text-gray-600 shadow-lg shadow-primary/30 p-4 cursor-pointer"
            onClick={() => router.push("/auth/login")}
          >
            <div className="flex items-center justify-center">
              <span className="material-symbols-outlined text-4xl">confirmation_number</span>
            </div>
            <h1 className="text-gray-900 dark:text-gray-100 text-3xl font-bold leading-tight tracking-tight text-center">
              Nockett
            </h1>
          </div>
        </div>

        {error && (
          <div className="px-6 mb-4 max-w-[480px] mx-auto w-full">
            <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-300 dark:border-red-700 text-red-800 dark:text-red-300 rounded-xl text-sm">
              {error}
            </div>
          </div>
        )}
        <form
          onSubmit={handleSubmit}
          className="flex w-full flex-col gap-4 px-6 max-w-[480px] mx-auto bg-white/90 dark:bg-gray-900/90 p-8 rounded-3xl shadow-xl border border-gray-200/50 dark:border-gray-700/50"
        >
          {/* Email Field (readonly, from invite) */}
          <div className="flex flex-col gap-2">
            <label className="text-gray-900 dark:text-gray-100 text-sm font-semibold">Email Address</label>
            <div className="relative">
              <input
                type="email"
                value={email}
                readOnly
                className="flex w-full rounded-xl text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-0 focus:ring-2 focus:ring-primary focus:border-transparent h-14 placeholder:text-gray-500 dark:placeholder:text-gray-400 p-4 text-base font-normal leading-normal shadow-sm"
                placeholder="name@company.com"
                required
                disabled={loading}
              />
            </div>
          </div>
          {/* First Name Field */}
          <div className="flex flex-col gap-2">
            <label className="text-gray-900 dark:text-gray-100 text-sm font-semibold">First Name</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="flex w-full rounded-xl text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-0 focus:ring-2 focus:ring-primary focus:border-transparent h-14 placeholder:text-gray-500 dark:placeholder:text-gray-400 p-4 text-base font-normal leading-normal shadow-sm"
              placeholder="First Name"
              required
              disabled={loading}
            />
          </div>
          {/* Last Name Field */}
          <div className="flex flex-col gap-2">
            <label className="text-gray-900 dark:text-gray-100 text-sm font-semibold">Last Name</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="flex w-full rounded-xl text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-0 focus:ring-2 focus:ring-primary focus:border-transparent h-14 placeholder:text-gray-500 dark:placeholder:text-gray-400 p-4 text-base font-normal leading-normal shadow-sm"
              placeholder="Last Name"
              required
              disabled={loading}
            />
          </div>
          {/* Password Field */}
          <div className="flex flex-col gap-2">
            <label className="text-gray-900 dark:text-gray-100 text-sm font-semibold">Password</label>
            <div className="flex w-full items-stretch relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="flex w-full rounded-xl text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-0 focus:ring-2 focus:ring-primary focus:border-transparent h-14 placeholder:text-gray-500 dark:placeholder:text-gray-400 p-4 text-base font-normal leading-normal shadow-sm"
                placeholder="Set your password"
                required
                disabled={loading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 flex items-center justify-center cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
              >
                <span className="material-symbols-outlined">{showPassword ? "visibility_off" : "visibility"}</span>
              </button>
            </div>
          </div>
          <button
            type="submit"
            disabled={loading || !inviteValid}
            className="mt-4 flex h-14 w-full items-center justify-center rounded-xl dark:bg-white bg-slate-800 text-base font-bold transition-all active:scale-95 hover:bg- hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 text-white dark:text-gray-600 cursor-pointer"
          >
            {loading ? "Signing up..." : "Sign Up"}
          </button>
        </form>
      </div>
    </div>
  );
}
