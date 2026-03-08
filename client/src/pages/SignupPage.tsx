import type { FormEvent } from "react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Sparkles, AlertCircle, ArrowRight } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";

export function SignupPage() {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const errorMessage = await signup(email, username, password);

    if (errorMessage) {
      setError(errorMessage);
      setIsSubmitting(false);
      return;
    }

    navigate("/");
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-x-hidden pt-24 pb-12 px-6">
      {/* Animated background */}
      <div className="bg-mesh-light" />
      
      <div className="w-full max-w-[460px] relative z-10">
        <div className="glass-panel rounded-2xl p-8 sm:p-12 shadow-2xl">
          <div className="mb-10 text-center">
            <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-2xl shadow-indigo-600/20 dark:bg-white dark:text-slate-900 dark:shadow-white/5">
              <Sparkles size={32} strokeWidth={2.5} fill="currentColor" />
            </div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              Create Account
            </h1>
            <p className="mt-3 text-[15px] font-medium text-slate-500 dark:text-zinc-500">
              Start collaborating in high-fidelity
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label
                htmlFor="signup-email"
                className="ml-1 block text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-zinc-600"
              >
                Email Address
              </label>
              <div className="relative">
                <input
                  id="signup-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-white px-5 py-4 text-sm font-medium text-slate-900 shadow-sm transition-all focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:focus:border-indigo-500"
                  placeholder="name@company.com"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="signup-username"
                className="ml-1 block text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-zinc-600"
              >
                Display Username
              </label>
              <input
                id="signup-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-5 py-4 text-sm font-medium text-slate-900 shadow-sm transition-all focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:focus:border-indigo-500"
                placeholder="johndoe"
                required
                minLength={2}
                autoComplete="username"
              />
            </div>

            <div className="space-y-2">
              <label
                htmlFor="signup-password"
                className="ml-1 block text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-zinc-600"
              >
                Choose Password
              </label>
              <input
                id="signup-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-5 py-4 text-sm font-medium text-slate-900 shadow-sm transition-all focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 dark:border-zinc-800 dark:bg-zinc-900 dark:text-white dark:focus:border-indigo-500"
                placeholder="At least 6 characters"
                required
                minLength={6}
                autoComplete="new-password"
              />
            </div>

            {error ? (
              <div className="flex items-center gap-2.5 rounded-xl border border-red-100 bg-red-50 p-4 text-xs font-bold text-red-700 dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-400">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            ) : null}

            <button
              type="submit"
              disabled={isSubmitting}
              className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-slate-900 px-6 py-4.5 text-sm font-bold tracking-wide text-white transition-all hover:bg-indigo-600 hover:shadow-xl hover:shadow-indigo-500/20 disabled:cursor-not-allowed disabled:opacity-60 dark:bg-white dark:text-slate-900 dark:hover:bg-zinc-200"
            >
              {isSubmitting ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent dark:border-slate-900 dark:border-t-transparent" />
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
          </form>

          <div className="mt-10 border-t border-slate-100 pt-8 text-center dark:border-zinc-800">
            <p className="text-[13px] font-bold text-slate-500 dark:text-zinc-500">
              Already a user?{" "}
              <Link
                to="/login"
                className="text-slate-900 underline decoration-slate-200 underline-offset-4 transition-all hover:text-indigo-600 hover:decoration-indigo-200 dark:text-white dark:decoration-zinc-800 dark:hover:text-indigo-400"
              >
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
