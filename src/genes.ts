import type { BeliefSystem, EdgeOfUnknown, EmotionalTone, EndingMeaning, EnergySource, HistoricalWound, OppositionType, PowerStructure, PrimaryNarrativeEngine, ProtagonistArc, RevelationStyle, Scarcity, SocialFracture } from "./types.js";

export const ENGINES: PrimaryNarrativeEngine[] = ["quest", "mystery", "transformation", "love_blocked", "power_struggle", "survival", "rebellion", "legacy_conflict", "contact_with_unknown", "redemption"];
export const EMOTIONS: EmotionalTone[] = ["wonder", "suspense", "dread", "longing", "triumph", "melancholy", "catharsis", "awe", "belonging", "righteous_anger"];
export const ARCS: ProtagonistArc[] = ["coward_to_brave", "selfish_to_loving", "naive_to_wise", "moral_to_corrupted", "passive_to_decisive", "skeptic_to_believer", "broken_to_whole", "loyal_to_independent", "vengeful_to_forgiving"];
export const OPPOSITIONS: OppositionType[] = ["villain", "rival", "society", "nature", "time", "inner_flaw", "fate", "unknowable_force", "ally_conflict", "hidden_elite"];
export const REVELATIONS: RevelationStyle[] = ["hidden_identity", "betrayal_exposed", "false_history", "prophecy_reversed", "enemy_was_right", "protagonist_caused_problem", "world_artificial", "memory_false", "death_was_staged", "love_was_manipulation"];
export const ENDINGS: EndingMeaning[] = ["justice_restored", "bittersweet_growth", "tragic_inevitability", "sacrifice_saves_many", "truth_costs_everything", "cycle_continues", "hope_survives_darkness", "love_survives_death", "victory_corrupts_winner", "mystery_remains"];
export const ENERGY: EnergySource[] = ["steam", "fossil", "magic", "biotech", "ai_grid", "relic_technology", "divine_gift", "tidal_wind", "slave_labor", "memory_harvesting", "scarce_sunlight"];
export const POWERS: PowerStructure[] = ["monarchy", "senate", "merchant_guilds", "corporations", "priesthood", "algorithmic_state", "family_dynasties", "warlords", "tribes", "democratic_shell", "military_order", "secret_council"];
export const BELIEFS: BeliefSystem[] = ["ancestor_faith", "scientific_rationalism", "state_ideology", "heroic_honor_code", "pleasure_creed", "fatalistic_astrology", "salvation_religion", "reincarnation_certainty", "nihilism", "commercial_rationalism"];
export const SCARCITIES: Scarcity[] = ["water", "land", "trust", "truth", "children", "energy", "memory", "time", "safety", "status", "forgiveness"];
export const FRACTURES: SocialFracture[] = ["rich_vs_poor", "native_vs_outsider", "human_vs_altered", "magic_users_vs_non_users", "city_vs_rural", "believer_vs_skeptic", "old_families_vs_new_money", "free_vs_owned", "surface_vs_underground", "core_vs_periphery"];
export const WOUNDS: HistoricalWound[] = ["lost_war", "genocide", "betrayal_revolution", "plague_coverup", "stolen_throne", "broken_treaty", "vanished_civilization", "ai_uprising", "colonization_trauma", "divine_silence", "erased_civil_war"];
export const EDGES: EdgeOfUnknown[] = ["cursed_forest", "dead_zone", "outer_planets", "forbidden_archives", "ocean_trench_minds", "ghost_provinces", "time_ruins", "monster_wastes", "dream_realm", "sealed_continent", "black_sea_trench"];
export const TEXTURES = ["ration_lines", "ritual_festivals", "rooftop_gardens", "surveillance_drones", "communal_meals", "dangerous_roads", "floating_villages", "mandatory_service", "seasonal_migrations", "harbor_markets", "salt_tax_inspections"];

export const SECONDARY: Record<PrimaryNarrativeEngine, PrimaryNarrativeEngine[]> = {
  quest: ["transformation", "survival", "mystery"], mystery: ["rebellion", "legacy_conflict", "contact_with_unknown"], transformation: ["love_blocked", "power_struggle", "redemption"], love_blocked: ["legacy_conflict", "rebellion", "survival"], power_struggle: ["legacy_conflict", "rebellion", "contact_with_unknown"], survival: ["contact_with_unknown", "transformation", "love_blocked"], rebellion: ["mystery", "power_struggle", "transformation"], legacy_conflict: ["mystery", "power_struggle", "love_blocked"], contact_with_unknown: ["mystery", "survival", "transformation"], redemption: ["quest", "transformation", "love_blocked"]
};

export const SCORE_WEIGHTS = { coherence: .25, originality: .15, emotionalPotential: .15, interactivePotential: .15, worldStorySynergy: .15, characterPressure: .10, genreFit: .05 } as const;
