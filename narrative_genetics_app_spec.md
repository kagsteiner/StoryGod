# Narrative Genetics App Spec

## Purpose

Build an AI-based interactive novel author that first creates a coherent **world**, **story**, and **character foundation**, then exports those assets as structured data and reusable prose for a later storytelling engine.

The core idea is simple:

> Generate structure first. Render prose second.

Most AI story generators fail because they ask the model to write a story directly. This app should instead generate a canonical **narrative genome**, validate and score it, expand it into bibles, and only then produce text modules that can power an interactive novel.

---

## Product Goal

The app generates a complete story foundation package:

```text
/project
  project.json
  world_bible.md
  story_bible.md
  character_bible.md
  interactive_design.md
  locations.json
  factions.json
  characters.json
  plot_outline.json
  opening_scene_seed.md
```

The generated package should be usable by:

1. a human author,
2. a Codex-assisted development workflow,
3. a later interactive storytelling engine.

---

## Core Principle

The app should not treat story generation as one giant prompt.

Instead, it should use a staged pipeline:

```text
User Taste Profile
   ↓
Generate Candidate Genomes
   ↓
Validate Hard Constraints
   ↓
Score Soft Compatibility
   ↓
Repair Weak Candidates
   ↓
Select Top Candidates
   ↓
Generate World Bible
   ↓
Generate Story Bible
   ↓
Generate Character Bible
   ↓
Generate Interactive Hooks
   ↓
Export Markdown + JSON
```

The **genome** is canonical. Prose is derived from it.

---

# 1. Key Concepts

## 1.1 NarrativeProject

The main object representing a generated story project.

```ts
export interface NarrativeProject {
  projectId: string;
  title: string;
  tasteProfile: TasteProfile;
  storyGenome: StoryGenome;
  worldGenome: WorldGenome;
  characterGenome: CharacterGenome;
  scores: GenomeScores;
  bibles: GeneratedBibles;
  interactiveDesign: InteractiveDesign;
  exportManifest: ExportManifest;
}
```

---

## 1.2 TasteProfile

Captures user preference before generation.

```ts
export interface TasteProfile {
  genres: string[];
  tone: string[];
  targetAudience?: "middle_grade" | "young_adult" | "adult";
  darkness: number;      // 0-10
  weirdness: number;     // 0-10
  romance: number;       // 0-10
  action: number;        // 0-10
  humor: number;         // 0-10
  literaryStyle?: "plain" | "lyrical" | "cinematic" | "mythic" | "noir" | "cozy";
  inspirationsToCapture?: string[];
  inspirationsToAvoid?: string[];
  contentLimits?: string[];
  userSeed?: string;
}
```

Example:

```json
{
  "genres": ["fantasy", "political mystery"],
  "tone": ["melancholy", "suspense"],
  "darkness": 7,
  "weirdness": 5,
  "romance": 2,
  "action": 4,
  "literaryStyle": "cinematic",
  "userSeed": "A maritime republic that is rich but terrified of running out of fresh water."
}
```

---

# 2. Story Genome

The Story Genome defines the deep plot structure.

## 2.1 StoryGenome Type

```ts
export interface StoryGenome {
  primaryEngine: PrimaryNarrativeEngine;
  secondaryEngines: SecondaryNarrativeEngine[];
  emotionalPromise: EmotionalPromise;
  protagonistArc: ProtagonistArc;
  oppositionTypes: OppositionType[];
  revelationStyle: RevelationStyle;
  endingMeaning: EndingMeaning;
  contradiction?: string;
}
```

---

## 2.2 Primary Narrative Engine

Cardinality: **exactly 1**  
Weight: **5**

```ts
export type PrimaryNarrativeEngine =
  | "quest"
  | "mystery"
  | "transformation"
  | "love_blocked"
  | "power_struggle"
  | "survival"
  | "rebellion"
  | "legacy_conflict"
  | "contact_with_unknown"
  | "redemption";
```

Purpose: Provides the story spine.

Rules:

- `quest` requires destination, object, task, or goal.
- `mystery` requires hidden truth.
- `transformation` requires a protagonist whose identity changes.
- `love_blocked` requires a credible barrier.
- `power_struggle` requires contested authority.
- `survival` requires ongoing threat.
- `rebellion` requires hierarchy, oppression, or illegitimate power.
- `legacy_conflict` requires inheritance, family, bloodline, succession, or institutional memory.
- `contact_with_unknown` requires a boundary between known and unknown.
- `redemption` requires past failure or guilt.

---

## 2.3 Secondary Engine

Cardinality: **0-2**  
Weight: **4**

Secondary engines add richness but must not overwhelm the primary engine.

Strong pairings:

