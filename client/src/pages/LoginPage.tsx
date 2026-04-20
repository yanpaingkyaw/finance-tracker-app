import { FormEvent, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ApiError } from "../api/client";
import { ErrorNotice } from "../components/ErrorNotice";
import { useAuth } from "../hooks/useAuth";

export function LoginPage() {
  const { token, login, register } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

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
    <div className="mx-auto flex min-h-screen max-w-5xl items-center px-4 py-12">
      <div className="grid w-full gap-8 lg:grid-cols-2">
        <section className="rounded-3xl bg-brand-900 p-8 text-brand-50">
          <p className="text-sm uppercase tracking-[0.2em] text-brand-200">Mini Finance Tracker</p>
          <h1 className="mt-4 font-display text-4xl font-extrabold leading-tight">
            Build stronger monthly budget habits.
          </h1>
          <p className="mt-4 text-brand-100">
            Track transactions, compare spending against category budgets, and auto-carry unused budget into a global
            pool.
          </p>
          <div className="mt-8 grid gap-3 text-sm">
            <p className="rounded-xl bg-brand-700/60 px-3 py-2">Single currency MMK</p>
            <p className="rounded-xl bg-brand-700/60 px-3 py-2">Per-user isolated budgeting</p>
            <p className="rounded-xl bg-brand-700/60 px-3 py-2">Automatic carryover pool offsets overspending</p>
          </div>
        </section>

        <section className="card-surface p-6 lg:p-8">
          <div className="mb-6 flex gap-2 rounded-full bg-brand-100 p-1">
            <button
              onClick={() => setMode("login")}
              className={`flex-1 rounded-full py-2 text-sm font-semibold ${
                mode === "login" ? "bg-white text-brand-900 shadow" : "text-brand-600"
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setMode("register")}
              className={`flex-1 rounded-full py-2 text-sm font-semibold ${
                mode === "register" ? "bg-white text-brand-900 shadow" : "text-brand-600"
              }`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error ? <ErrorNotice message={error} /> : null}
            <label className="block space-y-1">
              <span className="text-sm font-medium text-brand-700">Email</span>
              <input
                className="field"
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
              />
            </label>
            <label className="block space-y-1">
              <span className="text-sm font-medium text-brand-700">Password (min 8 chars)</span>
              <input
                className="field"
                type="password"
                required
                minLength={8}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
              />
            </label>
            {mode === "register" ? (
              <label className="block space-y-1">
                <span className="text-sm font-medium text-brand-700">Confirm Password</span>
                <input
                  className="field"
                  type="password"
                  required
                  minLength={8}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="••••••••"
                />
              </label>
            ) : null}
            <button disabled={submitting} className="btn-primary w-full" type="submit">
              {submitting ? "Please wait..." : mode === "login" ? "Sign In" : "Create Account"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
