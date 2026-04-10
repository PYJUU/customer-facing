import { NextResponse } from "next/server";

export type ApiErrorCode =
  | "UNAUTHENTICATED"
  | "NO_ORGANIZATION"
  | "VALIDATION_ERROR"
  | "RATE_LIMITED"
  | "CONFLICT"
  | "FORBIDDEN"
  | "NOT_FOUND"
  | "SERVICE_UNAVAILABLE"
  | "INTERNAL_ERROR";

export type ApiErrorBody = {
  error: string;
  code: ApiErrorCode;
  requestId: string;
  details?: unknown;
};

export function apiError(
  status: number,
  code: ApiErrorCode,
  message: string,
  requestId: string,
  details?: unknown,
) {
  return NextResponse.json(
    {
      error: message,
      code,
      requestId,
      ...(details ? { details } : {}),
    } satisfies ApiErrorBody,
    { status },
  );
}

export class UnauthenticatedError extends Error {
  constructor() {
    super("UNAUTHENTICATED");
  }
}

export class NoOrganizationError extends Error {
  constructor() {
    super("NO_ORGANIZATION");
  }
}
