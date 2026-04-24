"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/api/supabase/client";
import { authService } from "@/services/auth-service";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [done, setDone] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Supabase processes the recovery token from the URL hash automatically.
    // Listen for the PASSWORD_RECOVERY event to know when the session is set.
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY") {
        setReady(true);
      }
    });

    // Also check if there is already a session (in case the event already fired)
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { error: updateError } = await authService.updatePassword(password);
      if (updateError) {
        setError(updateError.message);
      } else {
        setDone(true);
        await authService.signOut();
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
          <div className="flex items-center justify-center gap-2 rounded-2xl bg-primary dark:text-white text-gray-600 shadow-lg shadow-primary/30 p-4">
            <div className="flex items-center justify-center">
              <span className="material-symbols-outlined text-4xl">confirmation_number</span>
            </div>
            <h1 className="text-gray-900 dark:text-gray-100 text-3xl font-bold leading-tight tracking-tight text-center">
              Nockett
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-base font-normal leading-normal mt-2 text-center">
            Set a new password
          </p>
        </div>

        {error && (
          <div className="px-6 mb-4 max-w-[480px] mx-auto w-full">
            <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-300 dark:border-red-700 text-red-800 dark:text-red-300 rounded-xl text-sm">
              {error}
            </div>
          </div>
        )}

        {done ? (
          <div className="flex w-full flex-col gap-4 px-6 max-w-[480px] mx-auto bg-white/90 dark:bg-gray-900/90 p-8 rounded-3xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 text-center">
            <span className="material-symbols-outlined text-5xl text-green-500 mx-auto">check_circle</span>
            <h2 className="text-gray-900 dark:text-gray-100 text-xl font-bold">Password updated!</h2>
            <p className="text-gray-600 dark:text-gray-400 text-sm">
              Your password has been changed. You can now log in with your new password.
            </p>
            <button
              onClick={() => router.push("/auth/login")}
              className="mt-2 flex h-14 w-full items-center justify-center rounded-xl dark:bg-white bg-slate-800 text-base font-bold transition-all active:scale-95 hover:shadow-lg text-white dark:text-gray-600 cursor-pointer"
            >
              Go to Login
            </button>
          </div>
        ) : !ready ? (
          <div className="flex w-full flex-col gap-4 px-6 max-w-[480px] mx-auto bg-white/90 dark:bg-gray-900/90 p-8 rounded-3xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 text-center">
            <p className="text-gray-600 dark:text-gray-400 text-sm">Verifying your reset link&hellip;</p>
            <p className="text-gray-500 dark:text-gray-500 text-xs mt-2">
              If nothing happens,{" "}
              <span className="underline cursor-pointer" onClick={() => router.push("/auth/forgot-password")}>
                request a new reset link
              </span>
              .
            </p>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="flex w-full flex-col gap-4 px-6 max-w-[480px] mx-auto bg-white/90 dark:bg-gray-900/90 p-8 rounded-3xl shadow-xl border border-gray-200/50 dark:border-gray-700/50"
          >
            {/* New Password */}
            <div className="flex flex-col gap-2">
              <label className="text-gray-900 dark:text-gray-100 text-sm font-semibold">New Password</label>
              <div className="flex w-full items-stretch relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="flex w-full rounded-xl text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-0 focus:ring-2 focus:ring-primary focus:border-transparent h-14 placeholder:text-gray-500 dark:placeholder:text-gray-400 p-4 text-base font-normal leading-normal shadow-sm"
                  placeholder="Enter new password"
                  required
                  disabled={loading}
                  minLength={6}
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

            {/* Confirm Password */}
            <div className="flex flex-col gap-2">
              <label className="text-gray-900 dark:text-gray-100 text-sm font-semibold">Confirm Password</label>
              <div className="flex w-full items-stretch relative">
                <input
                  type={showConfirm ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="flex w-full rounded-xl text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-0 focus:ring-2 focus:ring-primary focus:border-transparent h-14 placeholder:text-gray-500 dark:placeholder:text-gray-400 p-4 text-base font-normal leading-normal shadow-sm"
                  placeholder="Confirm new password"
                  required
                  disabled={loading}
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 flex items-center justify-center cursor-pointer hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
                >
                  <span className="material-symbols-outlined">{showConfirm ? "visibility_off" : "visibility"}</span>
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 flex h-14 w-full items-center justify-center rounded-xl dark:bg-white bg-slate-800 text-base font-bold transition-all active:scale-95 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 text-white dark:text-gray-600 cursor-pointer"
            >
              {loading ? "Updating..." : "Update Password"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
