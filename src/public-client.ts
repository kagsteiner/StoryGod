import type { GenomeCandidate, NarrativeProject, TasteProfile } from "./types.js";
import { startStory } from "./story-client.js";

const $ = <T extends Element>(selector: string): T => { const element = document.querySelector<T>(selector); if (!element) throw new Error(`Missing element: ${selector}`); return element; };
const form = $<HTMLFormElement>("#taste-form"); const grid = $("#candidate-grid"); const status = $("#status");
let tasteProfile: TasteProfile | undefined; let project: NarrativeProject | undefined;

const sliderData = [["darkness", "Darkness", 7], ["weirdness", "Weirdness", 5], ["romance", "Romance", 2], ["action", "Action", 4], ["humor", "Humor", 3]] as const;
$("#sliders").innerHTML = sliderData.map(([name, title, value]) => `<label class="range"><span>${title}<output for="${name}">${value}</output></span><input id="${name}" name="${name}" type="range" min="0" max="10" value="${value}"></label>`).join("");
document.querySelectorAll<HTMLInputElement>('input[type="range"]').forEach(input => input.addEventListener("input", () => { const output = document.querySelector<HTMLOutputElement>(`output[for="${input.id}"]`); if (output) output.value = input.value; }));

function toast(message: string, error = false): void { status.textContent = message; status.className = `status show${error ? " error" : ""}`; window.setTimeout(() => status.classList.remove("show"), 3200); }
function values(value: FormDataEntryValue | null): string[] { return String(value ?? "").split(",").map(x => x.trim()).filter(Boolean); }
function show(name: "profile" | "candidates" | "project"): void { document.querySelectorAll(".panel").forEach(p => p.classList.remove("active")); $(`#${name}-panel`).classList.add("active"); document.querySelectorAll<HTMLButtonElement>(".step").forEach(step => step.classList.toggle("active", step.dataset.step === name)); window.scrollTo({ top: 330, behavior: "smooth" }); }
async function api<T>(path: string, payload: unknown): Promise<T> { const response = await fetch(path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) }); const result = await response.json() as T & { error?: string }; if (!response.ok) throw new Error(result.error ?? "Request failed"); return result; }
const human = (value: string): string => value.replaceAll("_", " ").replace(/\b\w/g, c => c.toUpperCase());

form.addEventListener("submit", async event => {
  event.preventDefault(); const data = new FormData(form); const button = form.querySelector<HTMLButtonElement>('button[type="submit"]')!; button.disabled = true; button.firstChild!.textContent = "Writing story directions… ";
  const profile = { genres: values(data.get("genres")), tone: values(data.get("tone")), targetAudience: data.get("targetAudience"), literaryStyle: data.get("literaryStyle"), userSeed: String(data.get("userSeed") ?? ""), inspirationsToCapture: values(data.get("inspirationsToCapture")), inspirationsToAvoid: values(data.get("inspirationsToAvoid")), contentLimits: values(data.get("contentLimits")), ...Object.fromEntries(sliderData.map(([name]) => [name, Number(data.get(name))])) };
  try { const result = await api<{ candidates: GenomeCandidate[]; tasteProfile: TasteProfile }>("/api/candidates", { tasteProfile: profile }); tasteProfile = result.tasteProfile; renderCandidates(result.candidates.slice(0, 3)); const step = document.querySelector<HTMLButtonElement>('[data-step="candidates"]')!; step.disabled = false; show("candidates"); toast("Five seed-faithful directions written. Showing the strongest three."); } catch (error) { toast(error instanceof Error ? error.message : "Generation failed", true); } finally { button.disabled = false; button.firstChild!.textContent = "Create five story directions "; }
});

function renderCandidates(candidates: GenomeCandidate[]): void {
  grid.innerHTML = candidates.map((c, i) => `<article class="candidate"><div class="candidate-rank"><span>${i === 0 ? "Best fit" : `Candidate 0${i + 1}`}</span><span class="score">${c.scores.overall.toFixed(1)}</span></div><h3>${escapeHtml(c.title)}</h3><span class="genre">${escapeHtml(c.genreFeel)}</span><p class="logline">${escapeHtml(c.logline)}</p><p class="seed-fit"><b>Seed fidelity</b>${escapeHtml(c.seedConnection)}</p><div class="genes"><div class="gene"><span>Engine</span><strong>${human(c.storyGenome.primaryEngine)}</strong></div><div class="gene"><span>Emotion</span><strong>${human(c.storyGenome.emotionalPromise.primary)}</strong></div><div class="gene"><span>Scarcity</span><strong>${human(c.worldGenome.scarcity.visible)}</strong></div><div class="gene"><span>Wound</span><strong>${human(c.worldGenome.historicalWound)}</strong></div></div>${c.validation.warnings.length ? `<p class="warning">△ ${c.validation.warnings.length} soft warning${c.validation.warnings.length > 1 ? "s" : ""}</p>` : ""}<button class="primary select" data-index="${i}">Grow this story <span>→</span></button></article>`).join("");
  grid.querySelectorAll<HTMLButtonElement>(".select").forEach(button => button.addEventListener("click", async () => { const candidate = candidates[Number(button.dataset.index)]; if (!candidate || !tasteProfile) return; button.disabled = true; button.firstChild!.textContent = "Writing the full foundation… "; try { const result = await api<{ project: NarrativeProject }>("/api/project", { tasteProfile, candidate }); project = result.project; renderProject(project); const step = document.querySelector<HTMLButtonElement>('[data-step="project"]')!; step.disabled = false; show("project"); toast("Your AI-authored story foundation is ready."); } catch (error) { toast(error instanceof Error ? error.message : "Project generation failed", true); button.disabled = false; button.firstChild!.textContent = "Grow this story "; } }));
}

