// Shared behavior for content pages.
import { renderIcons } from "./lib/icons.js";
import { api } from "./lib/api.js";
import { $, $$ } from "./lib/dom.js";

renderIcons();

const toggle = $(".nav-toggle");
if (toggle) toggle.addEventListener("click", () => {
  const nav = $("#site-nav");
  const open = nav.classList.toggle("open");
  toggle.setAttribute("aria-expanded", String(open));
});

$$("[data-copy]").forEach((btn) => btn.addEventListener("click", async () => {
  const text = $("#" + btn.dataset.copy).textContent.trim();
  try { await navigator.clipboard.writeText(text); const t = btn.lastChild.textContent; btn.lastChild.textContent = "Copied"; setTimeout(() => (btn.lastChild.textContent = t), 1400); } catch { /* ignore */ }
}));

// Official links come from server configuration only. Nothing is hardcoded.
if ($("#ol-domain")) {
  api.get("/api/config").then((c) => {
    const o = c.official;
    $("#ol-domain").textContent = o.domain ? `https://${o.domain}` : location.origin;
    const link = (id, url) => {
      const el = $(id);
      if (!url) return;
      el.textContent = "";
      const a = document.createElement("a"); a.href = url; a.rel = "noopener noreferrer"; a.target = "_blank"; a.textContent = url; el.append(a);
    };
    link("#ol-x", o.x); link("#ol-discord", o.discord); link("#ol-telegram", o.telegram);
    if (o.tokenMint) { $("#ol-mint").textContent = o.tokenMint; $("#ol-mint-copy").hidden = false; }
    $("#ol-audit").textContent = o.auditStatus;
    $("#ol-network").textContent = `Solana ${c.solanaNetwork} (sign-in only, no transactions)`;
  }).catch(() => { $("#ol-domain").textContent = location.origin; });
}

// Contact + scam report forms
$$("form[data-support]").forEach((form) => {
  form.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const status = $(".form-status", form);
    const fd = new FormData(form);
    const body = { kind: form.dataset.support };
    for (const [k, v] of fd.entries()) if (String(v).trim()) body[k] = String(v).trim();
    status.className = "form-status"; status.textContent = "Sending…";
    try {
      await api.session();
      const r = await api.post("/api/support", body);
      status.classList.add("ok"); status.textContent = r.message; form.reset();
    } catch (e) { status.classList.add("err"); status.textContent = e.message; }
  });
});
