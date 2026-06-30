import { readdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { restartTileServer, triggerPrivateApi } from "../steps/externalTriggers";
import { readRedGreenConfig } from "./config";
import {
	downloadBaselineIfNeeded,
	ensureRecutPolygon,
} from "./downloadBaseline";
import { dbEnv, withProcessEnv } from "./shell";
import { acquireLock, releaseLock } from "./lock";
import { promoteStagingIntoPrimary } from "./promotePrimary";
import { replicateAndRecut } from "./replicateAndRecut";
import { rollbackPrimary } from "./rollbackPrimary";
import { validateStagingDataset } from "./validateStaging";
import { ContinuousVerifier } from "./verifier";

const LOCK_FILE = "/data/hashes/red_green_pipeline.lock";
const CACHE_NGINX_PROXY_DIR = "/cache_nginx_proxy";

function readVerifyEndpoints() {
	return (process.env.RED_GREEN_VERIFY_ENDPOINTS || "")
		.split(",")
		.map((endpoint) => endpoint.trim())
		.filter((endpoint) => endpoint.length > 0);
}

async function checkEndpoints() {
	const endpoints = readVerifyEndpoints();
	for (const endpoint of endpoints) {
		const response = await fetch(endpoint);
		if (!response.ok) {
			throw new Error(
				`Health check failed for ${endpoint}: HTTP ${response.status}`,
			);
		}
	}
}

async function clearProxyCacheIfPresent() {
	const entries = await readdir(CACHE_NGINX_PROXY_DIR).catch(() => null);
	if (!entries || entries.length === 0) return;
	await Promise.all(
		entries.map((name) =>
			rm(join(CACHE_NGINX_PROXY_DIR, name), {
				recursive: true,
				force: true,
			}),
		),
	);
}

async function main() {
	const config = readRedGreenConfig();
	await acquireLock(LOCK_FILE);

	const endpoints = readVerifyEndpoints();
	if (endpoints.length === 0) {
		throw new Error(
			"RED_GREEN_VERIFY_ENDPOINTS must be set. Verification is mandatory.",
		);
	}
	const verifier = new ContinuousVerifier({
		endpoints,
		intervalMs: Number(process.env.RED_GREEN_VERIFY_INTERVAL_MS || "5000"),
		outputFile: `/data/hashes/red_green_verify_${config.runId}.jsonl`,
	});

	let promotedTables: string[] = [];
	try {
		await verifier.start();
		console.log(`Pipeline run ${config.runId}: start`);
		await checkEndpoints();
		await downloadBaselineIfNeeded(config);
		await ensureRecutPolygon(config);
		await replicateAndRecut(config);
		await withProcessEnv(dbEnv(config.staging), async () => {
			const { runStagingBuild } = await import("./stagingBuild");
			await runStagingBuild(config);
		});
		const validation = await validateStagingDataset(config);
		promotedTables = validation.tables;
		await promoteStagingIntoPrimary(config, promotedTables);
		await checkEndpoints();

		// Refresh tile serving so /catalog reflects the freshly swapped tables,
		// then run post-processing hooks. These side effects run against the
		// already-promoted primary: triggerPrivateApi retries on transient failures
		// and warns (does not throw) on persistent ones, so a flaky warm-cache does
		// not roll back data that already validated and promoted cleanly. The
		// continuous verifier's failure-streak budget is the real serving-health gate.
		try {
			await restartTileServer();
		} catch (tileError) {
			console.warn(
				"[WARN] Tile server restart failed after promotion; data is promoted, /catalog may be stale until the next restart.",
				tileError,
			);
		}
		await triggerPrivateApi("post-processing-hook");
		await triggerPrivateApi("post-processing-qa-update");
		await clearProxyCacheIfPresent();
		if (config.warmCacheMode === "delta") {
			const deltaEndpoint = process.env.RED_GREEN_DELTA_WARM_ENDPOINT;
			if (deltaEndpoint) {
				await triggerPrivateApi(deltaEndpoint);
			} else {
				console.warn(
					"WARM_CACHE_MODE=delta set but RED_GREEN_DELTA_WARM_ENDPOINT missing. Falling back to full warm-cache.",
				);
				await triggerPrivateApi("warm-cache");
			}
		} else {
			await triggerPrivateApi("warm-cache");
		}
		const summary = await verifier.stop();
		const maxFailureStreak = Number(
			process.env.RED_GREEN_MAX_FAILURE_STREAK || "3",
		);
		if (summary.maxFailureStreak > maxFailureStreak) {
			throw new Error(
				`Verifier failed budget: max failure streak ${summary.maxFailureStreak} > ${maxFailureStreak}`,
			);
		}
		console.log(`Pipeline run ${config.runId}: completed`);
	} catch (error) {
		console.error(`[ERROR] Pipeline run ${config.runId} failed`, error);
		if (promotedTables.length > 0) {
			try {
				await rollbackPrimary(config, promotedTables);
				console.log(`Pipeline run ${config.runId}: rollback completed`);
			} catch (rollbackError) {
				console.error(
					`[ERROR] Rollback failed for run ${config.runId}`,
					rollbackError,
				);
			}
		}
		await verifier.stop();
		throw error;
	} finally {
		await releaseLock(LOCK_FILE);
	}
}

main().catch((error) => {
	console.error(error);
	process.exit(1);
});
