-- Add unique constraint to prevent duplicate site creation in same organization
CREATE UNIQUE INDEX "Site_organizationId_baseUrl_key" ON "Site"("organizationId", "baseUrl");
