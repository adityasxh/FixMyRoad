"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, LoaderCircle, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

type ReviewReport = {
  id: string; title: string; description: string | null; photo_url: string | null;
  severity: number; user_reported_severity: number | null; ai_assessed_severity: number | null;
  ai_confidence: number | null; ai_model: string | null; ai_assessment_status: string;
  ai_assessment_notes: string | null; verification_status: string; verified_severity: number | null; reported_at: string;
};

export default function ModeratorReviewPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<ReviewReport[]>([]);
  const [values, setValues] = useState<Record<string, string>>({});
  const [busyId, setBusyId] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const load = useCallback(async () => {
    if (!supabase) { setError("Supabase is not configured."); setLoading(false); return; }
    const { data } = await supabase.auth.getSession();
    const user = data.session?.user;
    if (!user) { router.replace("/login?next=/moderator"); return; }
    if (user.app_metadata?.role !== "moderator") {
      setError("Moderator access is required. Ask the project administrator to assign the moderator role securely in Supabase Auth app_metadata.");
      setLoading(false); return;
    }
    const { data: rows, error: fetchError } = await supabase
      .from("pothole_reports")
      .select("id,title,description,photo_url,severity,user_reported_severity,ai_assessed_severity,ai_confidence,ai_model,ai_assessment_status,ai_assessment_notes,verification_status,verified_severity,reported_at")
      .neq("verification_status", "duplicate")
      .order("reported_at", { ascending: false }).limit(100);
    if (fetchError) setError(fetchError.message);
    else {
      const items = (rows ?? []) as ReviewReport[];
      setReports(items);
      setValues(Object.fromEntries(items.map(item => [item.id, String(item.verified_severity ?? item.ai_assessed_severity ?? item.user_reported_severity ?? item.severity)])));
    }
    setLoading(false);
  }, [router]);

  useEffect(() => { void load(); }, [load]);

  async function verify(report: ReviewReport) {
    if (!supabase) return;
    const selected = Number(values[report.id]);
    if (!Number.isInteger(selected) || selected < 1 || selected > 5) { setError("Choose a severity from 1 to 5."); return; }
    setBusyId(report.id); setError(""); setNotice("");
    const { error: updateError } = await supabase.from("pothole_reports").update({
      verified_severity: selected, verification_status: "verified"
    }).eq("id", report.id);
    setBusyId("");
    if (updateError) { setError("Could not save review: " + updateError.message); return; }
    setNotice("Severity verified. The priority queue will now use the moderator-confirmed severity.");
    await load();
  }

  if (loading) return <main className="account-shell"><div className="account-loading"><LoaderCircle size={24} className="spin" /> Loading review queue…</div></main>;

  return <main className="account-shell">
    <header className="account-nav"><Link href="/" className="brand"><span className="brand-mark"><ShieldCheck size={22}/></span><span><strong>FixMyRoad</strong><small>MODERATOR REVIEW</small></span></Link><div className="account-nav-actions"><Link href="/dashboard" className="account-map-link">Public dashboard</Link><Link href="/" className="account-map-link">Home</Link></div></header>
    <section className="account-welcome"><div><div className="landing-eyebrow"><span/> HUMAN VERIFICATION</div><h1>Severity review queue.</h1><p>Compare the reported estimate with the photo assessment, inspect the evidence, then confirm a severity.</p></div></section>
    {error && <div className="auth-error" role="alert">{error}</div>}
    {notice && <div className="auth-success" role="status">{notice}</div>}
    {!error.startsWith("Moderator access is required") && <section className="account-panel">
      <div className="account-panel-heading"><span className="account-panel-icon"><ShieldCheck size={19}/></span><div><h2>Reports awaiting assessment</h2><p>Severity scale: 1 = minor, 5 = critical. A single photo cannot reliably establish physical depth.</p></div></div>
      {reports.length === 0 ? <div className="account-empty"><strong>No reports to review</strong><p>New submissions will appear here.</p></div> :
        <div className="account-report-list">{reports.map(report => <article className="account-report-row" key={report.id}>
          <div className="account-report-copy">
            <strong>{report.title}</strong><span>{report.description || "No description provided"}</span>
            <span>Reported estimate: <b>{report.user_reported_severity ?? report.severity}/5</b> · Photo assessment: <b>{report.ai_assessment_status === "assessed" && report.ai_assessed_severity ? report.ai_assessed_severity + "/5" : "Pending"}</b></span>
            {report.ai_confidence !== null && <span>Assessment confidence: {Math.round(report.ai_confidence * 100)}% · {report.ai_model || "Assessment details unavailable"}</span>}
            {report.photo_url && <a href={report.photo_url} target="_blank" rel="noreferrer" className="report-dashboard-link">Open photo evidence ↗</a>}
            <small>Reported {new Intl.DateTimeFormat("en-IN",{day:"numeric",month:"short",year:"numeric"}).format(new Date(report.reported_at))} · {report.verification_status}</small>
          </div>
          <div className="account-report-status">
            <label className="report-field">Verified severity<select value={values[report.id] ?? "3"} onChange={e=>setValues(old=>({...old,[report.id]:e.target.value}))}><option value="1">1 · Low</option><option value="2">2 · Minor</option><option value="3">3 · Moderate</option><option value="4">4 · High</option><option value="5">5 · Critical</option></select></label>
            <button className="account-save" onClick={()=>void verify(report)} disabled={busyId===report.id}>{busyId===report.id?<LoaderCircle size={15} className="spin"/>:<CheckCircle2 size={15}/>} Verify severity</button>
          </div>
        </article>)}</div>}
    </section>}
    <footer className="account-footer"><span>Only moderator-confirmed severity is marked verified.</span><Link href="/dashboard">Return to map</Link></footer>
  </main>;
}
