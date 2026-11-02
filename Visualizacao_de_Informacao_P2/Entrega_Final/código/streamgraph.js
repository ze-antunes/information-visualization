import { aggregateYears, label } from "./data.js";
import { iconImage } from "./shapes.js";
export function renderStream(rows, state, selectCategory, shapeColors) {
  const host = d3.select("#streamgraph");
  host.selectAll("*").remove();
  const legend = document.querySelector("#legend");
  legend.replaceChildren();
  const detail = document.querySelector("#chart-detail");
  detail.textContent = rows.length
    ? "Hover or focus a band to read its total."
    : "No reports match this edition. Change or reset the filters.";
  if (!rows.length) return;
  const { keys, years } = aggregateYears(
    rows,
    state.group,
    state.from,
    state.to,
  );
  const stacked = d3.stack().keys(keys).offset(d3.stackOffsetSilhouette)(years);
  const W = 1100,
    H = 340,
    m = { top: 18, right: 20, bottom: 40, left: 20 };
  const x = d3
    .scaleLinear()
    .domain(
      state.from === state.to
        ? [state.from - 0.5, state.to + 0.5]
        : [state.from, state.to],
    )
    .range([m.left, W - m.right]);
  const bound =
    d3.max(stacked, (layer) => d3.max(layer, (d) => Math.abs(d[1]))) || 1;
  const y = d3
    .scaleLinear()
    .domain([-bound, bound])
    .range([H - m.bottom, m.top]);
  const color =
    state.group === "shape"
      ? shapeColors
      : d3.scaleOrdinal(d3.schemeTableau10).domain(keys);
  const svg = host
    .append("svg")
    .attr("viewBox", [0, 0, W, H])
    .attr("role", "group")
    .attr("aria-label", `Streamgraph of report counts by ${state.group}`);
  svg
    .append("g")
    .attr("transform", `translate(0,${H - m.bottom})`)
    .call(
      d3
        .axisBottom(x)
        .ticks(Math.min(10, state.to - state.from + 1))
        .tickFormat(d3.format("d")),
    );
  const total = (key) => d3.sum(years, (d) => d[key]);
  const describe = (key) => {
    detail.textContent = `${label(key)} · ${total(key).toLocaleString("en")} reports · ${state.from}–${state.to}`;
  };
  const canSelect = (key) =>
    state.group !== "duration" && key !== "Remaining categories";
  const area = d3
    .area()
    .x((d) => x(d.data.year))
    .y0((d) => y(d[0]))
    .y1((d) => y(d[1]));
  svg
    .selectAll(".band")
    .data(stacked)
    .join("path")
    .attr("class", "band")
    .attr("fill", (d) => color(d.key))
    .attr("d", area)
    .attr("stroke", "#f4f0e6")
    .attr("stroke-width", 0.4)
    .attr("tabindex", 0)
    .attr("role", (d) => (canSelect(d.key) ? "button" : "img"))
    .attr(
      "aria-label",
      (d) =>
        `${label(d.key)}: ${total(d.key)} reports${canSelect(d.key) ? ". Select to filter" : ""}`,
    )
    .on("pointerenter", function (event, d) {
      describe(d.key);
      d3.select(this).attr("opacity", 0.75);
    })
    .on("pointerleave", function () {
      d3.select(this).attr("opacity", 1);
    })
    .on("focus", (event, d) => describe(d.key))
    .on("click", (event, d) => selectCategory(d.key))
    .on("keydown", (event, d) => {
      if (canSelect(d.key) && (event.key === "Enter" || event.key === " ")) {
        event.preventDefault();
        selectCategory(d.key);
      }
    })
    .append("title")
    .text((d) => `${label(d.key)}: ${total(d.key)} reports`);
  if (state.from === state.to) {
    svg
      .selectAll(".band")
      .attr(
        "d",
        (d) => `M${x(state.from) - 8},${y(d[0][0])}h16V${y(d[0][1])}h-16Z`,
      );
  }
  keys.forEach((key) => {
    const button = document.createElement("button");
    button.type = "button";
    const swatch = document.createElement("i");
    swatch.style.background = color(key);
    if (state.group === "shape") button.append(iconImage(key));
    button.append(
      swatch,
      document.createTextNode(
        `${label(key)} · ${total(key).toLocaleString("en")}`,
      ),
    );
    button.addEventListener("focus", () => describe(key));
    button.addEventListener("pointerenter", () => describe(key));
    button.addEventListener("click", () => {
      describe(key);
      selectCategory(key);
    });
    legend.append(button);
  });
}
