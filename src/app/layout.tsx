import type { Metadata } from "next";
import "leaflet/dist/leaflet.css";
import "./globals.css";
import GlobalMotion from "@/components/GlobalMotion";

export const metadata: Metadata = {
  title: "FixMyRoad GIS | Pothole reporting and prioritization",
  description:
    "Report road potholes, explore their locations, and prioritize repairs using geographic data.",
  icons: { icon: "/fixmyroad-logo.svg", shortcut: "/fixmyroad-logo.svg" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body><GlobalMotion />{children}</body>
    </html>
  );
}
