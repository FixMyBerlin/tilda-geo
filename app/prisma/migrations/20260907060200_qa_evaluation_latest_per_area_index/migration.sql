-- CreateIndex
CREATE INDEX "QaEvaluation_configId_areaId_createdAt_id_idx" ON prisma."QaEvaluation" ("configId", "areaId", "createdAt" DESC, "id" DESC);