| Primary | Strong Secondary Options |
|---|---|
| quest | transformation, survival, mystery |
| mystery | rebellion, legacy_conflict, contact_with_unknown |
| transformation | love_blocked, power_struggle, redemption |
| love_blocked | legacy_conflict, rebellion, survival |
| power_struggle | legacy_conflict, rebellion, contact_with_unknown |
| survival | contact_with_unknown, transformation, love_blocked |
| rebellion | mystery, power_struggle, transformation |
| legacy_conflict | mystery, power_struggle, love_blocked |
| contact_with_unknown | mystery, survival, transformation |
| redemption | quest, transformation, love_blocked |

---

## 2.4 Emotional Promise

Cardinality: **1 primary + 0-1 secondary**  
Weight: **4**

```ts
export interface EmotionalPromise {
  primary:
    | "wonder"
    | "suspense"
    | "dread"
    | "longing"
    | "triumph"
    | "melancholy"
    | "catharsis"
    | "awe"
    | "belonging"
    | "righteous_anger";
  secondary?: string;
}
```

The emotional promise controls the feel of scenes, prose, pacing, and stakes.

Examples:

- `suspense + melancholy`
- `wonder + awe`
- `dread + catharsis`
- `belonging + longing`

---

## 2.5 Protagonist Arc

Cardinality: **exactly 1**  
Weight: **5**

```ts
export type ProtagonistArc =
  | "coward_to_brave"
  | "selfish_to_loving"
  | "naive_to_wise"
  | "moral_to_corrupted"
  | "passive_to_decisive"
  | "skeptic_to_believer"
  | "broken_to_whole"
  | "loyal_to_independent"
  | "vengeful_to_forgiving";
```

Rules:

- `coward_to_brave` requires danger.
- `selfish_to_loving` requires relational stakes.
- `naive_to_wise` requires deception or painful learning.
- `moral_to_corrupted` requires temptation and power.
- `passive_to_decisive` requires mounting pressure.
- `skeptic_to_believer` requires impossible evidence.
- `broken_to_whole` requires wound, care, and integration.
- `loyal_to_independent` requires faction/family pressure.
- `vengeful_to_forgiving` requires harm, anger, and a credible mercy choice.

---

## 2.6 Opposition Type

Cardinality: **1 primary + 0-2 secondary**  
Weight: **5**

```ts
export type OppositionType =
  | "villain"
  | "rival"
  | "society"
  | "nature"
  | "time"
  | "inner_flaw"
  | "fate"
  | "unknowable_force"
  | "ally_conflict"
  | "hidden_elite";
```

At least one opposition type must escalate across the story.

Good combinations:

- `villain + inner_flaw`
- `society + time`
- `nature + ally_conflict`
- `hidden_elite + mystery`
- `unknowable_force + skeptic_to_believer`

---

## 2.7 Revelation Style

Cardinality: **1 major + optional minor reveals**  
Weight: **4**

```ts
export type RevelationStyle =
  | "hidden_identity"
  | "betrayal_exposed"
  | "false_history"
  | "prophecy_reversed"
  | "enemy_was_right"
  | "protagonist_caused_problem"
  | "world_artificial"
  | "memory_false"
  | "death_was_staged"
  | "love_was_manipulation";
```

Rules:

- Mystery strongly benefits from a revelation style.
- Too many major revelations can feel cheap.
- Revelation should alter the meaning of earlier events.

---

## 2.8 Ending Meaning

Cardinality: **exactly 1 + optional bittersweet modifier**  
Weight: **5**

```ts
export type EndingMeaning =
  | "justice_restored"
  | "bittersweet_growth"
  | "tragic_inevitability"
  | "sacrifice_saves_many"
  | "truth_costs_everything"
  | "cycle_continues"
  | "hope_survives_darkness"
  | "love_survives_death"
  | "victory_corrupts_winner"
  | "mystery_remains";
```

Rules:

- `truth_costs_everything` pairs well with mystery, rebellion, and false history.
- `justice_restored` pairs well with quest, mystery, and revenge-like structures.
- `bittersweet_growth` pairs well with transformation and love blocked.
- `victory_corrupts_winner` pairs well with power struggle and moral corruption.
- `mystery_remains` must be used carefully; it can frustrate readers if the primary engine is mystery.

---

# 3. World Genome

The World Genome defines the system that produces conflict.

## 3.1 WorldGenome Type

```ts
export interface WorldGenome {
  energySource: EnergySourceSelection;
  powerStructure: PowerStructureSelection;
  beliefSystem: BeliefSystemSelection;
  scarcity: ScarcitySelection;
  socialFractures: SocialFracture[];
  historicalWound: HistoricalWound;
  dailyLifeTexture: string[];
  edgeOfUnknown: EdgeOfUnknown;
  contradiction: string;
}
```

