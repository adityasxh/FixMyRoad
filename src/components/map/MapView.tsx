"use client";

import { useEffect } from "react";
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from "react-leaflet";
import type { LatLngExpression } from "leaflet";
import type { PotholeReport } from "@/types/pothole";

// Approximate center of Wagholi, Pune.
const WAGHOLI: LatLngExpression = [18.5793, 73.9829];

function FixMapSize() {
  const map = useMap();
  useEffect(() => {
    const timer = window.setTimeout(() => map.invalidateSize(), 100);
    return () => window.clearTimeout(timer);
  }, [map]);
  return null;
}

function severityColor(severity: number) {
  if (severity >= 5) return "#dc2626";
  if (severity >= 4) return "#ea580c";
  if (severity >= 3) return "#d97706";
  return "#16a34a";
}

export default function MapView({ reports }: { reports: PotholeReport[] }) {
  return (
    <MapContainer
      center={WAGHOLI}
      zoom={13}
      scrollWheelZoom
      className="map-canvas"
      aria-label="Interactive pothole map centered on Wagholi, Pune"
    >
      <FixMapSize />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {reports.map((report) => (
        <CircleMarker
          key={report.id}
          center={[report.latitude, report.longitude]}
          radius={7 + report.severity}
          pathOptions={{
            color: severityColor(report.severity),
            fillColor: severityColor(report.severity),
            fillOpacity: 0.76,
            weight: 2,
          }}
        >
          <Popup>
            <div className="map-popup">
              <strong>{report.title}</strong>
              <span>Severity: {report.severity}/5</span>
              <span>Status: {report.status.replace("_", " ")}</span>
              {report.source_type === "synthetic" && (
                <span className="demo-note">Demo data — not a verified real report</span>
              )}
              {report.description && <p>{report.description}</p>}
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
