import type { NarrativeProject, StoryPacing, StorySession, StorySuggestion } from "./types.js";

const applicationBasePath = document.querySelector<HTMLMetaElement>('meta[name="application-base-path"]')?.content.replace(/\/$/, "") ?? "";
const applicationUrl = (path: string): string => `${applicationBasePath}${path}`;

const get = <T extends Element>(selector: string): T => { const value = document.querySelector<T>(selector); if (!value) throw new Error(`Missing reader element: ${selector}`); return value; };
const builder = get<HTMLElement>("#builder-shell"); const reader = get<HTMLElement>("#reader-shell"); const pages = get<HTMLElement>("#reader-pages");
const generationPanel = get<HTMLElement>("#reader-generation"); const errorPanel = get<HTMLElement>("#reader-error"); const composer = get<HTMLElement>("#story-composer"); const ending = get<HTMLElement>("#story-ending");
const actionInput = get<HTMLTextAreaElement>("#player-action"); const pacingSelect = get<HTMLSelectElement>("#story-pacing"); const continueButton = get<HTMLButtonElement>("#continue-button"); const inspirationButton = get<HTMLButtonElement>("#inspiration-button"); const suggestionsPanel = get<HTMLElement>("#story-suggestions");
const continueStoryButton = get<HTMLButtonElement>("#continue-story");

let current: StorySession | undefined; let pollTimer: number | undefined; let lastRenderedTurnCount = -1; let resumeInFlight = false;
const ACTIVE_KEY = "narrative-genetics.active-story"; const THEME_KEY = "narrative-genetics.reader-theme";

function escapeHtml(value: string): string { return value.replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" })[char]!); }
function inline(value: string): string { return escapeHtml(value).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>").replace(/\*(.+?)\*/g, "<em>$1</em>"); }
function proseMarkdown(value: string, sceneTitle: string): string {
  const lines = value.replace(/^#\s+.*\n+/, "").split(/\n{2,}/).map(part => part.trim()).filter(Boolean);
  return lines.map(part => part.startsWith("## ") ? `<h3>${inline(part.slice(3))}</h3>` : `<p>${inline(part.replace(/\n/g, " "))}</p>`).join("");
}

async function request<T>(path: string, method = "GET", payload?: unknown): Promise<T> {
  const response = await fetch(applicationUrl(path), { method, ...(payload === undefined ? {} : { headers: { "content-type": "application/json" }, body: JSON.stringify(payload) }) });
  const result = await response.json() as T & { error?: string };
  if (!response.ok) { const error = new Error(result.error ?? "Request failed") as Error & { status?: number }; error.status = response.status; throw error; }
  return result;
}

function openBackupDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const opening = indexedDB.open("narrative-genetics", 1);
    opening.onupgradeneeded = () => { if (!opening.result.objectStoreNames.contains("storySessions")) opening.result.createObjectStore("storySessions", { keyPath: "id" }); };
    opening.onsuccess = () => resolve(opening.result); opening.onerror = () => reject(opening.error);
  });
}

async function backupSession(session: StorySession): Promise<void> {
  try { localStorage.setItem(ACTIVE_KEY, session.id); continueStoryButton.hidden = false; const db = await openBackupDatabase(); await new Promise<void>((resolve, reject) => { const transaction = db.transaction("storySessions", "readwrite"); transaction.objectStore("storySessions").put(session); transaction.oncomplete = () => resolve(); transaction.onerror = () => reject(transaction.error); }); db.close(); } catch { /* Server persistence remains authoritative. */ }
}

async function readBackup(id: string): Promise<StorySession | undefined> {
  try { const db = await openBackupDatabase(); const value = await new Promise<StorySession | undefined>((resolve, reject) => { const result = db.transaction("storySessions", "readonly").objectStore("storySessions").get(id); result.onsuccess = () => resolve(result.result as StorySession | undefined); result.onerror = () => reject(result.error); }); db.close(); return value; } catch { return undefined; }
}

function activeId(): string | undefined { try { return localStorage.getItem(ACTIVE_KEY) ?? undefined; } catch { return undefined; } }
function storyIdFromUrl(): string | undefined { return location.pathname.match(/\/story\/([a-zA-Z0-9-]+)$/)?.[1]; }
function newRequestId(): string { if (typeof crypto.randomUUID === "function") return crypto.randomUUID(); const bytes = crypto.getRandomValues(new Uint8Array(16)); return `mobile-${Date.now().toString(36)}-${[...bytes].map(value => value.toString(16).padStart(2, "0")).join("")}`; }