---

## 3.2 Energy Source

Cardinality: **1 primary + optional secondary**  
Weight: **4**

```ts
export interface EnergySourceSelection {
  primary: EnergySource;
  secondary?: EnergySource;
}

export type EnergySource =
  | "steam"
  | "fossil"
  | "magic"
  | "biotech"
  | "ai_grid"
  | "relic_technology"
  | "divine_gift"
  | "tidal_wind"
  | "slave_labor"
  | "memory_harvesting"
  | "scarce_sunlight";
```

Rule: The energy source must influence economy, class, war, transport, or daily life.

---

## 3.3 Power Structure

Cardinality: **1 visible + optional 1 hidden**  
Weight: **5**

```ts
export interface PowerStructureSelection {
  visible: PowerStructure;
  hidden?: PowerStructure;
}

export type PowerStructure =
  | "monarchy"
  | "senate"
  | "merchant_guilds"
  | "corporations"
  | "priesthood"
  | "algorithmic_state"
  | "family_dynasties"
  | "warlords"
  | "tribes"
  | "democratic_shell"
  | "military_order"
  | "secret_council";
```

Rule: Power must create winners and losers.

---

## 3.4 Belief System

Cardinality: **1 dominant + optional minority rival**  
Weight: **4**

```ts
export interface BeliefSystemSelection {
  dominant: BeliefSystem;
  minority?: BeliefSystem;
}

export type BeliefSystem =
  | "ancestor_faith"
  | "scientific_rationalism"
  | "state_ideology"
  | "heroic_honor_code"
  | "pleasure_creed"
  | "fatalistic_astrology"
  | "salvation_religion"
  | "reincarnation_certainty"
  | "nihilism"
  | "commercial_rationalism";
```

Rule: Belief should affect law, guilt, ritual, marriage, death, or sacrifice.

---

## 3.5 Scarcity

Cardinality: **1 visible + optional hidden**  
Weight: **5**

```ts
export interface ScarcitySelection {
  visible: Scarcity;
  hidden?: Scarcity;
}

export type Scarcity =
  | "water"
  | "land"
  | "trust"
  | "truth"
  | "children"
  | "energy"
  | "memory"
  | "time"
  | "safety"
  | "status"
  | "forgiveness";
```

Rule: Scarcity should generate conflict automatically.

---

## 3.6 Social Fractures

Cardinality: **1-3**  
Weight: **5**

```ts
export type SocialFracture =
  | "rich_vs_poor"
  | "native_vs_outsider"
  | "human_vs_altered"
  | "magic_users_vs_non_users"
  | "city_vs_rural"
  | "believer_vs_skeptic"
  | "old_families_vs_new_money"
  | "free_vs_owned"
  | "surface_vs_underground"
  | "core_vs_periphery";
```

Rule: Fractures should create different incentives for factions and characters.

---

## 3.7 Historical Wound

Cardinality: **exactly 1 core wound**  
Weight: **5**

```ts
export type HistoricalWound =
  | "lost_war"
  | "genocide"
  | "betrayal_revolution"
  | "plague_coverup"
  | "stolen_throne"
  | "broken_treaty"
  | "vanished_civilization"
  | "ai_uprising"
  | "colonization_trauma"
  | "divine_silence"
  | "erased_civil_war";
```

Rule: Present politics and personal conflicts must still reflect this wound.

---

## 3.8 Daily Life Texture

Cardinality: **3-5 details**  
Weight: **2**

Examples:

```ts
export type DailyLifeTexture =
  | "ration_lines"
  | "ritual_festivals"
  | "rooftop_gardens"
  | "surveillance_drones"
  | "communal_meals"
  | "dangerous_roads"
  | "floating_villages"
  | "mandatory_service"
  | "seasonal_migrations"
  | "harbor_markets"
  | "salt_tax_inspections";
```

Rule: These details make the world feel lived-in.

---

## 3.9 Edge of Unknown

Cardinality: **exactly 1**  
Weight: **3**

```ts
export type EdgeOfUnknown =
  | "cursed_forest"
  | "dead_zone"
  | "outer_planets"
  | "forbidden_archives"
  | "ocean_trench_minds"
  | "ghost_provinces"
  | "time_ruins"
  | "monster_wastes"
  | "dream_realm"
  | "sealed_continent"
  | "black_sea_trench";
```

Rule: The edge of unknown should enable mystery, quest, horror, awe, or escalation.

---

## 3.10 World Contradiction

Cardinality: **exactly 1 strong paradox**  
Weight: **5**

Examples:

- A peaceful empire built on secret torture.
- A free democracy run by prediction AI.
- The wealthiest nation fears thirst.
- A magical kingdom with no wonder left.
- An immortal society obsessed with youth.
- A healing utopia where nobody is allowed to grieve.

