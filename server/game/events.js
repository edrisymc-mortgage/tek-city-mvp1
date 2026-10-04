"use strict";
// City Briefs: every round the city faces one decision. Players vote; the server settles the majority at the tick.
// Crises: escalating emergencies tied to one district. Hitting the build target during the round contains them.
// No option ever removes a player's own resources. Consequences are city-wide (stability, moods, district XP, boosts).

const BRIEFS = [
  { code: "market-day", title: "Market Day", body: "Merchants want the streets for a weekend market.", options: [
    { label: "Open the streets", effects: { moods: { merchants: 8, residents: -4 }, boost: { kind: "hood_xp", hood: "gilded", mult: 2 } } },
    { label: "Keep it quiet", effects: { moods: { residents: 6, merchants: -5 }, stability: 2 } } ] },
  { code: "night-shift", title: "Night Shift", body: "The workshops can run overnight if the city pays for lighting.", options: [
    { label: "Light the yards", effects: { moods: { makers: 8, residents: -3 }, boost: { kind: "hood_xp", hood: "brick", mult: 2 } } },
    { label: "Lights out at ten", effects: { moods: { residents: 5, makers: -5 }, stability: 1 } } ] },
  { code: "harbor-dredge", title: "Harbor Dredge", body: "Silt is choking the docks. Dredging slows trade for a day.", options: [
    { label: "Dredge now", effects: { moods: { makers: 4, merchants: -4 }, xpHood: { hood: "harbor", amount: 40 } } },
    { label: "Wait for spring", effects: { moods: { merchants: 5 }, stability: -2 } } ] },
  { code: "street-festival", title: "Street Festival", body: "Residents want a festival in Greenway.", options: [
    { label: "Throw the festival", effects: { moods: { residents: 8, merchants: 3 }, vault: 30 } },
    { label: "Save the budget", effects: { moods: { residents: -6 }, energy: 1 } } ] },
  { code: "open-data", title: "Open Data Charter", body: "Tek Heights engineers want city data published for everyone to build on.", options: [
    { label: "Publish it", effects: { moods: { makers: 6, merchants: -3 }, boost: { kind: "hood_xp", hood: "heights", mult: 2 } } },
    { label: "Keep it private", effects: { moods: { merchants: 5, makers: -4 } } } ] },
  { code: "radio-hour", title: "Radio Hour", body: "Signal Hill offers a city-wide broadcast slot.", options: [
    { label: "Rally builders", effects: { moods: { makers: 3, residents: 3 }, energy: 1 } },
    { label: "Sell ad time", effects: { moods: { merchants: 6, residents: -3 }, vault: 25 } } ] },
  { code: "park-or-parking", title: "Park or Parking", body: "One empty lot downtown. Two very loud groups.", options: [
    { label: "Plant a park", effects: { moods: { residents: 8, merchants: -4 }, stability: 3 } },
    { label: "Pave a lot", effects: { moods: { merchants: 7, residents: -6 }, vault: 20 } } ] },
  { code: "tool-library", title: "Tool Library", body: "Makers propose a shared tool library at Central Station.", options: [
    { label: "Fund it", effects: { moods: { makers: 7 }, checkinBonus: 10 } },
    { label: "Not this year", effects: { moods: { makers: -5, merchants: 2 } } } ] },
  { code: "canal-lights", title: "Canal Lights", body: "Lantern makers want to string lights along the canal.", options: [
    { label: "Hang the lanterns", effects: { moods: { residents: 4, merchants: 4 }, boost: { kind: "hood_xp", hood: "harbor", mult: 2 } } },
    { label: "Maybe later", effects: { stability: 1 } } ] },
  { code: "seed-swap", title: "Seed Swap", body: "Seed Commons wants volunteers for the spring planting.", options: [
    { label: "Send volunteers", effects: { moods: { residents: 6 }, boost: { kind: "hood_xp", hood: "greenway", mult: 2 } } },
    { label: "Hire contractors", effects: { moods: { merchants: 4, residents: -2 }, xpHood: { hood: "greenway", amount: 30 } } } ] },
];

const CRISES = [
  { code: "kiln-fire", title: "Kiln Fire", body: "A kiln fire is spreading on {d}.", },
  { code: "dock-flood", title: "Dock Flood", body: "Storm water is rising at {d}." },
  { code: "grid-brownout", title: "Grid Brownout", body: "Power is flickering across {d}." },
  { code: "supply-delay", title: "Supply Delay", body: "Materials stopped arriving at {d}." },
  { code: "signal-loss", title: "Signal Loss", body: "{d} has dropped off the network." },
];

const MOODS = {
  makers: { name: "Makers", high: "Contributions earn +10% District XP", low: "Contributions earn -10% District XP" },
  merchants: { name: "Merchants", high: "Check-ins earn +5 Build Credits", low: "Check-ins earn -5 Build Credits" },
  residents: { name: "Residents", high: "+1 Stability every round", low: "-1 Stability every round" },
};

// Escalation: severity rises through the day, crises arrive more often.
function severityFor(roundNumber) { return Math.min(5, 1 + Math.floor((roundNumber - 1) / 20)); }
function isCrisisRound(roundNumber) {
  const sev = severityFor(roundNumber);
  const every = Math.max(3, 8 - sev); // 7,6,5,4,3
  return roundNumber >= 4 && roundNumber % every === 0;
}

module.exports = { BRIEFS, CRISES, MOODS, severityFor, isCrisisRound };
