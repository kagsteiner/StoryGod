import assert from "node:assert/strict";
import test from "node:test";
import { AI_MODEL_DEFAULTS, configuredAIModels, modelForStoryScene, modelForTask } from "./ai.js";

test("expensive and recurring AI tasks use the intended model tiers", () => {
  assert.deepEqual(AI_MODEL_DEFAULTS, {
    genome: "gpt-5.6-sol",
    architecture: "gpt-5.6-sol",
    bibles: "gpt-5.6-terra",
    opening: "gpt-5.6-sol",
    continuation: "gpt-5.6-terra",
    suggestions: "gpt-5.6-luna"
  });
  assert.equal(modelForStoryScene(true), modelForTask("opening"));
  assert.equal(modelForStoryScene(false), modelForTask("continuation"));
  assert.deepEqual(configuredAIModels(), Object.fromEntries(Object.keys(AI_MODEL_DEFAULTS).map(task => [task, modelForTask(task as keyof typeof AI_MODEL_DEFAULTS)])));
});

test("model routes can be overridden independently without code changes", () => {
  const previous = process.env.OPENAI_MODEL_STORY;
  process.env.OPENAI_MODEL_STORY = "custom-story-model";
  try {
    assert.equal(modelForTask("continuation"), "custom-story-model");
    assert.equal(modelForTask("opening"), AI_MODEL_DEFAULTS.opening);
  } finally {
    if (previous === undefined) delete process.env.OPENAI_MODEL_STORY;
    else process.env.OPENAI_MODEL_STORY = previous;
  }
});
