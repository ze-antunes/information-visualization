import test from "node:test";
import assert from "node:assert/strict";
import { createStory } from "../Visualizacao_de_Informacao_P2/Entrega_Final/código/story.js";

test("a selected dataset stays fixed regardless of elapsed time", (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const changes = [];
  const story = createStory({ onChange: (value) => changes.push(value) });
  const row = { country: "us" };
  story.focus([row], "US");
  t.mock.timers.tick(120000);
  assert.equal(changes.length, 1);
  assert.ok(changes[0].members.has(row));
  story.overview();
  assert.equal(changes.at(-1), null);
});

test("only a deliberate selection replaces the active dataset", () => {
  const changes = [];
  const story = createStory({ onChange: (value) => changes.push(value) });
  const first = {},
    second = {};
  assert.equal(story.focus([], "Empty"), false);
  story.focus([first], "First");
  story.focus([second], "Second");
  assert.equal(changes.length, 2);
  assert.ok(changes[1].members.has(second));
  assert.ok(!changes[1].members.has(first));
  story.destroy();
  story.overview();
  story.focus([first], "Ignored");
  assert.equal(changes.length, 2);
});
