import { readFileSync } from "node:fs";
import { resolve } from "node:path";

let loaded = false;

export function loadEnvironment(): void {
  if (loaded) return;
  loaded = true;
  try {
    const source = readFileSync(resolve(process.cwd(), ".env"), "utf8");
    for (const rawLine of source.split(/\r?\n/)) {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) continue;
      const equals = line.indexOf("=");
      if (equals < 1) continue;
      const key = line.slice(0, equals).trim();
      let value = line.slice(equals + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) value = value.slice(1, -1);
      if (!(key in process.env)) process.env[key] = value;
    }
  } catch (error) {
    const code = error && typeof error === "object" && "code" in error ? String(error.code) : "";
    if (code !== "ENOENT") throw error;
  }
}

export function openAIConfigured(): boolean {
  loadEnvironment();
  return Boolean(process.env.OPENAI_API_KEY?.trim());
}
