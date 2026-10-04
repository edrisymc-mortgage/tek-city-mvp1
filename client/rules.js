import "./site.js";
import { api } from "./lib/api.js";
import { $, h } from "./lib/dom.js";

api.get("/api/state").then((s) => {
  const tb = $("#hood-table");
  for (const n of Object.values(s.neighborhoods)) {
    tb.append(h("tr", {}, h("td", {}, h("b", { text: n.name })), h("td", { text: n.effect })));
  }
}).catch(() => {});
