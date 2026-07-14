import type { StorySession, StoryTurn } from "./types.js";

function sceneProse(turn: StoryTurn): string {
  return turn.proseMarkdown.trim().replace(/^#\s+.*(?:\r?\n)+/, "");
}

function quotedChoice(choice: string): string {
  return choice.trim().split(/\r?\n/).map(line => `> ${line}`).join("\n");
}

export function storyMarkdown(session: StorySession): string {
  const sections = [
    `# ${session.title}`,
    `*An interactive story featuring ${session.protagonistName}.*`
  ];

  for (const turn of session.turns) {
    const parts = [`## Scene ${turn.sceneNumber}: ${turn.sceneTitle}`];
    if (turn.playerAction) parts.push(`**Your choice**\n\n${quotedChoice(turn.playerAction)}`);
    parts.push(sceneProse(turn));
    sections.push(parts.filter(Boolean).join("\n\n"));
  }

  if (session.status === "complete") {
    sections.push(["---", "**The End**", session.state.endingReached].filter(Boolean).join("\n\n"));
  }

  return `${sections.join("\n\n")}\n`;
}

export function storyMarkdownFilename(title: string): string {
  const base = title.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `${base || "story"}.md`;
}
