import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { extname, join, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import { applyRepairs, normalizeTaste, projectFiles, scoreGenome, validateGenome } from "./narrative.js";
import { createZip } from "./zip.js";
import type { GenomeCandidate, NarrativeProject } from "./types.js";
import { configuredAIModels, createProjectWithAI, generateCandidatesWithAI, modelForTask } from "./ai.js";
import { openAIConfigured } from "./env.js";
import { createStorySession, generateNextStoryScene, getStorySession, getStorySuggestions, isStoryGenerationRunning, normalizePacing, restoreStorySession } from "./story-service.js";
import type { StorySession } from "./types.js";

const publicDir = fileURLToPath(new URL("./public/", import.meta.url));
const types: Record<string, string> = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".svg": "image/svg+xml", ".json": "application/json; charset=utf-8" };

function json(res: ServerResponse, status: number, value: unknown): void {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" }); res.end(JSON.stringify(value));
}

async function body(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = []; let size = 0;
  for await (const chunk of req) { const b = Buffer.from(chunk); size += b.length; if (size > 2_000_000) throw new Error("Request is too large."); chunks.push(b); }
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}"); } catch { throw new Error("Request body must be valid JSON."); }
}

async function staticFile(pathname: string, res: ServerResponse): Promise<void> {
  const requested = pathname === "/" ? "index.html" : pathname.slice(1); const safe = normalize(requested).replace(/^(\.\.(\/|\\|$))+/, ""); const path = join(publicDir, safe);
  try { const info = await stat(path); if (!info.isFile()) throw new Error(); res.writeHead(200, { "content-type": types[extname(path)] ?? "application/octet-stream", "cache-control": "no-cache" }); createReadStream(path).pipe(res); }
  catch {
    if (!extname(pathname)) { res.writeHead(200, { "content-type": types[".html"], "cache-control": "no-cache" }); createReadStream(join(publicDir, "index.html")).pipe(res); }
    else json(res, 404, { error: "Not found" });
  }
}

export const server = createServer(async (req, res) => {
  const method = req.method ?? "GET"; const url = new URL(req.url ?? "/", "http://localhost");
  try {
    if (method === "GET" && url.pathname === "/api/health") return json(res, 200, { ok: true, mode: "openai", models: configuredAIModels(), configured: openAIConfigured() });
    if (method === "POST" && url.pathname === "/api/candidates") { const payload = await body(req) as { tasteProfile?: unknown }; const taste = normalizeTaste(payload.tasteProfile ?? payload); return json(res, 200, { candidates: await generateCandidatesWithAI(taste), tasteProfile: taste, model: modelForTask("genome") }); }
    if (method === "POST" && url.pathname === "/api/validate") { const payload = await body(req) as Partial<GenomeCandidate>; if (!payload.storyGenome || !payload.worldGenome) throw new Error("storyGenome and worldGenome are required."); return json(res, 200, validateGenome(payload.storyGenome, payload.worldGenome)); }
    if (method === "POST" && url.pathname === "/api/repair") { const payload = await body(req) as Partial<GenomeCandidate>; if (!payload.storyGenome || !payload.worldGenome) throw new Error("storyGenome and worldGenome are required."); return json(res, 200, applyRepairs(payload.storyGenome, payload.worldGenome)); }
    if (method === "POST" && url.pathname === "/api/score") { const payload = await body(req) as { tasteProfile?: unknown; candidate?: GenomeCandidate }; if (!payload.candidate) throw new Error("candidate is required."); const taste = normalizeTaste(payload.tasteProfile); return json(res, 200, scoreGenome(taste, payload.candidate.storyGenome, payload.candidate.worldGenome)); }
    if (method === "POST" && url.pathname === "/api/project") { const payload = await body(req) as { tasteProfile?: unknown; candidate?: GenomeCandidate }; if (!payload.candidate) throw new Error("candidate is required."); return json(res, 200, { project: await createProjectWithAI(normalizeTaste(payload.tasteProfile), payload.candidate), models: { architecture: modelForTask("architecture"), bibles: modelForTask("bibles") } }); }
    if (method === "POST" && url.pathname === "/api/export") { const payload = await body(req) as { project?: NarrativeProject }; if (!payload.project?.projectId) throw new Error("project is required."); const zip = createZip(projectFiles(payload.project)); const filename = payload.project.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "narrative-project"; res.writeHead(200, { "content-type": "application/zip", "content-disposition": `attachment; filename="${filename}.zip"`, "content-length": zip.length }); res.end(zip); return; }
    if (method === "POST" && url.pathname === "/api/story/sessions") { const payload = await body(req) as { project?: NarrativeProject; pacing?: unknown }; if (!payload.project) throw new Error("project is required."); return json(res, 201, { session: await createStorySession(payload.project, normalizePacing(payload.pacing)) }); }
    const storyRoute = url.pathname.match(/^\/api\/story\/sessions\/([a-zA-Z0-9-]+)(?:\/(begin|continue|suggestions|resume|restore|status))?$/);
    if (storyRoute) {
      const id = storyRoute[1]!; const action = storyRoute[2];
      if (method === "GET" && !action) { const session = await getStorySession(id); if (!session) return json(res, 404, { error: "Story session not found." }); return json(res, 200, { session, runtimeRunning: isStoryGenerationRunning(id) }); }
      if (method === "GET" && action === "status") { const session = await getStorySession(id); if (!session) return json(res, 404, { error: "Story session not found." }); return json(res, 200, { id, revision: session.revision, status: session.status, generation: session.generation, turnCount: session.turns.length, runtimeRunning: isStoryGenerationRunning(id) }); }
      if (method === "POST" && action === "restore") { const payload = await body(req) as { session?: StorySession }; if (!payload.session || payload.session.id !== id) throw new Error("A matching browser backup is required."); return json(res, 200, { session: await restoreStorySession(payload.session) }); }
      if (method === "POST" && (action === "begin" || action === "continue" || action === "resume")) { const payload = await body(req) as { requestId?: string; playerAction?: string; pacing?: unknown }; const session = await generateNextStoryScene(id, { ...(payload.requestId ? { requestId: payload.requestId } : {}), ...(payload.playerAction ? { action: payload.playerAction } : {}), pacing: normalizePacing(payload.pacing), opening: action === "begin", resume: action === "resume" }); return json(res, 200, { session }); }
      if (method === "POST" && action === "suggestions") { const result = await getStorySuggestions(id); return json(res, 200, result); }
    }
    if (method === "GET") return await staticFile(url.pathname, res);
    json(res, 405, { error: "Method not allowed" });
  } catch (error) { json(res, 400, { error: error instanceof Error ? error.message : "Unexpected error" }); }
});

if (process.env.NODE_ENV !== "test") { const port = Number(process.env.PORT ?? 3000); server.listen(port, () => console.log(`Narrative Genetics is running at http://localhost:${port}`)); }
