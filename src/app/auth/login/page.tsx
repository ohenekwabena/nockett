"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { authService } from "@/services/auth-service";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const { user, error: authError } = await authService.signIn({ email, password });

      if (authError) {
        setError(authError.message);
      } else if (user) {
        router.push("/dashboard");
      }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
        {/* Top Left */}
        <img
          src="/background-svgs/undraw_collaboration_dtwk.svg"
          alt=""
          className="absolute -top-10 -left-10 w-64 h-64 opacity-30 blur-xs transform rotate-12"
        />
        {/* Top Right */}
        <img
          src="/background-svgs/undraw_device-sync_d9ei.svg"
          alt=""
          className="absolute -top-20 -right-20 w-72 h-72 opacity-25 blur-xs transform -rotate-45"
        />
        {/* Bottom Left */}
        <img
          src="/background-svgs/undraw_online-community_3o0l.svg"
          alt=""
          className="absolute -bottom-16 -left-16 w-80 h-80 opacity-30 blur-xs transform -rotate-12"
        />
        {/* Bottom Right */}
        <img
          src="/background-svgs/undraw_email-campaign_2z6t.svg"
          alt=""
          className="absolute -bottom-10 -right-10 w-60 h-60 opacity-25 blur-xs transform rotate-45"
        />
        {/* Center Right */}
        <img
          src="/background-svgs/undraw_collaboration_dtwk.svg"
          alt=""
          className="absolute top-1/2 -right-32 w-96 h-96 opacity-20 blur-md transform -translate-y-1/2 rotate-90"
        />
        {/* Center Left */}
        <img
          src="/background-svgs/undraw_device-sync_d9ei.svg"
          alt=""
          className="absolute top-1/3 -left-24 w-72 h-72 opacity-20 blur-md transform -rotate-90"
        />
      </div>

      {/* Content with backdrop blur overlay */}
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
            Sign in to manage your tickets
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="px-6 mb-4 max-w-[480px] mx-auto w-full">
            <div className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-300 dark:border-red-700 text-red-800 dark:text-red-300 rounded-xl text-sm">
              {error}
            </div>
          </div>
        )}

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="flex w-full flex-col gap-4 px-6 max-w-[480px] mx-auto bg-white/90 dark:bg-gray-900/90 p-8 rounded-3xl shadow-xl border border-gray-200/50 dark:border-gray-700/50"
        >
          {/* Email Field */}
          <div className="flex flex-col gap-2">
            <label className="text-gray-900 dark:text-gray-100 text-sm font-semibold">Email Address</label>
            <div className="relative">
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
          </div>

          {/* Password Field */}
          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
              <label className="text-gray-900 dark:text-gray-100 text-sm font-semibold">Password</label>
              <a
                href="#"
                className="text-gray-600 dark:text-gray-100 text-xs font-semibold  hover:text-gray-300 dark:hover:text-gray-300 transition-colors"
              >
                Forgot Password?
              </a>
            </div>
            <div className="flex w-full items-stretch relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="flex w-full rounded-xl text-gray-900 dark:text-gray-100 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 focus:outline-0 focus:ring-2 focus:ring-primary focus:border-transparent h-14 placeholder:text-gray-500 dark:placeholder:text-gray-400 p-4 text-base font-normal leading-normal shadow-sm"
                placeholder="Enter your password"
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

          {/* Remember Me */}
          <div className="flex items-center gap-2 py-2">
            <input
              type="checkbox"
              id="remember"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="rounded border-gray-400 dark:border-gray-300 text-primary focus:ring-primary"
            />
            <label htmlFor="remember" className="text-sm text-gray-700 dark:text-gray-400 cursor-pointer">
              Remember me for 30 days
            </label>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading}
            className="mt-4 flex h-14 w-full items-center justify-center rounded-xl dark:bg-white bg-slate-800 text-base font-bold transition-all active:scale-95 hover:bg- hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100 text-white dark:text-gray-600 cursor-pointer"
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
}
