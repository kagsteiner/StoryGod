export interface TasteProfile {
  genres: string[];
  tone: string[];
  targetAudience?: "middle_grade" | "young_adult" | "adult";
  darkness: number;
  weirdness: number;
  romance: number;
  action: number;
  humor: number;
  literaryStyle?: "plain" | "lyrical" | "cinematic" | "mythic" | "noir" | "cozy";
  inspirationsToCapture?: string[];
  inspirationsToAvoid?: string[];
  contentLimits?: string[];
  userSeed?: string;
}

export type PrimaryNarrativeEngine = "quest" | "mystery" | "transformation" | "love_blocked" | "power_struggle" | "survival" | "rebellion" | "legacy_conflict" | "contact_with_unknown" | "redemption";
export type EmotionalTone = "wonder" | "suspense" | "dread" | "longing" | "triumph" | "melancholy" | "catharsis" | "awe" | "belonging" | "righteous_anger";
export type ProtagonistArc = "coward_to_brave" | "selfish_to_loving" | "naive_to_wise" | "moral_to_corrupted" | "passive_to_decisive" | "skeptic_to_believer" | "broken_to_whole" | "loyal_to_independent" | "vengeful_to_forgiving";
export type OppositionType = "villain" | "rival" | "society" | "nature" | "time" | "inner_flaw" | "fate" | "unknowable_force" | "ally_conflict" | "hidden_elite";
export type RevelationStyle = "hidden_identity" | "betrayal_exposed" | "false_history" | "prophecy_reversed" | "enemy_was_right" | "protagonist_caused_problem" | "world_artificial" | "memory_false" | "death_was_staged" | "love_was_manipulation";
export type EndingMeaning = "justice_restored" | "bittersweet_growth" | "tragic_inevitability" | "sacrifice_saves_many" | "truth_costs_everything" | "cycle_continues" | "hope_survives_darkness" | "love_survives_death" | "victory_corrupts_winner" | "mystery_remains";
export type EnergySource = "steam" | "fossil" | "magic" | "biotech" | "ai_grid" | "relic_technology" | "divine_gift" | "tidal_wind" | "slave_labor" | "memory_harvesting" | "scarce_sunlight";
export type PowerStructure = "monarchy" | "senate" | "merchant_guilds" | "corporations" | "priesthood" | "algorithmic_state" | "family_dynasties" | "warlords" | "tribes" | "democratic_shell" | "military_order" | "secret_council";
export type BeliefSystem = "ancestor_faith" | "scientific_rationalism" | "state_ideology" | "heroic_honor_code" | "pleasure_creed" | "fatalistic_astrology" | "salvation_religion" | "reincarnation_certainty" | "nihilism" | "commercial_rationalism";
export type Scarcity = "water" | "land" | "trust" | "truth" | "children" | "energy" | "memory" | "time" | "safety" | "status" | "forgiveness";
export type SocialFracture = "rich_vs_poor" | "native_vs_outsider" | "human_vs_altered" | "magic_users_vs_non_users" | "city_vs_rural" | "believer_vs_skeptic" | "old_families_vs_new_money" | "free_vs_owned" | "surface_vs_underground" | "core_vs_periphery";
export type HistoricalWound = "lost_war" | "genocide" | "betrayal_revolution" | "plague_coverup" | "stolen_throne" | "broken_treaty" | "vanished_civilization" | "ai_uprising" | "colonization_trauma" | "divine_silence" | "erased_civil_war";
export type EdgeOfUnknown = "cursed_forest" | "dead_zone" | "outer_planets" | "forbidden_archives" | "ocean_trench_minds" | "ghost_provinces" | "time_ruins" | "monster_wastes" | "dream_realm" | "sealed_continent" | "black_sea_trench";

export interface StoryGenome {
  primaryEngine: PrimaryNarrativeEngine;
  secondaryEngines: PrimaryNarrativeEngine[];
  emotionalPromise: { primary: EmotionalTone; secondary?: EmotionalTone };
  protagonistArc: ProtagonistArc;
  oppositionTypes: OppositionType[];
  revelationStyle: RevelationStyle;
  endingMeaning: EndingMeaning;
  contradiction?: string;
}

export interface WorldGenome {
  energySource: { primary: EnergySource; secondary?: EnergySource };
  powerStructure: { visible: PowerStructure; hidden?: PowerStructure };
  beliefSystem: { dominant: BeliefSystem; minority?: BeliefSystem };
  scarcity: { visible: Scarcity; hidden?: Scarcity };
  socialFractures: SocialFracture[];
  historicalWound: HistoricalWound;
  dailyLifeTexture: string[];
  edgeOfUnknown: EdgeOfUnknown;
  contradiction: string;
}

