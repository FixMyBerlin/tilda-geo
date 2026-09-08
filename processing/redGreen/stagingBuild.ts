import { basename } from "node:path";
import { OSM_FILTERED_DIR } from "../constants/directories.const";
import { exportSidepathData } from "../topics/roads_bikelanes/pseudo_tags_sidepath/exportSidepathData";
import { generateTypes } from "../steps/generateTypes";
import { initialize } from "../steps/initialize";
import {
	createProcessingEntry,
	updateProcessingEntry,
} from "../steps/metadata";
import { processTopics } from "../steps/processTopics";
import type { RedGreenConfig } from "./config";
import { copyFile } from "./db";

export async function runStagingBuild(config: RedGreenConfig) {
	const recutFileName = basename(config.recutPbfPath);
	const targetFilteredPath = `${OSM_FILTERED_DIR}/${recutFileName}`;
	await copyFile(config.recutPbfPath, targetFilteredPath);

	await initialize();
	const processingId = await createProcessingEntry();
	const startedAt = Date.now();

	const ranTopics = await processTopics(
		recutFileName,
		true,
		processingId,
		recutFileName,
	);
	await generateTypes();
	await exportSidepathData(true, ranTopics);

	await updateProcessingEntry(
		processingId,
		recutFileName,
		Date.now() - startedAt,
	);
}
