-- CreateTable
CREATE TABLE "BikelaneVerification" (
    "id" SERIAL NOT NULL,
    "osm_type" VARCHAR NOT NULL,
    "osm_id" BIGINT NOT NULL,
    "verified_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verified_by" BIGINT,
    "verified" TEXT NOT NULL,
    "comment" TEXT,

    CONSTRAINT "BikelaneVerification_pkey" PRIMARY KEY ("id")
);