Rule: This contradiction should create recurring moral tension.

---

# 4. Character Genome

The Character Genome should be generated after story and world selection.

## 4.1 CharacterGenome Type

```ts
export interface CharacterGenome {
  protagonist: ProtagonistProfile;
  antagonist: AntagonistProfile;
  majorAllies: CharacterProfile[];
  majorRivals: CharacterProfile[];
  keyRelationships: RelationshipDynamic[];
}
```

---

## 4.2 Protagonist Profile

```ts
export interface ProtagonistProfile {
  name: string;
  roleInWorld: string;
  surfaceDesire: string;
  deepNeed: string;
  fear: string;
  wound: string;
  lieBelieved: string;
  competence: string;
  weakness: string;
  secret: string;
  temptation: string;
  arc: ProtagonistArc;
}
```

Important distinction:

- **Surface desire**: what the protagonist thinks they want.
- **Deep need**: what they actually need.
- **Lie believed**: false idea that keeps them trapped.
- **Temptation**: the easy but destructive path.

---

## 4.3 Antagonist Profile

```ts
export interface AntagonistProfile {
  name: string;
  roleInWorld: string;
  goal: string;
  moralArgument: string;
  method: string;
  vulnerability: string;
  relationshipToProtagonist: string;
}
```

Rule: The antagonist should not merely be evil. They should represent a competing answer to the story’s central question.

---

## 4.4 Relationship Dynamics

```ts
export interface RelationshipDynamic {
  characterA: string;
  characterB: string;
  bondType:
    | "family"
    | "romantic"
    | "mentor"
    | "rival"
    | "former_friend"
    | "political"
    | "debt"
    | "betrayal"
    | "reluctant_alliance";
  tension: string;
  possibleChange: string;
}
```

---

# 5. Validation Rules

The validator should catch hard incoherence before prose generation.

## 5.1 Hard Rules

```ts
export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
  warnings: ValidationIssue[];
}

export interface ValidationIssue {
  severity: "error" | "warning";
  code: string;
  message: string;
  suggestedRepair?: string;
}
```

Example hard rules:

```ts
function validateStoryGenome(story: StoryGenome, world: WorldGenome): ValidationResult {
  const issues: ValidationIssue[] = [];
  const warnings: ValidationIssue[] = [];

  if (story.primaryEngine === "mystery" && !hasHiddenTruth(story, world)) {
    issues.push({
      severity: "error",
      code: "MYSTERY_WITHOUT_SECRET",
      message: "Mystery requires hidden truth, false history, deception, or missing knowledge.",
      suggestedRepair: "Add a revelation style such as false_history, memory_false, or betrayal_exposed."
    });
  }

  if (story.primaryEngine === "rebellion" && !hasOppressiveStructure(world)) {
    issues.push({
      severity: "error",
      code: "REBELLION_WITHOUT_OPPRESSION",
      message: "Rebellion requires hierarchy, oppression, illegitimate power, or coercive institutions.",
      suggestedRepair: "Add a hidden elite, algorithmic state, priesthood, warlord system, or exploitative corporation."
    });
  }

  if (story.primaryEngine === "love_blocked" && !hasCredibleBarrier(world, story)) {
    issues.push({
      severity: "error",
      code: "LOVE_WITHOUT_BARRIER",
      message: "Love Blocked requires a credible social, personal, temporal, political, or metaphysical barrier.",
      suggestedRepair: "Add caste division, family feud, species divide, duty conflict, or time separation."
    });
  }

  if (story.protagonistArc === "skeptic_to_believer" && !hasImpossibleEvidence(story, world)) {
    warnings.push({
      severity: "warning",
      code: "SKEPTIC_ARC_UNDERPOWERED",
      message: "Skeptic to believer needs evidence that challenges the protagonist's worldview.",
      suggestedRepair: "Strengthen contact_with_unknown, prophecy_reversed, divine_silence, or forbidden_archives."
    });
  }

  return {
    valid: issues.length === 0,
    issues,
    warnings
  };
}
```

---

## 5.2 Helper Logic

```ts
function hasHiddenTruth(story: StoryGenome, world: WorldGenome): boolean {
  return [
    "hidden_identity",
    "betrayal_exposed",
    "false_history",
    "prophecy_reversed",
    "enemy_was_right",
    "protagonist_caused_problem",
    "world_artificial",
    "memory_false",
    "death_was_staged",
    "love_was_manipulation"
  ].includes(story.revelationStyle)
  || world.scarcity.hidden === "truth"
  || world.historicalWound === "plague_coverup"
  || world.historicalWound === "erased_civil_war";
}

function hasOppressiveStructure(world: WorldGenome): boolean {
  const oppressiveStructures = [
    "monarchy",
    "corporations",
    "priesthood",
    "algorithmic_state",
    "family_dynasties",
    "warlords",
    "military_order",
    "secret_council"
  ];

  return oppressiveStructures.includes(world.powerStructure.visible)
    || !!world.powerStructure.hidden
    || world.socialFractures.includes("free_vs_owned")
    || world.socialFractures.includes("rich_vs_poor");
}
```

