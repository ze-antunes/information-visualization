import test from "node:test";
import assert from "node:assert/strict";
import {
  normalize,
  filterRows,
  aggregateYears,
  mapCells,
  durationGroup,
  UNKNOWN,
} from "../Visualizacao_de_Informacao_P2/Entrega_Final/código/data.js";
const fixture = (extra = {}) =>
  normalize({
    datetime: "10/10/2001 20:30",
    country: "us",
    shape: "light",
    latitude: "30",
    "longitude ": "-90",
    "duration (seconds)": "120",
    ...extra,
  });
test("explicit US dates reject impossible calendar dates and keep unknown fields", () => {
  assert.equal(fixture().year, 2001);
  assert.equal(fixture({ datetime: "2/29/2001 10:00" }), null);
  assert.equal(fixture({ datetime: "2/29/2000 10:00" }).year, 2000);
  assert.equal(fixture({ country: "" }).country, UNKNOWN);
  assert.equal(fixture({ latitude: "" }).located, false);
  assert.equal(fixture({ "longitude ": "181" }).located, false);
});
test("duration bins cover boundaries, missing and negative durations", () => {
  for (const [value, expected] of [
    ["59", "Under 1 min"],
    ["60", "1–5 min"],
    ["300", "5–30 min"],
    ["1800", "30 min or more"],
    ["", UNKNOWN],
    ["-1", UNKNOWN],
  ])
    assert.equal(
      durationGroup(fixture({ "duration (seconds)": value })),
      expected,
    );
});
test("stack totals conserve every report, including long-tail and unknown categories", () => {
  const rows = Array.from({ length: 15 }, (_, i) =>
    fixture({
      shape: i === 0 ? "" : `shape-${i}`,
      datetime: `1/1/${2000 + (i % 3)} 12:00`,
    }),
  );
  for (const mode of ["country", "shape", "duration"]) {
    const result = aggregateYears(rows, mode, 1999, 2003);
    assert.equal(result.years.length, 5);
    assert.equal(
      result.years.reduce(
        (sum, y) => sum + result.keys.reduce((n, k) => n + y[k], 0),
        0,
      ),
      rows.length,
    );
    assert.ok(
      result.years.every((y) =>
        result.keys.every((k) => Number.isFinite(y[k])),
      ),
    );
  }
  assert.ok(
    aggregateYears(rows, "shape", 2000, 2002).keys.includes(
      "Remaining categories",
    ),
  );
});
test("shared filters are inclusive and empty editions remain valid", () => {
  const rows = [
    fixture(),
    fixture({ country: "gb" }),
    fixture({ datetime: "1/1/2002 10:00" }),
  ];
  assert.equal(
    filterRows(rows, { country: "us", shape: "light", from: 2001, to: 2001 })
      .length,
    1,
  );
  assert.equal(
    filterRows(rows, { country: "de", shape: "", from: 2000, to: 2002 }).length,
    0,
  );
  assert.deepEqual(aggregateYears([], "country", 2001, 2001).keys, []);
});
test("geographic aggregation conserves located records and keeps eastern longitudes separate", () => {
  const rows = [
    fixture(),
    fixture(),
    fixture({ "longitude ": "10" }),
    fixture({ "longitude ": "170" }),
    fixture({ latitude: "" }),
  ];
  const cells = mapCells(rows);
  assert.equal(
    cells.reduce((n, c) => n + c.count, 0),
    4,
  );
  assert.equal(cells.length, 3);
  assert.equal(cells.find((c) => c.count === 2).shape, "light");
});
