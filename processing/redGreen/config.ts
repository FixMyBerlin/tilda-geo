type ParsedDbUrl = {
	url: string;
	host: string;
	port: string;
	database: string;
	username: string;
	password: string;
};

type RedGreenConfig = {
	workingPbfPath: string;
	recutPbfPath: string;
	recutPolygonPath: string | null;
	recutPolygonDownloadUrl: string | null;
	recutBbox: string | null;
	replicationServerUrl: string | null;
	replicationLoopSleepSeconds: number;
	rowCountTolerance: number;
	warmCacheMode: "full" | "delta";
	runId: string;
	staging: ParsedDbUrl;
	primary: ParsedDbUrl;
	tablesAllowlist: string[];
};

function parseDbUrl(envName: string): ParsedDbUrl {
	const raw = process.env[envName];
	if (!raw) {
		throw new Error(`Missing required env var ${envName}`);
	}
	const parsed = new URL(raw);
	if (parsed.protocol !== "postgresql:" && parsed.protocol !== "postgres:") {
		throw new Error(
			`Invalid protocol for ${envName}. Expected postgres:// or postgresql://`,
		);
	}

	const host = parsed.hostname;
	const port = parsed.port || "5432";
	const database = parsed.pathname.replace(/^\//, "");
	const username = decodeURIComponent(parsed.username);
	const password = decodeURIComponent(parsed.password);

	if (!host || !database || !username) {
		throw new Error(`Invalid ${envName}. Need host, database and username.`);
	}

	return {
		url: raw,
		host,
		port,
		database,
		username,
		password,
	};
}

function parseCsv(envName: string): string[] {
	return (process.env[envName] || "")
		.split(",")
		.map((value) => value.trim())
		.filter((value) => value.length > 0);
}

function resolveRunId() {
	const now = new Date();
	return now
		.toISOString()
		.replace(/[^0-9]/g, "")
		.slice(0, 14);
}

export function readRedGreenConfig(): RedGreenConfig {
	const warmCacheMode =
		process.env.WARM_CACHE_MODE === "delta" ? "delta" : "full";
	const tablesAllowlist = parseCsv("PROMOTION_TABLES_ALLOWLIST");

	const rowCountTolerance = Number(
		process.env.PROMOTION_ROW_COUNT_TOLERANCE || "0.15",
	);
	if (Number.isNaN(rowCountTolerance) || rowCountTolerance < 0) {
		throw new Error(
			"PROMOTION_ROW_COUNT_TOLERANCE must be a non-negative number (e.g. 0.15 for 15%).",
		);
	}

	return {
		workingPbfPath:
			process.env.WORKING_PBF_PATH || "/data/downloads/germany-latest.osm.pbf",
		recutPbfPath:
			process.env.RECUT_PBF_PATH || "/data/filtered/germany-recut.osm.pbf",
		recutPolygonPath: process.env.RECUT_POLYGON_PATH || null,
		recutPolygonDownloadUrl: process.env.RECUT_POLYGON_DOWNLOAD_URL || null,
		recutBbox: process.env.RECUT_BBOX || null,
		replicationServerUrl: process.env.REPLICATION_SERVER_URL || null,
		replicationLoopSleepSeconds: Number(
			process.env.REPLICATION_LOOP_SLEEP_SECONDS || "60",
		),
		rowCountTolerance,
		warmCacheMode,
		runId: process.env.RED_GREEN_RUN_ID || resolveRunId(),
		staging: parseDbUrl("PROCESSING_STAGING_DATABASE_URL"),
		primary: parseDbUrl("PROMOTION_PRIMARY_DATABASE_URL"),
		tablesAllowlist,
	};
}

export type { RedGreenConfig, ParsedDbUrl };