---

# 6. Scoring System

After validation, each candidate should be scored.

```ts
export interface GenomeScores {
  coherence: number;             // 0-10
  originality: number;           // 0-10
  emotionalPotential: number;    // 0-10
  interactivePotential: number;  // 0-10
  worldStorySynergy: number;     // 0-10
  characterPressure: number;     // 0-10
  genreFit: number;              // 0-10
  overall: number;               // weighted average
}
```

Suggested weights:

```ts
const SCORE_WEIGHTS = {
  coherence: 0.25,
  originality: 0.15,
  emotionalPotential: 0.15,
  interactivePotential: 0.15,
  worldStorySynergy: 0.15,
  characterPressure: 0.10,
  genreFit: 0.05
};
```

---

## 6.1 Compatibility Examples

```ts
const COMPATIBILITY_SCORES = [
  {
    combo: ["mystery", "false_history"],
    score: 10,
    reason: "A mystery becomes stronger when the world contains a buried historical lie."
  },
  {
    combo: ["survival", "water"],
    score: 10,
    reason: "Survival stories are naturally fueled by concrete scarcity."
  },
  {
    combo: ["love_blocked", "old_families_vs_new_money"],
    score: 8,
    reason: "Class/family conflict provides a strong relationship barrier."
  },
  {
    combo: ["rebellion", "algorithmic_state"],
    score: 9,
    reason: "Algorithmic control creates clear systemic oppression."
  },
  {
    combo: ["quest", "stable_abundance_utopia"],
    score: 3,
    reason: "A quest needs pressure, loss, danger, or desire beyond comfort."
  }
];
```

---

## 6.2 Rarity Scoring

Frequent combinations feel classic. Rare combinations feel fresh. The app should not maximize rarity blindly; it should balance rarity with coherence.

Examples:

| Combination | Rarity | Note |
|---|---:|---|
| quest + magical artifact | low | Familiar, usable, not fresh |
| mystery + erased civil war | medium | Strong and flexible |
| love blocked + memory scarcity | high | Fresh, emotionally interesting |
| cozy belonging + rebellion | high | Odd but potentially strong |
| survival + harsh winter | low | Classic but effective |
| power struggle + healing utopia | high | Interesting contradiction |

---

# 7. Repair System

The repairer should fix candidates that are close but weak.

```ts
export interface RepairSuggestion {
  issueCode: string;
  action: "add" | "replace" | "strengthen" | "remove";
  targetGene: string;
  oldValue?: string;
  newValue?: string;
  explanation: string;
}
```

Example repairs:

```json
[
  {
    "issueCode": "REBELLION_WITHOUT_OPPRESSION",
    "action": "add",
    "targetGene": "worldGenome.powerStructure.hidden",
    "newValue": "secret_council",
    "explanation": "Adds a coercive hidden authority that gives the rebellion a clear target."
  },
  {
    "issueCode": "MYSTERY_WITHOUT_SECRET",
    "action": "replace",
    "targetGene": "storyGenome.revelationStyle",
    "oldValue": "mystery_remains",
    "newValue": "false_history",
    "explanation": "Creates a discoverable truth that supports the mystery engine."
  }
]
```

---

# 8. Generated Bibles

Once a genome candidate is selected, generate bibles.

## 8.1 GeneratedBibles Type

```ts
export interface GeneratedBibles {
  worldBibleMarkdown: string;
  storyBibleMarkdown: string;
  characterBibleMarkdown: string;
  interactiveDesignMarkdown: string;
}
```

---

## 8.2 World Bible Sections

```markdown
# World Bible

## World Summary

## Core Contradiction

## Geography

## History

## Historical Wound

## Power Structure

## Hidden Power

## Economy and Energy

## Belief Systems

## Scarcity

## Social Fractures

## Daily Life

## Factions

## Locations

## Edge of the Unknown

## Rules of Magic / Technology

## Sensory Identity

## Story Opportunities
```

---

## 8.3 Story Bible Sections

```markdown
# Story Bible

## Title

## Logline

## Premise

## Primary Narrative Engine

## Secondary Engine

## Emotional Promise

## Central Conflict

## Central Question

## Thematic Argument

## Protagonist Arc

## Opposition

## Major Revelation

## Escalation Ladder

## Act Structure

## Ending Variants

## Reader Promise
```

