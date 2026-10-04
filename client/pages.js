"use strict";
// Static page templates. Rendered to public/*.html by scripts/build-client.js. No inline scripts or styles (strict CSP).

const LOGO = `<svg viewBox="0 0 32 32" aria-hidden="true"><rect x="1" y="1" width="30" height="30" rx="8" fill="#173d2d" stroke="#c9972b" stroke-width="1.5"/><path d="M8 23V14h4v9M14 23V8h4v15M20 23v-6h4v6" fill="#f4ecd8"/><path d="M5 26.5h22" stroke="#e2b33c" stroke-width="2" stroke-linecap="round" stroke-dasharray="1 3.2"/></svg>`;

const NAV = [
  ["/play", "Play"],
  ["/how-it-works", "How it works"],
  ["/wallet-safety", "Wallet safety"],
  ["/official-links", "Official links"],
];

function layout({ path, title, description, body, scripts = ["site"], styles = ["base"], bodyClass = "", header = true }) {
  const nav = NAV.map(([href, label]) => `<a href="${href}"${href === path ? ' aria-current="page"' : ""}>${label}</a>`).join("");
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${title}</title>
<meta name="description" content="${description}">
<meta name="theme-color" content="#0a1f17">
<meta name="referrer" content="strict-origin-when-cross-origin">
<link rel="icon" href="/assets/img/favicon.svg" type="image/svg+xml">
${styles.map((s) => `<link rel="stylesheet" href="/assets/css/${s}.css?v=__V__">`).join("\n")}
</head>
<body class="${bodyClass}">
${header ? `<header class="site-header"><div class="wrap">
  <a class="logo" href="/" aria-label="TEK CITY home">${LOGO}<b>TEK CITY</b><span class="beta">Beta</span></a>
  <button class="nav-toggle" aria-expanded="false" aria-controls="site-nav"><span class="sr-only">Menu</span><i data-lucide="menu"></i></button>
  <nav class="nav" id="site-nav">${nav}<a class="btn btn-primary btn-sm" href="/play"><i data-lucide="play"></i>Play now</a></nav>
</div></header>` : ""}
${body}
${header ? FOOTER : ""}
${scripts.map((s) => `<script src="/assets/js/${s}.js?v=__V__" defer></script>`).join("\n")}
</body>
</html>`;
}

const FOOTER = `<footer class="site-footer"><div class="wrap">
  <div class="cols">
    <div>
      <a class="logo" href="/">${LOGO}<b>TEK CITY</b><span class="beta">Beta</span></a>
      <p class="muted mt12">A cooperative city-building game. Free to play. Off-chain game resources only. Wallets are optional and used only for identity.</p>
    </div>
    <div><h4>Game</h4><ul><li><a href="/play">Play</a></li><li><a href="/how-it-works">How it works</a></li><li><a href="/official-links">Official links</a></li></ul></div>
    <div><h4>Safety</h4><ul><li><a href="/wallet-safety">Wallet safety</a></li><li><a href="/report">Report a scam</a></li><li><a href="/contact">Contact &amp; support</a></li></ul></div>
    <div><h4>Legal</h4><ul><li><a href="/terms">Terms</a></li><li><a href="/privacy">Privacy</a></li><li><a href="/risk">Risk disclosure</a></li></ul></div>
  </div>
  <p class="fine">TEK CITY is in public beta and may change or reset. Game resources (Energy, Build Credits, Influence, District XP, Vault progress) have no monetary value, cannot be bought, sold, transferred, or withdrawn. TEK CITY will never ask for your seed phrase, recovery phrase, or private key.</p>
</div></footer>`;

const ic = (n) => `<i data-lucide="${n}"></i>`;

const PAGES = {};

PAGES.index = () => layout({
  path: "/", title: "TEK CITY · Build the city. Own the culture.",
  description: "TEK CITY is a free cooperative online city-building game. Every 15 minutes the board evolves.",
  body: `<main class="wrap">
  <section class="hero">
    <div>
      <span class="kicker">Live city · Beta</span>
      <h1>Build the city.<br><em>Own the culture.</em></h1>
      <p class="lede">TEK CITY runs 24/7. Every 15 minutes the board evolves. Check in, ride the Transit Line, and put your Build Credits into the districts you want to see rise. Every upgrade is a group effort.</p>
      <div class="hero-ctas">
        <a class="btn btn-primary" href="/play">${ic("play")}Play as guest</a>
        <a class="btn btn-ghost" href="/play#wallet">${ic("wallet")}Connect wallet</a>
      </div>
      <p class="safety-note">${ic("shield-check")}Connect a wallet for optional player identity. TEK CITY never asks for your seed phrase or private key.</p>
    </div>
    <div class="hero-art" aria-hidden="true">
      <div class="mini-map">
        <span class="s"></span><span class="mm-blue h60"></span><span class="mm-blue h40"></span><span class="s"></span><span class="mm-blue h80"></span><span class="s"></span>
        <span class="mm-green h30"></span><span class="mm-red h55"></span><span class="mm-red h70"></span><span class="s"></span><span class="mm-red h35"></span><span class="mm-green h50"></span>
        <span class="mm-green h45"></span><span class="mm-green h20"></span><span class="s"></span><span class="mm-gold h65"></span><span class="mm-gold h25"></span><span class="s"></span>
        <span class="mm-teal h90"></span><span class="mm-teal h60"></span><span class="mm-teal h30"></span><span class="s"></span><span class="mm-yellow h40"></span><span class="mm-yellow h75"></span>
      </div>
      <div class="hero-badge"><span class="ink2">Community Vault</span><b id="hero-vault">Live</b></div>
    </div>
  </section>
  <div class="ticker" id="ticker" aria-live="polite"><span>Round <b id="t-round">--</b> of 96</span><span>Next tick in <b id="t-count">--:--</b></span><span>City stability <b id="t-stab">--</b></span><span>Builders today <b id="t-players">--</b></span></div>

  <section class="grid-3">
    <div class="card feature"><h3>${ic("clock")}A city that never sleeps</h3><p class="muted">One city day has 96 rounds of exactly 15 minutes. When the clock hits zero, the server settles every action, upgrades districts, and opens the next round.</p></div>
    <div class="card feature"><h3>${ic("hammer")}Build together</h3><p class="muted">Districts are shared construction zones. Contributions push upgrade meters, and everyone who helped gets credit, badges, and leaderboard points. No one can drain your resources.</p></div>
    <div class="card feature"><h3>${ic("landmark")}Community Vault</h3><p class="muted">Part of every contribution fills the Community Vault. Milestones unlock city-wide build boosts, badges, and new content for everyone.</p></div>
  </section>

  <section class="grid-2 mt64">
    <div>
      <span class="kicker">The loop</span>
      <h2>Check in. Move. Build. Leave.</h2>
      <div class="steps">
        <div><p><b>Check in</b> once per round for Build Credits, Energy, and Influence.</p></div>
        <div><p><b>Ride the Transit Line.</b> The server rolls your move. Landing on a district puts you on site for a 1.5x build bonus.</p></div>
        <div><p><b>Contribute</b> Build Credits to districts, vote on the City Brief, and help contain crises.</p></div>
        <div><p><b>Come back later.</b> Energy refills every round, so a few minutes at a time is enough.</p></div>
      </div>
    </div>
    <div class="card-paper">
      <h3 class="paper-title">What TEK CITY is not</h3>
      <ul class="list-check no mt12">
        <li>${ic("x")}<span>Not an investment, a token sale, or a way to earn money.</span></li>
        <li>${ic("x")}<span>No buying game resources, no paid rolls, no cash prizes, no withdrawals.</span></li>
        <li>${ic("x")}<span>No transactions. Signing in only proves you control a wallet address.</span></li>
        <li>${ic("x")}<span>We never ask for a seed phrase, private key, or password.</span></li>
      </ul>
      <p class="mt16 mb0"><a href="/wallet-safety">Read wallet safety</a> · <a href="/risk">Risk disclosure</a></p>
    </div>
  </section>
</main>`,
  scripts: ["site", "landing"],
});

PAGES["how-it-works"] = () => layout({
  path: "/how-it-works", title: "How TEK CITY works", description: "Rules of TEK CITY: rounds, districts, the Community Vault, City Briefs, crises, and daily goals.",
  body: `<main class="wrap"><section class="page-hero prose"><span class="kicker">Rules</span><h1>How it works</h1>
  <p class="muted">TEK CITY is a cooperative strategy game. The whole server shares one city. You win together by building it up before the day ends.</p></section>
  <div class="prose">
  <h2>The clock</h2>
  <p>A city day runs from 00:00 to 24:00 UTC and has 96 rounds of exactly 15 minutes. During a round you can act. At the tick, the server closes the round, validates and resolves everything, updates districts and the Vault, records the leaderboard, writes an audit log, and opens the next round. Your browser never decides outcomes.</p>
  <h2>Your resources</h2>
  <ul>
    <li><b>Energy</b> (max 12): spent to move (2) and contribute (1). Refills by 2 every round.</li>
    <li><b>Build Credits</b>: earned by checking in, riding the line, and visiting stops. Spent on district contributions.</li>
    <li><b>Influence</b>: your score. Earned by contributing, voting, and being part of upgrades. Ranks the daily leaderboard.</li>
  </ul>
  <p>All resources are off-chain game points. They cannot be bought, sold, transferred, or cashed out.</p>
  <h2>Each round you can</h2>
  <ul>
    <li><b>Check in</b> once: +15 Build Credits (more with Brick Quarter upgrades), +1 Energy, +1 Influence.</li>
    <li><b>Ride the Transit Line</b> once: the server rolls 1 to 6. Passing Central Station pays Build Credits. Landing on a district puts you on site for 1.5x District XP this round.</li>
    <li><b>Contribute</b> up to 3 times: 10 to 200 Build Credits to any district. 20% of every contribution also fills the Community Vault.</li>
    <li><b>Vote</b> on the City Brief. The majority choice is applied at the tick.</li>
  </ul>
  <h2>Districts and neighborhoods</h2>
  <p>There are 16 districts in six neighborhoods. Each district has five levels. When a district's XP passes its threshold, it levels up at the next tick and every contributor at that level earns Influence and the Crew Chief badge. Each neighborhood produces something different for the whole city:</p>
  <table class="simple"><thead><tr><th>Neighborhood</th><th>City effect</th></tr></thead><tbody id="hood-table"></tbody></table>
  <h2>Citizens</h2>
  <p>Makers, Merchants, and Residents react to City Brief decisions. Happy factions (70+) give bonuses; unhappy factions (30 or less) make things harder. Moods drift back toward neutral over time.</p>
  <h2>Crises</h2>
  <p>As the day goes on, crises arrive more often and get more severe. A crisis targets one district and sets a District XP target for the round. Meet it and the city gains Stability. Miss it and that district loses some XP and the city loses Stability. Crises never take resources from players.</p>
  <h2>Winning and losing</h2>
  <ul>
    <li><b>City Thrives</b>: reach 36 total district levels and 3 Vault milestones in one day. Everyone who played that day earns the City Thrives badge and bonus Influence.</li>
    <li><b>Blackout</b>: if Stability hits zero, the daily goal is lost and the city spends 4 rounds recovering at half build speed.</li>
    <li><b>Unfinished</b>: the day ends without reaching the goal.</li>
  </ul>
  <p>At midnight UTC the city resets: districts return to Level 1 and the Vault empties. Your resources, badges, and all-time Influence carry over.</p>
  <h2>Fair play</h2>
  <p>There is nothing to buy. Rate limits and abuse checks apply to everyone. Multiple accounts to farm the leaderboard may be removed.</p>
  </div></main>`,
  scripts: ["site", "rules"],
});

PAGES["wallet-safety"] = () => layout({
  path: "/wallet-safety", title: "Wallet safety · TEK CITY", description: "How TEK CITY uses wallets, and how to stay safe.",
  body: `<main class="wrap"><section class="page-hero prose"><span class="kicker">Safety</span><h1>Wallet safety</h1>
  <p class="muted">Connecting a wallet is optional. You can play the full game as a guest.</p></section>
  <div class="grid-2">
  <div class="card-paper">
    <h2 class="h-sm">TEK CITY will never ask for</h2>
    <ul class="list-check no mt12">
      <li>${ic("x")}<span>Your seed phrase or recovery phrase</span></li>
      <li>${ic("x")}<span>Your private key</span></li>
      <li>${ic("x")}<span>Your wallet password</span></li>
      <li>${ic("x")}<span>A wallet backup file</span></li>
    </ul>
    <p class="mt16 mb0">Anyone asking for these is trying to steal from you, even if they claim to be TEK CITY staff.</p>
  </div>
  <div class="card">
    <h2 class="h-sm">What connecting does</h2>
    <ul class="list-check">
      <li>${ic("check")}<span>Connecting does not give TEK CITY access to your funds.</span></li>
      <li>${ic("check")}<span>Signing in asks you to sign a plain text message that starts with "wants you to sign in" and includes "Sign in to TEK CITY". It is not a transaction and costs nothing.</span></li>
      <li>${ic("check")}<span>You approve every future transaction yourself, in your own wallet. In this beta, TEK CITY does not request any transactions at all.</span></li>
      <li>${ic("check")}<span>Only trust the official domain and the links on our <a href="/official-links">Official links</a> page.</span></li>
    </ul>
  </div>
  </div>
  <div class="prose mt32">
  <h2>Before you sign anything</h2>
  <ul>
    <li>Check the address bar shows the official domain listed on <a href="/official-links">Official links</a>.</li>
    <li>Read the message. A TEK CITY sign-in message shows our domain, your address, a one-time code, and an expiration time, and states that it does not authorize any transaction or transfer.</li>
    <li>If your wallet asks you to approve a transaction, a token approval, or a transfer while using TEK CITY, reject it and <a href="/report">report it</a>.</li>
    <li>Sign-in requests expire after 5 minutes and can only be used once.</li>
  </ul>
  <div class="callout red"><b>See something suspicious?</b> Fake sites, DMs from "support", or fake airdrops are scams. <a href="/report">Report it here</a>.</div>
  <h2>Pump.fun</h2>
  <p>TEK CITY does not use Pump.fun as a sign-in method and does not trade, buy, or sell anything on your behalf. Any future market information would be read-only and informational.</p>
  </div></main>`,
});

PAGES["official-links"] = () => layout({
  path: "/official-links", title: "Official links · TEK CITY", description: "The only official TEK CITY domain, social accounts, and contract information.",
  body: `<main class="wrap"><section class="page-hero prose"><span class="kicker">Verify</span><h1>Official links</h1>
  <p class="muted">Bookmark this page. If a link isn't listed here, it isn't us.</p></section>
  <div class="callout red prose"><b>Anti-phishing warning:</b> scammers copy game sites and social accounts. TEK CITY staff will never DM you first, never ask for a seed phrase or private key, and never ask you to "validate" or "sync" a wallet.</div>
  <div class="card">
    <table class="simple"><tbody>
      <tr><th>Official domain</th><td><div class="copy-row"><code id="ol-domain">Loading…</code><button class="btn btn-ghost btn-sm" data-copy="ol-domain">${ic("copy")}Copy</button></div></td></tr>
      <tr><th>X (Twitter)</th><td id="ol-x">Not announced</td></tr>
      <tr><th>Discord</th><td id="ol-discord">Not announced</td></tr>
      <tr><th>Telegram</th><td id="ol-telegram">Not announced</td></tr>
      <tr><th>Token mint</th><td><div class="copy-row"><code id="ol-mint">Not announced</code><button class="btn btn-ghost btn-sm" data-copy="ol-mint" id="ol-mint-copy" hidden>${ic("copy")}Copy</button></div><small class="muted">TEK CITY has not announced a token. Any token claiming to be official before it appears here is not ours.</small></td></tr>
      <tr><th>Contract / audit status</th><td id="ol-audit">Loading…</td></tr>
      <tr><th>Network</th><td id="ol-network">Loading…</td></tr>
    </tbody></table>
  </div></main>`,
});

const legal = (path, title, kicker, html) => layout({
  path, title: `${title} · TEK CITY`, description: `${title} for TEK CITY (beta).`,
  body: `<main class="wrap"><section class="page-hero prose"><span class="kicker">${kicker}</span><h1>${title}</h1><p class="muted">Beta draft. Last updated October 2026.</p></section><div class="prose">${html}</div></main>`,
});

PAGES.terms = () => legal("/terms", "Terms of Use", "Legal", `
<p>These terms apply to the TEK CITY beta. By playing you agree to them. If you don't agree, please don't use the service.</p>
<h2>The game</h2><p>TEK CITY is a free online game provided as-is during a public beta. Features, rules, and balances may change, and game data may be reset at any time.</p>
<h2>Game resources have no value</h2><p>Energy, Build Credits, Influence, District XP, Vault progress, badges, and cosmetics are game features only. They are not property, currency, or securities. They cannot be purchased, sold, traded, transferred, redeemed, or withdrawn, and they have no cash or market value.</p>
<h2>Wallets</h2><p>Connecting a wallet is optional and is used only to identify your player account by verifying a signed message. TEK CITY does not take custody of assets and does not request transactions in this beta. You are responsible for the security of your wallet.</p>
<h2>Fair play</h2><p>Don't use bots, scripts, multiple accounts to manipulate rankings, exploits, or attacks against the service. Don't impersonate TEK CITY or other players. We may limit, suspend, or remove accounts that break these rules.</p>
<h2>No warranties</h2><p>The service is provided without warranties of any kind. To the extent allowed by law, the operators are not liable for indirect or consequential losses arising from use of the beta.</p>
<h2>Changes</h2><p>We may update these terms. Continued use after an update means you accept the new terms.</p>
<h2>Contact</h2><p>Questions: <a href="/contact">Contact &amp; support</a>.</p>`);

PAGES.privacy = () => legal("/privacy", "Privacy Policy", "Legal", `
<h2>What we collect</h2><ul>
<li><b>Account data:</b> your display name, and if you connect one, your public wallet address. We never collect seed phrases or private keys.</li>
<li><b>Gameplay data:</b> your actions, resources, badges, and leaderboard position.</li>
<li><b>Security data:</b> keyed hashes of your IP address and browser user agent (not the raw values), session records, rate-limit events, and an audit log of sign-ins and game actions.</li>
<li><b>Support messages:</b> what you submit through the contact or scam report forms, including an email address if you provide one.</li></ul>
<h2>How we use it</h2><p>To run the game, secure accounts, prevent abuse, investigate scams, and answer support requests. We don't sell personal data and don't use third-party advertising trackers.</p>
<h2>Cookies</h2><p>We use one essential session cookie (HttpOnly, Secure, SameSite). It is required for signing in and for security checks. No analytics or advertising cookies.</p>
<h2>Public information</h2><p>Your display name, badges, and Influence appear on the public leaderboard and activity feed. Wallet addresses are shown only in shortened form.</p>
<h2>Retention</h2><p>Sessions expire within hours to days. Login challenges are deleted shortly after they expire. Audit logs are kept for security purposes. You can ask us to delete your account via <a href="/contact">Contact</a>.</p>`);

PAGES.risk = () => legal("/risk", "Risk Disclosure", "Read this", `
<div class="callout"><b>Short version:</b> TEK CITY is a game, not an investment. Nothing here can make you money.</div>
<ul>
<li><b>No financial returns.</b> TEK CITY does not offer, promise, or imply profit, income, yield, or any return of any kind. Game resources have no monetary value.</li>
<li><b>No token offering.</b> TEK CITY has not announced a token. Nothing on this site is an offer to buy or sell any digital asset. Check <a href="/official-links">Official links</a> before trusting any claim otherwise.</li>
<li><b>Beta software.</b> The game may have bugs, downtime, or data resets. Do not rely on it for anything important.</li>
<li><b>Wallet risk.</b> Crypto wallets can be targeted by phishing and malicious sites. Only sign messages you understand, and never share your seed phrase or private key. See <a href="/wallet-safety">Wallet safety</a>.</li>
<li><b>Third-party wallets.</b> Wallet software is provided by third parties. TEK CITY does not control or guarantee it.</li>
<li><b>Market information.</b> If a read-only market data feature is ever enabled, it is informational only, may be delayed or inaccurate, and is not investment advice.</li>
<li><b>Not audited.</b> TEK CITY has not undergone an independent security audit. Do not treat it as audited or compliant with any specific standard.</li>
</ul>`);

const formPage = (path, title, kicker, kind, intro) => layout({
  path, title: `${title} · TEK CITY`, description: intro,
  body: `<main class="wrap"><section class="page-hero prose"><span class="kicker">${kicker}</span><h1>${title}</h1><p class="muted">${intro}</p></section>
  ${kind === "scam" ? `<div class="callout red prose"><b>Never include your seed phrase or private key</b> in a report, even partially. We will never ask for them.</div>` : ""}
  <form class="form" data-support="${kind}" novalidate>
    <div class="field"><label for="f-subject">${kind === "scam" ? "What did you see?" : "Subject"}</label><input id="f-subject" name="subject" required minlength="3" maxlength="120" placeholder="${kind === "scam" ? "Fake TEK CITY site asking to sync wallet" : "How can we help?"}"></div>
    ${kind === "scam" ? `<div class="field"><label for="f-url">Link or account (optional)</label><input id="f-url" name="url" maxlength="500" placeholder="https://… or @handle"></div>` : ""}
    <div class="field"><label for="f-body">Details</label><textarea id="f-body" name="body" required minlength="10" maxlength="4000"></textarea></div>
    <div class="field"><label for="f-email">Email (optional, for a reply)</label><input id="f-email" name="email" type="email" maxlength="200" autocomplete="email"></div>
    <div><button class="btn btn-primary" type="submit">${ic("send")}${kind === "scam" ? "Send report" : "Send message"}</button></div>
    <p class="form-status" role="status" aria-live="polite"></p>
  </form></main>`,
});

PAGES.contact = () => formPage("/contact", "Contact & support", "Help", "contact", "Questions, bugs, account deletion, or feedback. We read everything.");
PAGES.report = () => formPage("/report", "Report a scam", "Safety", "scam", "Report phishing sites, impersonators, fake tokens, or anyone asking for wallet secrets.");

PAGES["404"] = () => layout({
  path: "/404", title: "Not found · TEK CITY", description: "Page not found.",
  body: `<main class="wrap"><section class="page-hero prose"><span class="kicker">404</span><h1>This street isn't on the map.</h1><p class="muted">If someone sent you here claiming to be TEK CITY, check our <a href="/official-links">Official links</a>.</p><p><a class="btn btn-primary" href="/play">${ic("play")}Back to the city</a></p></section></main>`,
});

