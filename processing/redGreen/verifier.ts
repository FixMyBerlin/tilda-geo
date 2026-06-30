import { appendFile, mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

type ProbeResult = {
	ts: string;
	endpoint: string;
	ok: boolean;
	status: number;
	durationMs: number;
};

type VerifierSummary = {
	totalProbes: number;
	failedProbes: number;
	maxFailureStreak: number;
};

type VerifierOptions = {
	endpoints: string[];
	intervalMs: number;
	outputFile: string;
};

export class ContinuousVerifier {
	private readonly endpoints: string[];
	private readonly intervalMs: number;
	private readonly outputFile: string;
	private timer: ReturnType<typeof setInterval> | null = null;
	private running = false;
	private failureStreak = 0;
	private maxFailureStreak = 0;
	private totalProbes = 0;
	private failedProbes = 0;

	constructor(options: VerifierOptions) {
		this.endpoints = options.endpoints;
		this.intervalMs = options.intervalMs;
		this.outputFile = options.outputFile;
	}

	async start() {
		if (this.running) return;
		this.running = true;
		await mkdir(dirname(this.outputFile), { recursive: true });
		await writeFile(this.outputFile, "");
		this.timer = setInterval(() => {
			void this.tick();
		}, this.intervalMs);
		await this.tick();
	}

	private async tick() {
		if (!this.running) return;
		for (const endpoint of this.endpoints) {
			const started = performance.now();
			let ok = false;
			let status = 0;
			try {
				const response = await fetch(endpoint);
				status = response.status;
				ok = response.ok;
			} catch {
				ok = false;
				status = 0;
			}

			const durationMs = Math.round(performance.now() - started);
			this.totalProbes += 1;
			if (!ok) {
				this.failedProbes += 1;
				this.failureStreak += 1;
			} else {
				this.failureStreak = 0;
			}
			this.maxFailureStreak = Math.max(
				this.maxFailureStreak,
				this.failureStreak,
			);

			const row: ProbeResult = {
				ts: new Date().toISOString(),
				endpoint,
				ok,
				status,
				durationMs,
			};
			await appendFile(this.outputFile, `${JSON.stringify(row)}\n`);
		}
	}

	async stop(): Promise<VerifierSummary> {
		this.running = false;
		if (this.timer) clearInterval(this.timer);
		return {
			totalProbes: this.totalProbes,
			failedProbes: this.failedProbes,
			maxFailureStreak: this.maxFailureStreak,
		};
	}
}
