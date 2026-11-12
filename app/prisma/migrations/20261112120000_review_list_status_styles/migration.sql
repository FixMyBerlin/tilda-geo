-- Review lists can rename their status buttons and change the status colors on the map.
ALTER TABLE "ReviewList" ADD COLUMN "statusStyles" JSONB;