function showReader(): void { builder.hidden = true; reader.hidden = false; document.body.classList.add("reader-open"); }
function showBuilder(): void { reader.hidden = true; builder.hidden = false; document.body.classList.remove("reader-open"); stopPolling(); }
function stopPolling(): void { if (pollTimer !== undefined) window.clearInterval(pollTimer); pollTimer = undefined; }
function startPolling(id: string): void { if (pollTimer !== undefined) return; pollTimer = window.setInterval(() => { void pollStoryStatus(id); }, 3000); }

async function pollStoryStatus(id: string): Promise<void> {
  try {
    const status = await request<{ revision: number; status: string; generation: StorySession["generation"]; turnCount: number; runtimeRunning: boolean }>(`/api/story/sessions/${id}/status`);
    if (!current || status.revision !== current.revision || status.turnCount !== current.turns.length || status.generation.status !== "generating") { await refreshSession(id, false); return; }
    if (status.generation.status === "generating" && !status.runtimeRunning && !resumeInFlight) await resumeGeneration(current);
  } catch { /* The full recovery path runs when the tab becomes visible or the user retries. */ }
}

function applyTheme(theme: "light" | "dark"): void {
  document.documentElement.dataset.theme = theme; try { localStorage.setItem(THEME_KEY, theme); } catch { /* ignore */ }
  const meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]') ?? document.head.appendChild(Object.assign(document.createElement("meta"), { name: "theme-color" }));
  meta.content = theme === "dark" ? "#1c1e1b" : "#f8f3e8"; get<HTMLButtonElement>("#theme-toggle").textContent = theme === "dark" ? "☀" : "◐";
}

