import { mkdir, readFile, readdir, rename, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import type { StorySession, StorySessionSummary } from "./types.js";

const safeId = /^[a-zA-Z0-9-]{8,80}$/;

function root(): string {
  return resolve(process.env.STORY_DATA_DIR ?? "data/story-sessions");
}

function pathFor(id: string): string {
  if (!safeId.test(id)) throw new Error("Invalid story session ID.");
  return resolve(root(), `${id}.json`);
}

export async function saveStorySession(session: StorySession): Promise<void> {
  await mkdir(root(), { recursive: true });
  const path = pathFor(session.id); const temporary = `${path}.${process.pid}.tmp`;
  await writeFile(temporary, JSON.stringify(session, null, 2), { encoding: "utf8", mode: 0o600 });
  await rename(temporary, path);
}

export async function loadStorySession(id: string): Promise<StorySession | undefined> {
  try { return JSON.parse(await readFile(pathFor(id), "utf8")) as StorySession; }
  catch (error) {
    const code = error && typeof error === "object" && "code" in error ? String(error.code) : "";
    if (code === "ENOENT") return undefined;
    throw error;
  }
}

export async function listStorySessions(): Promise<StorySessionSummary[]> {
  let names: string[];
  try { names = (await readdir(root(), { withFileTypes: true })).filter(entry => entry.isFile() && entry.name.endsWith(".json")).map(entry => entry.name.slice(0, -5)).filter(id => safeId.test(id)); }
  catch (error) {
    const code = error && typeof error === "object" && "code" in error ? String(error.code) : "";
    if (code === "ENOENT") return [];
    throw error;
  }
  const summaries = await Promise.all(names.map(async id => {
    try {
      const session = await loadStorySession(id);
      if (!session?.title || !session.protagonistName || !session.updatedAt || !Array.isArray(session.turns)) return undefined;
      return { id, title: session.title, protagonistName: session.protagonistName, updatedAt: session.updatedAt, status: session.status, currentAct: session.state.currentAct, turnCount: session.turns.length, generationStatus: session.generation.status } satisfies StorySessionSummary;
    } catch { return undefined; }
  }));
  return summaries.filter((summary): summary is StorySessionSummary => Boolean(summary)).sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
}

export async function restoreStorySession(session: StorySession): Promise<StorySession> {
  if (!session?.id || !session.project?.projectId || !Array.isArray(session.turns)) throw new Error("The browser backup is not a valid story session.");
  const restored = structuredClone(session);
  restored.updatedAt = new Date().toISOString();
  if (restored.generation.status === "generating") restored.generation = { ...restored.generation, status: "failed", error: "Generation was interrupted before the session was restored." };
  await saveStorySession(restored);
  return restored;
}
