-- Add decisionData column to QaEvaluation table
ALTER TABLE "QaEvaluation"
ADD COLUMN "decisionData" JSONB;
