# Cutouts

## External cutouts

The processing can cutout external data in addition to the data generated from OSM.

### eUVM Berlin

#### Source

https://drive.google.com/drive/u/0/folders/1wEKkUayaySZ6AhsdrkTGbbeVAx1YJARs

#### Import / Update

##### Prepare tables (locally)

Use [`app/scripts/parking-cutouts-import/README.md`](../../../../app/scripts/parking-cutouts-import/README.md) (ogr2ogr + row-count check + SQL export).

##### Copy data (staging, production)

1. Run the generated `app/scripts/parking-cutouts-import/data/<table>.sql` in your SQL client (starts with `TRUNCATE`, then `INSERT`s)
2. Connect to staging/production using a DB tool if needed