---

## 8.4 Character Bible Sections

```markdown
# Character Bible

## Protagonist

## Antagonist

## Major Allies

## Major Rivals

## Factions as Character Forces

## Relationship Web

## Secrets

## Temptations

## Transformation Path

## Possible Betrayals

## Possible Sacrifices
```

---

# 9. Interactive Design

Interactive fiction needs recurring choice logic, not random branches.

## 9.1 InteractiveDesign Type

```ts
export interface InteractiveDesign {
  choiceAxes: ChoiceAxis[];
  worldState: WorldStateVariable[];
  branchHooks: BranchHook[];
  actChoicePoints: ActChoicePoint[];
  endingConditions: EndingCondition[];
}
```

---

## 9.2 Choice Axes

Choice axes are recurring moral or strategic tensions.

```ts
export interface ChoiceAxis {
  name: string;
  description: string;
  poles: [string, string];
}
```

Example:

```json
{
  "name": "Truth vs Safety",
  "description": "Does the player expose dangerous truths or preserve social stability?",
  "poles": ["truth", "safety"]
}
```

Suggested choice axes:

- Truth vs Safety
- Loyalty vs Independence
- Mercy vs Justice
- Power vs Freedom
- Love vs Duty
- Survival vs Humanity
- Tradition vs Change
- Faith vs Doubt

---

## 9.3 World State Variables

```ts
export interface WorldStateVariable {
  key: string;
  label: string;
  min: number;
  max: number;
  initial: number;
  description: string;
}
```

Example:

```json
[
  {
    "key": "publicUnrest",
    "label": "Public Unrest",
    "min": 0,
    "max": 100,
    "initial": 10,
    "description": "Measures how close the public is to open revolt."
  },
  {
    "key": "eliteSuspicion",
    "label": "Elite Suspicion",
    "min": 0,
    "max": 100,
    "initial": 0,
    "description": "Measures how much the ruling class suspects the protagonist."
  },
  {
    "key": "truthDiscovered",
    "label": "Truth Discovered",
    "min": 0,
    "max": 100,
    "initial": 0,
    "description": "Measures progress toward uncovering the central secret."
  }
]
```

---

## 9.4 Branch Hooks

```ts
export interface BranchHook {
  id: string;
  sceneSeed: string;
  choiceText: string;
  axis: string;
  effects: Record<string, number>;
  narrativeConsequence: string;
}
```

Example:

```json
{
  "id": "salt-tribunal-expose-ledgers",
  "sceneSeed": "At the Salt Tribunal, the protagonist discovers forged ration ledgers.",
  "choiceText": "Expose the senator's forged ration ledgers.",
  "axis": "Truth vs Safety",
  "effects": {
    "publicUnrest": 20,
    "eliteSuspicion": 30,
    "rebelTrust": 15
  },
  "narrativeConsequence": "The public begins to doubt the Senate, but the protagonist becomes a target."
}
```

---

## 9.5 Ending Conditions

```ts
export interface EndingCondition {
  endingId: string;
  title: string;
  requiredState: Record<string, string | number>;
  emotionalMeaning: EndingMeaning;
  summary: string;
}
```

Example:

```json
{
  "endingId": "truth_costs_everything",
  "title": "The Republic Learns to Thirst",
  "requiredState": {
    "truthDiscovered": 90,
    "publicUnrest": 70,
    "protagonistBelief": 80
  },
  "emotionalMeaning": "truth_costs_everything",
  "summary": "The protagonist exposes the founding lie, but the Republic collapses into a necessary reckoning."
}
```

---

# 10. Prompt Architecture

The app should use multiple focused prompts instead of one massive prompt.

## 10.1 Prompt 1: Generate Genome Candidates

System instruction:

```text
You are a narrative systems designer. Generate structured story and world genomes, not prose. Respect cardinality rules and avoid incoherent combinations.
```

User prompt template:

```text
Generate {{candidateCount}} candidate narrative genomes.

Taste profile:
{{tasteProfileJson}}

Return strict JSON matching this schema:
{{schema}}

Do not write prose summaries yet. Focus on structured genome values.
```

---

## 10.2 Prompt 2: Critique and Validate

```text
You are a strict narrative validator.

Review this candidate genome:
{{candidateJson}}

Check:
- hard rule violations
- weak story-world fit
- underpowered protagonist arc
- missing opposition
- missing scarcity or stakes
- unclear contradiction

Return:
{
  "valid": boolean,
  "issues": [],
  "warnings": [],
  "repairSuggestions": []
}
```

---

## 10.3 Prompt 3: Score Candidate

