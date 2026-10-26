import Link from "next/link";

export default function NotFound() {
  return (
    <main style={{ minHeight: "70vh", display: "grid", placeItems: "center", padding: 24 }}>
      <div style={{ textAlign: "center", maxWidth: 420 }}>
        <p style={{ color: "#176b4d", fontWeight: 700 }}>FIXMYROAD GIS</p>
        <h1>Page not found</h1>
        <p>The page you are looking for doesn’t exist.</p>
        <Link href="/" style={{ color: "#176b4d", fontWeight: 700 }}>Back to map</Link>
      </div>
    </main>
  );
}
