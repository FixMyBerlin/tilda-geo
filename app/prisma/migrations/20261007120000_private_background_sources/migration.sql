-- Background maps with a secret token in the tile URL, shared with regions (m:n).
CREATE TABLE "PrivateBackgroundSource" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "tilesUrl" TEXT NOT NULL,
    "tilesUrlChangedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "attributionHtml" TEXT NOT NULL DEFAULT '',
    "minzoom" INTEGER,
    "maxzoom" INTEGER,
    "tileSize" INTEGER NOT NULL DEFAULT 256,
    CONSTRAINT "PrivateBackgroundSource_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PrivateBackgroundSource_slug_key" ON "PrivateBackgroundSource"("slug");
CREATE TABLE "_PrivateBackgroundSourceToRegion" (
    "A" INTEGER NOT NULL,
    "B" INTEGER NOT NULL,
    CONSTRAINT "_PrivateBackgroundSourceToRegion_AB_pkey" PRIMARY KEY ("A","B")
);
CREATE INDEX "_PrivateBackgroundSourceToRegion_B_index" ON "_PrivateBackgroundSourceToRegion"("B");
ALTER TABLE "_PrivateBackgroundSourceToRegion" ADD CONSTRAINT "_PrivateBackgroundSourceToRegion_A_fkey" FOREIGN KEY ("A") REFERENCES "PrivateBackgroundSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "_PrivateBackgroundSourceToRegion" ADD CONSTRAINT "_PrivateBackgroundSourceToRegion_B_fkey" FOREIGN KEY ("B") REFERENCES "Region"("id") ON DELETE CASCADE ON UPDATE CASCADE;
