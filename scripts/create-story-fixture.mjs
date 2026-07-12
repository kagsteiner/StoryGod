import { createProject, generateCandidates, normalizeTaste } from "../dist/narrative.js";
import { newStorySession } from "../dist/story-service.js";
import { saveStorySession } from "../dist/story-store.js";

const taste = normalizeTaste({ genres: ["fantasy", "political mystery"], tone: ["melancholy", "suspense"], darkness: 7, weirdness: 5, romance: 2, action: 4, humor: 2, literaryStyle: "cinematic", userSeed: "A maritime republic that is rich but terrified of running out of fresh water." });
const project = createProject(taste, generateCandidates(taste, 1)[0]);
const id = `browser-story-${Date.now().toString(36)}`;
const session = newStorySession(project, "quick", id);
await saveStorySession(session);
console.log(id);
