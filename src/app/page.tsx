"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, MapPinned, ShieldCheck, Camera, LocateFixed, BarChart3, Menu, X, Map, AlertTriangle, UserRound, LogOut } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

export default function LandingPage() {
  const [signedIn, setSignedIn] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  useEffect(() => {
    let alive = true;
    void supabase?.auth.getSession().then(({ data }) => { if (alive) setSignedIn(Boolean(data.session)); });
    const { data } = supabase?.auth.onAuthStateChange((_event, session) => setSignedIn(Boolean(session))) ?? { data: { subscription: { unsubscribe: () => {} } } };
    return () => { alive = false; data.subscription.unsubscribe(); };
  }, []);
  const reportHref = signedIn ? "/report" : "/login?next=/report";
  async function logout() { if (!supabase) return; setLoggingOut(true); const { error } = await supabase.auth.signOut(); setLoggingOut(false); if (!error) setSignedIn(false); }
  return <main className="landing-shell">
    <header className="landing-nav">
      <Link href="/" className="brand"><span className="brand-mark"><MapPinned size={23}/></span><span><strong>FixMyRoad</strong><small>GIS · ROAD INTELLIGENCE</small></span></Link>
      <button className="mobile-menu-toggle" aria-label="Toggle navigation" onClick={() => setMenuOpen(v => !v)}>{menuOpen ? <X size={21}/> : <Menu size={21}/>}</button>
      <nav className={menuOpen ? "landing-nav-links open" : "landing-nav-links"}>
        <a href="#how-it-works" onClick={() => setMenuOpen(false)}>How it works</a>
        <a href="#features" onClick={() => setMenuOpen(false)}>Why FixMyRoad</a>
        <Link href="/dashboard" onClick={() => setMenuOpen(false)}>Explore reports</Link>
        {signedIn ? <><Link className="nav-login" href="/account" onClick={() => setMenuOpen(false)}><UserRound size={15}/> My dashboard</Link><button className="nav-register nav-logout" type="button" disabled={loggingOut} onClick={() => { setMenuOpen(false); void logout(); }}><LogOut size={15}/>{loggingOut ? "Logging out…" : "Log out"}</button></> : <><Link className="nav-login" href="/login" onClick={() => setMenuOpen(false)}><UserRound size={15}/> Sign in</Link><Link className="nav-register" href="/register" onClick={() => setMenuOpen(false)}>Register <ArrowRight size={15}/></Link></>}
        <Link className="nav-report" href={reportHref} onClick={() => setMenuOpen(false)}><MapPinned size={15}/> Report a pothole</Link>
      </nav>
    </header>

    <section className="landing-hero">
      <div className="landing-hero-copy">
        <div className="landing-eyebrow"><span/> COMMUNITY-POWERED ROAD SAFETY <span className="pilot-chip">WAGHOLI PILOT</span></div>
        <h1>Better roads begin<br/>with <em>being heard.</em></h1>
        <p>Spot a pothole? Report it with a photo and your location. FixMyRoad GIS helps turn community reports into a clear, map-based priority list for road repair.</p>
        <div className="landing-cta-row"><Link href={reportHref} className="primary-cta"><Camera size={18}/> Report a pothole <ArrowRight size={17}/></Link><Link href="/dashboard" className="secondary-cta"><Map size={17}/> Explore the map</Link></div>
        <div className="landing-trust"><span><ShieldCheck size={16}/> Sign-in required for reports</span><span><LocateFixed size={16}/> Location-aware submissions</span></div>
      </div>
      <div className="landing-hero-art" aria-label="Illustration of a road map with pothole reports">
        <div className="art-map-grid"></div><div className="art-road art-road-one"></div><div className="art-road art-road-two"></div>
        <div className="art-map-label label-one"><MapPinned size={14}/> WAGHOLI, PUNE</div>
        <div className="art-pin pin-one"><AlertTriangle size={20}/></div><div className="art-pin pin-two"><MapPinned size={20}/></div><div className="art-pin pin-three"><Camera size={19}/></div>
        <div className="art-report-card"><span className="art-card-icon"><AlertTriangle size={17}/></span><div><strong>Road hazard reported</strong><small>Photo + GPS location</small></div><span className="art-card-status">NEW</span></div>
        <div className="art-map-caption"><span className="art-live-dot"/> COMMUNITY REPORTS · MAP VIEW</div>
      </div>
    </section>

    <section className="landing-value-strip" id="features">
      <div><span className="value-icon"><Camera size={19}/></span><strong>Photo evidence</strong><p>Capture a new photo or upload one already taken.</p></div>
      <div><span className="value-icon"><LocateFixed size={19}/></span><strong>Location matters</strong><p>Use your device location to place the report on the map.</p></div>
      <div><span className="value-icon"><BarChart3 size={19}/></span><strong>Clear priorities</strong><p>Help organise reports by urgency and location context.</p></div>
      <div><span className="value-icon"><ShieldCheck size={19}/></span><strong>Account-linked</strong><p>Sign in so reports can be associated with an account.</p></div>
    </section>

    <section className="landing-how" id="how-it-works">
      <div className="landing-section-head"><span className="landing-eyebrow">SIMPLE. LOCAL. ACTIONABLE.</span><h2>From pothole to priority.</h2><p>A straightforward reporting process designed around useful evidence.</p></div>
      <div className="landing-steps">
        <article><span className="step-number">01</span><span className="step-icon"><UserRound size={21}/></span><h3>Create your account</h3><p>Register with your name, email and password, or use Google sign-in.</p></article>
        <article><span className="step-number">02</span><span className="step-icon"><Camera size={21}/></span><h3>Add photo and location</h3><p>Take a picture or choose one from your phone, then capture your current GPS coordinates.</p></article>
        <article><span className="step-number">03</span><span className="step-icon"><MapPinned size={21}/></span><h3>Submit a report</h3><p>Your signed-in account helps associate the report with its submitter for follow-up.</p></article>
        <article><span className="step-number">04</span><span className="step-icon"><BarChart3 size={21}/></span><h3>Support better priorities</h3><p>Reports can be mapped and ranked to help reviewers understand where attention may be needed.</p></article>
      </div>
    </section>

    <section className="landing-callout">
      <div><span className="landing-eyebrow">YOUR STREET. YOUR VOICE.</span><h2>Seen a pothole on your route?</h2><p>Share the evidence and help build a clearer picture of road conditions in the pilot area.</p></div>
      <Link href={reportHref} className="primary-cta">Report a pothole <ArrowRight size={17}/></Link>
    </section>

    <footer className="landing-footer">
      <div className="footer-main"><Link href="/" className="brand"><span className="brand-mark"><MapPinned size={22}/></span><span><strong>FixMyRoad</strong><small>GIS · ROAD INTELLIGENCE</small></span></Link><p>Community reports. Geographic context. More transparent repair priorities.</p><div className="footer-links"><Link href="/dashboard">Explore reports</Link>{signedIn ? <Link href="/account">My dashboard</Link> : <>{signedIn ? <Link href="/account">My dashboard</Link> : <><Link href="/login">Sign in</Link><Link href="/register">Register</Link></>}</>}<Link href={reportHref}>Report a pothole</Link></div></div>
      <div className="footer-bottom"><span>© {new Date().getFullYear()} FixMyRoad GIS · Wagholi, Pune pilot</span><span><ShieldCheck size={14}/> Reports are subject to review; submission does not guarantee repair.</span></div>
    </footer>
  </main>;
}