const sections = [
  ["Overview", "overview"], ["World Bible", "worldBibleMarkdown"], ["Story Bible", "storyBibleMarkdown"], ["Character Bible", "characterBibleMarkdown"], ["Interactive Design", "interactiveDesignMarkdown"], ["Genome JSON", "genome"]
] as const;

function escapeHtml(value: string): string { return value.replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]!); }
function markdown(value: string): string {
  return value.split("\n").map(line => { if (line.startsWith("# ")) return `<h1>${escapeHtml(line.slice(2))}</h1>`; if (line.startsWith("## ")) return `<h2>${escapeHtml(line.slice(3))}</h2>`; if (line.startsWith("### ")) return `<h3>${escapeHtml(line.slice(4))}</h3>`; if (line.startsWith("- ")) return `<li>${inline(line.slice(2))}</li>`; if (/^\d+\. /.test(line)) return `<p>${inline(line)}</p>`; return line.trim() ? `<p>${inline(line)}</p>` : ""; }).join("");
}
function inline(value: string): string { return escapeHtml(value).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\*(.+?)\*/g, "<em>$1</em>"); }

function renderProject(current: NarrativeProject): void {
  $("#project-header").innerHTML = `<div><span class="kicker">Narrative genome expanded</span><h2 id="project-title">${current.title}</h2></div><p>${human(current.storyGenome.primaryEngine)} · ${human(current.storyGenome.emotionalPromise.primary)} · Overall ${current.scores.overall.toFixed(1)}</p>`;
  const nav = $("#project-nav"); nav.innerHTML = sections.map(([title, key], i) => `<button data-section="${key}" class="${i === 0 ? "active" : ""}">${title}</button>`).join("") + '<button id="begin-story" class="begin-story">Begin interactive novel <span>→</span></button><button id="export" class="export">Download project .zip</button>';
  nav.querySelectorAll<HTMLButtonElement>("[data-section]").forEach(button => button.addEventListener("click", () => { nav.querySelectorAll("[data-section]").forEach(x => x.classList.remove("active")); button.classList.add("active"); renderSection(button.dataset.section!); }));
  $("#begin-story").addEventListener("click", () => { if (!project) return; const button = $("#begin-story") as HTMLButtonElement; button.disabled = true; button.textContent = "Opening the book…"; void startStory(project).catch(error => { toast(error instanceof Error ? error.message : "Could not begin the story", true); button.disabled = false; button.innerHTML = "Begin interactive novel <span>→</span>"; }); });
  $("#export").addEventListener("click", exportProject); renderSection("overview");
}

function renderSection(key: string): void {
  if (!project) return; const content = $("#project-content");
  if (key === "overview") { content.innerHTML = `<h1>${project.title}</h1><p>${project.storyGenome.contradiction}</p><h2>Foundation package</h2><p>The selected narrative genome has grown into ${project.locations.length} locations, ${project.factions.length} factions, a three-act plot, ${project.interactiveDesign.actChoicePoints.length} major choice points, four canonical bibles, and an opening scene seed.</p><h2>World contradiction</h2><p>${project.worldGenome.contradiction}</p><h2>Protagonist</h2><h3>${project.characterGenome.protagonist.name}</h3><p>${project.characterGenome.protagonist.roleInWorld}. ${project.characterGenome.protagonist.surfaceDesire}; underneath, they need to ${project.characterGenome.protagonist.deepNeed.toLowerCase()}.</p><h2>Antagonist</h2><h3>${project.characterGenome.antagonist.name}</h3><p>${project.characterGenome.antagonist.moralArgument}</p><h2>Opening image</h2>${markdown(project.openingSceneSeed.replace("# Opening Scene Seed\n\n", ""))}`; return; }
  if (key === "genome") { content.innerHTML = `<h1>Canonical genome</h1><p>Every bible and design asset is derived from this structure.</p><pre>${escapeHtml(JSON.stringify({ storyGenome: project.storyGenome, worldGenome: project.worldGenome, scores: project.scores }, null, 2))}</pre>`; return; }
  const value = project.bibles[key as keyof NarrativeProject["bibles"]]; content.innerHTML = markdown(value);
}

async function exportProject(): Promise<void> {
  if (!project) return; try { const response = await fetch("/api/export", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ project }) }); if (!response.ok) throw new Error("Export failed"); const blob = await response.blob(); const link = document.createElement("a"); link.href = URL.createObjectURL(blob); link.download = `${project.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.zip`; link.click(); URL.revokeObjectURL(link.href); toast("Project package downloaded with all ten files."); } catch (error) { toast(error instanceof Error ? error.message : "Export failed", true); }
}

document.querySelectorAll<HTMLButtonElement>(".step").forEach(step => step.addEventListener("click", () => { if (!step.disabled) show(step.dataset.step as "profile" | "candidates" | "project"); }));
