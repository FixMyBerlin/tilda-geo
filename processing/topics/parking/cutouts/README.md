# Cutouts

## External cutouts

The processing can cutout external data in addition to the data generated from OSM.

### eUVM Berlin

#### Source

https://drive.google.com/drive/u/0/folders/1wEKkUayaySZ6AhsdrkTGbbeVAx1YJARs

#### Import / Update

##### Prepare tables (locally)

1. Open QGIS
2. Add GeoJSON files
3. Rename layers
   - `euvm_cutouts_point`
   - `euvm_cutouts_polygon`
4. Drag and drop layers to the PostgreSQL connection

QGIS will copy the external data into the database.
[Screenshot](https://docs.google.com/document/d/1NThYOMxp4dIYfp_jZbBQX_akVWdE7nYMsQEUc3B-VNE/edit?tab=t.0)

##### Copy data (staging, production)

1. Export tables as SQL from local DB using a DB tool
2. Connect to staging/producction using a DB tool
3. Import the data from file
