"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, KeyRound, LoaderCircle, MapPinned } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    let alive = true;
    async function checkSession() {
      if (!supabase) {
        if (alive) { setError("Supabase is not configured."); setChecking(false); }
        return;
      }
      const { data, error } = await supabase.auth.getSession();
      if (!alive) return;
      if (error || !data.session) setError("This reset link is invalid or expired. Request a new one from the sign-in page.");
      else setReady(true);
      setChecking(false);
    }
    void checkSession();
    return () => { alive = false; };
  }, []);

  async function updatePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(""); setSuccess("");
    if (password.length < 8) { setError("Use at least 8 characters for your new password."); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }
    if (!supabase) { setError("Supabase is not configured."); return; }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) { setError(error.message); return; }
    setSuccess("Password updated. Taking you to your account…");
    window.setTimeout(() => router.replace("/account"), 800);
  }

  return <main className="auth-shell">
    <Link href="/login" className="auth-back"><ArrowLeft size={15}/> Back to sign in</Link>
    <section className="auth-card">
      <div className="auth-brand"><span className="brand-mark"><MapPinned size={23}/></span><div><strong>FixMyRoad</strong><small>SECURE ACCOUNT ACCESS</small></div></div>
      <div className="auth-pill"><KeyRound size={14}/> PASSWORD RECOVERY</div>
      <h1>Choose a new password.</h1>
      <p className="auth-intro">Use a strong password you don’t use on other websites.</p>
      {checking ? <div className="profile-loading"><LoaderCircle size={22} className="spin"/> Validating your reset link…</div> : ready ? <form className="profile-form auth-form" onSubmit={updatePassword}>
        <label>New password<input required type="password" minLength={8} autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="At least 8 characters"/></label>
        <label>Confirm new password<input required type="password" minLength={8} autoComplete="new-password" value={confirm} onChange={e=>setConfirm(e.target.value)} placeholder="Enter it again"/></label>
        {error && <div className="auth-error" role="alert">{error}</div>}
        {success && <div className="auth-success" role="status">{success}</div>}
        <button className="google-button auth-submit" disabled={busy}>{busy?<LoaderCircle size={18} className="spin"/>:<KeyRound size={17}/>} {busy?"Updating password…":"Update password"}</button>
      </form> : <div className="auth-error" role="alert">{error}</div>}
      {!ready && !checking && <Link className="profile-primary" href="/login">Return to sign in</Link>}
    </section>
    <footer className="auth-footer">FixMyRoad GIS · Wagholi pilot</footer>
  </main>;
}
