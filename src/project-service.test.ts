import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { generateCandidates, normalizeTaste } from "./narrative.js";
import { createProjectJob, getProjectJob, publicProjectJob } from "./project-service.js";

test("project generation jobs persist the recovery data needed after a browser reload", async () => {
  const directory = await mkdtemp(join(tmpdir(), "storygod-project-")); const previous = process.env.PROJECT_DATA_DIR; process.env.PROJECT_DATA_DIR = directory;
  try {
    const taste = normalizeTaste({ genres: ["fantasy"], tone: ["suspense"], userSeed: "An island city is running out of water." });
    const candidate = generateCandidates(taste, 1)[0]!;
    const created = await createProjectJob(taste, candidate);
    const loaded = await getProjectJob(created.id);
    assert.equal(loaded?.status, "queued");
    assert.equal(loaded?.candidate.id, candidate.id);
    assert.equal(loaded?.tasteProfile.userSeed, taste.userSeed);
    assert.equal("candidate" in publicProjectJob(loaded!), false);
    assert.equal("tasteProfile" in publicProjectJob(loaded!), false);
  } finally { if (previous === undefined) delete process.env.PROJECT_DATA_DIR; else process.env.PROJECT_DATA_DIR = previous; await rm(directory, { recursive: true, force: true }); }
});
