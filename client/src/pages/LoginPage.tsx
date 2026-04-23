import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ApiError } from "../api/client";
import { ErrorNotice } from "../components/ErrorNotice";
import { useAuth } from "../hooks/useAuth";

const benefitItems = [
  "Monthly budgets with live progress",
  "Protected multi-user finance records",
  "Carryover pool that cushions overspending",
];

const spotlightStats = [
  { label: "Budget rhythm", value: "Monthly" },
  { label: "Currency", value: "MMK" },
  { label: "Mode", value: "Local-first" },
];

export function LoginPage() {
  const { token, login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const confirmMismatch = mode === "register" && confirmPassword.length > 0 && password !== confirmPassword;

  useEffect(() => {
    if (token) {
      navigate("/", { replace: true });
    }
  }, [token, navigate]);

  useEffect(() => {
    setError("");
    if (mode === "login") {
      setConfirmPassword("");
    }
  }, [mode]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");

    if (mode === "register" && password !== confirmPassword) {
      setError("Confirm password does not match.");
      return;
    }

    setSubmitting(true);
    try {
      if (mode === "login") {
        await login(email, password);
      } else {
        await register(email, password);
      }
      navigate("/", { replace: true });
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Unable to continue. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-shell relative isolate min-h-screen overflow-hidden px-4 py-10 sm:px-6 lg:px-8">
      <div className="auth-orb auth-orb-left" />
      <div className="auth-orb auth-orb-right" />
      <div className="auth-grid absolute inset-0 opacity-50" />

      <div className="relative mx-auto grid min-h-[calc(100vh-5rem)] max-w-6xl items-center gap-8 lg:grid-cols-[1.1fr_0.9fr]">
        <section className="auth-panel-reveal auth-hero-panel relative overflow-hidden rounded-[2rem] border border-white/20 bg-brand-900 px-6 py-8 text-brand-50 shadow-[0_25px_80px_rgba(40,61,49,0.28)] sm:px-8 sm:py-10 lg:min-h-[620px]">
          <div className="auth-hero-glow absolute -right-12 top-10 h-40 w-40 rounded-full bg-accent-400/20 blur-3xl" />
          <div className="auth-hero-glow absolute bottom-0 left-0 h-52 w-52 rounded-full bg-brand-300/10 blur-3xl" />

          <div className="relative z-10 flex h-full flex-col justify-between">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/8 px-4 py-2 text-xs font-semibold uppercase tracking-[0.28em] text-brand-100">
                <span className="h-2 w-2 rounded-full bg-accent-400 shadow-[0_0_12px_rgba(247,148,29,0.9)]" />
                Mini Finance Tracker
              </div>

              <h1 className="mt-8 max-w-xl font-display text-4xl font-extrabold leading-[1.02] text-white sm:text-5xl lg:text-6xl">
                Make budgeting feel clear, calm, and under control.
              </h1>
              <p className="mt-6 max-w-xl text-base leading-8 text-brand-100/95 sm:text-lg">
                Track transactions, compare monthly plan versus actual spending, and keep momentum with a carryover
                pool that works with you instead of against you.
              </p>
            </div>

            <div className="relative z-10 mt-10 grid gap-4">
              <div className="grid gap-3 sm:grid-cols-3">
                {spotlightStats.map((item, index) => (
                  <div
                    key={item.label}
                    className="auth-fade-up rounded-2xl border border-white/10 bg-white/8 px-4 py-4 backdrop-blur"
                    style={{ animationDelay: `${0.1 + index * 0.08}s` }}
                  >
                    <p className="text-xs uppercase tracking-[0.2em] text-brand-200">{item.label}</p>
                    <p className="mt-2 text-lg font-bold text-white">{item.value}</p>
                  </div>
                ))}
              </div>

              <div className="grid gap-3">
                {benefitItems.map((item, index) => (
                  <div
                    key={item}
                    className="auth-fade-up flex items-center gap-3 rounded-2xl border border-brand-500/20 bg-brand-800/55 px-4 py-3 text-sm text-brand-50/95 backdrop-blur"
                    style={{ animationDelay: `${0.3 + index * 0.08}s` }}
                  >
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-accent-400/15 font-display text-sm font-bold text-accent-200">
                      0{index + 1}
                    </span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="auth-panel-reveal relative overflow-hidden rounded-[2rem] border border-white/70 bg-white/85 p-4 shadow-[0_30px_90px_rgba(63,112,83,0.18)] backdrop-blur-xl sm:p-6 lg:p-7">
          <div className="auth-card-sheen pointer-events-none absolute inset-x-8 top-0 h-24 rounded-b-[3rem] bg-gradient-to-b from-white/70 to-transparent" />

          <div className="relative z-10 rounded-[1.6rem] border border-brand-100/70 bg-white/72 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.85)] sm:p-6">
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-500">
                {mode === "login" ? "Welcome back" : "Create your space"}
              </p>
              <h2 className="mt-3 font-display text-3xl font-bold text-brand-900">
                {mode === "login" ? "Sign in to your tracker" : "Start your finance routine"}
              </h2>
              <p className="mt-2 text-sm leading-6 text-brand-600">
                {mode === "login"
                  ? "Pick up where you left off and review this month in seconds."
                  : "Set up your account and begin tracking budgets with a calmer flow."}
              </p>
            </div>

            <div className="mb-6 rounded-full bg-brand-100/90 p-1.5 shadow-[inset_0_1px_2px_rgba(53,90,69,0.12)]">
              <div className="relative grid grid-cols-2 gap-1">
                <span
                  aria-hidden="true"
                  className={`absolute inset-y-0 w-[calc(50%-0.125rem)] rounded-full bg-white shadow-[0_10px_24px_rgba(39,63,46,0.18)] transition-transform duration-300 ${
                    mode === "login" ? "translate-x-0" : "translate-x-full"
                  }`}
                />
                <button
                  onClick={() => setMode("login")}
                  className={`relative z-10 rounded-full px-4 py-3 text-sm font-semibold transition ${
                    mode === "login" ? "text-brand-900" : "text-brand-600 hover:text-brand-800"
                  }`}
                >
                  Login
                </button>
                <button
                  onClick={() => setMode("register")}
                  className={`relative z-10 rounded-full px-4 py-3 text-sm font-semibold transition ${
                    mode === "register" ? "text-brand-900" : "text-brand-600 hover:text-brand-800"
                  }`}
                >
                  Register
                </button>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error ? <ErrorNotice message={error} /> : null}

              <label className="block space-y-2">
                <span className="text-sm font-medium text-brand-700">Email</span>
                <input
                  className="field auth-input"
                  type="email"
                  required
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@example.com"
                />
              </label>

              <label className="block space-y-2">
                <span className="text-sm font-medium text-brand-700">Password (min 8 chars)</span>
                <input
                  className="field auth-input"
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                />
              </label>

              <div
                className={`grid overflow-hidden transition-[grid-template-rows,opacity,transform] duration-300 ${
                  mode === "register" ? "grid-rows-[1fr] opacity-100 translate-y-0" : "grid-rows-[0fr] opacity-0 -translate-y-2"
                }`}
              >
                <div className="min-h-0">
                  <label className="block space-y-2 pt-1">
                    <span className="text-sm font-medium text-brand-700">Confirm Password</span>
                    <input
                      className={`field auth-input ${
                        confirmMismatch ? "border-red-300 focus:border-red-400 focus:ring-red-100" : ""
                      }`}
                      type="password"
                      required={mode === "register"}
                      minLength={8}
                      value={confirmPassword}
                      onChange={(event) => setConfirmPassword(event.target.value)}
                      placeholder="Re-enter your password"
                    />
                    <span className={`block text-xs transition ${confirmMismatch ? "text-red-600" : "text-brand-500"}`}>
                      {confirmPassword.length === 0
                        ? "Use the same password to confirm your account."
                        : confirmMismatch
                          ? "Passwords do not match yet."
                          : "Passwords match."}
                    </span>
                  </label>
                </div>
              </div>

              <button disabled={submitting} className="btn-primary auth-submit w-full" type="submit">
                {submitting ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
              </button>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
}
