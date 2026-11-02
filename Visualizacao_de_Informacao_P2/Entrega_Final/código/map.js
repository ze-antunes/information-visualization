import { mapCells, mapLayers, mapLayerIndex } from "./data.js";
import { shapeIcon, shapeIcons, iconImage } from "./shapes.js";
export function createMap(world, onSelect = () => {}) {
  const W = 960,
    H = 510;
  const svg = d3
    .select("#map")
    .append("svg")
    .attr("viewBox", [0, 0, W, H])
    .attr("role", "group")
    .attr(
      "aria-label",
      "Interactive map with seven zoom layers. Select a cluster or use the zoom controls to reveal more detailed report locations.",
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
  let rows = [],
    cache = new Map(),
    transform = d3.zoomIdentity;
  const duration = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ? 0
    : 300;
  const controls = d3
    .select("#map")
    .insert("div", "svg")
    .attr("class", "map-controls");
  const zoomIn = controls
    .append("button")
    .attr("type", "button")
    .attr("aria-label", "Zoom in")
    .text("+");
  const zoomOut = controls
    .append("button")
    .attr("type", "button")
    .attr("aria-label", "Zoom out")
    .text("−");
  const layerStatus = controls
    .append("span")
    .attr("id", "map-layer")
    .attr("role", "status");
  const zoom = d3
    .zoom()
    .scaleExtent([1, 64])
    .extent([
      [0, 0],
      [W, H],
    ])
    .translateExtent([
      [0, 0],
      [W, H],
    ])
    .on("zoom", (event) => {
      transform = event.transform;
      g.attr("transform", transform);
      tooltip.hidden = true;
      render();
    });
  svg.call(zoom);
  zoomIn.on("click", () =>
    svg.transition().duration(duration).call(zoom.scaleBy, 2),
  );
  zoomOut.on("click", () =>
    svg.transition().duration(duration).call(zoom.scaleBy, 0.5),
  );
  const reset = () => svg.call(zoom.transform, d3.zoomIdentity);
  document.querySelector("#reset-map").addEventListener("click", reset);
  const size = document.querySelector("#map-size");
  size.replaceChildren();
  const sizeText = document.createElement("p");
  size.append(sizeText);
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
    "Original shape icons by José Antunes. The question mark covers other shapes and missing values; tooltips retain the reported category.";
  size.append(credit);
  function describe(d) {
    return `${d.count.toLocaleString("en")} ${d.count === 1 ? "report" : "reports"}\nMost common shape: ${d.shape} (${d.shapeCount.toLocaleString("en")} of ${d.count.toLocaleString("en")})\nCentre: ${d.latitude.toFixed(3)}°, ${d.longitude.toFixed(3)}°${transform.k < 64 ? "\nSelect to explore related reports and zoom in." : "\nSelect to explore related reports. Reports at the same coordinates remain grouped."}`;
  }
  function showTooltip(event, d) {
    tooltip.textContent = describe(d);
    tooltip.hidden = false;
    const bounds = event.currentTarget.getBoundingClientRect();
    const left = event.clientX || bounds.right,
      top = event.clientY || bounds.top;
    tooltip.style.left = `${Math.max(8, Math.min(left + 14, window.innerWidth - 275))}px`;
    tooltip.style.top = `${Math.max(8, Math.min(top + 14, window.innerHeight - 180))}px`;
  }
  function reveal(event, d) {
    event.stopPropagation();
    onSelect(d);
    if (transform.k >= 64) return;
    const k = mapLayers[mapLayerIndex(transform.k) + 1].minZoom;
    const point = projection([d.longitude, d.latitude]);
    const next = d3.zoomIdentity
      .translate(W / 2, H / 2)
      .scale(k)
      .translate(-point[0], -point[1]);
    svg.transition().duration(duration).call(zoom.transform, next);
  }
  function render() {
    const index = mapLayerIndex(transform.k),
      layer = mapLayers[index];
    if (!cache.has(index))
      cache.set(
        index,
        mapCells(rows, layer.degrees).map((d) => ({
          ...d,
          point: projection([d.longitude, d.latitude]),
        })),
      );
    const cells = cache.get(index),
      max = d3.max(cells, (d) => d.count) || 1;
    const visible = cells.filter((d) => {
      const [x, y] = transform.apply(d.point);
      return x >= -35 && x <= W + 35 && y >= -35 && y <= H + 35;
    });
    const scale = d3.scaleSqrt().domain([0, max]).range([0, 38]);
    const iconSize = (d) => Math.max(16, scale(d.count));
    const markers = dots
      .selectAll("g.sighting")
      .data(visible, (d) => d.key)
      .join("g")
      .attr("class", "sighting")
      .attr(
        "transform",
        (d) => `translate(${d.point}) scale(${1 / transform.k})`,
      )
      .attr("tabindex", 0)
      .attr("role", "button")
      .attr("aria-label", (d) => describe(d).replaceAll("\n", ". "));
    markers
      .selectAll("circle")
      .data((d) => [d])
      .join("circle")
      .attr("r", (d) => iconSize(d) / 2 + 4)
      .attr("fill", "#f4f0e6")
      .attr("fill-opacity", 0.9)
      .attr("stroke", "#c7b9a4")
      .attr("stroke-width", 0.6);
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
      .selectAll("text")
      .data((d) => (d.count > 1 ? [d] : []))
      .join("text")
      .attr("class", "cluster-count")
      .attr("y", (d) => iconSize(d) / 2 + 13)
      .attr("text-anchor", "middle")
      .text((d) => d.count.toLocaleString("en"));
    markers
      .on("pointermove", showTooltip)
      .on("pointerleave", () => (tooltip.hidden = true))
      .on("focus", showTooltip)
      .on("blur", () => (tooltip.hidden = true))
      .on("click", reveal)
      .on("dblclick", (event) => {
        event.preventDefault();
        event.stopPropagation();
      })
      .on("keydown", (event, d) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          reveal(event, d);
        }
      });
    markers
      .selectAll("title")
      .data((d) => [d])
      .join("title")
      .text(describe);
    const description = `Layer ${index + 1}/${mapLayers.length} · ${layer.name} · ${transform.k.toFixed(1)}× · ${visible.length.toLocaleString("en")} visible clusters`;
    if (layerStatus.text() !== description) layerStatus.text(description);
    svg.attr("data-layer", index).attr(
      "data-total-reports",
      d3.sum(cells, (d) => d.count),
    );
    zoomIn.property("disabled", transform.k >= 64);
    zoomOut.property("disabled", transform.k <= 1);
    sizeText.textContent = cells.length
      ? `${layer.degrees ? `${layer.degrees}° geographic cells` : "Exact reported coordinates"}. Icon size indicates count (up to ${max.toLocaleString("en")} reports in this layer), with a minimum size for readability. Numbers give exact cluster totals.`
      : "No mapped reports for these filters.";
  }
  function update(filtered) {
    rows = filtered;
    cache.clear();
    tooltip.hidden = true;
    render();
  }
  return { update, reset };
}
