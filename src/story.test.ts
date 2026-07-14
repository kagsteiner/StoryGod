import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { createProject, generateCandidates, normalizeTaste } from "./narrative.js";
import { applySceneResult, newStorySession } from "./story-service.js";
import { loadStorySession, restoreStorySession, saveStorySession } from "./story-store.js";
import { storyMarkdown, storyMarkdownFilename } from "./story-export.js";
import type { StorySceneResult } from "./types.js";

const taste = normalizeTaste({ genres: ["fantasy", "political mystery"], tone: ["melancholy", "suspense"], darkness: 7, weirdness: 5, romance: 2, action: 4, humor: 2, userSeed: "A rich maritime republic fears running out of fresh water." });
const project = createProject(taste, generateCandidates(taste, 1)[0]!);

const scene: StorySceneResult = {
  sceneTitle: "The Ledger Opens", proseMarkdown: "Mara touched the salt-stiff page. The numbers did not balance.", interpretedIntent: "Mara attempts to inspect the forbidden ledger.", attemptResolution: "She finds a discrepancy but alerts a clerk.", consequenceSummary: "The hidden water account is partly exposed and elite attention increases.", updatedStorySummary: "Mara has found evidence that the public water accounts conceal a second system.", stateChanges: { publicUnrest: 0, eliteSuspicion: 12, truthDiscovered: 18, communityTrust: 0 }, newFacts: ["A second water ledger exists."], resolvedThreads: [], openedThreads: ["Who maintains the second ledger?"], currentAct: 1, storyStatus: "active"
};

test("a new story session has durable canon and never presents an action prompt before prose", () => {
  const session = newStorySession(project, "adaptive", "session-test-0001");
  assert.equal(session.turns.length, 0);
  assert.equal(session.generation.status, "ready");
  assert.equal(session.project.projectId, project.projectId);
  assert.equal(session.protagonistName, project.characterGenome.protagonist.name);
  assert.ok("communityTrust" in session.state.values);
});

test("scene application updates continuity once and is idempotent across mobile retries", () => {
  const session = newStorySession(project, "scene", "session-test-0002");
  const initialSuspicion = session.state.values.eliteSuspicion ?? 0;
  const updated = applySceneResult(session, scene, "request-0001", "I inspect the forbidden ledger.", "scene");
  assert.equal(updated.turns.length, 1);
  assert.equal(updated.state.values.truthDiscovered, 18);
  assert.equal(updated.state.values.eliteSuspicion, initialSuspicion + 12);
  assert.ok(updated.state.establishedFacts.includes("A second water ledger exists."));
  assert.ok(updated.state.openThreads.includes("Who maintains the second ledger?"));
  assert.equal(applySceneResult(updated, scene, "request-0001", "duplicate", "scene").turns.length, 1);
});

test("story sessions export as readable Markdown with choices and a safe filename", () => {
  const session = newStorySession(project, "scene", "session-test-export");
  const updated = applySceneResult(session, { ...scene, proseMarkdown: "# The Ledger Opens\n\nMara touched the salt-stiff page.\n\nThe numbers did not balance." }, "request-export", "I inspect the forbidden ledger.\nQuietly.", "scene");
  const markdown = storyMarkdown(updated);
  assert.match(markdown, new RegExp(`^# ${updated.title}`));
  assert.match(markdown, /## Scene 1: The Ledger Opens/);
  assert.match(markdown, /\*\*Your choice\*\*\n\n> I inspect the forbidden ledger\.\n> Quietly\./);
  assert.equal(markdown.match(/# The Ledger Opens/g), null);
  assert.match(markdown, /Mara touched the salt-stiff page\.\n\nThe numbers did not balance\./);
  assert.match(storyMarkdownFilename("Échos: A Story?"), /^[a-z0-9-]+\.md$/);
  assert.equal(storyMarkdownFilename("Échos: A Story?"), "echos-a-story.md");
});

test("sessions survive disk reload and interrupted browser backups restore safely", async () => {
  const directory = await mkdtemp(join(tmpdir(), "storygod-session-")); const previous = process.env.STORY_DATA_DIR; process.env.STORY_DATA_DIR = directory;
  try {
    const session = newStorySession(project, "quick", "session-test-0003");
    session.generation = { status: "generating", requestId: "request-reload", action: "I follow the courier.", pacing: "quick", startedAt: new Date().toISOString() };
    await saveStorySession(session);
    const loaded = await loadStorySession(session.id);
    assert.equal(loaded?.generation.requestId, "request-reload");
    assert.equal(loaded?.project.title, project.title);
    const restored = await restoreStorySession(session);
    assert.equal(restored.generation.status, "failed");
    assert.match(restored.generation.error ?? "", /interrupted/i);
  } finally { if (previous === undefined) delete process.env.STORY_DATA_DIR; else process.env.STORY_DATA_DIR = previous; await rm(directory, { recursive: true, force: true }); }
});