export interface CharacterProfile { name: string; roleInWorld: string; goal: string; strength: string; flaw: string; secret: string }
export interface ProtagonistProfile { name: string; roleInWorld: string; surfaceDesire: string; deepNeed: string; fear: string; wound: string; lieBelieved: string; competence: string; weakness: string; secret: string; temptation: string; arc: ProtagonistArc }
export interface AntagonistProfile { name: string; roleInWorld: string; goal: string; moralArgument: string; method: string; vulnerability: string; relationshipToProtagonist: string }
export interface RelationshipDynamic { characterA: string; characterB: string; bondType: "family" | "romantic" | "mentor" | "rival" | "former_friend" | "political" | "debt" | "betrayal" | "reluctant_alliance"; tension: string; possibleChange: string }
export interface CharacterGenome { protagonist: ProtagonistProfile; antagonist: AntagonistProfile; majorAllies: CharacterProfile[]; majorRivals: CharacterProfile[]; keyRelationships: RelationshipDynamic[] }

export interface ValidationIssue { severity: "error" | "warning"; code: string; message: string; suggestedRepair?: string }
export interface ValidationResult { valid: boolean; issues: ValidationIssue[]; warnings: ValidationIssue[] }
export interface RepairSuggestion { issueCode: string; action: "add" | "replace" | "strengthen" | "remove"; targetGene: string; oldValue?: string; newValue?: string; explanation: string }
export interface GenomeScores { coherence: number; originality: number; emotionalPotential: number; interactivePotential: number; worldStorySynergy: number; characterPressure: number; genreFit: number; overall: number }
export interface ChoiceAxis { name: string; description: string; poles: [string, string] }
export interface WorldStateVariable { key: string; label: string; min: number; max: number; initial: number; description: string }
export interface BranchHook { id: string; sceneSeed: string; choiceText: string; axis: string; effects: Record<string, number>; narrativeConsequence: string }
export interface ActChoicePoint extends BranchHook { act: 1 | 2 | 3 }
export interface EndingCondition { endingId: string; title: string; requiredState: Record<string, string | number>; emotionalMeaning: EndingMeaning; summary: string }
export interface InteractiveDesign { choiceAxes: ChoiceAxis[]; worldState: WorldStateVariable[]; branchHooks: BranchHook[]; actChoicePoints: ActChoicePoint[]; endingConditions: EndingCondition[] }
export interface GeneratedBibles { worldBibleMarkdown: string; storyBibleMarkdown: string; characterBibleMarkdown: string; interactiveDesignMarkdown: string }
export interface Location { id: string; name: string; description: string; storyUse: string }
export interface Faction { id: string; name: string; goal: string; leverage: string; cost: string }
export interface PlotAct { act: number; title: string; purpose: string; beats: string[] }
export interface ExportManifest { files: string[]; generatedAt: string }

export interface GenomeCandidate {
  id: string;
  title: string;
  genreFeel: string;
  logline: string;
  storyGenome: StoryGenome;
  worldGenome: WorldGenome;
  validation: ValidationResult;
  repairs: RepairSuggestion[];
  scores: GenomeScores;
  whyItWorks: string;
  seedConnection: string;
}

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
  locations: Location[];
  factions: Faction[];
  plotOutline: PlotAct[];
  openingSceneSeed: string;
  exportManifest: ExportManifest;
}

export type StoryPacing = "adaptive" | "quick" | "scene" | "immersive";
export type StoryStatus = "active" | "complete";

export interface StoryState {
  values: Record<string, number>;
  currentAct: 1 | 2 | 3;
  summary: string;
  establishedFacts: string[];
  openThreads: string[];
  resolvedThreads: string[];
  endingReached?: string;
}

export interface StoryTurn {
  id: string;
  requestId: string;
  sceneNumber: number;
  sceneTitle: string;
  proseMarkdown: string;
  playerAction?: string;
  interpretedIntent: string;
  attemptResolution: string;
  consequenceSummary: string;
  pacing: StoryPacing;
  createdAt: string;
}

export interface StorySuggestion {
  id: string;
  label: string;
  actionText: string;
  axis: string;
  dramaticPromise: string;
}

export interface PendingStoryGeneration {
  status: "ready" | "generating" | "idle" | "failed";
  requestId?: string;
  action?: string;
  pacing?: StoryPacing;
  startedAt?: string;
  error?: string;
}

export interface StorySession {
  id: string;
  project: NarrativeProject;
  title: string;
  protagonistName: string;
  createdAt: string;
  updatedAt: string;
  revision: number;
  status: StoryStatus;
  pacing: StoryPacing;
  state: StoryState;
  turns: StoryTurn[];
  suggestions: StorySuggestion[];
  generation: PendingStoryGeneration;
}

export interface StorySessionSummary {
  id: string;
  title: string;
  protagonistName: string;
  updatedAt: string;
  status: StoryStatus;
  currentAct: 1 | 2 | 3;
  turnCount: number;
  generationStatus: PendingStoryGeneration["status"];
}

export interface StorySceneResult {
  sceneTitle: string;
  proseMarkdown: string;
  interpretedIntent: string;
  attemptResolution: string;
  consequenceSummary: string;
  updatedStorySummary: string;
  stateChanges: Record<string, number>;
  newFacts: string[];
  resolvedThreads: string[];
  openedThreads: string[];
  currentAct: 1 | 2 | 3;
  storyStatus: StoryStatus;
  endingReached?: string;
}