```text
You are a narrative scoring engine.

Score this candidate from 0 to 10 on:
- coherence
- originality
- emotional potential
- interactive potential
- world-story synergy
- character pressure
- genre fit

Return strict JSON.
Explain each score in one sentence.
```

---

## 10.4 Prompt 4: Repair Candidate

```text
You are a narrative genome repairer.

Given this genome and validation report, produce an improved genome.

Rules:
- Preserve the user's taste profile.
- Preserve the strongest original idea.
- Fix hard errors.
- Improve weak synergies.
- Do not overcomplicate the genome.
- Return strict JSON only.
```

---

## 10.5 Prompt 5: Generate Bibles

```text
You are a story bible writer for an interactive fiction project.

Use this canonical genome:
{{selectedGenomeJson}}

Generate:
1. World Bible
2. Story Bible
3. Character Bible
4. Interactive Design

Write clear, structured Markdown.
Do not contradict the genome.
Do not introduce major new concepts unless they directly support the selected genes.
```

---

# 11. MVP Scope

The first implementation should stay narrow.

## MVP Features

1. User enters taste profile.
2. App generates 5 genome candidates.
3. App validates candidates.
4. App scores candidates.
5. App displays top 3.
6. User selects one.
7. App generates:
   - world summary
   - story premise
   - protagonist
   - antagonist
   - 3 factions
   - 5 locations
   - 3-act plot
   - 5 major choice points
8. App exports Markdown and JSON.

---

## MVP Non-Goals

Do not build these first:

- full branching novel generation
- account system
- collaborative editing
- image generation
- audio generation
- EPUB export
- complex graph visualization
- fine-tuned model

Those can come later.

---

# 12. Suggested App Modules

```text
src/
  app/
    page.tsx
    api/
      generate-candidates/
      validate-candidate/
      score-candidate/
      repair-candidate/
      generate-bibles/
      export-project/
  components/
    TasteProfileForm.tsx
    CandidateCard.tsx
    ScorePanel.tsx
    GenomeViewer.tsx
    BiblePreview.tsx
    ExportButton.tsx
  lib/
    narrative/
      schemas.ts
      constants.ts
      validateGenome.ts
      scoreGenome.ts
      repairGenome.ts
      prompts.ts
      exportProject.ts
    ai/
      client.ts
      jsonMode.ts
  types/
    narrative.ts
```

This structure assumes a Next.js-style app, but the architecture is portable.

---

# 13. Implementation Stages

## Stage 1: Static Types and Constants

Create:

- `StoryGenome`
- `WorldGenome`
- `CharacterGenome`
- enum-like value lists
- cardinality metadata
- weight metadata

## Stage 2: Local Validator

Implement hard validation rules in deterministic code.

## Stage 3: Mock Candidate Generator

Before using an LLM, create a local generator that randomly combines valid values.

This helps test UI and validation.

## Stage 4: LLM Candidate Generator

Replace mock generation with AI-generated candidates.

Use strict JSON schema output.

## Stage 5: Scoring and Ranking

Combine deterministic scoring with AI critique.

## Stage 6: Bible Generation

Generate Markdown bibles from selected genome.

## Stage 7: Export

Export `.json` and `.md` files.

---

# 14. Candidate Display UI

Each candidate card should show:

```text
Title
Genre Feel
Primary Engine
Secondary Engine
World Contradiction
Core Scarcity
Historical Wound
Emotional Promise
Overall Score
Why It Works
Warnings
```

Example:

```text
The Thirsting Republic

Political fantasy mystery.
A rich maritime republic fears running out of fresh water.

Primary Engine: Mystery
Secondary Engine: Rebellion
Emotional Promise: Suspense + Melancholy
Scarcity: Water / Truth
Historical Wound: Erased Civil War
Contradiction: The wealthiest nation fears thirst.

Overall Score: 8.7

Why it works:
The mystery is powered by a false national history, while water scarcity creates concrete stakes for every class.
```

---

# 15. Example Project Output

## 15.1 Example Genome

```json
{
  "title": "The Thirsting Republic",
  "storyGenome": {
    "primaryEngine": "mystery",
    "secondaryEngines": ["rebellion"],
    "emotionalPromise": {
      "primary": "suspense",
      "secondary": "melancholy"
    },
    "protagonistArc": "skeptic_to_believer",
    "oppositionTypes": ["society", "hidden_elite", "inner_flaw"],
    "revelationStyle": "false_history",
    "endingMeaning": "truth_costs_everything",
    "contradiction": "The investigator must destroy the only system that has kept people alive."
  },
  "worldGenome": {
    "energySource": {
      "primary": "tidal_wind",
      "secondary": "relic_technology"
    },
    "powerStructure": {
      "visible": "senate",
      "hidden": "merchant_guilds"
    },
    "beliefSystem": {
      "dominant": "commercial_rationalism",
      "minority": "ancestor_faith"
    },
    "scarcity": {
      "visible": "water",
      "hidden": "truth"
    },
    "socialFractures": [
      "rich_vs_poor",
      "core_vs_periphery",
      "believer_vs_skeptic"
    ],
    "historicalWound": "erased_civil_war",
    "dailyLifeTexture": [
      "ration_lines",
      "harbor_markets",
      "salt_tax_inspections",
      "ritual_festivals"
    ],
    "edgeOfUnknown": "black_sea_trench",
    "contradiction": "The wealthiest maritime nation in the world fears thirst."
  }
}
```

