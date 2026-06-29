import { unlinkExportFile } from '@/server/api/export/streamExportFile.server'

export type ExportJobStatus = 'running' | 'done' | 'error'

export type ExportJob = {
  id: string
  status: ExportJobStatus
  percent: number
  filename: string
  outputFilePath?: string
  outputBytes?: number
  mimeType?: string
  error?: string
  createdAt: number
  updatedAt: number
}

// Jobs live in-memory in the single app container. Stored on globalThis so dev HMR
// (which re-evaluates modules) does not drop running jobs or spawn duplicate sweepers.
const globalForJobs = globalThis as typeof globalThis & {
  __tildaExportJobs?: Map<string, ExportJob>
  __tildaExportJobsSweeper?: NodeJS.Timeout
}

const jobs = (globalForJobs.__tildaExportJobs ??= new Map<string, ExportJob>())

const JOB_TTL_MS = 30 * 60 * 1000
const SWEEP_INTERVAL_MS = 5 * 60 * 1000

const createJobId = () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`

export function createExportJob(filename: string): ExportJob {
  const now = Date.now()
  const job: ExportJob = {
    id: createJobId(),
    status: 'running',
    percent: 0,
    filename,
    createdAt: now,
    updatedAt: now,
  }
  jobs.set(job.id, job)
  return job
}

export function getExportJob(id: string): ExportJob | undefined {
  return jobs.get(id)
}

export function updateExportJob(id: string, patch: Partial<Omit<ExportJob, 'id'>>): void {
  const job = jobs.get(id)
  if (!job) return
  Object.assign(job, patch, { updatedAt: Date.now() })
}

/** Removes the job from the registry and deletes its temp file if still present. */
export function removeExportJob(id: string): void {
  const job = jobs.get(id)
  if (!job) return
  jobs.delete(id)
  if (job.outputFilePath) {
    void unlinkExportFile(job.outputFilePath, `[EXPORT-JOB:${id}]`, 'job_removed')
  }
}

// Drop abandoned jobs (e.g. user closed the tab before downloading) and their temp files.
function sweepExpiredJobs() {
  const now = Date.now()
  for (const [id, job] of jobs) {
    if (now - job.updatedAt > JOB_TTL_MS) {
      removeExportJob(id)
    }
  }
}

if (!globalForJobs.__tildaExportJobsSweeper) {
  globalForJobs.__tildaExportJobsSweeper = setInterval(sweepExpiredJobs, SWEEP_INTERVAL_MS)
  // Do not keep the process alive just for the sweeper.
  globalForJobs.__tildaExportJobsSweeper.unref?.()
}
