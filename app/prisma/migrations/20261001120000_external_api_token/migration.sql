-- External notes API: short-lived Bearer tokens, issued for a verified OSM access token.
CREATE TABLE "ExternalApiToken" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "hashedToken" TEXT NOT NULL,
    "scope" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "lastUsedAt" TIMESTAMP(3),
    "userId" TEXT NOT NULL,
    CONSTRAINT "ExternalApiToken_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "ExternalApiToken_hashedToken_key" ON "ExternalApiToken"("hashedToken");
CREATE INDEX "ExternalApiToken_userId_idx" ON "ExternalApiToken"("userId");
CREATE INDEX "ExternalApiToken_expiresAt_idx" ON "ExternalApiToken"("expiresAt");
ALTER TABLE "ExternalApiToken" ADD CONSTRAINT "ExternalApiToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
