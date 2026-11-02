export const UNKNOWN = "Not recorded";
export const countryNames = {
  us: "United States",
  gb: "United Kingdom",
  ca: "Canada",
  au: "Australia",
  de: "Germany",
};
export const label = (key) => countryNames[key] || key;
export function normalize(row) {
  const match = /^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s|$)/.exec(
    row.datetime || "",
  );
  if (!match) return null;
  const [, month, day, year] = match.map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  )
    return null;
  const number = (v) => (String(v ?? "").trim() === "" ? NaN : Number(v));
  const latitude = number(row.latitude),
    longitude = number(row["longitude "]);
  const duration = number(row["duration (seconds)"]);
  return {
    ...row,
    year,
    country: row.country.trim().toLowerCase() || UNKNOWN,
    shape: row.shape.trim().toLowerCase() || UNKNOWN,
    duration,
    latitude,
    longitude,
    located:
      Number.isFinite(latitude) &&
      Math.abs(latitude) <= 90 &&
      Number.isFinite(longitude) &&
      Math.abs(longitude) <= 180,
  };
}
export function durationGroup(d) {
  if (!Number.isFinite(d.duration) || d.duration < 0) return UNKNOWN;
  return d.duration < 60
    ? "Under 1 min"
    : d.duration < 300
      ? "1–5 min"
      : d.duration < 1800
        ? "5–30 min"
        : "30 min or more";
}
export function filterRows(rows, state) {
  return rows.filter(
    (d) =>
      (!state.country || d.country === state.country) &&
      (!state.shape || d.shape === state.shape) &&
      d.year >= state.from &&
      d.year <= state.to,
  );
}
export function aggregateYears(rows, mode, from, to) {
  const category = (d) => (mode === "duration" ? durationGroup(d) : d[mode]);
  const totals = new Map();
  rows.forEach((d) =>
    totals.set(category(d), (totals.get(category(d)) || 0) + 1),
  );
  const ranked = [...totals].sort((a, b) => b[1] - a[1]);
  // Reserve a distinct bucket so a literal "other" shape is not confused with aggregation.
  const keys = ranked.slice(0, 8).map((d) => d[0]);
  const overflow = ranked.length > 8;
  if (overflow) keys.push("Remaining categories");
  const years = Array.from({ length: to - from + 1 }, (_, i) =>
    Object.assign(
      { year: from + i },
      Object.fromEntries(keys.map((k) => [k, 0])),
    ),
  );
  rows.forEach((d) => {
    const key = keys.includes(category(d))
      ? category(d)
      : "Remaining categories";
    years[d.year - from][key]++;
  });
  return { keys, years, totals };
}
export function mapCells(rows) {
  const groups = new Map();
  rows
    .filter((d) => d.located)
    .forEach((d) => {
      const lon = Math.min(71, Math.floor((d.longitude + 180) / 5)),
        lat = Math.min(35, Math.floor((d.latitude + 90) / 5));
      const key = `${lon},${lat}`;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key).push(d);
    });
  return [...groups.values()].map((items) => {
    const counts = new Map();
    items.forEach((d) => counts.set(d.shape, (counts.get(d.shape) || 0) + 1));
    return {
      count: items.length,
      longitude: items.reduce((s, d) => s + d.longitude, 0) / items.length,
      latitude: items.reduce((s, d) => s + d.latitude, 0) / items.length,
      shape: [...counts].sort((a, b) => b[1] - a[1])[0][0],
    };
  });
}
