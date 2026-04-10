export const SITE_STATUS = {
  ACTIVE: "active",
  PAUSED: "paused",
} as const;

export const SCAN_STATUS = {
  QUEUED: "queued",
  RUNNING: "running",
  COMPLETED: "completed",
  FAILED: "failed",
} as const;
