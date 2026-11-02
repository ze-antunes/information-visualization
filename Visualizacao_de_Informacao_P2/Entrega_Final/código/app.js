import { normalize, filterRows, label } from "./data.js";
import { createMap } from "./map.js";
import { renderStream } from "./streamgraph.js";
import { createWitnesses } from "./commentcarousel.js";
const status = document.querySelector("#status");
(async () => {
  try {
    if (!window.d3 || !window.topojson)
      throw new Error("Visualization libraries unavailable.");
    const raw = await d3.csv("UFO_sights.csv");
    const rows = raw.map(normalize).filter(Boolean);
    if (!rows.length) throw new Error("No valid dated reports in the archive.");
    const extent = d3.extent(rows, (d) => d.year);
    const state = {
      country: "",
      shape: "",
      from: extent[0],
      to: extent[1],
      group: "country",
    };
    const common = d3
      .rollups(
        rows,
        (v) => v.length,
        (d) => d.shape,
      )
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map((d) => d[0]);
    const colors = d3
      .scaleOrdinal(common, d3.schemeTableau10.slice(0, 8))
      .unknown("#858176");
    let world = null;
    try {
      world = await d3.json("../../../vendor/countries-110m.json");
    } catch {
      status.textContent =
        "World outline unavailable; sighting coordinates are still shown.";
    }
    const map = createMap(world, colors);
    const witnesses = createWitnesses();
    for (const field of ["country", "shape"]) {
      const select = document.getElementById(field);
      [...new Set(rows.map((d) => d[field]))]
        .sort((a, b) => label(a).localeCompare(label(b)))
        .forEach((key) => {
          const option = document.createElement("option");
          option.value = key;
          option.textContent = label(key);
          select.append(option);
        });
      select.addEventListener("change", () => {
        state[field] = select.value;
        update();
      });
    }
    for (const field of ["from", "to"]) {
      const input = document.getElementById(field);
      input.disabled = false;
      input.min = extent[0];
      input.max = extent[1];
      input.value = state[field];
      input.addEventListener("change", () => {
        const value = Number(input.value);
        if (
          input.value === "" ||
          !Number.isInteger(value) ||
          value < extent[0] ||
          value > extent[1] ||
          (field === "from" ? value > state.to : value < state.from)
        ) {
          input.value = state[field];
          status.textContent =
            "Choose a valid year range, with From year before To year.";
          return;
        }
        state[field] = value;
        update();
      });
    }
    document.querySelector("#group").addEventListener("change", (event) => {
      state.group = event.target.value;
      update();
    });
    document
      .querySelector("#filters")
      .addEventListener("submit", (event) => event.preventDefault());
    document.querySelector("#filters").addEventListener("reset", (event) => {
      event.preventDefault();
      Object.assign(state, {
        country: "",
        shape: "",
        from: extent[0],
        to: extent[1],
        group: "country",
      });
      for (const field of ["country", "shape", "from", "to", "group"])
        document.getElementById(field).value = state[field];
      map.reset();
      update();
    });
    function selectCategory(key) {
      if (state.group === "duration" || key === "Remaining categories") return;
      state[state.group] = state[state.group] === key ? "" : key;
      document.getElementById(state.group).value = state[state.group];
      update();
    }
    function update() {
      const filtered = filterRows(rows, state);
      const located = filtered.filter((d) => d.located).length;
      status.textContent = `${filtered.length.toLocaleString("en")} of ${rows.length.toLocaleString("en")} dated reports · ${state.from}–${state.to} · ${raw.length - rows.length} invalid dates excluded${world ? "" : " · World outline unavailable"}.`;
      const stats = document.querySelector("#stats");
      stats.replaceChildren();
      [
        [filtered.length.toLocaleString("en"), "reports in this edition"],
        [
          new Set(filtered.map((d) => d.shape)).size,
          "reported shape categories",
        ],
        [located.toLocaleString("en"), "reports with valid coordinates"],
      ].forEach(([value, name]) => {
        const item = document.createElement("div");
        item.className = "stat";
        const strong = document.createElement("strong");
        strong.textContent = value;
        const span = document.createElement("span");
        span.textContent = name;
        item.append(strong, span);
        stats.append(item);
      });
      map.update(filtered);
      document.querySelector("#map-note").textContent =
        `${located.toLocaleString("en")} mapped reports · ${(filtered.length - located).toLocaleString("en")} without usable coordinates. Circle colours indicate shape; see each circle’s tooltip for the category.`;
      renderStream(filtered, state, selectCategory, colors);
      witnesses.update(filtered);
    }
    update();
  } catch (error) {
    status.textContent = `Unable to load the archive. ${error.message} Run a local HTTP server as described in README.`;
  }
})();
