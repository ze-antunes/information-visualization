/* Static visualization: all findings remain visible without interaction. */
(async function () {
  const status = document.querySelector("#status");
  try {
    if (!window.d3)
      throw new Error("D3 could not be loaded. Check your connection.");
    const rows = await d3.csv("../cars_alterado.csv", d3.autoType);
    const valid = rows.filter(
      (d) =>
        Number.isFinite(d.Weight) &&
        d.Weight > 0 &&
        Number.isFinite(d.Horsepower) &&
        d.Horsepower > 0 &&
        Number.isFinite(d.Acceleration) &&
        d.Acceleration > 0,
    );
    const flagged = (d) => d.Weight < 500;
    const color = d3.scaleOrdinal(
      ["US", "Europe", "Japan"],
      ["#c07132", "#48836d", "#3b78a1"],
    );
    const radius = d3
      .scaleSqrt()
      .domain([0, d3.max(valid, (d) => d.Acceleration)])
      .range([0, 10]);
    const W = 850,
      H = 520,
      m = { top: 35, right: 24, bottom: 65, left: 65 };
    const x = d3
      .scaleLinear()
      .domain([0, d3.max(valid, (d) => d.Weight)])
      .nice()
      .range([m.left, W - m.right]);
    const y = d3
      .scaleLinear()
      .domain([0, d3.max(valid, (d) => d.Horsepower)])
      .nice()
      .range([H - m.bottom, m.top]);
    const svg = d3.select("#chart").append("svg").attr("viewBox", [0, 0, W, H]);
    svg
      .append("g")
      .attr("class", "grid")
      .attr("transform", `translate(${m.left},0)`)
      .call(
        d3
          .axisLeft(y)
          .ticks(5)
          .tickSize(-(W - m.left - m.right))
          .tickFormat(""),
      );
    for (const ratio of [25, 50, 75]) {
      const end = Math.min(x.domain()[1], (y.domain()[1] * 1000) / ratio);
      svg
        .append("line")
        .attr("x1", x(0))
        .attr("y1", y(0))
        .attr("x2", x(end))
        .attr("y2", y((end * ratio) / 1000))
        .attr("stroke", "#a9b5a2")
        .attr("stroke-dasharray", "4 5");
      svg
        .append("text")
        .attr("class", "ratio-label")
        .attr("x", x(end) - 7)
        .attr("y", y((end * ratio) / 1000) - 8)
        .attr("text-anchor", "end")
        .text(`${ratio} hp / 1,000 lb`);
    }
    svg
      .append("g")
      .attr("transform", `translate(0,${H - m.bottom})`)
      .call(d3.axisBottom(x).ticks(6));
    svg
      .append("g")
      .attr("transform", `translate(${m.left},0)`)
      .call(d3.axisLeft(y).ticks(5));
    svg
      .append("g")
      .selectAll("circle")
      .data(valid.slice().sort((a, b) => b.Acceleration - a.Acceleration))
      .join("circle")
      .attr("cx", (d) => x(d.Weight))
      .attr("cy", (d) => y(d.Horsepower))
      .attr("r", (d) => radius(d.Acceleration))
      .attr("fill", (d) => (flagged(d) ? "none" : color(d.Origin)))
      .attr("fill-opacity", 0.48)
      .attr("stroke", (d) => (flagged(d) ? "#202823" : color(d.Origin)))
      .append("title")
      .text(
        (d) =>
          `${d.Car} (${1900 + d.Model}) — ${d.Horsepower} hp · ${d.Weight} lb · ${d.Acceleration} s${flagged(d) ? " · Suspicious weight" : ""}`,
      );
    svg
      .append("text")
      .attr("class", "axis-label")
      .attr("x", W - m.right)
      .attr("y", H - 16)
      .attr("text-anchor", "end")
      .text("Weight · lb →");
    svg
      .append("text")
      .attr("class", "axis-label")
      .attr("x", m.left)
      .attr("y", 18)
      .text("Horsepower · hp ↑");
    const anomaly = valid.find(flagged);
    if (anomaly)
      svg
        .append("text")
        .attr("x", x(anomaly.Weight) + 14)
        .attr("y", y(anomaly.Horsepower) - 15)
        .attr("font-size", 11)
        .text("283 lb · weight to verify");
    for (const origin of color.domain()) {
      const p = d3.select("#origin-legend").append("p");
      p.append("span")
        .attr("class", "swatch")
        .style("background", color(origin));
      p.append("span").text(
        `${origin} · ${valid.filter((d) => d.Origin === origin).length}`,
      );
    }
    const legend = d3.select("#size-legend");
    [8, 16, 24].forEach((v, i) => {
      legend
        .append("circle")
        .attr("cx", 30 + i * 80)
        .attr("cy", 23)
        .attr("r", radius(v))
        .attr("fill", "none")
        .attr("stroke", "#202823");
      legend
        .append("text")
        .attr("x", 30 + i * 80)
        .attr("y", 57)
        .attr("text-anchor", "middle")
        .attr("font-size", 12)
        .text(`${v} s`);
    });
    const top = valid
      .filter((d) => !flagged(d))
      .sort((a, b) => b.Horsepower / b.Weight - a.Horsepower / a.Weight)
      .slice(0, 5);
    for (const car of top) {
      const tr = d3.select("#ranking").append("tr");
      [
        `${car.Car} · ${1900 + car.Model}`,
        car.Horsepower,
        car.Weight,
        ((car.Horsepower / car.Weight) * 1000).toFixed(1),
      ].forEach((v) => tr.append("td").text(v));
    }
    status.textContent = `${valid.length} cars shown · ${rows.length - valid.length} invalid records excluded · 1 suspicious weight flagged.`;
  } catch (error) {
    status.textContent = `Unable to load the chart. ${error.message} Serve the project over HTTP (see README).`;
  }
})();
