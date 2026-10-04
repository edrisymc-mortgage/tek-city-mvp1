"use strict";
// Static page templates. Rendered to public/*.html by scripts/build-client.js. No inline scripts or styles (strict CSP).

const LOGO = `<svg viewBox="0 0 32 32" aria-hidden="true"><g fill="currentColor"><rect x="3.0" y="3.0" width="4.4" height="4.4" rx="1"/><rect x="3.0" y="8.4" width="4.4" height="4.4" rx="1"/><rect x="3.0" y="13.8" width="4.4" height="4.4" rx="1"/><rect x="3.0" y="19.2" width="4.4" height="4.4" rx="1"/><rect x="3.0" y="24.6" width="4.4" height="4.4" rx="1"/><rect x="8.4" y="3.0" width="4.4" height="4.4" rx="1"/><rect x="8.4" y="24.6" width="4.4" height="4.4" rx="1"/><rect x="13.8" y="3.0" width="4.4" height="4.4" rx="1"/><rect x="13.8" y="24.6" width="4.4" height="4.4" rx="1"/><rect x="19.2" y="3.0" width="4.4" height="4.4" rx="1"/><rect x="19.2" y="24.6" width="4.4" height="4.4" rx="1"/><rect x="24.6" y="3.0" width="4.4" height="4.4" rx="1"/><rect x="24.6" y="8.4" width="4.4" height="4.4" rx="1"/><rect x="24.6" y="13.8" width="4.4" height="4.4" rx="1"/><rect x="24.6" y="19.2" width="4.4" height="4.4" rx="1"/><rect x="24.6" y="24.6" width="4.4" height="4.4" rx="1"/></g><rect x="13.8" y="13.8" width="4.4" height="4.4" rx="1" fill="currentColor" opacity=".45"/></svg>`;

