-- CreateTable
CREATE TABLE "MapLayerOrder" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "layerKey" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "beforeId" TEXT,

    CONSTRAINT "MapLayerOrder_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "MapLayerOrder_layerKey_key" ON "MapLayerOrder"("layerKey");
