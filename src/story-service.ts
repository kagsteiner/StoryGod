import { randomUUID } from "node:crypto";
import { generateStorySuggestionsWithAI, writeStorySceneWithAI } from "./ai.js";
import { loadStorySession, restoreStorySession, saveStorySession } from "./story-store.js";
import type { NarrativeProject, StoryPacing, StorySceneResult, StorySession, StorySuggestion } from "./types.js";

const activeGenerations = new Set<string>();
const locks = new Map<string, Promise<void>>();

async function withLock<T>(id: string, operation: () => Promise<T>): Promise<T> {
  const previous = locks.get(id) ?? Promise.resolve();
  let release!: () => void;
  const current = new Promise<void>(resolve => { release = resolve; });
  const chained = previous.then(() => current);
  locks.set(id, chained);
  await previous;
  try { return await operation(); }
  finally { release(); if (locks.get(id) === chained) locks.delete(id); }
}

const validPacing = new Set<StoryPacing>(["adaptive", "quick", "scene", "immersive"]);
export function normalizePacing(value: unknown): StoryPacing { return validPacing.has(value as StoryPacing) ? value as StoryPacing : "adaptive"; }
const unique = (values: string[]): string[] => [...new Set(values.map(value => value.trim()).filter(Boolean))];
const clamp = (value: number, min = 0, max = 100): number => Math.max(min, Math.min(max, Math.round(value)));

export function newStorySession(project: NarrativeProject, pacing: StoryPacing = "adaptive", id: string = randomUUID()): StorySession {
  const now = new Date().toISOString(); const values: Record<string, number> = {};
  for (const variable of project.interactiveDesign.worldState) values[variable.key] = variable.initial;
  for (const key of ["publicUnrest", "eliteSuspicion", "truthDiscovered", "communityTrust"]) if (!(key in values)) values[key] = key === "communityTrust" ? 45 : key === "publicUnrest" ? 15 : 0;
  return {
    id, project, title: project.title, protagonistName: project.characterGenome.protagonist.name, createdAt: now, updatedAt: now, revision: 1,
    status: "active", pacing, state: {
      values, currentAct: 1,
      summary: `${project.title} begins with ${project.characterGenome.protagonist.name}, ${project.characterGenome.protagonist.roleInWorld.toLowerCase()}, under pressure from ${project.worldGenome.contradiction}`,
      establishedFacts: [project.worldGenome.contradiction, project.storyGenome.contradiction ?? ""].filter(Boolean),
      openThreads: project.plotOutline[0]?.beats.slice(0, 2) ?? [], resolvedThreads: []
    }, turns: [], suggestions: [], generation: { status: "ready" }
  };
}

export function applySceneResult(session: StorySession, result: StorySceneResult, requestId: string, action: string | undefined, pacing: StoryPacing): StorySession {
  const next = structuredClone(session); const now = new Date().toISOString();
  if (next.turns.some(turn => turn.requestId === requestId)) return next;
  for (const [key, delta] of Object.entries(result.stateChanges)) next.state.values[key] = clamp((next.state.values[key] ?? 0) + delta);
  next.state.summary = result.updatedStorySummary;
  next.state.establishedFacts = unique([...next.state.establishedFacts, ...result.newFacts]).slice(-120);
  const resolved = new Set(result.resolvedThreads);
  next.state.openThreads = unique([...next.state.openThreads.filter(thread => !resolved.has(thread)), ...result.openedThreads]).slice(-40);
  next.state.resolvedThreads = unique([...next.state.resolvedThreads, ...result.resolvedThreads]).slice(-80);
  next.state.currentAct = result.currentAct; next.status = result.storyStatus;
  if (result.endingReached) next.state.endingReached = result.endingReached;
  next.turns.push({ id: randomUUID(), requestId, sceneNumber: next.turns.length + 1, sceneTitle: result.sceneTitle, proseMarkdown: result.proseMarkdown, ...(action ? { playerAction: action } : {}), interpretedIntent: result.interpretedIntent, attemptResolution: result.attemptResolution, consequenceSummary: result.consequenceSummary, pacing, createdAt: now });
  next.pacing = pacing; next.suggestions = []; next.generation = { status: "idle" }; next.updatedAt = now; next.revision += 1;
  return next;
}

export async function createStorySession(project: NarrativeProject, pacing: StoryPacing): Promise<StorySession> {
  if (!project?.projectId || !project.characterGenome?.protagonist) throw new Error("A complete narrative project is required to begin a story.");
  const session = newStorySession(project, pacing); await saveStorySession(session); return session;
}

export async function getStorySession(id: string): Promise<StorySession | undefined> { return loadStorySession(id); }
export function isStoryGenerationRunning(id: string): boolean { return activeGenerations.has(id); }

export async function generateNextStoryScene(id: string, request: { requestId?: string; action?: string; pacing?: StoryPacing; opening?: boolean; resume?: boolean }): Promise<StorySession> {
  let generation!: { requestId: string; action: string; pacing: StoryPacing; opening: boolean };
  const prepared = await withLock(id, async () => {
    const session = await loadStorySession(id); if (!session) throw new Error("Story session not found.");
    if (request.requestId && session.turns.some(turn => turn.requestId === request.requestId)) return { session, alreadyComplete: true };
    if (activeGenerations.has(id)) return { session, alreadyComplete: true };
    if (session.status === "complete") throw new Error("This story has reached its ending.");
    const pending = session.generation.status === "generating" ? session.generation : undefined;
    const requestId = pending?.requestId ?? request.requestId ?? randomUUID();
    const opening = session.turns.length === 0;
    const action = opening ? "" : (pending?.action ?? request.action ?? "").trim();
    if (!opening && !action) throw new Error("Describe what the protagonist attempts.");
    const pacing = normalizePacing(pending?.pacing ?? request.pacing ?? session.pacing);
    generation = { requestId, action, pacing, opening };
    session.generation = { status: "generating", requestId, action, pacing, startedAt: new Date().toISOString() };
    session.updatedAt = new Date().toISOString(); session.revision += 1; await saveStorySession(session); activeGenerations.add(id);
    return { session, alreadyComplete: false };
  });
  if (prepared.alreadyComplete) return prepared.session;
  try {
    const result = await writeStorySceneWithAI(prepared.session, generation.action, generation.pacing, generation.opening);
    return await withLock(id, async () => { const latest = await loadStorySession(id); if (!latest) throw new Error("Story session disappeared during generation."); const updated = applySceneResult(latest, result, generation.requestId, generation.action || undefined, generation.pacing); await saveStorySession(updated); return updated; });
  } catch (error) {
    await withLock(id, async () => { const latest = await loadStorySession(id); if (!latest) return; latest.generation = { ...latest.generation, status: "failed", error: error instanceof Error ? error.message : "Scene generation failed." }; latest.updatedAt = new Date().toISOString(); latest.revision += 1; await saveStorySession(latest); });
    throw error;
  } finally { activeGenerations.delete(id); }
}

export async function getStorySuggestions(id: string): Promise<{ session: StorySession; suggestions: StorySuggestion[] }> {
  const session = await loadStorySession(id); if (!session) throw new Error("Story session not found.");
  if (!session.turns.length || session.generation.status === "generating" || session.status === "complete") return { session, suggestions: [] };
  const suggestions = await generateStorySuggestionsWithAI(session);
  const updated = await withLock(id, async () => { const latest = await loadStorySession(id); if (!latest) throw new Error("Story session not found."); latest.suggestions = suggestions; latest.updatedAt = new Date().toISOString(); latest.revision += 1; await saveStorySession(latest); return latest; });
  return { session: updated, suggestions };
}

export { restoreStorySession };
