const tasteProfile = {
  genres: ["fantasy", "political mystery"], tone: ["melancholy", "suspense"], targetAudience: "adult",
  darkness: 7, weirdness: 5, romance: 2, action: 4, humor: 2, literaryStyle: "cinematic",
  userSeed: "A maritime republic that is rich but terrified of running out of fresh water."
};

const candidate = {
  id: "smoke-ledger-republic", title: "The Freshwater Ledger of the Cistern Republic",
  genreFeel: "A cinematic political-fantasy mystery of rain-dark harbors, sealed ledgers, and melancholy civic betrayal.",
  logline: "When the richest maritime republic’s central cistern is found nearly empty despite flawless import records, its loyal Water Comptroller uncovers evidence that the ruling merchant houses manufactured generations of freshwater anxiety—and that her own family authenticated the founding crime that made the deception possible.",
  seedConnection: "The harbor economy, political legitimacy, and class hierarchy all depend on cistern levels and water imports; the republic’s wealth and freshwater fear were deliberately created together.",
  whyItWorks: "Imported freshwater supports shipping profits, naval authority, public debt, and the merchant houses’ control of the senate. Exposing the truth risks collapsing credit and provoking war, while continued secrecy condemns poor districts to rationing.",
  storyGenome: {
    primaryEngine: "mystery", secondaryEngines: ["power_struggle", "rebellion"], emotionalPromise: { primary: "suspense", secondary: "melancholy" }, protagonistArc: "loyal_to_independent", oppositionTypes: ["hidden_elite", "society", "ally_conflict"], revelationStyle: "false_history", endingMeaning: "truth_costs_everything", contradiction: "The Comptroller must destroy the freshwater ledgers that give the republic confidence in its wealth, because those ledgers conceal why its cisterns are empty."
  },
  worldGenome: {
    energySource: { primary: "tidal_wind", secondary: "magic" }, powerStructure: { visible: "senate", hidden: "merchant_guilds" }, beliefSystem: { dominant: "commercial_rationalism", minority: "ancestor_faith" }, scarcity: { visible: "water", hidden: "truth" }, socialFractures: ["rich_vs_poor", "core_vs_periphery", "old_families_vs_new_money"], historicalWound: "broken_treaty", dailyLifeTexture: ["harbor_markets", "ration_lines", "salt_tax_inspections"], edgeOfUnknown: "forbidden_archives", contradiction: "The republic became rich by controlling freshwater convoys after secretly destroying the mainland aqueduct that could have made water cheap."
  },
  validation: { valid: true, issues: [], warnings: [] }, repairs: [],
  scores: { coherence: 9.2, originality: 8.5, emotionalPotential: 9.1, interactivePotential: 9.5, worldStorySynergy: 7.7, characterPressure: 9.5, genreFit: 9, overall: 8.9 }
};

const response = await fetch("http://127.0.0.1:3021/api/project", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ tasteProfile, candidate }) });
const result = await response.json();
if (!response.ok) throw new Error(result.error ?? `Request failed (${response.status})`);
const project = result.project;
const searchable = JSON.stringify(project).toLowerCase();
console.log(JSON.stringify({
  model: result.model, title: project.title, protagonist: project.characterGenome.protagonist.name,
  factions: project.factions.length, locations: project.locations.length, acts: project.plotOutline.length,
  choices: project.interactiveDesign.actChoicePoints.length, exportFiles: project.exportManifest.files.length,
  seedTermsPresent: ["maritime", "republic", "freshwater", "water", "cistern"].filter(term => searchable.includes(term)),
  bibleHeadings: {
    world: project.bibles.worldBibleMarkdown.startsWith("# World Bible"),
    story: project.bibles.storyBibleMarkdown.startsWith("# Story Bible"),
    character: project.bibles.characterBibleMarkdown.startsWith("# Character Bible"),
    interactive: project.bibles.interactiveDesignMarkdown.startsWith("# Interactive Design")
  }
}, null, 2));
