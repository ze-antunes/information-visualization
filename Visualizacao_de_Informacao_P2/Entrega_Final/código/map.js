import { mapCells } from "./data.js";
export function createMap(world, colors) {
  const W = 960,
    H = 510;
  const svg = d3
    .select("#map")
    .append("svg")
    .attr("viewBox", [0, 0, W, H])
    .attr("role", "img")
    .attr(
      "aria-label",
      "World map of reports aggregated into five degree cells. Use the shared filters to explore.",
    );
  const projection = d3.geoNaturalEarth1().fitExtent(
    [
      [15, 15],
      [W - 15, H - 15],
    ],
    { type: "Sphere" },
  );
  const path = d3.geoPath(projection),
    g = svg.append("g");
  g.append("path")
    .datum({ type: "Sphere" })
    .attr("d", path)
    .attr("fill", "#eae7dd");
  g.append("path")
    .datum(d3.geoGraticule10())
    .attr("d", path)
    .attr("fill", "none")
    .attr("stroke", "#d5d0c4")
    .attr("stroke-width", 0.5);
  if (world)
    g.append("g")
      .selectAll("path")
      .data(topojson.feature(world, world.objects.countries).features)
      .join("path")
      .attr("d", path)
      .attr("fill", "#d3d0c3")
      .attr("stroke", "#f4f0e6")
      .attr("stroke-width", 0.5);
  const dots = g.append("g"),
    tooltip = document.querySelector("#tooltip");
  const zoom = d3
    .zoom()
    .scaleExtent([1, 7])
    .on("zoom", (event) => g.attr("transform", event.transform));
  svg.call(zoom);
  const reset = () => svg.call(zoom.transform, d3.zoomIdentity);
  document.querySelector("#reset-map").addEventListener("click", reset);
  function update(rows) {
    const cells = mapCells(rows),
      max = d3.max(cells, (d) => d.count) || 1;
    const radius = d3.scaleSqrt().domain([0, max]).range([0, 22]);
    dots
      .selectAll("circle")
      .data(cells)
      .join("circle")
      .attr("cx", (d) => projection([d.longitude, d.latitude])[0])
      .attr("cy", (d) => projection([d.longitude, d.latitude])[1])
      .attr("r", (d) => Math.max(2, radius(d.count)))
      .attr("fill", (d) => colors(d.shape))
      .attr("fill-opacity", 0.65)
      .attr("stroke", "#fffaf0")
      .attr("stroke-width", 0.6)
      .on("pointermove", (event, d) => {
        tooltip.textContent = `${d.count.toLocaleString("en")} reports in this cell\nMost common shape: ${d.shape}\nCentre: ${d.latitude.toFixed(1)}°, ${d.longitude.toFixed(1)}°`;
        tooltip.hidden = false;
        tooltip.style.left = `${Math.max(8, Math.min(event.clientX + 14, window.innerWidth - 275))}px`;
        tooltip.style.top = `${Math.max(8, Math.min(event.clientY + 14, window.innerHeight - 110))}px`;
      })
      .on("pointerleave", () => (tooltip.hidden = true))
      .append("title")
      .text((d) => `${d.count} reports · ${d.shape}`);
    const size = document.querySelector("#map-size");
    size.replaceChildren();
    const text = document.createElement("p");
    text.textContent = cells.length
      ? `Circle area: 1 to ${max.toLocaleString("en")} reports per cell. A minimum radius keeps small groups visible. Scale recalculates for each edition.`
      : "No mapped reports for these filters.";
    size.append(text);
    const present = new Set(cells.map((d) => d.shape));
    const keys = colors.domain().filter((key) => present.has(key));
    if ([...present].some((key) => !colors.domain().includes(key)))
      keys.push("Remaining shapes");
    keys.forEach((key) => {
      const item = document.createElement("span");
      item.style.display = "inline-block";
      item.style.marginRight = "12px";
      const swatch = document.createElement("i");
      swatch.style.cssText = `display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:5px;background:${colors(key)}`;
      item.append(swatch, document.createTextNode(key));
      size.append(item);
    });
  }
  return { update, reset };
}
