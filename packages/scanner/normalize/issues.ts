import crypto from "node:crypto";

export type Severity = "critical" | "serious" | "moderate" | "minor";

export interface NormalizedIssue {
  ruleId: string;
  severity: Severity;
  selector: string;
  summary: string;
  detail: string;
  fingerprint: string;
}

type AxeNode = {
  target?: string[];
  failureSummary?: string;
};

type AxeViolation = {
  id: string;
  impact?: Severity;
  description?: string;
  help?: string;
  nodes?: AxeNode[];
};

export function toNormalizedIssues(violations: AxeViolation[], pageUrl: string): NormalizedIssue[] {
  return violations.flatMap((violation) => {
    const severity = violation.impact ?? "moderate";
    const nodes = violation.nodes ?? [];

    return nodes.map((node) => {
      const selector = node.target?.join(" ") ?? "unknown";
      const detail = node.failureSummary ?? violation.description ?? violation.help ?? "No detail";
      const fingerprint = createFingerprint({
        ruleId: violation.id,
        pageUrl,
        selector,
        detail,
      });

      return {
        ruleId: violation.id,
        severity,
        selector,
        summary: violation.help ?? violation.description ?? violation.id,
        detail,
        fingerprint,
      } satisfies NormalizedIssue;
    });
  });
}

export function createFingerprint(input: { ruleId: string; pageUrl: string; selector: string; detail: string }) {
  return crypto
    .createHash("sha1")
    .update(`${input.ruleId}|${input.pageUrl}|${input.selector}|${input.detail}`)
    .digest("hex");
}
