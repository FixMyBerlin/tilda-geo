import { $ } from "bun";
import type { ParsedDbUrl } from "./config";

type CommandEnv = Record<string, string | undefined>;

export async function runLogged(command: string, env?: CommandEnv) {
	console.log(`🔧 ${command}`);
	const shell = env ? $.env(env) : $;
	return shell`bash -lc ${command}`;
}

export function dbEnv(db: ParsedDbUrl): CommandEnv {
	return {
		PGHOST: db.host,
		PGPORT: db.port,
		PGDATABASE: db.database,
		PGUSER: db.username,
		PGPASSWORD: db.password,
	};
}

export function withEnv(base: CommandEnv, extra: CommandEnv): CommandEnv {
	return { ...base, ...extra };
}

const PG_ENV_KEYS = [
	"PGHOST",
	"PGPORT",
	"PGDATABASE",
	"PGUSER",
	"PGPASSWORD",
] as const;

export async function withProcessEnv<T>(
	env: CommandEnv,
	fn: () => Promise<T>,
) {
	const snapshot: Record<string, string | undefined> = {};
	for (const key of PG_ENV_KEYS) {
		snapshot[key] = process.env[key];
	}

	try {
		for (const [key, value] of Object.entries(env)) {
			if (value === undefined) delete process.env[key];
			else process.env[key] = value;
		}
		return await fn();
	} finally {
		for (const key of PG_ENV_KEYS) {
			const previous = snapshot[key];
			if (previous === undefined) delete process.env[key];
			else process.env[key] = previous;
		}
	}
}
