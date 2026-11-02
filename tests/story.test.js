import test from "node:test";
import assert from "node:assert/strict";
import { createStory } from "../Visualizacao_de_Informacao_P2/Entrega_Final/código/story.js";

test("a new focus replaces its timer and restores the edition after eight seconds", (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const changes = [];
  const story = createStory({
    onChange: (value) => changes.push(value),
    onAdvance: () => {},
    playing: false,
  });
  const first = { country: "us" },
    second = { country: "gb" };
  story.focus([first], "US");
  t.mock.timers.tick(4000);
  story.focus([second], "UK");
  t.mock.timers.tick(4000);
  assert.equal(changes.length, 2);
  assert.ok(changes[1].members.has(second));
  assert.ok(!changes[1].members.has(first));
  t.mock.timers.tick(4000);
  assert.equal(changes.at(-1), null);
  story.destroy();
});

test("the tour pauses, resumes and returns to an overview between scenes", (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const changes = [];
  let advances = 0;
  const story = createStory({
    onChange: (value) => changes.push(value),
    onAdvance: () => {
      advances++;
      story.focus([{}], "Scene", "Auto tour");
    },
  });
  story.start();
  story.setPlaying(false);
  t.mock.timers.tick(6000);
  assert.equal(advances, 0);
  story.setPlaying(true);
  t.mock.timers.tick(6000);
  assert.equal(advances, 1);
  assert.equal(changes.at(-1).source, "Auto tour");
  t.mock.timers.tick(8000);
  assert.equal(changes.at(-1), null);
  t.mock.timers.tick(6000);
  assert.equal(advances, 2);
  story.destroy();
});

test("clearing focus cancels stale timers, and teardown stops the tour", (t) => {
  t.mock.timers.enable({ apis: ["setTimeout"] });
  const changes = [];
  const story = createStory({
    onChange: (value) => changes.push(value),
    onAdvance: () => assert.fail("Unexpected scene"),
    playing: false,
  });
  assert.equal(story.focus([], "Empty"), false);
  story.focus([{}], "Selected");
  story.overview();
  t.mock.timers.tick(8000);
  assert.equal(changes.length, 2);
  story.setPlaying(true);
  story.destroy();
  t.mock.timers.tick(10000);
  assert.equal(changes.length, 2);
});
