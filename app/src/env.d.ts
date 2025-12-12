namespace NodeJS {
  interface ProcessEnv {
    // NEXTJS
    readonly NEXT_PUBLIC_APP_ORIGIN: string
    readonly NEXT_PUBLIC_APP_ENV: 'staging' | 'production' | 'development'
    readonly SESSION_SECRET_KEY: string
    // MAP API KEYS
    readonly MAPBOX_STYLE_ACCESS_TOKEN: `pk.${string}`
    readonly MAPBOX_PARKING_STYLE_ACCESS_TOKEN: `pk.${string}`
    // DEVELOPMENT
    readonly NEXT_PUBLIC_TILES_ENV: 'staging' | 'production' | 'development'
    // DATABASE

    readonly PGUSER: never
    readonly PGDATABASE: never
    readonly PGPASSWORD: never
    readonly DATABASE_URL: never
    readonly GEO_DATABASE_URL: string
    // LOGIN
    readonly OSM_CLIENT_ID: string
    readonly OSM_CLIENT_SECRET: string
    // StaticDatasets
    readonly S3_KEY: string
    readonly S3_SECRET: string
    readonly S3_REGION: 'eu-central-1'
    readonly API_ROOT_URL:
      | 'http://127.0.0.1:5173/api'
      | 'https://staging.tilda-geo.de/api'
      | 'https://tilda-geo.de/api'
    readonly S3_BUCKET: string
    readonly S3_UPLOAD_FOLDER: production | staging | localdev
    // API
    readonly ATLAS_API_KEY: string
    readonly MAPROULETTE_API_KEY: string
    readonly NEXT_PUBLIC_DO_NOT_NAVIGATE: string
  }
}
