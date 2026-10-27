export type PotholeStatus = "open" | "in_progress" | "resolved" | "rejected";
export type VerificationStatus = "unverified" | "verified" | "duplicate";

export interface PotholeReport {
  id: string;
  title: string;
  description: string | null;
  latitude: number;
  longitude: number;
  severity: number;
  user_reported_severity?: number | null;
  ai_assessed_severity?: number | null;
  ai_confidence?: number | null;
  ai_model?: string | null;
  ai_assessment_status?: "pending" | "assessed" | "needs_review" | "failed" | "not_a_pothole";
  ai_assessment_notes?: string | null;
  verified_severity?: number | null;
  severity_source?: "ai_pending" | "user_reported" | "ai_assessed" | "moderator_verified";
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
