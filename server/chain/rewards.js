"use strict";
// Retired. TEK CITY no longer runs a server-held rewards wallet: no hourly holder payouts, no Vault SOL
// jackpot, no fee split on players' coins. The only money flow TEK CITY accounts for is the creator rewards
// its own OPERATOR_CREATOR_REWARD_WALLET actually receives (see ./creatorRewards.js), and those are
// transferred to the Community Fund only through an external multisig, never by this server.
function configure() {}
const poolAddress = () => null;
module.exports = { configure, poolAddress };
