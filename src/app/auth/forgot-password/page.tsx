"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/services/auth-service";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { error: resetError } = await authService.resetPassword(email);
      if (resetError) {
        setError(resetError.message);
      } else {
        setSent(true);
      }
    } catch (_) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col justify-center overflow-hidden bg-gray-50 dark:bg-gray-900">
      {/* Background SVG Pattern */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <img
          src="/background-svgs/undraw_collaboration_dtwk.svg"
          alt=""
          className="absolute -top-10 -left-10 w-64 h-64 opacity-30 blur-xs transform rotate-12"
        />
        <img
          src="/background-svgs/undraw_device-sync_d9ei.svg"
          alt=""
          className="absolute -top-20 -right-20 w-72 h-72 opacity-25 blur-xs transform -rotate-45"
        />
        <img
          src="/background-svgs/undraw_online-community_3o0l.svg"
          alt=""
          className="absolute -bottom-16 -left-16 w-80 h-80 opacity-30 blur-xs transform -rotate-12"
        />
        <img
          src="/background-svgs/undraw_email-campaign_2z6t.svg"
          alt=""
          className="absolute -bottom-10 -right-10 w-60 h-60 opacity-25 blur-xs transform rotate-45"
        />
      </div>

      <div className="relative z-10">
        {/* Header */}
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
          <p className="text-gray-600 dark:text-gray-400 text-base font-normal leading-normal mt-2 text-center">
            Reset your password
          </p>
        </div>

        {error && (
          <div className="px-6 mb-4 max-w-[480px] mx-auto w-full">
            <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-300 dark:border-red-700 text-red-800 dark:text-red-300 rounded-xl text-sm">
              {error}
            </div>
          </div>
        )}

        {sent ? (
          <div className="flex w-full flex-col gap-4 px-6 max-w-[480px] mx-auto bg-white/90 dark:bg-gray-900/90 p-8 rounded-3xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 text-center">
            <span className="material-symbols-outlined text-5xl text-green-500 mx-auto">mark_email_read</span>
            <h2 className="text-gray-900 dark:text-gray-100 text-xl font-bold">Check your inbox</h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              If an account exists for <strong>{email}</strong>, you&apos;ll receive a password reset link shortly.
            </p>
            <button
              onClick={() => router.push("/auth/login")}
              className="mt-2 flex h-14 w-full items-center justify-center rounded-xl dark:bg-white bg-slate-800 text-base font-bold transition-all active:scale-95 hover:shadow-lg text-white dark:text-gray-600 cursor-pointer"
            >
              Back to Login
            </button>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="flex w-full flex-col gap-4 px-6 max-w-[480px] mx-auto bg-white/90 dark:bg-gray-900/90 p-8 rounded-3xl shadow-xl border border-gray-200/50 dark:border-gray-700/50"
          >
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Enter your email address and we&apos;ll send you a link to reset your password.
            </p>
            <div className="flex flex-col gap-2">
              <label className="text-gray-900 dark:text-gray-100 text-sm font-semibold">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex w-full rounded-xl text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-0 focus:ring-2 focus:ring-primary focus:border-transparent h-14 placeholder:text-gray-500 dark:placeholder:text-gray-400 p-4 text-base font-normal leading-normal shadow-sm"
                placeholder="name@company.com"
                required
                disabled={loading}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex h-14 w-full items-center justify-center rounded-xl dark:bg-white bg-slate-800 text-base font-bold transition-all active:scale-95 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 text-white dark:text-gray-600 cursor-pointer"
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
            <button
              type="button"
              onClick={() => router.push("/auth/login")}
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors text-center cursor-pointer"
            >
              Back to Login
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
