import { normalize, filterRows, label } from "./data.js";
import { createMap } from "./map.js";
import { renderStream } from "./streamgraph.js";
import { createWitnesses } from "./commentcarousel.js";
import { createStory } from "./story.js";
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
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
    let selection = null,
      playing = false;
    const banner = document.querySelector("#story-status");
    const toggle = document.querySelector("#story-toggle");
    const progress = document.querySelector("#story-progress");
    const overviewButton = document.querySelector("#story-overview");
    const story = createStory({
      onChange(next) {
        selection = next;
        update();
      },
    });
    const map = createMap(world, (cell) =>
      story.focus(
        cell.members,
        `Map cluster · ${cell.count.toLocaleString("en")} reports · ${cell.shape}`,
      ),
    );
    const witnesses = createWitnesses((row) =>
      story.focus(
        filterRows(rows, state).filter(
          (d) => d.country === row.country && d.shape === row.shape,
        ),
        `${label(row.country)} · ${row.shape} · related witness reports`,
      ),
    );
    const intervalInput = document.querySelector("#playback-interval");
    let intervalSeconds = 15;
    try {
      const saved = Number(localStorage.getItem("paranormal-witness-interval"));
      if (Number.isInteger(saved) && saved >= 1 && saved <= 120)
        intervalSeconds = saved;
    } catch {}
    intervalInput.value = intervalSeconds;
    witnesses.setInterval(intervalSeconds);
    intervalInput.addEventListener("change", () => {
      const seconds = Number(intervalInput.value);
      if (!intervalInput.value || !witnesses.setInterval(seconds)) {
        intervalInput.value = intervalSeconds;
        return;
      }
      intervalSeconds = seconds;
      try {
        localStorage.setItem("paranormal-witness-interval", String(seconds));
      } catch {}
    });
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
        story.overview();
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
        story.overview();
      });
    }
    document.querySelector("#group").addEventListener("change", (event) => {
      state.group = event.target.value;
      story.overview();
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
      story.overview();
    });
    function selectCategory(key, members) {
      story.focus(
        members,
        `${state.group === "country" ? "Country" : state.group === "shape" ? "Shape" : "Duration"}: ${label(key)}`,
      );
    }
    function setPlaying(value) {
      playing = value;
      witnesses.setPlaying(playing && !document.hidden);
      document.documentElement.dataset.motion = playing ? "playing" : "paused";
      if (!playing) {
        document.getAnimations().forEach((animation) => animation.cancel());
        d3.select("#map svg").interrupt();
      }
      refreshBanner();
    }
    toggle.addEventListener("click", () => setPlaying(!playing));
    overviewButton.addEventListener("click", () => story.overview());
    document.addEventListener("visibilitychange", () =>
      witnesses.setPlaying(playing && !document.hidden),
    );
    reducedMotion.addEventListener("change", (event) => {
      if (event.matches) setPlaying(false);
    });
    function refreshBanner() {
      toggle.textContent = playing ? "Pause all" : "Play witnesses";
      toggle.setAttribute("aria-pressed", String(playing));
      overviewButton.disabled = !selection;
      banner.textContent = selection
        ? `${selection.title} · selection held until you choose “Show my edition”`
        : "One edition · use the filters or select data to change this set";
      progress.hidden = true;
      document.querySelector("#story").dataset.playing = String(playing);
      document.querySelector("#story").dataset.focused = String(!!selection);
    }
    function update() {
      const base = filterRows(rows, state);
      const filtered = selection
        ? base.filter((d) => selection.members.has(d))
        : base;
      refreshBanner();
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
        `${located.toLocaleString("en")} mapped reports · ${(filtered.length - located).toLocaleString("en")} without usable coordinates. Icons show the most common shape in each cell; see tooltips for exact categories and counts.`;
      renderStream(filtered, state, selectCategory, colors);
      witnesses.update(filtered);
    }
    setPlaying(false);
    update();
    window.addEventListener(
      "pagehide",
      () => {
        story.destroy();
        witnesses.destroy();
      },
      { once: true },
    );
  } catch (error) {
    status.textContent = `Unable to load the archive. ${error.message} Run a local HTTP server as described in README.`;
  }
})();
