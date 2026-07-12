# Narrative Genetics

An AI-assisted story-foundation generator that creates a canonical narrative genome before writing prose.

## Setup

Requires Node.js 22 or newer.

```bash
npm install
```

Create `.env` in the project root:

```dotenv
OPENAI_API_KEY=your_key_here
```

The key is read only by the Node.js server and is never sent to the browser.

## Run

```bash
npm start
```

Open <http://localhost:3000>.

## Generation pipeline

1. `gpt-5.6-sol` writes five seed-faithful story/world genomes using structured output.
2. Local TypeScript validates, repairs, scores, and ranks the genomes.
3. After selection, `gpt-5.6-sol` designs the canonical character, faction, location, plot, and interactive architecture.
4. `gpt-5.6-terra` renders four Markdown bibles from that approved architecture.
5. The app exports the complete ten-file project as a ZIP archive.

## Interactive storyteller

From a generated project, select **Begin interactive novel**. The reader uses free-text intentions by default; three editable, plot-compatible inspirations are available only through **Need inspiration?**. Pacing can be Adaptive, Quick beat, Scene, or Immersive.

Story sessions are persisted under `data/story-sessions/`, identified in `/story/<session-id>` URLs, and backed up in browser IndexedDB. Reloading or closing an iPhone/iPad tab while a scene is being written is safe: the reader reconnects to the running request or resumes an interrupted server-side generation. Light and dark reading themes are remembered locally.

Model routing keeps the one-time creative foundation at maximum quality while reducing recurring cost:

| Task | Default model |
|---|---|
| Genomes and story architecture | `gpt-5.6-sol` |
| Bible rendering | `gpt-5.6-terra` |
| Opening scene | `gpt-5.6-sol` |
| Story continuations | `gpt-5.6-terra` |
| Optional inspiration | `gpt-5.6-luna` |

Defaults can be overridden with `OPENAI_MODEL_GENOME`, `OPENAI_MODEL_ARCHITECTURE`, `OPENAI_MODEL_BIBLES`, `OPENAI_MODEL_OPENING`, `OPENAI_MODEL_STORY`, and `OPENAI_MODEL_SUGGESTIONS`.

Generation can take several minutes because the selected model reasons over a large, tightly constrained story package.

## Verify

```bash
npm test
```

The optional live project smoke test uses the configured API key and incurs API usage:

```bash
node scripts/smoke-ai-project.mjs
```
