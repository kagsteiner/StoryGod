import assert from "node:assert/strict";
import test from "node:test";
import { applyRepairs, createProject, generateCandidates, normalizeTaste, projectFiles, scoreGenome, validateGenome } from "./narrative.js";
import { createZip } from "./zip.js";

const taste = normalizeTaste({ genres: ["fantasy", "political mystery"], tone: ["melancholy", "suspense"], darkness: 7, weirdness: 5, romance: 2, action: 4, humor: 2, userSeed: "A maritime republic terrified of running out of fresh water." });

test("candidate pipeline creates five ranked, valid candidates", () => {
  const candidates = generateCandidates(taste);
  assert.equal(candidates.length, 5);
  assert.ok(candidates.every(c => validateGenome(c.storyGenome, c.worldGenome).valid));
  assert.ok(candidates.every(c => c.seedConnection.length > 20));
  assert.ok(candidates.every(c => c.scores.overall >= 0 && c.scores.overall <= 10));
  assert.ok(candidates[0]!.scores.overall >= candidates[4]!.scores.overall);
});

test("mystery and rebellion hard constraints are detected", () => {
  const candidate = generateCandidates(taste, 1)[0]!;
  const world = { ...candidate.worldGenome, powerStructure: { visible: "senate" as const }, socialFractures: ["city_vs_rural" as const] };
  const story = { ...candidate.storyGenome, primaryEngine: "rebellion" as const };
  assert.equal(validateGenome(story, world).valid, false);
  const repaired = applyRepairs(story, world);
  assert.equal(repaired.validation.valid, true);
  assert.equal(repaired.worldGenome.powerStructure.hidden, "secret_council");
});

test("scoring is deterministic and produces a weighted overall", () => {
  const candidate = generateCandidates(taste, 1)[0]!;
  assert.deepEqual(scoreGenome(taste, candidate.storyGenome, candidate.worldGenome), scoreGenome(taste, candidate.storyGenome, candidate.worldGenome));
});

test("project expands to all ten required export files", () => {
  const candidate = generateCandidates(taste, 1)[0]!; const project = createProject(taste, candidate); const files = projectFiles(project);
  assert.deepEqual(Object.keys(files).sort(), project.exportManifest.files.sort());
  assert.equal(project.locations.length, 5); assert.equal(project.factions.length, 3); assert.equal(project.plotOutline.length, 3); assert.equal(project.interactiveDesign.actChoicePoints.length, 5);
  assert.match(files["world_bible.md"]!, /# World Bible/); assert.match(files["opening_scene_seed.md"]!, /Immediate choice/);
  const archive = createZip(files);
  assert.equal(archive.readUInt32LE(0), 0x04034b50);
  assert.equal(archive.readUInt32LE(archive.length - 22), 0x06054b50);
  assert.equal(archive.readUInt16LE(archive.length - 12), 10);
  for (const name of project.exportManifest.files) assert.ok(archive.includes(Buffer.from(name)), `${name} should be present in the ZIP directory`);
});
