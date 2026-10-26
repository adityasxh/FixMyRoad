export type PotholeStatus = "open" | "in_progress" | "resolved" | "rejected";
export type VerificationStatus = "unverified" | "verified" | "duplicate";

export interface PotholeReport {
  id: string;
  title: string;
  description: string | null;
  latitude: number;
  longitude: number;
  severity: number;
  traffic_level: number;
  photo_url: string | null;
  status: PotholeStatus;
  verification_status: VerificationStatus;
  source_type: "community" | "official" | "synthetic";
  source_url: string | null;
  occurrence_count: number;
  reported_at: string;
  priority_score?: number;
}
