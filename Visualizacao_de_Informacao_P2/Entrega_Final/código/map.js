import { mapCells } from "./data.js";
import { shapeIcon, shapeIcons, iconImage } from "./shapes.js";
export function createMap(world) {
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
    // Square-root scaling makes the icon bounding-box area proportional to count.
    // A minimum size keeps the original drawings recognizable in sparse cells.
    const sizeScale = d3.scaleSqrt().domain([0, max]).range([0, 46]);
    const iconSize = (d) => Math.max(12, sizeScale(d.count));
    const markers = dots
      .selectAll("g.sighting")
      .data(cells)
      .join("g")
      .attr("class", "sighting")
      .attr(
        "transform",
        (d) => `translate(${projection([d.longitude, d.latitude])})`,
      );
    markers
      .selectAll("image")
      .data((d) => [d])
      .join("image")
      .attr("href", (d) => shapeIcon(d.shape))
      .attr("width", iconSize)
      .attr("height", iconSize)
      .attr("x", (d) => -iconSize(d) / 2)
      .attr("y", (d) => -iconSize(d) / 2)
      .attr("preserveAspectRatio", "xMidYMid meet");
    markers
      .on("pointermove", (event, d) => {
        tooltip.textContent = `${d.count.toLocaleString("en")} reports in this cell\nMost common shape: ${d.shape}\nCentre: ${d.latitude.toFixed(1)}°, ${d.longitude.toFixed(1)}°`;
        tooltip.hidden = false;
        tooltip.style.left = `${Math.max(8, Math.min(event.clientX + 14, window.innerWidth - 275))}px`;
        tooltip.style.top = `${Math.max(8, Math.min(event.clientY + 14, window.innerHeight - 110))}px`;
      })
      .on("pointerleave", () => (tooltip.hidden = true))
      .selectAll("title")
      .data((d) => [d])
      .join("title")
      .text((d) => `${d.count} reports · ${d.shape}`);
    const size = document.querySelector("#map-size");
    size.replaceChildren();
    const text = document.createElement("p");
    text.textContent = cells.length
      ? `Icon size: 1 to ${max.toLocaleString("en")} reports per cell. Small groups use a minimum size; size recalculates after filtering. Use tooltips for exact counts.`
      : "No mapped reports for these filters.";
    size.append(text);
    const legend = document.createElement("div");
    legend.className = "map-shape-legend";
    for (const key of [...Object.keys(shapeIcons), "Other / unknown"]) {
      const item = document.createElement("span");
      item.append(iconImage(key), document.createTextNode(key));
      legend.append(item);
    }
    size.append(legend);
    const credit = document.createElement("p");
    credit.className = "note";
    credit.textContent =
      "Original shape icons by José Antunes. The question mark covers other shapes and missing values; each tooltip retains the reported category.";
    size.append(credit);
  }
  return { update, reset };
}