---

## 15.2 Example World Summary

```markdown
# The Ashwater Republic

The Ashwater Republic is the wealthiest maritime state in the known world, yet every citizen lives under water rationing. Its merchant senate claims discipline and commerce saved civilization after the Drowning Wars, but in the outer islands old families still whisper that the Republic caused the flood it now profits from.

The capital is clean, tiled, and blue-white, full of public fountains that never run dry. Beyond the harbor wall, children queue with copper ration plates while salt inspectors search fishing boats for illegal freshwater barrels.
```

---

## 15.3 Example Interactive Choice Axis

```json
{
  "name": "Truth vs Safety",
  "description": "Does the player expose dangerous truths or preserve social stability?",
  "poles": ["truth", "safety"]
}
```

---

# 16. Quality Rules

The app should prefer candidates where:

1. The primary engine has enough fuel.
2. The protagonist arc is pressured by the world.
3. The world contradiction creates moral tension.
4. The scarcity affects ordinary people and elites differently.
5. The historical wound still shapes present conflicts.
6. The revelation changes the meaning of the world.
7. Interactive choices map to theme, not just tactics.
8. The ending meaning follows from earlier choices.

Reject or repair candidates where:

1. Mystery has no secret.
2. Quest has no goal.
3. Rebellion has no oppression.
4. Survival has no ongoing threat.
5. Love blocked has no barrier.
6. Transformation has no pressure.
7. The world has no scarcity.
8. The contradiction is cosmetic.
9. The protagonist could be removed and the world would not change.
10. Choices do not affect world state or character arc.

---

# 17. Future Extensions

After MVP:

## 17.1 Scene Generator

Generate individual scenes from:

- current world state
- character goals
- location
- tension level
- choice axis
- required reveal

## 17.2 Branching Plot Graph

Represent the novel as a graph:

```ts
interface StoryNode {
  id: string;
  title: string;
  sceneSeed: string;
  requiredState?: Record<string, number>;
  choices: StoryChoice[];
}
```

## 17.3 Continuity Checker

Validate that generated scenes do not contradict:

- world rules
- character knowledge
- previous choices
- current world state

## 17.4 Style Layer

Allow prose rendering in styles:

- plain
- cinematic
- mythic
- gothic
- noir
- cozy
- literary
- young adult

## 17.5 Image and Audio Hooks

Generate prompts for:

- world map
- character portraits
- location art
- soundtrack mood
- ambient sound effects

---

# 18. Development Prompt for Codex

Use this prompt to start implementation:

```text
Create a Next.js TypeScript app for a "Narrative Genetics" story world generator.

Use the attached specification as the product and architecture guide.

Implement the MVP only:
1. Taste profile form.
2. Candidate genome generation endpoint.
3. Deterministic validation rules.
4. Candidate scoring.
5. Candidate cards showing top candidates.
6. Selected candidate detail view.
7. Generate Markdown bibles from selected candidate.
8. Export project as JSON and Markdown files.

Start by creating:
- TypeScript types for StoryGenome, WorldGenome, CharacterGenome, NarrativeProject.
- Constants for allowed gene values, cardinality, and weights.
- A deterministic validator in lib/narrative/validateGenome.ts.
- A simple mock generator in lib/narrative/mockGenerate.ts so the UI can work before connecting an AI API.
- A scoreGenome.ts file with basic compatibility scoring.
- A basic UI with TasteProfileForm, CandidateCard, and GenomeViewer.

Do not implement full branching novel generation yet.
Keep the first version clean, typed, and testable.
```

---

# 19. Design Philosophy

This app should not be a random story idea machine.

It should be an **evolutionary narrative system**.

The system creates candidate story-world organisms, tests them for coherence, scores their potential, repairs their weaknesses, and then grows the best candidate into a usable story bible.

In practical terms:

- Structure before prose.
- Constraints before creativity.
- World pressure before plot events.
- Character transformation before scene generation.
- Choice axes before branching.
- Markdown and JSON export before full novel writing.

That is the foundation of a serious AI-based interactive novel author.
