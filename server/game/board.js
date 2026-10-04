"use strict";
// TEK CITY board: an original 6x4 city map crossed by one looping Transit Line (24 stops).
// Stops snake across the grid row by row; the Express Loop returns from stop 23 to Central Station.

const NEIGHBORHOODS = {
  harbor: { name: "Old Harbor", color: "#2f5d8a", effect: "Trade flow: each round adds Vault progress equal to the neighborhood's total levels." },
  brick: { name: "Brick Quarter", color: "#b6463a", effect: "Craft guilds: check-ins earn +1 Build Credit per neighborhood level (max +15)." },
  greenway: { name: "Greenway", color: "#2e7d4f", effect: "Clean air: +1 city Stability every round per 3 neighborhood levels." },
  gilded: { name: "Gilded Row", color: "#c9972b", effect: "Fare boxes: passing Central Station pays +5 Build Credits per neighborhood level." },
  signal: { name: "Signal Hill", color: "#d8a72a", effect: "Broadcast: voting on City Briefs earns +1 Influence per 2 neighborhood levels." },
  heights: { name: "Tek Heights", color: "#3f6f73", effect: "Power grid: at 6+ neighborhood levels, every player regenerates +1 extra Energy per round." },
};

// type: station | district | vault | desk | workshop | plaza
const STOPS = [
  { type: "station", name: "Central Station", text: "The Transit Line starts here. Passing pays 25 Build Credits (more with Gilded Row upgrades)." },
  { type: "district", slug: "pier-9", name: "Pier 9", hood: "harbor" },
  { type: "district", slug: "lantern-docks", name: "Lantern Docks", hood: "harbor" },
  { type: "desk", name: "City Desk", text: "Pick up a City Desk dispatch: a small, random boost decided by the server." },
  { type: "district", slug: "canal-works", name: "Canal Works", hood: "harbor" },
  { type: "workshop", name: "Maker Workshop", text: "Clock in at the workshop: +20 Build Credits and +1 Energy." },
  { type: "district", slug: "kiln-street", name: "Kiln Street", hood: "brick" },
  { type: "district", slug: "mason-yard", name: "Mason Yard", hood: "brick" },
  { type: "desk", name: "City Desk", text: "Pick up a City Desk dispatch: a small, random boost decided by the server." },
  { type: "district", slug: "redline-lofts", name: "Redline Lofts", hood: "brick" },
  { type: "district", slug: "orchard-park", name: "Orchard Park", hood: "greenway" },
  { type: "vault", name: "Community Vault", text: "The city's shared reserve. Visiting adds 10 Vault progress and earns 3 Influence." },
  { type: "district", slug: "seed-commons", name: "Seed Commons", hood: "greenway" },
  { type: "district", slug: "riverbank", name: "Riverbank", hood: "greenway" },
  { type: "plaza", name: "Founders Plaza", text: "Speak at the plaza: +5 Influence." },
  { type: "district", slug: "mint-arcade", name: "Mint Arcade", hood: "gilded" },
  { type: "district", slug: "exchange-hall", name: "Exchange Hall", hood: "gilded" },
  { type: "desk", name: "City Desk", text: "Pick up a City Desk dispatch: a small, random boost decided by the server." },
  { type: "district", slug: "radio-tower", name: "Radio Tower", hood: "signal" },
  { type: "district", slug: "switchboard", name: "Switchboard", hood: "signal" },
  { type: "workshop", name: "Maker Workshop", text: "Clock in at the workshop: +20 Build Credits and +1 Energy." },
  { type: "district", slug: "circuit-labs", name: "Circuit Labs", hood: "heights" },
  { type: "district", slug: "data-foundry", name: "Data Foundry", hood: "heights" },
  { type: "district", slug: "launchpad-labs", name: "Launchpad Labs", hood: "heights" },
].map((s, i) => ({ id: i, ...s }));

// districts table id === stop index
const DISTRICT_STOPS = STOPS.filter((s) => s.type === "district");

const RULES = {
  maxEnergy: 12,
  startEnergy: 8,
  startCredits: 100,
  energyRegenPerRound: 2,
  moveCost: 2,
  contributeCost: 1,
  checkinCredits: 15,
  stationPass: 25,
  siteStipend: 10,
  workshopCredits: 20,
  contributionsPerRound: 3,
  minContribution: 10,
  maxContribution: 200,
  visitMultiplier: 1.5,
  vaultShare: 0.2,
  vaultMilestoneSize: 300,
  maxLevel: 5,
  xpForNext: (level) => 150 * level, // L1->2 150, L2->3 300, L3->4 450, L4->5 600
};

function hoodLevels(districtRows) {
  const out = Object.fromEntries(Object.keys(NEIGHBORHOODS).map((k) => [k, 0]));
  for (const d of districtRows) out[d.neighborhood] += d.level;
  return out;
}

module.exports = { NEIGHBORHOODS, STOPS, DISTRICT_STOPS, RULES, hoodLevels };
