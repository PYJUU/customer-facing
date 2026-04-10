export type Severity = "critical" | "serious" | "moderate" | "minor";

export interface NormalizedIssue {
  ruleId: string;
  severity: Severity;
  selector: string;
  summary: string;
  detail: string;
  fingerprint: string;
}
