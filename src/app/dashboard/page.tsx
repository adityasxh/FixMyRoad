"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, ArrowUpRight, CheckCircle2, Clock3, MapPinned, RefreshCw, Search, ShieldCheck, SlidersHorizontal, UserRound } from "lucide-react";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";
import type { PotholeReport } from "@/types/pothole";

const MapView = dynamic(() => import("@/components/map/MapView"), { ssr: false, loading: () => <div className="map-loading">Loading interactive map…</div> });
type Filter = "all" | "open" | "high";
const severityLabel = (n: number) => n >= 4 ? "High" : n === 3 ? "Medium" : "Low";
const dateLabel = (s: string) => { const d = new Date(s); return Number.isNaN(d.getTime()) ? "Date unavailable" : new Intl.DateTimeFormat("en-IN",{day:"numeric",month:"short"}).format(d); };

export default function HomePage() {
  const [reports,setReports] = useState<PotholeReport[]>([]);
  const [loading,setLoading] = useState(true);
  const [refreshing,setRefreshing] = useState(false);
  const [message,setMessage] = useState("Checking Supabase connection…");
  const [filter,setFilter] = useState<Filter>("all");
  const [search,setSearch] = useState("");

  const loadReports = useCallback(async (refresh = false) => {
    refresh ? setRefreshing(true) : setLoading(true);
    if (!supabase) { setReports([]); setMessage("Supabase is not configured. Add your public URL and publishable key to .env.local."); setLoading(false); setRefreshing(false); return; }
    const {data,error} = await supabase.from("pothole_priority_queue").select("*").order("priority_score",{ascending:false}).limit(250);
    if (error) setMessage("Could not load reports. Check your Supabase URL, public key, and table policies.");
    else { setReports((data ?? []) as PotholeReport[]); setMessage("Connected to Supabase · displaying records currently in the database."); }
    setLoading(false); setRefreshing(false);
  },[]);
  useEffect(()=>{ void loadReports(); },[loadReports]);

  const open = useMemo(()=>reports.filter(r=>r.status==="open"||r.status==="in_progress"),[reports]);
  const high = useMemo(()=>open.filter(r=>r.severity>=4).length,[open]);
  const verified = useMemo(()=>reports.filter(r=>r.verification_status==="verified").length,[reports]);
  const visible = useMemo(()=>reports.filter(r=>{
    const q=search.trim().toLowerCase();
    const f=filter==="all"||(filter==="open"&&(r.status==="open"||r.status==="in_progress"))||(filter==="high"&&r.severity>=4);
    return f&&(!q||r.title.toLowerCase().includes(q)||(r.description??"").toLowerCase().includes(q));
  }),[reports,filter,search]);

  return <main className="app-shell">
    <header className="topbar">
      <a className="brand" href="/" aria-label="FixMyRoad home"><span className="brand-mark"><MapPinned size={23}/></span><span><strong>FixMyRoad</strong><small>GIS · ROAD INTELLIGENCE</small></span></a>
      <div className="topbar-right"><span className="location-chip"><span className="live-dot"/>Wagholi, Pune</span><div className="header-actions"><Link className="signin-link" href="/auth"><UserRound size={15}/> Account</Link><a className="github-link" href="/report" className="signin-link"><MapPinned size={15}/> Report a pothole</a></div></div>
    </header>
    <section className="hero">
      <div className="hero-copy"><div className="eyebrow"><span/>COMMUNITY ROAD SAFETY</div><h1>Every safer street<br/>starts with <span>one report.</span></h1><p>A location-first view of road hazards in Wagholi. Explore reported potholes, understand urgency, and help make repair priorities more transparent.</p><div className="hero-note"><ShieldCheck size={17}/> Community insight · Data-led repair priorities</div></div>
      <aside className="hero-stamp"><span className="stamp-icon"><MapPinned size={23}/></span><span className="stamp-label">ACTIVE PILOT AREA</span><strong>Wagholi</strong><span className="stamp-sub">Pune, Maharashtra, India</span><span className="pilot-status"><span className="live-dot"/> Pilot dashboard</span></aside>
    </section>
    <section className="stats-grid" aria-label="Report summary">
      <article className="stat-card"><span className="stat-icon stat-icon-blue"><MapPinned size={19}/></span><div><span className="stat-label">Open reports</span><strong>{loading?"—":open.length}</strong><small>Open or being addressed</small></div><span className="stat-corner">01</span></article>
      <article className="stat-card"><span className="stat-icon stat-icon-orange"><AlertTriangle size={19}/></span><div><span className="stat-label">High severity</span><strong>{loading?"—":high}</strong><small>Severity level 4–5</small></div><span className="stat-corner">02</span></article>
      <article className="stat-card"><span className="stat-icon stat-icon-green"><CheckCircle2 size={19}/></span><div><span className="stat-label">Verified reports</span><strong>{loading?"—":verified}</strong><small>Verified in the database</small></div><span className="stat-corner">03</span></article>
    </section>
    <section className="workspace">
      <div className="section-heading"><div><span className="section-kicker">LIVE GEOSPATIAL VIEW</span><h2>Road hazard monitor</h2><p>Explore the map and review reports ranked for attention.</p></div><button className="refresh-button" onClick={()=>void loadReports(true)} disabled={loading||refreshing}><RefreshCw size={15} className={refreshing?"spin":""}/>{refreshing?"Refreshing":"Refresh data"}</button></div>
      <div className="map-layout">
        <div className="map-column"><div className="map-card-top"><div><strong className="map-card-title">Wagholi area</strong><span className="map-card-subtitle">Interactive map · OpenStreetMap</span></div><span className="map-live-pill"><i/>DATABASE REPORTS</span></div><div className="map-frame"><MapView reports={reports}/><div className="map-attribution-note">Map tiles © OpenStreetMap contributors</div></div><div className="map-footer"><span><i className="legend-dot legend-high"/>High severity</span><span><i className="legend-dot legend-medium"/>Medium</span><span><i className="legend-dot legend-low"/>Low</span><span className="map-footer-count">{reports.length} total records</span></div></div>
        <aside className="queue-panel"><div className="queue-header"><div><span className="section-kicker">ACTION QUEUE</span><h3>Priority reports</h3></div><span className="queue-count">{visible.length}</span></div>
          <label className="search-box"><Search size={15}/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search reports…" aria-label="Search reports"/></label>
          <div className="filter-row"><button className={filter==="all"?"filter-chip active":"filter-chip"} onClick={()=>setFilter("all")}><SlidersHorizontal size={12}/>All</button><button className={filter==="open"?"filter-chip active":"filter-chip"} onClick={()=>setFilter("open")}>Open</button><button className={filter==="high"?"filter-chip active":"filter-chip"} onClick={()=>setFilter("high")}>High severity</button></div>
          <div className="report-list">{loading?<div className="empty-state"><span className="empty-icon"><RefreshCw size={18}/></span><strong>Loading reports</strong><p>Fetching records from Supabase.</p></div>:visible.length===0?<div className="empty-state"><span className="empty-icon"><MapPinned size={20}/></span><strong>{search||filter!=="all"?"No matching reports":"No reports yet"}</strong><p>{search||filter!=="all"?"Try another search or filter.":"New database reports will appear here and on the map. No demo reports are being presented as real."}</p></div>:visible.slice(0,10).map(r=><article className="report-row" key={r.id}><span className={r.severity>=4?"report-severity severity-high":r.severity===3?"report-severity severity-medium":"report-severity severity-low"}>{r.severity}</span><div className="report-main"><strong>{r.title}</strong><span>{r.description||"No description provided"}</span><div className="report-meta"><span className="report-status">{r.status.replace("_"," ")}</span><span><Clock3 size={11}/>{dateLabel(r.reported_at)}</span></div></div><span className={r.severity>=4?"severity-label text-high":r.severity===3?"severity-label text-medium":"severity-label text-low"}>{severityLabel(r.severity)}</span></article>)}</div>
          <div className="queue-footnote"><ShieldCheck size={14}/>Priority considers severity, traffic, recurrence, and report age.</div>
        </aside>
      </div>
      <div className={`connection-banner ${isSupabaseConfigured&&!loading&&!message.startsWith("Connected")?"connection-warning":""}`}><span className="connection-indicator"/><span>{loading?"Checking Supabase connection…":message}</span></div>
    </section>
    <section className="bottom-grid"><article className="info-card"><div className="info-card-heading"><span className="info-icon"><ShieldCheck size={18}/></span><h3>Transparent prioritization</h3></div><p>Reports use an explainable score: severity 40%, traffic importance 25%, repeat reports 20%, and age 15%. A score supports review; it does not automatically decide repairs.</p><span className="small-tag">Explainable scoring</span></article><article className="info-card"><div className="info-card-heading"><span className="info-icon info-icon-orange"><MapPinned size={18}/></span><h3>Evidence over guesses</h3></div><p>This dashboard displays database records only. Empty states are intentional; sample reports must be labelled and never presented as verified public reports.</p><span className="small-tag">Data integrity first</span></article></section>
    <footer className="footer"><span>© {new Date().getFullYear()} FixMyRoad GIS</span><span>Built with Next.js, Supabase, PostGIS & OpenStreetMap</span></footer>
  </main>;
}
