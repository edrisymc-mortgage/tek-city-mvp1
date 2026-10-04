"use strict";
// Pump.fun official transaction-builder API (fun-block.pump.fun) + Pinata IPFS uploads.
// Every transaction is built unsigned for the player's own wallet; TEK CITY never signs for players.
const { fail } = require("../security/util");

let CFG = null;
function configure(config) { CFG = config; }
const SOL_MINT = "So11111111111111111111111111111111111111112";

async function call(path, body) {
  let res, j;
  try {
    res = await fetch(`${CFG.launchpad.pumpApi}${path}`, {
      method: "POST", headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ ...body, encoding: "base64" }), signal: AbortSignal.timeout(25000),
    });
    j = await res.json().catch(() => null);
  } catch { fail(502, "pump_unreachable", "Pump.fun didn't respond. Try again in a moment."); }
  if (!res.ok || !j || !j.transaction) {
    const msg = j && (j.message || j.error) ? String(j.message || j.error).slice(0, 160) : `status ${res.status}`;
    fail(502, "pump_error", `Pump.fun couldn't build that transaction (${msg}).`);
  }
  return j;
}

const createCoin = ({ wallet, name, symbol, uri, lamports }) =>
  call("/agents/create-coin", { user: wallet, creator: wallet, feePayer: wallet, name, symbol, uri, solLamports: String(lamports), mayhemMode: false, cashback: false, tokenizedAgent: false, frontRunningProtection: false });
const buy = ({ wallet, mint, lamports }) =>
  call("/agents/swap", { inputMint: SOL_MINT, outputMint: mint, amount: String(lamports), user: wallet, feePayer: wallet, slippagePct: 5, frontRunningProtection: false });
const sharingConfig = ({ wallet, mint, shareholders }) =>
  call("/agents/sharing-config", { mint, user: wallet, shareholders, mode: "create", frontRunningProtection: false });
const collectFees = ({ payer, mint }) => call("/agents/collect-fees", { mint, user: payer, frontRunningProtection: false });

async function pin(blob, filename) {
  if (!CFG.launchpad.pinataJwt) fail(503, "pinata_missing", "Coin launches need PINATA_JWT set on the server.");
  const fd = new FormData();
  fd.append("file", blob, filename);
  fd.append("network", "public");
  fd.append("name", filename);
  let res, j;
  try {
    res = await fetch("https://uploads.pinata.cloud/v3/files", { method: "POST", headers: { authorization: `Bearer ${CFG.launchpad.pinataJwt}` }, body: fd, signal: AbortSignal.timeout(30000) });
    j = await res.json().catch(() => null);
  } catch { fail(502, "pinata_unreachable", "Image storage didn't respond. Try again."); }
  const cid = j && j.data && j.data.cid;
  if (!res.ok || !cid) fail(502, "pinata_error", "Image storage rejected the upload.");
  return `https://ipfs.io/ipfs/${cid}`;
}

async function uploadMetadata({ image, mime, name, symbol, description, website, twitter }) {
  const ext = { "image/png": "png", "image/jpeg": "jpg", "image/gif": "gif", "image/webp": "webp" }[mime];
  const imageUri = await pin(new Blob([image], { type: mime }), `${symbol.toLowerCase()}.${ext}`);
  const meta = { name, symbol, description, image: imageUri, showName: true, createdOn: "https://pump.fun", ...(website ? { website } : {}), ...(twitter ? { twitter } : {}) };
  const uri = await pin(new Blob([JSON.stringify(meta)], { type: "application/json" }), `${symbol.toLowerCase()}.json`);
  return { uri, imageUri };
}

module.exports = { configure, createCoin, buy, sharingConfig, collectFees, uploadMetadata, SOL_MINT };
