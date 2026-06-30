import { resolve } from "node:path";
import { $ } from "bun";
import type { ParsedDbUrl } from "./config";
import { dbEnv, runLogged } from "./shell";

export async function queryLines(db: ParsedDbUrl, query: string) {
	const cmd = `psql -At -v ON_ERROR_STOP=1 -c "${query.replace(/"/g, '\\"')}"`;
	// runLogged is async (returns Promise<ShellOutput>); .text() lives on the
	// resolved ShellOutput, so it must be awaited first.
	const result = await runLogged(cmd, dbEnv(db));
	const text = result.text();
	return text
		.split("\n")
		.map((line) => line.trim())
		.filter((line) => line.length > 0);
}

export async function queryOne(db: ParsedDbUrl, query: string) {
	const lines = await queryLines(db, query);
	return lines[0] ?? null;
}

export async function executeSql(db: ParsedDbUrl, query: string) {
	const escaped = query.replace(/"/g, '\\"');
	await runLogged(`psql -v ON_ERROR_STOP=1 -c "${escaped}"`, dbEnv(db));
}

export async function executeSqlFile(db: ParsedDbUrl, filePath: string) {
	await runLogged(`psql -v ON_ERROR_STOP=1 -f "${filePath}"`, dbEnv(db));
}

export async function copyFile(sourcePath: string, targetPath: string) {
	if (resolve(sourcePath) === resolve(targetPath)) {
		console.log(`Copy: skipping identical paths (${sourcePath})`);
		return;
	}
	await $`cp "${sourcePath}" "${targetPath}"`;
}