PAGES.play = () => layout({
  path: "/play", title: "Play · TEK CITY", description: "Play TEK CITY.", bodyClass: "play", header: false,
  styles: ["base", "play"], scripts: ["play"],
  body: `<div class="paused-banner" id="paused"></div>
<header class="topbar">
  <a class="logo" href="/" aria-label="TEK CITY home">${LOGO}<b>TEK CITY</b><span class="beta">Beta</span></a>
  <div class="round-box">
    <div><span class="lbl">Round</span><span class="val" id="round-no">--</span></div>
    <div class="countdown" id="countdown-box"><span class="lbl">Next tick</span><span class="val" id="countdown" aria-live="off">--:--</span></div>
    <div><span class="lbl">Day</span><span class="val" id="day-label">--</span></div>
  </div>
  <div class="top-right" id="top-right">
    <span class="wallet-hint">${ic("shield-check")}Wallet is optional. We never ask for your seed phrase.</span>
    <div id="account-slot"></div>
  </div>
</header>
<main class="play-shell">
  <aside class="col-left">
    <section class="panel" id="player-panel"><h3>Your builder</h3><div id="player"></div></section>
    <section class="panel"><h3>Today's goal <span class="r" id="day-status"></span></h3><div id="goal-mini" class="muted small"></div></section>
  </aside>
  <section class="col-center">
    <div class="board-wrap"><div class="board" id="board"></div><div class="board-legend" id="legend"></div></div>
    <div id="event-m" class="event-m"></div>
    <div class="goal" id="goal"></div>
    <div class="day-banner" id="day-banner"></div>
  </section>
  <aside class="col-right">
    <section class="panel"><h3>Community Vault <span class="r" id="vault-ms"></span></h3><div id="vault"></div></section>
    <section class="panel"><h3>Leaderboard</h3><div class="tabs" role="tablist"><button role="tab" aria-selected="true" data-lb="today">Today</button><button role="tab" aria-selected="false" data-lb="allTime">All time</button></div><ol class="lb" id="lb"></ol></section>
    <section class="panel"><h3>Citizens</h3><div class="moods" id="moods"></div></section>
    <section class="panel"><h3>City feed <span class="r" id="live-dot">live</span></h3><ul class="feed" id="feed"></ul></section>
  </aside>
</main>
<nav class="mobile-bar" id="mobile-bar" aria-label="Actions"></nav>
<div class="scrim" id="scrim"></div>
<aside class="drawer" id="drawer" aria-hidden="true" aria-labelledby="dr-title"></aside>
<div class="modal" id="modal" role="dialog" aria-modal="true"><div class="box" id="modal-box"></div></div>
<div class="toasts" id="toasts" aria-live="polite"></div>`,
});

PAGES.admin = () => layout({
  path: "/admin", title: "Admin · TEK CITY", description: "Operator console.", scripts: ["admin"],
  body: `<main class="wrap"><section class="page-hero"><span class="kicker">Operators only</span><h1>Admin console</h1>
  <p class="muted">Requires an allowlisted wallet and a fresh signature. Every action is logged. There are no fund or treasury controls.</p></section>
  <div id="admin-root" class="card">Loading…</div></main>`,
});

module.exports = { PAGES, LOGO };
