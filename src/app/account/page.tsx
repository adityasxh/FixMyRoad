"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, CalendarDays, Camera, CheckCircle2, Clock3, LoaderCircle, LogOut, MapPinned, RefreshCw, ShieldCheck, UserRound } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

type Report = { id:string; title:string; description:string|null; status:string; severity:number; reported_at:string; verification_status:string; ai_assessment_status:string; ai_assessment_notes:string|null; ai_assessed_severity:number|null; ai_confidence:number|null };
export default function AccountDashboard() {
  const router=useRouter();
  const [loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[signingOut,setSigningOut]=useState(false);
  const [userId,setUserId]=useState(""),[email,setEmail]=useState(""),[name,setName]=useState(""),[phone,setPhone]=useState(""),[area,setArea]=useState("Wagholi, Pune"),[role,setRole]=useState("resident");
  const [reports,setReports]=useState<Report[]>([]),[error,setError]=useState(""),[notice,setNotice]=useState(""),[retryingId,setRetryingId]=useState("");
  const load=useCallback(async()=>{
    if(!supabase){setError("Supabase is not configured. Check .env.local.");setLoading(false);return;}
    const {data,error:sessionError}=await supabase.auth.getSession();
    const user=data.session?.user;
    if(sessionError||!user){router.replace("/login?next=/account");return;}
    setUserId(user.id);setEmail(user.email??"");
    setName(String(user.user_metadata?.full_name??user.user_metadata?.name??""));
    setPhone(String(user.user_metadata?.phone??""));setArea(String(user.user_metadata?.area??"Wagholi, Pune"));setRole(String(user.user_metadata?.reporter_type??"resident"));
    const {data:rows,error:reportError}=await supabase.from("pothole_reports").select("id,title,description,status,severity,reported_at,verification_status,ai_assessment_status,ai_assessment_notes,ai_assessed_severity,ai_confidence").eq("reporter_id",user.id).order("reported_at",{ascending:false}).limit(50);
    if(reportError)setError("Your profile loaded, but reports could not be fetched. "+reportError.message);
    else setReports((rows??[]) as Report[]);
    setLoading(false);
  },[router]);
  useEffect(()=>{void load();const {data}=supabase?.auth.onAuthStateChange((_event,session)=>{if(!session?.user)router.replace("/login?next=/account");})??{data:{subscription:{unsubscribe:()=>{}}}};return()=>data.subscription.unsubscribe();},[load,router]);
  async function save(e:React.FormEvent<HTMLFormElement>){
    e.preventDefault();if(!supabase)return;setSaving(true);setError("");setNotice("");
    const {error}=await supabase.auth.updateUser({data:{full_name:name.trim(),phone:phone.trim(),area:area.trim(),reporter_type:role,profile_completed:true}});
    setSaving(false);if(error){setError(error.message);return;}setNotice("Profile updated successfully.");
  }
  async function retryAssessment(reportId:string){
    if(!supabase)return;
    setRetryingId(reportId);setError("");setNotice("Retrying report assessment…");
    const {data,error:assessmentError}=await supabase.functions.invoke("assess-pothole-severity",{body:{reportId}});
    if(assessmentError){setError(assessmentError.message||"Report assessment failed. Please try again later.");setNotice("");}
    else if(data?.error){setError(String(data.error));setNotice("");}
    else {setNotice("Assessment request completed. Refreshing report details…");}
    await load();
    setRetryingId("");
  }
  async function logout(){
    if(!supabase)return;setSigningOut(true);const {error}=await supabase.auth.signOut();setSigningOut(false);
    if(error){setError(error.message);return;}router.replace("/");router.refresh();
  }
  if(loading)return <main className="account-shell"><div className="account-loading"><LoaderCircle size={24} className="spin"/> Loading your account…</div></main>;
  const initial=(name||email||"U").trim().charAt(0).toUpperCase();
  return <main className="account-shell">
    <header className="account-nav"><Link href="/" className="brand"><span className="brand-mark"><MapPinned size={22}/></span><span><strong>FixMyRoad</strong><small>REPORTER DASHBOARD</small></span></Link><div className="account-nav-actions"><Link href="/dashboard" className="account-map-link">Explore public map</Link><button className="account-logout" onClick={()=>void logout()} disabled={signingOut}>{signingOut?<LoaderCircle size={15} className="spin"/>:<LogOut size={15}/>} Log out</button></div></header>
    <section className="account-welcome"><div><div className="landing-eyebrow"><span/> YOUR FIXMYROAD ACCOUNT</div><h1>Welcome back{name?", "+name.split(" ")[0]:""}.</h1><p>Manage your profile and keep track of the potholes you've reported.</p></div><Link href="/report" className="primary-cta"><Camera size={17}/> Report a pothole <ArrowRight size={16}/></Link></section>
    <div className="account-summary-grid"><article><span className="account-summary-icon"><MapPinned size={19}/></span><div><small>Your reports</small><strong>{reports.length}</strong></div></article><article><span className="account-summary-icon account-orange"><Clock3 size={19}/></span><div><small>Open / in progress</small><strong>{reports.filter(r=>r.status==="open"||r.status==="in_progress").length}</strong></div></article><article><span className="account-summary-icon account-blue"><CheckCircle2 size={19}/></span><div><small>Verified</small><strong>{reports.filter(r=>r.verification_status==="verified").length}</strong></div></article></div>
    <div className="account-content-grid">
      <section className="account-panel"><div className="account-panel-heading"><span className="account-panel-icon"><UserRound size={19}/></span><div><h2>Your profile</h2><p>These details help the team follow up if a report needs clarification.</p></div></div>
        <div className="account-identity"><span className="account-avatar">{initial}</span><div><strong>{name||"FixMyRoad member"}</strong><span>{email}</span><small><ShieldCheck size={13}/> Signed-in account</small></div></div>
        <form className="account-profile-form" onSubmit={save}><label>Full name<input required minLength={2} maxLength={80} value={name} onChange={e=>setName(e.target.value)} placeholder="Your full name"/></label><label>Email address<input value={email} readOnly disabled/></label><label>Phone number<input type="tel" value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+91 98765 43210"/></label><label>Locality / area<input required value={area} maxLength={120} onChange={e=>setArea(e.target.value)} placeholder="Wagholi, Pune"/></label><label>Reporter type<select value={role} onChange={e=>setRole(e.target.value)}><option value="resident">Local resident</option><option value="commuter">Daily commuter</option><option value="student">Student</option><option value="business">Local business</option><option value="other">Other</option></select></label>{error&&<div className="auth-error" role="alert">{error}</div>}{notice&&<div className="auth-success" role="status">{notice}</div>}<button className="account-save" disabled={saving}>{saving?<LoaderCircle size={16} className="spin"/>:<CheckCircle2 size={16}/>} Save changes</button></form><p className="account-profile-note">Your profile details are saved to Supabase Auth metadata. Phone number is not SMS-verified.</p>
      </section>
      <section className="account-panel account-reports-panel"><div className="account-panel-heading"><span className="account-panel-icon"><MapPinned size={19}/></span><div><h2>Your reports</h2><p>Reports submitted using this account.</p></div></div>
        {reports.length===0?<div className="account-empty"><span><Camera size={22}/></span><strong>No reports yet</strong><p>When you submit your first pothole report, it will appear here.</p><Link href="/report" className="secondary-cta">Submit your first report <ArrowRight size={15}/></Link></div>:<div className="account-report-list">{reports.map(r=><article className="account-report-row" key={r.id}><span className={r.severity>=4?"account-severity high":r.severity===3?"account-severity medium":"account-severity low"}>{r.severity}</span><div className="account-report-copy"><strong>{r.title}</strong><span>{r.description||"No description added"}</span><small><CalendarDays size={12}/>{new Intl.DateTimeFormat("en-IN",{day:"numeric",month:"short",year:"numeric"}).format(new Date(r.reported_at))}</small><small>Severity: {r.ai_assessed_severity ?? "Pending"} · Assessment: {r.ai_assessment_status || "pending"}{r.ai_confidence!=null?` · ${Math.round(r.ai_confidence*100)}% confidence`:""}</small>{(r.ai_assessment_status==="pending"||r.ai_assessment_status==="failed")&&<button type="button" className="secondary-cta" onClick={()=>void retryAssessment(r.id)} disabled={!!retryingId}>{retryingId===r.id?<LoaderCircle size={14} className="spin"/>:<RefreshCw size={14}/>} Retry assessment</button>}</div><div className="account-report-status"><span>{r.status.replace("_"," ")}</span><small>{r.verification_status}</small></div></article>)}</div>}
        <div className="account-panel-footer"><ShieldCheck size={14}/> Reports remain unverified until reviewed by moderators.</div>
      </section>
    </div>
    <footer className="account-footer"><span>© {new Date().getFullYear()} FixMyRoad GIS · Wagholi pilot</span><Link href="/">Back to homepage <ArrowRight size={13}/></Link></footer>
  </main>;
}