function initialTheme(): "light" | "dark" { try { const saved = localStorage.getItem(THEME_KEY); if (saved === "light" || saved === "dark") return saved; } catch { /* ignore */ } return matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"; }

function renderSuggestions(suggestions: StorySuggestion[]): void {
  suggestionsPanel.hidden = suggestions.length === 0;
  suggestionsPanel.innerHTML = suggestions.map(suggestion => `<button class="suggestion" data-suggestion="${escapeHtml(suggestion.id)}"><span>${escapeHtml(suggestion.axis)}</span><strong>${escapeHtml(suggestion.label)}</strong><small>${escapeHtml(suggestion.dramaticPromise)}</small></button>`).join("");
  suggestionsPanel.querySelectorAll<HTMLButtonElement>(".suggestion").forEach(button => button.addEventListener("click", () => { const suggestion = suggestions.find(item => item.id === button.dataset.suggestion); if (!suggestion) return; actionInput.value = suggestion.actionText; actionInput.focus(); actionInput.setSelectionRange(actionInput.value.length, actionInput.value.length); }));
}

function renderSession(session: StorySession, runtimeRunning = false): void {
  const previousTurns = lastRenderedTurnCount; current = session; showReader(); void backupSession(session);
  get("#reader-title").textContent = session.title; get("#reader-act").textContent = `Act ${["I", "II", "III"][session.state.currentAct - 1]} · Scene ${Math.max(1, session.turns.length)}`;
  const progress = session.status === "complete" ? 100 : Math.min(94, (session.state.currentAct - 1) * 33 + Math.max(4, session.turns.length * 4)); get<HTMLElement>("#reader-progress").style.width = `${progress}%`;
  pages.innerHTML = session.turns.map(turn => `<article class="story-scene" data-scene="${turn.sceneNumber}">${turn.playerAction ? `<blockquote class="player-memory">${escapeHtml(turn.playerAction)}</blockquote>` : ""}<div class="scene-number">Scene ${turn.sceneNumber}</div><h1>${escapeHtml(turn.sceneTitle)}</h1><div class="story-prose">${proseMarkdown(turn.proseMarkdown, turn.sceneTitle)}</div></article>`).join("");
  generationPanel.hidden = session.generation.status !== "generating" && session.generation.status !== "ready";
  errorPanel.hidden = session.generation.status !== "failed"; composer.hidden = !(session.turns.length && session.generation.status === "idle" && session.status === "active"); ending.hidden = session.status !== "complete";
  if (session.generation.status === "failed") get("#reader-error-message").textContent = session.generation.error ?? "The narrator lost its place, but the saved story is intact.";
  if (session.status === "complete") get("#ending-name").textContent = session.state.endingReached ?? "Its meaning belongs to the choices that led here.";
  pacingSelect.value = session.pacing; get("#your-move-title").textContent = `What does ${session.protagonistName} attempt?`; renderSuggestions(session.suggestions);
  if (session.generation.status === "generating") { startPolling(session.id); if (!runtimeRunning && !resumeInFlight) void resumeGeneration(session); }
  else if (session.generation.status === "ready" && !session.turns.length && !resumeInFlight) void requestScene(session, true);
  else stopPolling();
  if (session.turns.length > previousTurns && previousTurns >= 0) window.setTimeout(() => document.querySelector(".story-scene:last-child")?.scrollIntoView({ behavior: "smooth", block: "start" }), 80);
  lastRenderedTurnCount = session.turns.length;
}

async function refreshSession(id: string, recover = true): Promise<void> {
  try { const result = await request<{ session: StorySession; runtimeRunning: boolean }>(`/api/story/sessions/${id}`); renderSession(result.session, result.runtimeRunning); }
  catch (error) {
    const status = (error as Error & { status?: number }).status; const backup = await readBackup(id);
    if (status === 404 && backup && recover) { const restored = await request<{ session: StorySession }>(`/api/story/sessions/${id}/restore`, "POST", { session: backup }); renderSession(restored.session, false); return; }
    if (backup) { renderSession(backup, false); errorPanel.hidden = false; generationPanel.hidden = true; get("#reader-error-message").textContent = "The server is unavailable. Your latest browser backup is open and will be restored when the server returns."; return; }
    showBuilder(); history.replaceState({}, "", "/");
  }
}

async function requestScene(session: StorySession, opening: boolean, action?: string): Promise<void> {
  const requestId = newRequestId(); const pacing = pacingSelect.value as StoryPacing;
  session.generation = { status: "generating", requestId, action: action ?? "", pacing, startedAt: new Date().toISOString() }; session.pacing = pacing; renderSession(session, true); startPolling(session.id);
  try { const result = await request<{ session: StorySession }>(`/api/story/sessions/${session.id}/${opening ? "begin" : "continue"}`, "POST", { requestId, playerAction: action ?? "", pacing }); renderSession(result.session, false); actionInput.value = ""; }
  catch { await refreshSession(session.id); }
}

async function resumeGeneration(session: StorySession): Promise<void> {
  resumeInFlight = true;
  try { const result = await request<{ session: StorySession }>(`/api/story/sessions/${session.id}/resume`, "POST", { requestId: session.generation.requestId, playerAction: session.generation.action, pacing: session.generation.pacing ?? session.pacing }); renderSession(result.session, false); }
  catch { await refreshSession(session.id, false); }
  finally { resumeInFlight = false; }
}

export async function startStory(project: NarrativeProject): Promise<void> {
  const result = await request<{ session: StorySession }>("/api/story/sessions", "POST", { project, pacing: "adaptive" });
  current = result.session; await backupSession(result.session); history.pushState({}, "", applicationUrl(`/story/${result.session.id}`)); lastRenderedTurnCount = -1; renderSession(result.session); 
}

continueButton.addEventListener("click", () => { if (!current) return; const action = actionInput.value.trim(); if (!action) { actionInput.focus(); return; } continueButton.disabled = true; void requestScene(current, false, action).finally(() => { continueButton.disabled = false; }); });
actionInput.addEventListener("keydown", event => { if ((event.metaKey || event.ctrlKey) && event.key === "Enter") continueButton.click(); });
inspirationButton.addEventListener("click", () => { if (!current) return; inspirationButton.disabled = true; inspirationButton.textContent = "Finding possibilities…"; void request<{ session: StorySession; suggestions: StorySuggestion[] }>(`/api/story/sessions/${current.id}/suggestions`, "POST", {}).then(result => renderSession(result.session)).catch(() => { inspirationButton.textContent = "Try inspiration again"; }).finally(() => { inspirationButton.disabled = false; inspirationButton.textContent = "Need inspiration?"; }); });
get("#retry-scene").addEventListener("click", () => { if (!current) return; void resumeGeneration(current); });
get("#reader-library").addEventListener("click", () => { history.pushState({}, "", "/"); showBuilder(); });
get("#theme-toggle").addEventListener("click", () => applyTheme(document.documentElement.dataset.theme === "dark" ? "light" : "dark"));
continueStoryButton.addEventListener("click", () => { const id = activeId(); if (id) { history.pushState({}, "", applicationUrl(`/story/${id}`)); void refreshSession(id); } });
window.addEventListener("popstate", () => { const id = storyIdFromUrl(); if (id) void refreshSession(id); else showBuilder(); });
document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible" && current && !reader.hidden) void refreshSession(current.id); });
window.addEventListener("pageshow", event => { if (event.persisted && current && !reader.hidden) void refreshSession(current.id); });

applyTheme(initialTheme());
const initialId = storyIdFromUrl(); const savedId = activeId(); continueStoryButton.hidden = !savedId;
if (initialId) void refreshSession(initialId);
