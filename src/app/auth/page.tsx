"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, LoaderCircle, MapPinned, ShieldCheck, KeyRound } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

export default function AuthPage() {
  const router = useRouter();
  const pathname = usePathname();
  const mode: "register" | "signin" = pathname === "/login" ? "signin" : "register";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [resetMode, setResetMode] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setMessage("");
    if (!supabase) {
      setError("Supabase is not configured. Check .env.local and restart the server.");
      return;
    }
    if (mode === "register" && password !== confirmPassword) {
      setError("Passwords do not match. Please check them and try again.");
      return;
    }
    setBusy(true);
    try {
      if (mode === "register") {
        const { data, error } = await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password,
          options: {
            data: { full_name: name.trim() },
            emailRedirectTo: window.location.origin + "/auth/complete",
          },
        });
        if (error) throw error;
        if (data.session) {
          router.replace("/auth/complete");
          router.refresh();
          return;
        }
        setMessage("Account created! Check your email for the confirmation link, then come back to sign in.");
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) throw error;
        const completed = data.user?.user_metadata?.profile_completed;
        const next = new URLSearchParams(window.location.search).get("next");
        const safeNext = next && next.startsWith("/") && !next.startsWith("//") && !next.includes("\\") ? next : null;
        router.replace(safeNext ?? (completed ? "/account" : "/auth/complete"));
        router.refresh();
        return;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  async function sendPasswordReset() {
    setError("");
    setMessage("");
    if (!supabase) { setError("Supabase is not configured. Check .env.local and restart the server."); return; }
    if (!email.trim()) { setError("Enter your email address first."); return; }
    setBusy(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim().toLowerCase(), {
        redirectTo: window.location.origin + "/auth/reset",
      });
      if (error) throw error;
      setMessage("If an account exists for that email, a password-reset link will arrive shortly. Check your inbox and spam folder.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not request a password reset. Please try again.");
    } finally { setBusy(false); }
  }

  async function google() {
    setError("");
    setMessage("");
    if (!supabase) {
      setError("Supabase is not configured. Check .env.local and restart the server.");
      return;
    }
    setBusy(true);
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: window.location.origin + "/auth/complete",
        queryParams: { prompt: "select_account" },
      },
    });
    if (error) {
      setError(error.message);
      setBusy(false);
    }
  }

  return (
    <main className="auth-shell">
      <Link href="/" className="auth-back"><ArrowLeft size={15} /> Back to dashboard</Link>
      <section className="auth-card">
        <div className="auth-brand">
          <span className="brand-mark"><MapPinned size={23} /></span>
          <div><strong>FixMyRoad</strong><small>COMMUNITY ROAD SAFETY</small></div>
        </div>
        <div className="auth-pill"><ShieldCheck size={14} /> ACCOUNTABILITY STARTS HERE</div>
        <h1>{resetMode ? "Reset your password." : mode === "register" ? "Join your community." : "Welcome back."}</h1>
        <p className="auth-intro">
          {resetMode ? "We’ll email you a secure link to choose a new password." : mode === "register"
            ? "Create an account to report road hazards and help make your neighbourhood safer."
            : "Sign in to continue reporting and tracking road hazards."}
        </p>

        {resetMode ? (
          <form className="profile-form auth-form" onSubmit={(e) => { e.preventDefault(); void sendPasswordReset(); }}>
            <label>Email address<input required type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" /></label>
            {error && <div className="auth-error" role="alert">{error}</div>}
            {message && <div className="auth-success" role="status">{message}</div>}
            <button className="google-button auth-submit" type="submit" disabled={busy}>{busy ? <LoaderCircle size={18} className="spin" /> : <KeyRound size={17} />}{busy ? "Sending link…" : "Email me a reset link"}</button>
            <button className="text-button" type="button" onClick={() => { setResetMode(false); setError(""); setMessage(""); }}>Back to sign in</button>
          </form>
        ) : <form className="profile-form auth-form" onSubmit={submit}>
          {mode === "register" && (
            <label>Full name
              <input required minLength={2} maxLength={80} autoComplete="name" value={name} onChange={e => setName(e.target.value)} placeholder="Enter your full name" />
            </label>
          )}
          <label>Email address
            <input required type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" />
          </label>
          <label>Password
            <input required type="password" minLength={6} autoComplete={mode === "register" ? "new-password" : "current-password"} value={password} onChange={e => setPassword(e.target.value)} placeholder={mode === "register" ? "Create a password (at least 6 characters)" : "Enter your password"} />
          </label>
          {mode === "register" && (
            <label>Confirm password
              <input required type="password" minLength={6} autoComplete="new-password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Enter your password again" />
            </label>
          )}
          {error && <div className="auth-error" role="alert">{error}</div>}
          {message && <div className="auth-success" role="status">{message}</div>}
          <button className="google-button auth-submit" type="submit" disabled={busy}>
            {busy ? <LoaderCircle size={18} className="spin" /> : null}
            {busy ? "Please wait…" : mode === "register" ? "Create account" : "Sign in with email"}
            {!busy && <ArrowRight size={16} />}
          </button>
          {mode === "signin" && <button className="text-button" type="button" onClick={() => { setResetMode(true); setError(""); setMessage(""); }}>Forgot password?</button>}
        </form>}

        {!resetMode && <><div className="auth-divider"><span>OR CONTINUE WITH</span></div>
        <button className="google-button" type="button" onClick={() => void google()} disabled={busy}>
          {busy ? <LoaderCircle size={18} className="spin" /> : <span className="google-button-g">G</span>}
          Continue with Google
          <ArrowRight size={16} />
        </button>
        <p className="auth-switch-link">
          {mode === "register" ? "Already have an account?" : "New to FixMyRoad?"}{" "}
          <Link href={mode === "register" ? "/login" : "/register"}>
            {mode === "register" ? "Sign in" : "Create an account"}
          </Link>
        </p>
        {mode === "signin" && <>
          <div className="auth-divider"><span>YOUR ACCOUNT</span></div>
          <ul className="auth-benefits">
            <li><ShieldCheck size={16} /> Reports linked to a signed-in account</li>
            <li><ShieldCheck size={16} /> Contact details for moderator follow-up</li>
            <li><ShieldCheck size={16} /> Better duplicate and abuse review</li>
          </ul>
          <p className="auth-disclaimer">Use a strong password you don't use elsewhere. Phone ownership is not verified unless a separate SMS verification step is added.</p>
        </>}
        </>}
      </section>
      <footer className="auth-footer">FixMyRoad GIS · Wagholi pilot</footer>
    </main>
  );
}
