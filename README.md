# Narrative Genetics

An AI-assisted story-foundation generator that creates a canonical narrative genome before writing prose.

## About

This is another experiment with getting LLMs to generate interactive stories. My last experiment, "AIDventure", was fun for a while, but in the end it was a failure. I had tried to get great stories by asking the LLM first to create a world with a number of characters, an pre-defined story arc and then to use it to generate a consistent story.

But the stories had four issues:

1. The style it generated was amazing first, but felt very same-ish after a while. Notably, it described things by not negating them, like "It was not like a bread, not like a pretzel" to describe a cake. Also its metaphors were sometimes off in the way metaphors are off when an AI that does not live on this planet and is not used to its physics creates them. My favorite was about someone special who also knows where up and down is when all lights are off. 
2. The stories were all starting great but getting boring and stale soon. You didn't have the feeling the plot progresses. It would stretch the current scene forever, with you nightmarish trapped in them, and if you made progress, the next scene was just not what you would imagine a good next scene to be.
3. The words, oh the words. Claude 4.6 was fixated around amber, around resonances, around precise figures. Even when you prompted it to avoid it it still couldn't resist.
4. Inconsistencies. Someone who is mentioned as a woman all of a sudden is a man. Something is described geometrically in a way that just cannot work.

Now honestly, I don't care too much about 1, 3 and 4. Assume you want to actually publish an AI generated story like that. You can correct some of the style easily, some of the words, get rid of the inconsistences. This doesn't matter. But a boring story cannot be turned into a cool story.

So I sat with ChatGPT for a long time. And we discussed what makes a good story. ChatGPT then came up with a "story genome". That's a long set of categories that make a good story, including world, hero, adversary, like this:

Primary Narrative Engine
Cardinality: exactly 1
Weight: 5
Purpose: Provides the story spine.
Rules:
quest requires destination, object, task, or goal.
mystery requires hidden truth.
transformation requires a protagonist whose identity changes.
love_blocked requires a credible barrier.
power_struggle requires contested authority.
survival requires ongoing threat.
rebellion requires hierarchy, oppression, or illegitimate power.
legacy_conflict requires inheritance, family, bloodline, succession, or institutional memory.
contact_with_unknown requires a boundary between known and unknown.
redemption requires past failure or guilt.

Creating a story is then selecting values for these properties. Between some properties there may be constraints that have to hold, like a story about a rebellion needs a world structure viable for a rebellion (ie not anarchy).

Yes, like a story configurator.

This is the result. I am not sure how well it works. The stories are more interesting. And they are, well, bloody expensive. OpenAI just gave me the great news that they've moved me from API tier 2 to 3 because my request volume is so high.

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

Open <http://localhost:3006>.

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
