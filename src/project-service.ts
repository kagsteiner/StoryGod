import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { createProjectWithAI } from "./ai.js";
import type { GenomeCandidate, NarrativeProject, TasteProfile } from "./types.js";

export type ProjectJobStatus = "queued" | "generating" | "complete" | "failed";

export interface ProjectGenerationJob {
  id: string;
  status: ProjectJobStatus;
  tasteProfile: TasteProfile;
  candidate: GenomeCandidate;
  createdAt: string;
  updatedAt: string;
  project?: NarrativeProject;
  error?: string;
}

const activeJobs = new Set<string>();
const jobDirectory = (): string => resolve(process.env.PROJECT_DATA_DIR ?? "data/project-jobs");
const jobPath = (id: string): string => resolve(jobDirectory(), `${id}.json`);

async function saveProjectJob(job: ProjectGenerationJob): Promise<void> {
  await mkdir(jobDirectory(), { recursive: true });
  const path = jobPath(job.id); const temporary = `${path}.${process.pid}.${Date.now()}.tmp`;
  await writeFile(temporary, JSON.stringify(job), "utf8"); await rename(temporary, path);
}

export async function getProjectJob(id: string): Promise<ProjectGenerationJob | undefined> {
  if (!/^[a-zA-Z0-9-]+$/.test(id)) return undefined;
  try { return JSON.parse(await readFile(jobPath(id), "utf8")) as ProjectGenerationJob; }
  catch (error) { if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined; throw error; }
}

export async function createProjectJob(tasteProfile: TasteProfile, candidate: GenomeCandidate): Promise<ProjectGenerationJob> {
  const now = new Date().toISOString();
  const job: ProjectGenerationJob = { id: randomUUID(), status: "queued", tasteProfile, candidate, createdAt: now, updatedAt: now };
  await saveProjectJob(job); return job;
}

export function isProjectGenerationRunning(id: string): boolean { return activeJobs.has(id); }

export function publicProjectJob(job: ProjectGenerationJob): Pick<ProjectGenerationJob, "id" | "status" | "createdAt" | "updatedAt" | "project" | "error"> {
  return { id: job.id, status: job.status, createdAt: job.createdAt, updatedAt: job.updatedAt, ...(job.project ? { project: job.project } : {}), ...(job.error ? { error: job.error } : {}) };
}

export function startProjectGeneration(id: string): void {
  if (activeJobs.has(id)) return;
  activeJobs.add(id);
  void (async () => {
    try {
      const job = await getProjectJob(id); if (!job || job.status === "complete") return;
      job.status = "generating"; delete job.error; job.updatedAt = new Date().toISOString(); await saveProjectJob(job);
      job.project = await createProjectWithAI(job.tasteProfile, job.candidate);
      job.status = "complete"; job.updatedAt = new Date().toISOString(); await saveProjectJob(job);
    } catch (error) {
      const job = await getProjectJob(id);
      if (job) { job.status = "failed"; job.error = error instanceof Error ? error.message : "Project generation failed."; job.updatedAt = new Date().toISOString(); await saveProjectJob(job); }
    } finally { activeJobs.delete(id); }
  })();
}
