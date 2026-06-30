import { mkdir, rm, stat, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

const DEFAULT_LOCK_TTL_SECONDS = 4 * 60 * 60; // 4h — comfortably above a full Germany run

function lockTtlSeconds() {
	const raw = Number(process.env.RED_GREEN_LOCK_TTL_SECONDS);
	return Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_LOCK_TTL_SECONDS;
}

async function breakStaleLock(lockPath: string) {
	let info: Awaited<ReturnType<typeof stat>>;
	try {
		info = await stat(lockPath);
	} catch {
		return; // lock vanished between attempts — nothing to break
	}

	const ageSeconds = (Date.now() - info.mtimeMs) / 1000;
	const ttl = lockTtlSeconds();
	if (ageSeconds <= ttl) {
		throw new Error(
			`Another run is already active (lock ${lockPath} is ${Math.round(ageSeconds)}s old, ` +
				`TTL ${ttl}s). Refusing to start a concurrent run.`,
		);
	}

	// The lock is older than any plausible run: the previous run almost certainly
	// crashed without releasing it. The PID inside is meaningless across containers,
	// so age is the only reliable staleness signal. Break it so the pipeline can recover.
	console.warn(
		`[WARN] Breaking stale lock ${lockPath} (age ${Math.round(ageSeconds)}s > TTL ${ttl}s). Previous run likely crashed.`,
	);
	await rm(lockPath, { force: true });
}

export async function acquireLock(lockPath: string) {
	await mkdir(dirname(lockPath), { recursive: true });
	const payload = `${process.pid} ${new Date().toISOString()}\n`;
	try {
		await writeFile(lockPath, payload, { flag: "wx" });
		return;
	} catch {
		await breakStaleLock(lockPath);
	}

	try {
		await writeFile(lockPath, payload, { flag: "wx" });
	} catch (error) {
		throw new Error(
			`Another run is already active (lock exists: ${lockPath}): ${error}`,
		);
	}
}

export async function releaseLock(lockPath: string) {
	await rm(lockPath, { force: true });
}
