"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  ArrowUpRight,
  CheckCircle2,
  MapPinned,
  ShieldCheck,
} from "lucide-react";
import { isSupabaseConfigured, supabase } from "@/lib/supabase/client";
import type { PotholeReport } from "@/types/pothole";

const MapView = dynamic(() => import("@/components/map/MapView"), {
  ssr: false,
  loading: () => <div className="map-loading">Loading interactive map…</div>,
});

export default function HomePage() {
  const [reports, setReports] = useState<PotholeReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState(
    "Connect Supabase to load reports from your database."
  );

  useEffect(() => {
    let active = true;

    async function loadReports() {
      if (!supabase) {
        if (active) setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("pothole_priority_queue")
        .select("*")
        .order("priority_score", { ascending: false })
        .limit(250);

      if (!active) return;
      if (error) {
        setMessage(
          "Supabase is configured, but reports could not be loaded. Check the project URL, public key, and table policies."
        );
      } else {
        setReports((data ?? []) as PotholeReport[]);
        setMessage("Connected to Supabase. Showing reports currently in the database.");
      }
      setLoading(false);
    }

    void loadReports();
    return () => {
      active = false;
    };
  }, []);

  const openReports = useMemo(
    () => reports.filter((report) => report.status === "open" || report.status === "in_progress"),
    [reports]
  );
  const criticalReports = useMemo(
    () => openReports.filter((report) => report.severity >= 4).length,
    [openReports]
  );
  const verifiedReports = useMemo(
    () => reports.filter((report) => report.verification_status === "verified").length,
    [reports]
  );

  return (
    <main className="app-shell">
      <header className="topbar">
        <a className="brand" href="/" aria-label="FixMyRoad home">
          <span className="brand-mark"><MapPinned size={23} strokeWidth={2.2} /></span>
          <span><strong>FixMyRoad</strong><small>GIS • ROAD INTELLIGENCE</small></span>
        </a>
        <div className="topbar-right">
          <span className="location-chip"><span className="live-dot" /> Wagholi, Pune</span>
          <a className="github-link" href="https://github.com/adityasxh/FixMyRoad" target="_blank" rel="noreferrer">
            View repository <ArrowUpRight size={15} />
          </a>
        </div>
      </header>

      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow"><span /> COMMUNITY ROAD SAFETY</div>
          <h1>Better roads start<br />with <span>better information.</span></h1>
          <p>Map potholes, surface road hazards, and help prioritize repairs where they matter most.</p>
          <div className="hero-note"><ShieldCheck size={17} /> Location-led reporting • Explainable prioritization</div>
        </div>
        <div className="hero-stamp">
          <span className="stamp-icon"><MapPinned size={24} /></span>
          <span className="stamp-label">PILOT AREA</span>
          <strong>Wagholi</strong>
          <span className="stamp-sub">Pune, Maharashtra</span>
        </div>
      </section>

      <section className="stats-grid" aria-label="Report summary">
        <article className="stat-card"><span className="stat-icon stat-icon-blue"><MapPinned size={19} /></span><div><span className="stat-label">Open reports</span><strong>{loading ? "—" : openReports.length}</strong><small>Awaiting resolution or in progress</small></div></article>
        <article className="stat-card"><span className="stat-icon stat-icon-orange"><AlertTriangle size={19} /></span><div><span className="stat-label">High severity</span><strong>{loading ? "—" : criticalReports}</strong><small>Severity level 4–5</small></div></article>
        <article className="stat-card"><span className="stat-icon stat-icon-green"><CheckCircle2 size={19} /></span><div><span className="stat-label">Verified reports</span><strong>{loading ? "—" : verifiedReports}</strong><small>Verified in the database</small></div></article>
      </section>

      <section className="workspace">
        <div className="section-heading">
          <div><span className="section-kicker">GEOSPATIAL OVERVIEW</span><h2>Pothole map</h2><p>Explore reported hazards across the pilot area.</p></div>
          <div className="map-legend"><span className="legend-dot legend-high" /> High <span className="legend-dot legend-medium" /> Medium <span className="legend-dot legend-low" /> Low</div>
        </div>
        <div className="map-frame"><MapView reports={reports} /><div className="map-attribution-note">Map tiles © OpenStreetMap contributors</div></div>
        <div className={`connection-banner ${isSupabaseConfigured && !loading && !message.startsWith("Connected") ? "connection-warning" : ""}`}>
          <span className="connection-indicator" /><span>{loading ? "Checking Supabase connection…" : message}</span>
        </div>
      </section>

      <section className="bottom-grid">
        <article className="info-card"><div className="info-card-heading"><span className="info-icon"><ShieldCheck size={18} /></span><h3>Transparent prioritization</h3></div><p>Open reports are ranked using a documented score: severity 40%, traffic importance 25%, repeat reports 20%, and age 15%.</p><span className="small-tag">Explainable scoring</span></article>
        <article className="info-card"><div className="info-card-heading"><span className="info-icon info-icon-orange"><MapPinned size={18} /></span><h3>Evidence over guesses</h3></div><p>This map displays database records only. Empty states are intentional; sample data must be labelled and never presented as verified reports.</p><span className="small-tag">Data integrity first</span></article>
      </section>

      <footer className="footer"><span>© {new Date().getFullYear()} FixMyRoad GIS</span><span>Built with Next.js, Supabase, PostGIS & OpenStreetMap</span></footer>
    </main>
  );
}
