import { headers } from "next/headers";

const DEFAULT_ORG_ID = process.env.DEFAULT_ORG_ID ?? "default-org";

export async function getRequestOrganizationId() {
  const headerStore = await headers();
  const orgFromHeader = headerStore.get("x-org-id");
  return orgFromHeader || DEFAULT_ORG_ID;
}
