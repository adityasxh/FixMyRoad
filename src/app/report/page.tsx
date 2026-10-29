"use client";
import Link from "next/link";
import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Camera, CheckCircle2, ImagePlus, LoaderCircle, LocateFixed, MapPinned, ShieldCheck, Upload, X } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

export default function ReportPotholePage() {
  const router = useRouter();
  const [checking,setChecking] = useState(true), [userId,setUserId] = useState(""), [email,setEmail] = useState("");
  const [title,setTitle] = useState("Pothole report"), [description,setDescription] = useState(""), [traffic,setTraffic] = useState("3");
  const [photo,setPhoto] = useState<File|null>(null), [preview,setPreview] = useState("");
  const [coords,setCoords] = useState<{latitude:number;longitude:number;accuracy:number}|null>(null);
  const [locating,setLocating] = useState(false), [locationError,setLocationError] = useState(""), [busy,setBusy] = useState(false), [error,setError] = useState("");

  useEffect(() => {
    let alive = true;
    async function check() {
      if (!supabase) { setError("Supabase is not configured. Check .env.local."); setChecking(false); return; }
      const {data} = await supabase.auth.getSession();
      if (!alive) return;
      if (!data.session?.user) { router.replace("/login?next=/report"); return; }
      setUserId(data.session.user.id); setEmail(data.session.user.email ?? ""); setChecking(false);
    }
    void check();
    const {data} = supabase?.auth.onAuthStateChange((_event,session) => {
      if (!session?.user) router.replace("/login?next=/report");
      else { setUserId(session.user.id); setEmail(session.user.email ?? ""); }
    }) ?? {data:{subscription:{unsubscribe:()=>{}}}};
    return () => { alive=false; data.subscription.unsubscribe(); };
  },[router]);

  function locate() {
    setLocationError("");
    if (!navigator.geolocation) { setLocationError("This browser does not support GPS location."); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      p => { setCoords({latitude:p.coords.latitude,longitude:p.coords.longitude,accuracy:p.coords.accuracy}); setLocating(false); },
      e => { setLocationError(e.code===1 ? "Location permission was denied. Allow access in browser settings." : "Current location could not be determined. Check device location and try outdoors again."); setLocating(false); },
      {enableHighAccuracy:true,timeout:20000,maximumAge:0}
    );
  }
  function choosePhoto(e:ChangeEvent<HTMLInputElement>) {
    const f=e.target.files?.[0] ?? null;
    if (!f) return;
    if (!f.type.startsWith("image/")) { setError("Please choose an image file."); return; }
    if (f.size>10*1024*1024) { setError("Image must be 10 MB or smaller."); return; }
    setError(""); setPhoto(f); setPreview(URL.createObjectURL(f));
  }
  async function submit(e:FormEvent<HTMLFormElement>) {
    e.preventDefault(); setError("");
    if (!supabase || !userId) { router.replace("/login?next=/report"); return; }
    if (!photo) { setError("Please take a photo or upload an image of the pothole."); return; }
    if (!coords) { setError("Capture your current GPS location before submitting."); return; }
    setBusy(true);
    try {
      const ext=photo.name.split(".").pop()?.toLowerCase().replace(/[^a-z0-9]/g,"") || "jpg";
      const path=userId+"/"+Date.now()+"-"+crypto.randomUUID()+"."+ext;
      const {error:uploadError}=await supabase.storage.from("report-evidence").upload(path,photo,{contentType:photo.type,upsert:false});
      if(uploadError) throw new Error("Photo upload failed: "+uploadError.message);
      const photoUrl=supabase.storage.from("report-evidence").getPublicUrl(path).data.publicUrl;

      // Validate the image before creating a public report, so unrelated photos never enter the map or priority queue.
      const {data:assessment,error:assessmentError}=await supabase.functions.invoke("assess-pothole-severity",{body:{photoUrl}});
      if(assessmentError) throw new Error(assessmentError.message||"We couldn't verify this photo. Please try again.");
      if(assessment?.error) throw new Error(String(assessment.error));
      if(assessment?.pothole_detected !== true) {
        await supabase.storage.from("report-evidence").remove([path]);
        setError("This photo doesn't appear to show a pothole. Please upload a clear photo of the pothole on the road. No report was submitted.");
        return;
      }

      const {data:report,error:insertError}=await supabase.from("pothole_reports").insert({
        title:title.trim(),description:description.trim()||null,latitude:coords.latitude,longitude:coords.longitude,
        severity:assessment.ai_assessed_severity ?? 3,traffic_level:Number(traffic),photo_url:photoUrl,reporter_id:userId,
        status:"open",verification_status:"unverified",source_type:"community",occurrence_count:1,
        ai_assessed_severity:assessment.ai_assessed_severity,
        ai_confidence:assessment.ai_confidence,
        ai_model:assessment.ai_model,
        ai_assessment_status:assessment.ai_assessment_status,
        ai_assessment_notes:assessment.reason
      }).select("id").single();
      if(insertError) throw new Error("Could not save the report: "+insertError.message);
      const {error:evidenceError}=await supabase.from("report_evidence").insert({report_id:report.id,photo_url:photoUrl,note:description.trim()||null});
      if(evidenceError) console.warn("Report saved but evidence metadata could not be saved:",evidenceError.message);
      router.replace("/dashboard?submitted=1"); router.refresh();
    } catch(err) { setError(err instanceof Error?err.message:"Could not submit your report. Please try again."); }
    finally { setBusy(false); }
  }

  if(checking) return <main className="report-shell"><div className="report-card report-centered"><LoaderCircle className="spin" size={25}/><p>Checking your account…</p></div></main>;
  return <main className="report-shell">
    <header className="report-topbar"><Link href="/" className="brand"><span className="brand-mark"><img src="/fixmyroad-logo.svg" alt="" /></span><span><strong>FixMyRoad</strong><small>REPORT A ROAD HAZARD</small></span></Link><Link href="/dashboard" className="report-dashboard-link">Explore reports</Link></header>
    <div className="report-page-heading"><Link href="/" className="report-back"><ArrowLeft size={15}/> Back to home</Link><div className="landing-eyebrow"><span/> COMMUNITY REPORTING</div><h1>Report a pothole.</h1><p>Share a photo and capture your current GPS location to help assess the pothole’s severity.</p></div>
    <div className="report-content-grid">
      <form className="report-form-card" onSubmit={submit}>
        <div className="report-form-section-title"><span>01</span><div><h2>What did you find?</h2><p>Describe the road hazard clearly.</p></div></div>
        <label className="report-field">Report title<input value={title} onChange={e=>setTitle(e.target.value)} required maxLength={100} placeholder="e.g. Deep pothole near the junction"/></label>
        <label className="report-field">Description <span className="optional-label">Optional</span><textarea value={description} onChange={e=>setDescription(e.target.value)} maxLength={1000} rows={3} placeholder="Road name, landmark or other useful details…"/></label>
        <div className="report-two-fields"><label className="report-field">Traffic importance<select value={traffic} onChange={e=>setTraffic(e.target.value)}><option value="1">1 · Very low</option><option value="2">2 · Low</option><option value="3">3 · Moderate</option><option value="4">4 · High</option><option value="5">5 · Very high</option></select><small className="optional-label">Pothole severity is assessed from the submitted photo.</small></label></div>
        <div className="report-form-divider"/>
        <div className="report-form-section-title"><span>02</span><div><h2>Add photo evidence</h2><p>Take a photo now or select one from your device.</p></div></div>
        <label className="photo-dropzone">
          {preview ? <><img src={preview} alt="Pothole evidence preview"/><span className="photo-replace"><ImagePlus size={16}/> Change photo</span></> : <><span className="photo-drop-icon"><Camera size={24}/></span><strong>Take a photo or upload an image</strong><span>Image formats · up to 10 MB</span><span className="photo-choose-button"><Upload size={15}/> Choose photo</span></>}
          <input type="file" accept="image/*" capture="environment" onChange={choosePhoto} required={!photo}/>
        </label>
        {photo && <div className="selected-photo"><CheckCircle2 size={15}/><span>{photo.name}</span><button type="button" onClick={()=>{setPhoto(null);setPreview("");}} aria-label="Remove selected photo"><X size={15}/></button></div>}
        <div className="report-form-divider"/>
        <div className="report-form-section-title"><span>03</span><div><h2>Capture current location</h2><p>Request your device&apos;s current GPS position.</p></div></div>
        <div className={coords?"gps-panel gps-ready":"gps-panel"}><span className="gps-icon"><LocateFixed size={22}/></span><div className="gps-copy"><strong>{coords?"Location captured":"Current GPS location required"}</strong><p>{coords ? coords.latitude.toFixed(6)+", "+coords.longitude.toFixed(6)+" · accuracy ±"+Math.round(coords.accuracy)+" m" : "Allow location access to attach your current coordinates."}</p></div><button type="button" className="gps-button" onClick={locate} disabled={locating}>{locating?<LoaderCircle size={16} className="spin"/>:<LocateFixed size={16}/>} {locating?"Locating…":coords?"Refresh GPS":"Use my location"}</button></div>
        {locationError&&<p className="location-error" role="alert">{locationError}</p>}
        <p className="location-note"><ShieldCheck size={14}/> High-accuracy browser geolocation is requested. GPS accuracy varies by device and surroundings; don&apos;t step into traffic to take a photo.</p>
        {error&&<div className="auth-error" role="alert">{error}</div>}
        <button className="report-submit-button" type="submit" disabled={busy||!userId}>{busy?<><LoaderCircle size={18} className="spin"/> Submitting report…</>:<><MapPinned size={18}/> Submit pothole report <ArrowRight size={17}/></>}</button>
        <p className="report-submit-note">Submitting as <strong>{email}</strong>. Your report stays unverified until reviewed.</p>
      </form>
      <aside className="report-side-column"><div className="report-side-card"><span className="report-side-icon"><ShieldCheck size={20}/></span><h3>Why sign in?</h3><p>Reports are linked to your account to support follow-up and reduce anonymous spam.</p></div><div className="report-side-card"><span className="report-side-icon"><LocateFixed size={20}/></span><h3>GPS accuracy matters</h3><p>Capture location while safely near the pothole. Location can be less accurate indoors or among tall buildings.</p></div><div className="report-side-card report-side-warning"><span className="report-side-icon"><ShieldCheck size={20}/></span><h3>Submit responsibly</h3><p>Only upload relevant evidence. Submission does not automatically verify a pothole or guarantee a repair.</p></div></aside>
    </div>
    <footer className="landing-footer report-footer"><div className="footer-bottom"><span>© {new Date().getFullYear()} FixMyRoad GIS · Wagholi, Pune pilot</span><span><ShieldCheck size={14}/> Reports are reviewed before verification.</span></div></footer>
  </main>;
}
