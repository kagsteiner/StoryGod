import { ARCS, BELIEFS, EDGES, EMOTIONS, ENDINGS, ENERGY, ENGINES, FRACTURES, OPPOSITIONS, POWERS, REVELATIONS, SCARCITIES, SCORE_WEIGHTS, SECONDARY, TEXTURES, WOUNDS } from "./genes.js";
import type { CharacterGenome, Faction, GeneratedBibles, GenomeCandidate, GenomeScores, InteractiveDesign, Location, NarrativeProject, PlotAct, RepairSuggestion, StoryGenome, TasteProfile, ValidationIssue, ValidationResult, WorldGenome } from "./types.js";

const label = (value: string): string => value.replaceAll("_", " ");
const cap = (value: string): string => value.replace(/\b\w/g, c => c.toUpperCase());
const clamp = (n: number): number => Math.max(0, Math.min(10, Math.round(n * 10) / 10));
const unique = <T>(values: T[]): T[] => [...new Set(values)];

function hash(value: string): number {
  let h = 2166136261;
  for (const char of value) { h ^= char.charCodeAt(0); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

function random(seed: number): () => number {
  return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}

function pick<T>(items: readonly T[], rng: () => number, offset = 0): T {
  const item = items[(Math.floor(rng() * items.length) + offset) % items.length];
  if (item === undefined) throw new Error("Cannot pick from an empty list");
  return item;
}

function sample<T>(items: readonly T[], count: number, rng: () => number): T[] {
  const pool = [...items]; const output: T[] = [];
  while (pool.length && output.length < count) output.push(pool.splice(Math.floor(rng() * pool.length), 1)[0]!);
  return output;
}

const hiddenTruthWounds = new Set(["plague_coverup", "erased_civil_war"]);
const oppressivePowers = new Set(["monarchy", "corporations", "priesthood", "algorithmic_state", "family_dynasties", "warlords", "military_order", "secret_council"]);

export function validateGenome(story: StoryGenome, world: WorldGenome): ValidationResult {
  const issues: ValidationIssue[] = []; const warnings: ValidationIssue[] = [];
  const error = (code: string, message: string, suggestedRepair: string) => issues.push({ severity: "error", code, message, suggestedRepair });
  const warn = (code: string, message: string, suggestedRepair: string) => warnings.push({ severity: "warning", code, message, suggestedRepair });
  const hasSecret = Boolean(story.revelationStyle) || world.scarcity.hidden === "truth" || hiddenTruthWounds.has(world.historicalWound);
  const oppressive = oppressivePowers.has(world.powerStructure.visible) || Boolean(world.powerStructure.hidden) || world.socialFractures.some(f => f === "free_vs_owned" || f === "rich_vs_poor");
  if (story.secondaryEngines.length > 2) error("TOO_MANY_SECONDARY_ENGINES", "A story can have at most two secondary engines.", "Remove the weakest secondary engine.");
  if (story.secondaryEngines.includes(story.primaryEngine)) error("DUPLICATE_PRIMARY_ENGINE", "The primary engine cannot also be secondary.", "Choose a complementary secondary engine.");
  if (story.oppositionTypes.length < 1 || story.oppositionTypes.length > 3) error("INVALID_OPPOSITION_COUNT", "Opposition requires one to three forces.", "Use one primary and no more than two secondary opposition types.");
  if (world.socialFractures.length < 1 || world.socialFractures.length > 3) error("INVALID_FRACTURE_COUNT", "A world needs one to three social fractures.", "Choose the fractures that create the strongest incentives.");
  if (world.dailyLifeTexture.length < 3 || world.dailyLifeTexture.length > 5) error("INVALID_TEXTURE_COUNT", "Daily life needs three to five concrete textures.", "Add or remove daily-life details.");
  if (story.primaryEngine === "mystery" && !hasSecret) error("MYSTERY_WITHOUT_SECRET", "Mystery requires hidden truth, deception, or missing knowledge.", "Use false history, memory falsehood, or a covered-up wound.");
  if (story.primaryEngine === "rebellion" && !oppressive) error("REBELLION_WITHOUT_OPPRESSION", "Rebellion requires hierarchy, coercion, or illegitimate power.", "Add an oppressive visible power or hidden council.");
  if (story.primaryEngine === "love_blocked" && !(world.socialFractures.length || story.oppositionTypes.includes("society") || story.oppositionTypes.includes("time"))) error("LOVE_WITHOUT_BARRIER", "Love Blocked needs a credible social, personal, or temporal barrier.", "Add a social fracture, duty conflict, or time pressure.");
  if (story.primaryEngine === "survival" && !(["water", "land", "energy", "time", "safety"].includes(world.scarcity.visible) || story.oppositionTypes.some(o => o === "nature" || o === "time" || o === "unknowable_force"))) error("SURVIVAL_WITHOUT_THREAT", "Survival requires an ongoing material threat.", "Use a concrete scarcity or escalating environmental force.");
  if (story.primaryEngine === "quest" && !story.contradiction?.trim()) error("QUEST_WITHOUT_GOAL", "Quest requires a concrete goal and reason it matters.", "State the goal in the story contradiction.");
  if (story.protagonistArc === "skeptic_to_believer" && !(["contact_with_unknown"].includes(story.primaryEngine) || story.secondaryEngines.includes("contact_with_unknown") || ["prophecy_reversed", "world_artificial"].includes(story.revelationStyle) || ["divine_silence", "vanished_civilization"].includes(world.historicalWound) || ["forbidden_archives", "dream_realm", "ocean_trench_minds"].includes(world.edgeOfUnknown))) warn("SKEPTIC_ARC_UNDERPOWERED", "Skeptic to believer needs worldview-breaking evidence.", "Strengthen the unknown, impossible evidence, or forbidden knowledge.");
  if (world.scarcity.hidden === world.scarcity.visible) warn("DUPLICATE_SCARCITY", "Visible and hidden scarcity should create different kinds of pressure.", "Choose a hidden emotional or informational scarcity.");
  if (!world.contradiction.trim()) error("MISSING_WORLD_CONTRADICTION", "The world needs a recurring moral paradox.", "State how the world's promise conceals its cost.");
  return { valid: issues.length === 0, issues, warnings };
}

export function repairGenome(story: StoryGenome, world: WorldGenome, result = validateGenome(story, world)): RepairSuggestion[] {
  return [...result.issues, ...result.warnings].map(issue => {
    const base = { issueCode: issue.code, explanation: issue.suggestedRepair ?? issue.message };
    switch (issue.code) {
      case "REBELLION_WITHOUT_OPPRESSION": return { ...base, action: "add", targetGene: "worldGenome.powerStructure.hidden", newValue: "secret_council" };
      case "MYSTERY_WITHOUT_SECRET": return { ...base, action: "replace", targetGene: "storyGenome.revelationStyle", oldValue: story.revelationStyle, newValue: "false_history" };
      case "SURVIVAL_WITHOUT_THREAT": return { ...base, action: "replace", targetGene: "worldGenome.scarcity.visible", oldValue: world.scarcity.visible, newValue: "safety" };
      case "SKEPTIC_ARC_UNDERPOWERED": return { ...base, action: "strengthen", targetGene: "worldGenome.edgeOfUnknown", oldValue: world.edgeOfUnknown, newValue: "forbidden_archives" };
      default: return { ...base, action: "strengthen", targetGene: "genome", newValue: "coherent supporting pressure" };
    }
  });
}

export function applyRepairs(story: StoryGenome, world: WorldGenome): { storyGenome: StoryGenome; worldGenome: WorldGenome; repairs: RepairSuggestion[]; validation: ValidationResult } {
  const repairedStory = structuredClone(story); const repairedWorld = structuredClone(world); const initial = validateGenome(repairedStory, repairedWorld); const repairs = repairGenome(repairedStory, repairedWorld, initial);
  for (const issue of [...initial.issues, ...initial.warnings]) {
    switch (issue.code) {
      case "REBELLION_WITHOUT_OPPRESSION": repairedWorld.powerStructure.hidden = "secret_council"; break;
      case "MYSTERY_WITHOUT_SECRET": repairedStory.revelationStyle = "false_history"; break;
      case "SURVIVAL_WITHOUT_THREAT": repairedWorld.scarcity.visible = "safety"; break;
      case "SKEPTIC_ARC_UNDERPOWERED": repairedWorld.edgeOfUnknown = "forbidden_archives"; break;
      case "TOO_MANY_SECONDARY_ENGINES": repairedStory.secondaryEngines = repairedStory.secondaryEngines.slice(0, 2); break;
      case "DUPLICATE_PRIMARY_ENGINE": repairedStory.secondaryEngines = repairedStory.secondaryEngines.filter(engine => engine !== repairedStory.primaryEngine).slice(0, 2); break;
      case "INVALID_OPPOSITION_COUNT": repairedStory.oppositionTypes = repairedStory.oppositionTypes.length ? repairedStory.oppositionTypes.slice(0, 3) : ["inner_flaw"]; break;
      case "INVALID_FRACTURE_COUNT": repairedWorld.socialFractures = repairedWorld.socialFractures.length ? repairedWorld.socialFractures.slice(0, 3) : ["rich_vs_poor"]; break;
      case "INVALID_TEXTURE_COUNT": repairedWorld.dailyLifeTexture = unique([...repairedWorld.dailyLifeTexture, "communal_meals", "ration_lines", "harbor_markets"]).slice(0, 5); break;
      case "QUEST_WITHOUT_GOAL": repairedStory.contradiction = "The protagonist must reach the forbidden archive before the ruling power destroys it."; break;
      case "MISSING_WORLD_CONTRADICTION": repairedWorld.contradiction = `The promise of ${label(repairedWorld.powerStructure.visible)} depends on denying ${label(repairedWorld.scarcity.visible)} to those it claims to protect.`; break;
      case "DUPLICATE_SCARCITY": repairedWorld.scarcity.hidden = repairedWorld.scarcity.visible === "truth" ? "trust" : "truth"; break;
    }
  }
  return { storyGenome: repairedStory, worldGenome: repairedWorld, repairs, validation: validateGenome(repairedStory, repairedWorld) };
}

function themeSignals(taste: TasteProfile, story: StoryGenome, world: WorldGenome): number {
  const text = [...taste.genres, ...taste.tone, taste.userSeed ?? ""].join(" ").toLowerCase();
  let fit = 5.5;
  if (text.includes("mystery") && story.primaryEngine === "mystery") fit += 2;
  if ((text.includes("fantasy") || text.includes("magic")) && ["magic", "divine_gift", "relic_technology"].includes(world.energySource.primary)) fit += 1.5;
  if ((text.includes("politic") || text.includes("rebell")) && ["power_struggle", "rebellion"].some(e => e === story.primaryEngine || story.secondaryEngines.includes(e as StoryGenome["primaryEngine"]))) fit += 1.5;
  if (taste.romance >= 7 && story.secondaryEngines.includes("love_blocked")) fit += 1;
  if (taste.action >= 7 && ["quest", "survival", "rebellion"].includes(story.primaryEngine)) fit += 1;
  return clamp(fit);
}

export function scoreGenome(taste: TasteProfile, story: StoryGenome, world: WorldGenome, validation = validateGenome(story, world)): GenomeScores {
  const coherent = 9.2 - validation.issues.length * 2.5 - validation.warnings.length * .6;
  const synergyPairs = [story.primaryEngine === "mystery" && ["false_history", "memory_false", "betrayal_exposed"].includes(story.revelationStyle), story.primaryEngine === "survival" && ["water", "energy", "safety", "time"].includes(world.scarcity.visible), story.primaryEngine === "rebellion" && oppressivePowers.has(world.powerStructure.visible), story.primaryEngine === "love_blocked" && world.socialFractures.includes("old_families_vs_new_money"), story.primaryEngine === "power_struggle" && Boolean(world.powerStructure.hidden)].filter(Boolean).length;
  const rarity = new Set([story.primaryEngine, world.scarcity.visible, world.historicalWound, world.energySource.primary, story.revelationStyle]).size;
  const scores = {
    coherence: clamp(coherent),
    originality: clamp(5 + rarity * .55 + (world.scarcity.hidden ? .7 : 0)),
    emotionalPotential: clamp(5.5 + taste.darkness * .18 + taste.romance * .1 + (story.emotionalPromise.secondary ? 1.1 : 0) + (["bittersweet_growth", "truth_costs_everything", "sacrifice_saves_many"].includes(story.endingMeaning) ? 1 : 0)),
    interactivePotential: clamp(6 + story.oppositionTypes.length * .55 + world.socialFractures.length * .45 + (world.powerStructure.hidden ? .5 : 0)),
    worldStorySynergy: clamp(6.2 + synergyPairs * 1.5 + (SECONDARY[story.primaryEngine].includes(story.secondaryEngines[0]!) ? .8 : 0)),
    characterPressure: clamp(5.5 + story.oppositionTypes.length * .7 + world.socialFractures.length * .4 + (story.contradiction ? .7 : 0)),
    genreFit: themeSignals(taste, story, world)
  };
  const overall = Object.entries(SCORE_WEIGHTS).reduce((sum, [key, weight]) => sum + scores[key as keyof typeof scores] * weight, 0);
  return { ...scores, overall: clamp(overall) };
}

const titleWords = ["Ash", "Glass", "Salt", "Ember", "Hollow", "Tide", "Ivory", "Last", "Silent", "Broken", "Star", "Verdant"];
const titleNouns = ["Republic", "Archive", "Covenant", "Throne", "City", "Inheritance", "Frontier", "Choir", "Kingdom", "Tribunal", "Garden", "Sea"];

function contradiction(power: string, scarcity: string, wound: string): string {
  return `A society celebrated for ${label(power)} depends on hiding the cost of its missing ${label(scarcity)}, a bargain born from the ${label(wound)}.`;
}

export function generateCandidates(taste: TasteProfile, count = 5): GenomeCandidate[] {
  const seedText = JSON.stringify(taste); const rng = random(hash(seedText));
  const tasteText = seedText.toLowerCase();
  const preferred = tasteText.includes("mystery") ? "mystery" : tasteText.includes("romance") ? "love_blocked" : tasteText.includes("surviv") ? "survival" : tasteText.includes("rebell") ? "rebellion" : taste.action >= 7 ? "quest" : undefined;
  const candidates: GenomeCandidate[] = [];
  for (let i = 0; i < Math.max(1, Math.min(10, count)); i++) {
    const primary = i === 0 && preferred ? preferred : pick(ENGINES, rng, i);
    const secondary = sample(SECONDARY[primary], i % 3 === 0 ? 2 : 1, rng);
    const visibleScarcity = (i === 0 && /water|thirst|maritime/.test(tasteText)) ? "water" : pick(SCARCITIES, rng, i);
    const visiblePower = pick(POWERS, rng, i);
    const wound = (i === 0 && tasteText.includes("history")) ? "erased_civil_war" : pick(WOUNDS, rng, i);
    const revelation = primary === "mystery" ? pick(["false_history", "betrayal_exposed", "memory_false"] as const, rng) : pick(REVELATIONS, rng, i);
    const story: StoryGenome = {
      primaryEngine: primary, secondaryEngines: secondary,
      emotionalPromise: { primary: pick(EMOTIONS, rng, Math.round(taste.darkness / 2)), secondary: pick(EMOTIONS, rng, i + 2) },
      protagonistArc: pick(ARCS, rng, i), oppositionTypes: unique(sample(OPPOSITIONS, 2 + i % 2, rng)), revelationStyle: revelation,
      endingMeaning: pick(ENDINGS, rng, i), contradiction: `To win, the protagonist must risk becoming an agent of the very ${label(visiblePower)} they oppose.`
    };
    const world: WorldGenome = {
      energySource: { primary: pick(ENERGY, rng, i), secondary: pick(ENERGY, rng, i + 4) },
      powerStructure: { visible: visiblePower, hidden: pick(POWERS, rng, i + 5) },
      beliefSystem: { dominant: pick(BELIEFS, rng, i), minority: pick(BELIEFS, rng, i + 3) },
      scarcity: { visible: visibleScarcity, hidden: visibleScarcity === "truth" ? "trust" : "truth" },
      socialFractures: sample(FRACTURES, 2 + i % 2, rng), historicalWound: wound,
      dailyLifeTexture: sample(TEXTURES, 4, rng), edgeOfUnknown: pick(EDGES, rng, i), contradiction: contradiction(visiblePower, visibleScarcity, wound)
    };
    const repaired = applyRepairs(story, world); const finalStory = repaired.storyGenome; const finalWorld = repaired.worldGenome; const validation = repaired.validation; const scores = scoreGenome(taste, finalStory, finalWorld, validation);
    const title = `The ${pick(titleWords, rng, i)} ${pick(titleNouns, rng, i)}`;
    candidates.push({ id: `genome-${hash(seedText + i).toString(36)}`, title, genreFeel: `${taste.genres.join(" · ") || "speculative fiction"} with ${label(finalStory.emotionalPromise.primary)}`, logline: `In a world governed by ${label(finalWorld.powerStructure.visible)} and starved of ${label(finalWorld.scarcity.visible)}, one reluctant figure must uncover ${label(finalStory.revelationStyle)} before the ${label(finalWorld.historicalWound)} repeats.`, storyGenome: finalStory, worldGenome: finalWorld, validation, repairs: repaired.repairs, scores, whyItWorks: `The ${label(primary)} engine is pressured by ${label(finalWorld.scarcity.visible)}, while ${label(finalStory.revelationStyle)} makes the ${label(finalWorld.historicalWound)} personally dangerous.`, seedConnection: taste.userSeed ? `This interpretation is derived from the seed: ${taste.userSeed}` : "This interpretation derives from the taste profile's central tensions." });
  }
  return candidates.sort((a, b) => b.scores.overall - a.scores.overall);
}

function makeCharacters(candidate: GenomeCandidate): CharacterGenome {
  const scarce = label(candidate.worldGenome.scarcity.visible); const power = label(candidate.worldGenome.powerStructure.visible); const arc = candidate.storyGenome.protagonistArc;
  const protagonist = { name: "Mara Vey", roleInWorld: `A licensed surveyor serving the ${power}`, surfaceDesire: `Secure enough ${scarce} to protect her district`, deepNeed: "Accept that safety without agency is another form of captivity", fear: "Becoming responsible for another public disaster", wound: `Her family was condemned for speaking about the ${label(candidate.worldGenome.historicalWound)}`, lieBelieved: "Truth only harms the people who cannot afford it", competence: "Reading systems, maps, and people under pressure", weakness: "She withholds trust until it becomes betrayal", secret: `She possesses evidence of ${label(candidate.storyGenome.revelationStyle)}`, temptation: `Trade the evidence to the ${power} for private safety`, arc };
  const antagonist = { name: "Chancellor Orin Vale", roleInWorld: `Public guardian of the ${power}`, goal: `Preserve order by monopolizing ${scarce}`, moralArgument: "A managed injustice is kinder than an honest collapse", method: "Rationing, patronage, and selective revelation", vulnerability: "He genuinely loves the city and cannot imagine it surviving him", relationshipToProtagonist: "Former sponsor and architect of her public career" };
  const allies = [{ name: "Ilya Sorn", roleInWorld: "Keeper of an illicit neighborhood archive", goal: "Return stolen history to ordinary people", strength: "Unshakable memory", flaw: "Confuses certainty with courage", secret: "Once informed for the state" }, { name: "Tess Ardin", roleInWorld: "Courier between the center and periphery", goal: "Open a route no faction controls", strength: "Improvisation", flaw: "Treats loyalty as temporary", secret: "Carries a rival claim to power" }];
  const rivals = [{ name: "Captain Ren Kade", roleInWorld: "Investigator for the ruling order", goal: "Stop unrest before it becomes famine", strength: "Patient strategy", flaw: "Believes institutions are people", secret: "Quietly falsifies reports to save suspects" }];
  return { protagonist, antagonist, majorAllies: allies, majorRivals: rivals, keyRelationships: [{ characterA: protagonist.name, characterB: antagonist.name, bondType: "mentor", tension: "Affection survives beneath irreconcilable ideas of safety", possibleChange: "Mentorship becomes public opposition or tragic alliance" }, { characterA: protagonist.name, characterB: allies[0]!.name, bondType: "former_friend", tension: "Both remember the same betrayal differently", possibleChange: "They may rebuild trust through costly truth" }] };
}

function makeFactions(candidate: GenomeCandidate): Faction[] {
  const p = cap(label(candidate.worldGenome.powerStructure.visible)); const s = label(candidate.worldGenome.scarcity.visible);
  return [{ id: "faction-civic", name: `The ${p} Compact`, goal: "Preserve continuity and public calm", leverage: `Controls legal access to ${s}`, cost: "Requires silence about the founding wound" }, { id: "faction-lantern", name: "The Lantern Archive", goal: "Restore forbidden public memory", leverage: "Witnesses, ledgers, and hidden routes", cost: "Every disclosure increases instability" }, { id: "faction-margin", name: "The Margin Assembly", goal: "Shift power from the center to neglected districts", leverage: "Labor, local knowledge, and mutual aid", cost: "Its coalition fractures under pressure" }];
}

function makeLocations(candidate: GenomeCandidate): Location[] {
  const edge = cap(label(candidate.worldGenome.edgeOfUnknown)); const scarcity = label(candidate.worldGenome.scarcity.visible);
  return [{ id: "loc-capital", name: "The Porcelain Forum", description: `The immaculate civic heart where ${scarcity} is displayed as abundance.`, storyUse: "Public confrontation and political bargains" }, { id: "loc-market", name: "Nine-Bell Market", description: "A layered market of ration chits, rumors, and ritual food.", storyUse: "Ordinary consequences and faction contact" }, { id: "loc-archive", name: "The Drowned Index", description: "An archive sealed below the old flood line.", storyUse: "The central revelation and a point of no return" }, { id: "loc-edge", name: edge, description: "The mapped world frays here and official instruments disagree.", storyUse: "Impossible evidence and escalating danger" }, { id: "loc-home", name: "Copper Row", description: "The protagonist's district, held together by shared meals and unpaid debts.", storyUse: "Personal stakes and the cost of every choice" }];
}

function makeInteractive(candidate: GenomeCandidate): InteractiveDesign {
  const ending = candidate.storyGenome.endingMeaning;
  const axes = [{ name: "Truth vs Safety", description: "Expose destabilizing truth or preserve fragile order?", poles: ["truth", "safety"] as [string, string] }, { name: "Loyalty vs Independence", description: "Honor relationships or act from individual conviction?", poles: ["loyalty", "independence"] as [string, string] }, { name: "Mercy vs Justice", description: "Protect the redeemable or make wrongdoing answerable?", poles: ["mercy", "justice"] as [string, string] }];
  const worldState = [{ key: "publicUnrest", label: "Public Unrest", min: 0, max: 100, initial: 15, description: "How close the public is to open revolt." }, { key: "eliteSuspicion", label: "Elite Suspicion", min: 0, max: 100, initial: 5, description: "How closely power watches the protagonist." }, { key: "truthDiscovered", label: "Truth Discovered", min: 0, max: 100, initial: 0, description: "Progress toward the central revelation." }, { key: "communityTrust", label: "Community Trust", min: 0, max: 100, initial: 45, description: "The protagonist's legitimacy among ordinary people." }];
  const data = [[1, "Steal a ration ledger before it is burned.", "Truth vs Safety", { truthDiscovered: 15, eliteSuspicion: 10 }], [1, "Protect a frightened official who knows too much.", "Mercy vs Justice", { communityTrust: -5, truthDiscovered: 10 }], [2, "Publish a partial truth to rally the margins.", "Truth vs Safety", { publicUnrest: 20, eliteSuspicion: 25, communityTrust: 10 }], [2, "Break with the mentor who offers private safety.", "Loyalty vs Independence", { eliteSuspicion: 15, communityTrust: 15 }], [3, "Open the archive while the city is at its most fragile.", "Truth vs Safety", { truthDiscovered: 45, publicUnrest: 30 }]] as const;
  const actChoicePoints = data.map((d, i) => ({ id: `choice-${i + 1}`, act: d[0], sceneSeed: d[1], choiceText: d[1], axis: d[2], effects: d[3], narrativeConsequence: "The choice changes both public conditions and the protagonist's moral authority." }));
  return { choiceAxes: axes, worldState, branchHooks: actChoicePoints, actChoicePoints, endingConditions: [{ endingId: ending, title: "The Cost of Knowing", requiredState: { truthDiscovered: 80, communityTrust: 55 }, emotionalMeaning: ending, summary: `The final order reflects ${label(ending)} and the accumulated balance between truth and safety.` }, { endingId: "guarded-hope", title: "A Door Left Open", requiredState: { publicUnrest: 50, communityTrust: 70 }, emotionalMeaning: "hope_survives_darkness", summary: "The old system survives, but ordinary people gain the means to challenge it." }] };
}

function makePlot(candidate: GenomeCandidate): PlotAct[] {
  const revelation = label(candidate.storyGenome.revelationStyle); const wound = label(candidate.worldGenome.historicalWound);
  return [{ act: 1, title: "The Hairline Fracture", purpose: "Make the world pressure personal and force investigation.", beats: ["A routine civic duty reveals an impossible discrepancy.", "The protagonist is ordered to erase it.", "A witness ties the discrepancy to the historical wound.", "The protagonist chooses investigation over safety."] }, { act: 2, title: "The Price of the Map", purpose: "Escalate opposition while changing the meaning of the past.", beats: ["Allies reveal competing versions of the truth.", "A public choice raises both trust and suspicion.", `Evidence of ${revelation} implicates the protagonist's own side.`, "The antagonist offers a morally credible compromise."] }, { act: 3, title: "What the City Can Bear", purpose: "Resolve plot and arc through a thematic choice.", beats: [`The buried reality of the ${wound} becomes undeniable.`, "Every faction demands control of the revelation.", "The protagonist chooses what to reveal and whom to protect.", `The ending expresses ${label(candidate.storyGenome.endingMeaning)}.`] }];
}

function markdown(candidate: GenomeCandidate, characters: CharacterGenome, factions: Faction[], locations: Location[], plot: PlotAct[], interactive: InteractiveDesign): GeneratedBibles {
  const w = candidate.worldGenome; const s = candidate.storyGenome; const factionMd = factions.map(f => `### ${f.name}\n${f.goal}. **Leverage:** ${f.leverage}. **Cost:** ${f.cost}.`).join("\n\n"); const locationMd = locations.map(l => `### ${l.name}\n${l.description} *Story use: ${l.storyUse}.*`).join("\n\n");
  const world = `# World Bible\n\n## World Summary\n\n${candidate.logline} Daily life is shaped by ${w.dailyLifeTexture.map(label).join(", ")}.\n\n## Core Contradiction\n\n${w.contradiction}\n\n## Geography\n\nAuthority radiates from a polished center toward neglected peripheral districts and the dangerous ${label(w.edgeOfUnknown)}.\n\n## History\n\nThe official calendar begins after the ${label(w.historicalWound)}, though surviving records contradict the civic account.\n\n## Historical Wound\n\nThe ${label(w.historicalWound)} still decides who owns property, whose testimony counts, and which losses may be named.\n\n## Power Structure\n\nVisible power belongs to the ${label(w.powerStructure.visible)}.\n\n## Hidden Power\n\nBehind it, the ${label(w.powerStructure.hidden ?? "private interests")} controls access and consequence.\n\n## Economy and Energy\n\n${cap(label(w.energySource.primary))} powers transport and industry; ${label(w.energySource.secondary ?? w.energySource.primary)} remains expensive and politically guarded.\n\n## Belief Systems\n\n${cap(label(w.beliefSystem.dominant))} governs public ritual, while ${label(w.beliefSystem.minority ?? "private doubt")} sustains dissent.\n\n## Scarcity\n\n${cap(label(w.scarcity.visible))} is visibly rationed. The deeper scarcity is ${label(w.scarcity.hidden ?? "trust")}.\n\n## Social Fractures\n\n${w.socialFractures.map(x => `- ${cap(label(x))}`).join("\n")}\n\n## Daily Life\n\n${w.dailyLifeTexture.map(x => `- ${cap(label(x))}`).join("\n")}\n\n## Factions\n\n${factionMd}\n\n## Locations\n\n${locationMd}\n\n## Edge of the Unknown\n\nThe ${label(w.edgeOfUnknown)} holds evidence the ruling order cannot explain.\n\n## Rules of Magic / Technology\n\nPower always needs a source, an operator, and a cost; no miracle escapes political ownership.\n\n## Sensory Identity\n\nPale civic stone, oxidized copper, damp paper, low mechanical song, and the taste of ration salt.\n\n## Story Opportunities\n\nEvery public resource, private ritual, and forbidden route can force a choice between truth and safety.`;
  const story = `# Story Bible\n\n## Title\n\n${candidate.title}\n\n## Logline\n\n${candidate.logline}\n\n## Premise\n\n${candidate.whyItWorks}\n\n## Primary Narrative Engine\n\n${cap(label(s.primaryEngine))}\n\n## Secondary Engine\n\n${s.secondaryEngines.map(x => cap(label(x))).join(", ")}\n\n## Emotional Promise\n\n${cap(label(s.emotionalPromise.primary))}${s.emotionalPromise.secondary ? ` with ${label(s.emotionalPromise.secondary)}` : ""}.\n\n## Central Conflict\n\n${s.contradiction}\n\n## Central Question\n\nCan a society survive the truth that made it possible?\n\n## Thematic Argument\n\nSafety without consent becomes captivity; truth without care becomes another weapon.\n\n## Protagonist Arc\n\n${cap(label(s.protagonistArc))}\n\n## Opposition\n\n${s.oppositionTypes.map(x => cap(label(x))).join(", ")}\n\n## Major Revelation\n\n${cap(label(s.revelationStyle))}; it recasts the founding wound and the protagonist's loyalty.\n\n## Escalation Ladder\n\nPrivate anomaly → institutional warning → public scarcity → faction fracture → irreversible disclosure.\n\n## Act Structure\n\n${plot.map(a => `### Act ${a.act}: ${a.title}\n${a.beats.map(b => `- ${b}`).join("\n")}`).join("\n\n")}\n\n## Ending Variants\n\nThe ending may express ${label(s.endingMeaning)} or guarded hope according to accumulated state.\n\n## Reader Promise\n\nEvery revelation changes both the political map and the protagonist's closest relationships.`;
  const allies = characters.majorAllies.map(c => `### ${c.name}\n${c.roleInWorld}. Wants to ${c.goal.toLowerCase()}. Strength: ${c.strength}. Flaw: ${c.flaw}. Secret: ${c.secret}.`).join("\n\n");
  const character = `# Character Bible\n\n## Protagonist\n\n### ${characters.protagonist.name}\n${characters.protagonist.roleInWorld}. **Desire:** ${characters.protagonist.surfaceDesire}. **Need:** ${characters.protagonist.deepNeed}. **Fear:** ${characters.protagonist.fear}. **Lie:** ${characters.protagonist.lieBelieved}. **Temptation:** ${characters.protagonist.temptation}.\n\n## Antagonist\n\n### ${characters.antagonist.name}\n${characters.antagonist.roleInWorld}. **Goal:** ${characters.antagonist.goal}. **Argument:** ${characters.antagonist.moralArgument}. **Method:** ${characters.antagonist.method}. **Vulnerability:** ${characters.antagonist.vulnerability}.\n\n## Major Allies\n\n${allies}\n\n## Major Rivals\n\n${characters.majorRivals.map(c => `### ${c.name}\n${c.roleInWorld}. ${c.goal}.`).join("\n\n")}\n\n## Factions as Character Forces\n\nEach faction offers a genuine good at a moral cost.\n\n## Relationship Web\n\n${characters.keyRelationships.map(r => `- **${r.characterA} / ${r.characterB}:** ${r.tension}. ${r.possibleChange}.`).join("\n")}\n\n## Secrets\n\nSecrets redistribute power when revealed; none exists only for surprise.\n\n## Temptations\n\nThe protagonist can purchase private safety by preserving public lies.\n\n## Transformation Path\n\nThe arc moves from ${label(s.protagonistArc.split("_to_")[0] ?? "fear")} to ${label(s.protagonistArc.split("_to_")[1] ?? "agency")} through escalating choices.\n\n## Possible Betrayals\n\nAn ally can release evidence early; the mentor can save the protagonist by condemning the district.\n\n## Possible Sacrifices\n\nReputation, intimacy, civic stability, or control of the truth.`;
  const design = `# Interactive Design\n\n## Choice Axes\n\n${interactive.choiceAxes.map(a => `### ${a.name}\n${a.description} **Poles:** ${a.poles.join(" / ")}.`).join("\n\n")}\n\n## World State\n\n${interactive.worldState.map(v => `- **${v.label}** (${v.initial}/${v.max}): ${v.description}`).join("\n")}\n\n## Five Major Choice Points\n\n${interactive.actChoicePoints.map((h, i) => `${i + 1}. **Act ${h.act} — ${h.axis}:** ${h.choiceText} Consequence: ${h.narrativeConsequence}`).join("\n")}\n\n## Ending Conditions\n\n${interactive.endingConditions.map(e => `### ${e.title}\n${e.summary} Required state: ${JSON.stringify(e.requiredState)}.`).join("\n\n")}`;
  return { worldBibleMarkdown: world, storyBibleMarkdown: story, characterBibleMarkdown: character, interactiveDesignMarkdown: design };
}

export function createProject(taste: TasteProfile, candidate: GenomeCandidate): NarrativeProject {
  const characterGenome = makeCharacters(candidate); const factions = makeFactions(candidate); const locations = makeLocations(candidate); const plotOutline = makePlot(candidate); const interactiveDesign = makeInteractive(candidate); const bibles = markdown(candidate, characterGenome, factions, locations, plotOutline, interactiveDesign);
  const openingSceneSeed = `# Opening Scene Seed\n\nAt dawn in ${locations[0]!.name}, ${characterGenome.protagonist.name} watches a ceremonial fountain run while her district's ration clocks remain dark. A routine measurement shows the water is flowing backward through a pipe erased from every civic map. Before she can copy the reading, ${characterGenome.antagonist.name} arrives and asks her to certify that nothing is wrong.\n\n**Immediate choice:** preserve her access by signing, or pocket the instrument's memory wafer and become a suspect.`;
  return { projectId: `project-${hash(candidate.id + Date.now()).toString(36)}`, title: candidate.title, tasteProfile: taste, storyGenome: candidate.storyGenome, worldGenome: candidate.worldGenome, characterGenome, scores: candidate.scores, bibles, interactiveDesign, locations, factions, plotOutline, openingSceneSeed, exportManifest: { files: ["project.json", "world_bible.md", "story_bible.md", "character_bible.md", "interactive_design.md", "locations.json", "factions.json", "characters.json", "plot_outline.json", "opening_scene_seed.md"], generatedAt: new Date().toISOString() } };
}

export function projectFiles(project: NarrativeProject): Record<string, string> {
  const json = (value: unknown) => JSON.stringify(value, null, 2);
  return { "project.json": json(project), "world_bible.md": project.bibles.worldBibleMarkdown, "story_bible.md": project.bibles.storyBibleMarkdown, "character_bible.md": project.bibles.characterBibleMarkdown, "interactive_design.md": project.bibles.interactiveDesignMarkdown, "locations.json": json(project.locations), "factions.json": json(project.factions), "characters.json": json(project.characterGenome), "plot_outline.json": json(project.plotOutline), "opening_scene_seed.md": project.openingSceneSeed };
}

export function normalizeTaste(input: unknown): TasteProfile {
  if (!input || typeof input !== "object") throw new Error("Taste profile must be an object.");
  const p = input as Record<string, unknown>; const number = (key: string, fallback: number) => Math.max(0, Math.min(10, typeof p[key] === "number" ? p[key] as number : fallback)); const strings = (key: string) => Array.isArray(p[key]) ? (p[key] as unknown[]).filter((x): x is string => typeof x === "string").map(x => x.trim()).filter(Boolean).slice(0, 10) : [];
  const profile: TasteProfile = { genres: strings("genres"), tone: strings("tone"), darkness: number("darkness", 5), weirdness: number("weirdness", 5), romance: number("romance", 3), action: number("action", 5), humor: number("humor", 3) };
  if (["middle_grade", "young_adult", "adult"].includes(String(p.targetAudience))) profile.targetAudience = p.targetAudience as NonNullable<TasteProfile["targetAudience"]>;
  if (["plain", "lyrical", "cinematic", "mythic", "noir", "cozy"].includes(String(p.literaryStyle))) profile.literaryStyle = p.literaryStyle as NonNullable<TasteProfile["literaryStyle"]>;
  for (const key of ["inspirationsToCapture", "inspirationsToAvoid", "contentLimits"] as const) { const value = strings(key); if (value.length) profile[key] = value; }
  if (typeof p.userSeed === "string" && p.userSeed.trim()) profile.userSeed = p.userSeed.trim().slice(0, 2000);
  if (!profile.genres.length) profile.genres = ["speculative fiction"];
  if (!profile.tone.length) profile.tone = ["suspenseful"];
  return profile;
}

export { label };