const NAV = [
  ["/how-it-works", "How it works"],
  ["/milestones", "Milestones"],
  ["/wallet-safety", "Security"],
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
<meta name="theme-color" content="#0b0c0e">
<meta name="referrer" content="strict-origin-when-cross-origin">
<link rel="icon" href="/assets/img/favicon.svg" type="image/svg+xml">
${styles.map((s) => `<link rel="stylesheet" href="/assets/css/${s}.css?v=__V__">`).join("\n")}
</head>
<body class="${bodyClass}">
${header ? `<header class="site-header"><div class="wrap">
  <a class="logo" href="/" aria-label="TEK CITY home">${LOGO}<b>TEK CITY</b><span class="beta">Beta</span></a>
  <button class="nav-toggle" aria-expanded="false" aria-controls="site-nav"><span class="sr-only">Menu</span><i data-lucide="menu"></i></button>
  <nav class="nav" id="site-nav">${nav}<a class="btn btn-primary btn-sm" href="/play">Open the board</a></nav>
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
      <p class="muted mt12">A board-game launchpad for Pump.fun coins on Solana. Non-custodial: every launch and buy is signed in your own wallet.</p>
    </div>
    <div><h4>Product</h4><ul><li><a href="/play">Open the board</a></li><li><a href="/how-it-works">How it works</a></li><li><a href="/milestones">Milestones</a></li></ul></div>
    <div><h4>Trust</h4><ul><li><a href="/wallet-safety">Security</a></li><li><a href="/report">Report a scam</a></li></ul></div>
    <div><h4>Company</h4><ul><li><a href="/contact">Contact</a></li><li><a href="/terms">Terms</a></li><li><a href="/privacy">Privacy</a></li></ul></div>
  </div>
  <p class="fine">TEK CITY is independent and not affiliated with Pump.fun or Phantom. TEK CITY will never ask for your seed phrase or private key.</p>
</div></footer>`;

const ic = (n) => `<i data-lucide="${n}"></i>`;

const PAGES = {};

PAGES.index = () => layout({
  path: "/", title: "TEK CITY · Every space is a coin",
  description: "TEK CITY is a 3D board where every space is a Pump.fun coin. Spin, land, launch your coin or buy into someone else's, paid from your own wallet.",
  bodyClass: "home",
  body: `<main>
  <section class="hero wrap">
    <div class="hero-copy">
      <span class="kicker">Pump.fun launchpad · Solana</span>
      <h1>Every space on the board is a coin.</h1>
      <p class="lede">Spin the board. Land on an empty space and launch your coin on Pump.fun, and its name and image take the space. Land on someone else's coin and buy in to grow it, or outbid its biggest buy to take the space.</p>
      <div class="hero-ctas">
        <a class="btn btn-primary btn-lg" href="/play">Open the board</a>
        <a class="btn btn-ghost btn-lg" href="/how-it-works">How it works</a>
      </div>
      <p class="trust-line">${ic("shield-check")}Non-custodial. You approve every transaction in your own wallet.</p>
    </div>
    <figure class="hero-shot"><img src="/assets/img/board.jpg" width="1600" height="1000" alt="The TEK CITY board: a walnut and porcelain game board with coin spaces, a die and player pawns"></figure>
  </section>

  <section class="stats wrap" aria-label="Live numbers">
    <div><span class="k">Coins on the board</span><b id="st-coins">--</b></div>
    <div><span class="k">SOL put in</span><b id="st-sol">--</b></div>
    <div><span class="k">Players</span><b id="st-players">--</b></div>
    <div><span class="k">TEK CITY fee on launches</span><b>0%</b></div>
  </section>

  <section class="wrap section">
    <div class="sec-head"><span class="kicker">How it works</span><h2>Three moves.</h2></div>
    <div class="steps3">
      <article><span class="n">01</span><h3>Spin</h3><p>Connect a Solana wallet and your first spin is free. After that, every 500,000 TEK CITY you buy earns 1 more. Passing START earns another. The server rolls the die.</p></article>
      <article><span class="n">02</span><h3>Launch or grow</h3><p>Empty space: launch your coin on Pump.fun right from the board. Taken space: buy into that coin, or take the space with a bigger first buy.</p></article>
      <article><span class="n">03</span><h3>Keep what you launch</h3><p>You pay your own launch from your own wallet and keep your coin's creator rewards. TEK CITY takes no cut of your launch, your buys or your rewards.</p></article>
    </div>
  </section>

  <section class="wrap section split">
    <div class="sec-head"><span class="kicker">The rules</span><h2>Plain numbers, enforced by the server.</h2><p class="muted">No hidden mechanics. The server sets every roll and position. Every launch and buy links to its transaction on Solana.</p></div>
    <table class="rules">
      <tbody>
        <tr><th>First spin</th><td>Free for every connected wallet</td></tr>
        <tr><th>More spins</th><td>+1 for every 500,000 TEK CITY you buy</td></tr>
        <tr><th>Passing START or landing on the Vault</th><td>+1 free spin</td></tr>
        <tr><th>Launch cost</th><td>Paid from your wallet to Pump.fun. TEK CITY fee: 0%</td></tr>
        <tr><th>Your coin's creator rewards</th><td>100% yours</td></tr>
        <tr><th>Taking over a space</th><td>First buy at least the space's biggest buy-in</td></tr>
        <tr><th>Per transaction</th><td>0.01 to 0.8 SOL</td></tr>
      </tbody>
    </table>
  </section>

  <section class="wrap section">
    <div class="sec-head row-head"><div><span class="kicker">Milestones</span><h2>Bonus spins as TEK CITY grows.</h2></div><a class="btn btn-ghost" href="/milestones">All milestones</a></div>
    <ol class="ladder" id="ladder"></ol>
  </section>

  <section class="wrap section cta-band">
    <h2>The board is live.</h2>
    <p class="muted">Connect Phantom, Solflare, Backpack or another Solana wallet. Without one you can still watch.</p>
    <a class="btn btn-primary btn-lg" href="/play">Open the board</a>
  </section>
</main>`,
  scripts: ["site", "landing"],
});

PAGES.milestones = () => layout({
  path: "/milestones", title: "Milestones · TEK CITY", description: "TEK CITY market-cap milestones and what each one unlocks.",
  body: `<main class="wrap"><section class="page-hero prose"><span class="kicker">Milestones</span><h1>What each milestone unlocks</h1>
  <p class="muted">When the TEK CITY coin first reaches a market cap on pump.fun, that milestone unlocks for good and every player gets bonus free spins. Milestones are gameplay only: they never send SOL or tokens.</p>
  <p class="muted small" id="ms-now"></p></section>
  <ol class="ladder full" id="ladder"></ol>
  <div class="prose mt32"><p class="muted small">TEK CITY tokens provide game utility only. They do not provide equity, dividends, revenue share, profit rights, ownership of Community Fund assets, or guaranteed financial returns.</p></div>
  </main>`,
  scripts: ["site", "landing"],
});

PAGES["how-it-works"] = () => layout({
  path: "/how-it-works", title: "How TEK CITY works", description: "Spins, launching and growing coins, take-overs, and milestones.",
  body: `<main class="wrap"><section class="page-hero prose"><span class="kicker">How it works</span><h1>The board and the coins.</h1>
  <p class="muted">TEK CITY is a 24-space board. Every space except START and the Vault can hold one Pump.fun coin. Empty spaces stay blank until someone launches a coin there; then the coin's name and image fill the space.</p></section>
  <div class="prose">
  <h2>Playing needs a wallet</h2>
  <p>Connect Phantom, Solflare, Backpack or another Solana wallet to play. Without a wallet you can watch the board. Connecting signs a text message only; it isn't a transaction.</p>
  <h2>Spins</h2>
  <ul>
    <li><b>First spin:</b> free for every connected wallet.</li>
    <li><b>Buy TEK CITY:</b> every 500,000 TEK CITY you buy earns 1 more spin. Only real buys count: on-chain purchases your own wallet signed and paid for. Tokens sent to you from another wallet don't. Checked on the server.</li>
    <li><b>Before the TEK CITY token is live:</b> 1 free spin per round for every connected wallet.</li>
    <li><b>Pass START or land on the Vault:</b> +1 free spin.</li>
    <li><b>Milestones:</b> bonus spins for every player when TEK CITY reaches a market cap. See <a href="/milestones">Milestones</a>.</li>
  </ul>
  <p>The server rolls the die. Your browser only shows the result.</p>
  <h2>Launching a coin</h2>
  <p>Land on an empty space, pick a name, ticker and image, and choose your first buy. TEK CITY builds the Pump.fun launch transaction and shows you the full cost first. You approve it in your own wallet and the space becomes your coin.</p>
  <p>Coin launches are paid directly from your connected Solana wallet through the selected launchpad. TEK CITY does not custody or take a percentage of your launch payment. Network and launchpad fees apply as displayed before transaction approval. Your coin's creator rewards go to you.</p>
  <h2>Growing and taking over</h2>
  <ul>
    <li><b>Grow:</b> land on a coin and buy into it on Pump.fun with SOL from your wallet. The amount is added to that space's total.</li>
    <li><b>Take over:</b> launch your own coin on a taken space with a first buy at least as large as the biggest single buy-in on that space. Your coin replaces it on the board. The old coin keeps trading on Pump.fun.</li>
  </ul>
  <h2>pump.fun accounts</h2>
  <p>pump.fun is a venue, not a wallet. Use a Solana wallet you control, such as Phantom, Solflare, or Backpack. SOL and tokens are available when they are held by the wallet you connect. If you log into pump.fun with that same wallet, your pump.fun profile shows up automatically.</p>
  <p class="muted small">TEK CITY tokens provide game utility only. They do not provide equity, dividends, revenue share, profit rights, ownership of Community Fund assets, or guaranteed financial returns.</p>
  </div></main>`,
});

PAGES["wallet-safety"] = () => layout({
  path: "/wallet-safety", title: "Wallet safety · TEK CITY", description: "How TEK CITY uses wallets, and how to stay safe.",
  body: `<main class="wrap"><section class="page-hero prose"><span class="kicker">Safety</span><h1>Wallet safety</h1>
  <p class="muted">TEK CITY is non-custodial. We never hold your keys or your coins.</p></section>
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
      <li>${ic("check")}<span>Signing in asks you to sign a plain text message that starts with "wants you to sign in" and includes "Sign in to TEK CITY". Signing in is not a transaction and costs nothing.</span></li>
      <li>${ic("check")}<span>You approve every launch and buy yourself, in your own wallet. TEK CITY builds the transaction; your wallet shows exactly what it does before you sign.</span></li>
      <li>${ic("check")}<span>Only trust this domain and links posted on the official TEK CITY X account.</span></li>
    </ul>
  </div>
  </div>
  <div class="prose mt32">
  <h2>Before you sign anything</h2>
  <ul>
    <li>Check the address bar shows this domain before you connect.</li>
    <li>Read the message. A TEK CITY sign-in message shows our domain, your address, a one-time code, and an expiration time, and states that it does not authorize any transaction or transfer.</li>
    <li>Launch and buy transactions go to Pump.fun's program. If your wallet shows a transfer to an address you don't recognise, reject it and <a href="/report">report it</a>.</li>
    <li>Sign-in requests expire after 5 minutes and can only be used once.</li>
  </ul>
  <div class="callout red"><b>See something suspicious?</b> Fake sites, DMs from "support", or fake airdrops are scams. <a href="/report">Report it here</a>.</div>
  <h2>pump.fun</h2>
  <p>Coins are launched and traded on Pump.fun. TEK CITY never trades on your behalf. Linking a pump.fun profile by bio code is read-only: it lets us see that profile's public TEK CITY balance and the coins it created.</p>
  </div></main>`,
});

const legal = (path, title, kicker, html) => layout({
  path, title: `${title} · TEK CITY`, description: `${title} for TEK CITY (beta).`,
  body: `<main class="wrap"><section class="page-hero prose"><span class="kicker">${kicker}</span><h1>${title}</h1><p class="muted">Beta draft. Last updated October 2026.</p></section><div class="prose">${html}</div></main>`,
});

PAGES.terms = () => legal("/terms", "Terms of Use", "Legal", `
<p>These terms apply to the TEK CITY beta. By using TEK CITY you agree to them.</p>
<h2>The service</h2><p>TEK CITY is a board-game interface for launching and buying Pump.fun coins on Solana. It is provided as-is during a public beta. Features and rules may change.</p>
<h2>Your wallet, your transactions</h2><p>TEK CITY is non-custodial. We build transactions; you review and sign them in your own wallet. Transactions on Solana are final. You are responsible for your wallet and for the coins you launch or buy.</p>
<h2>Coins you launch</h2><p>You are responsible for the name, ticker, image and description of any coin you launch. Don't launch coins that impersonate others, infringe rights, or are unlawful. We may hide such coins from the board.</p>
<h2>Fair play</h2><p>Don't use bots, exploits, or multiple accounts to manipulate spins, rewards or take-overs. We may limit or remove accounts that do.</p>
<h2>No warranties</h2><p>The service is provided without warranties of any kind. To the extent allowed by law, the operators are not liable for indirect or consequential losses arising from use of the beta.</p>
<h2>Contact</h2><p><a href="/contact">Contact &amp; support</a>.</p>`);

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

PAGES.risk = () => legal("/risk", "Things to know", "Before you start", `
<ul>
<li><b>Transactions are final.</b> Launches and buys settle on Solana and can't be reversed.</li>
<li><b>Prices move.</b> Pump.fun coin prices change constantly. You can sell coins you hold on Pump.fun at any time.</li>
<li><b>Beta software.</b> TEK CITY is in beta and hasn't had an independent security audit yet.</li>
<li><b>Only use official links.</b> Use links from the official TEK CITY X account and never share your seed phrase or private key.</li>
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

PAGES["community-fund"] = () => layout({
  path: "/community-fund", title: "Community Fund · TEK CITY", description: "How the TEK CITY Community Fund is funded, held and used.",
  body: `<main class="wrap"><section class="page-hero prose"><span class="kicker">Community Fund</span><h1>Community Fund</h1>
  <p class="muted">Supports announced TEK CITY game and community programs.</p>
  <p><span class="badge" id="cf-status">Loading</span></p></section>
  <div class="prose" id="cf-root"><p class="muted">Loading…</p></div></main>`,
  scripts: ["site", "landing"],
});

PAGES["404"] = () => layout({
  path: "/404", title: "Not found · TEK CITY", description: "Page not found.",
  body: `<main class="wrap"><section class="page-hero prose"><span class="kicker">404</span><h1>This page isn't on the board.</h1><p class="muted">Check the link on the official TEK CITY X account.</p><p><a class="btn btn-primary" href="/play">Back to the board</a></p></section></main>`,
});

PAGES.play = () => layout({
  path: "/play", title: "Board · TEK CITY", description: "The TEK CITY board.", bodyClass: "play", header: false,
  styles: ["base", "play"], scripts: ["play"],
  body: `<div class="paused-banner" id="paused"></div>
<header class="topbar">
  <a class="logo" href="/" aria-label="TEK CITY home">${LOGO}<b>TEK CITY</b><span class="beta">Beta</span></a>
  <div class="chips" id="chips">
    <div class="chip"><span class="lbl">TEK CITY mcap</span><span class="val" id="c-mcap">--</span></div>
    <div class="chip"><span class="lbl">Players</span><span class="val" id="c-players">--</span></div>
    <div class="chip"><span class="lbl">Next round</span><span class="val" id="c-next">--:--</span></div>
    <div class="chip" id="countdown-box"><span class="lbl">Round ends</span><span class="val" id="countdown" aria-live="off">--:--</span></div>
  </div>
  <div class="top-right" id="top-right"><div id="account-slot"></div></div>
</header>
<main class="play-shell">
  <aside class="col-left">
    <section class="panel" id="player-panel"><h3>Player</h3><div id="player"></div></section>
    <section class="panel"><h3>Milestones <a class="r" href="/milestones">All</a></h3><div id="milestones"></div></section>
  </aside>
  <section class="col-center">
    <div class="board-wrap"><div class="board" id="board"></div></div>
  </section>
  <aside class="col-right">
    <section class="panel"><h3>Spins</h3><div id="vault"></div></section>
    <section class="panel"><h3>Coins on the board <span class="r" id="coins-n"></span></h3><div id="coins"></div></section>
    <section class="panel"><h3>Activity <span class="r live" id="live-dot">live</span></h3><ul class="feed" id="feed"></ul></section>
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
