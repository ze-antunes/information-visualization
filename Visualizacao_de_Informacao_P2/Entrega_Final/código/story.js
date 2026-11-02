// One timer owns the tour. A new interaction replaces the previous focus.
export function createStory({
  onChange,
  onAdvance,
  playing = true,
  focusMs = 8000,
  overviewMs = 6000,
}) {
  let selection = null,
    timer,
    destroyed = false;
  function clear() {
    clearTimeout(timer);
  }
  function scheduleOverview() {
    clear();
    if (playing && !destroyed) timer = setTimeout(onAdvance, overviewMs);
  }
  function overview() {
    if (destroyed) return;
    clear();
    selection = null;
    onChange(null);
    scheduleOverview();
  }
  function focus(members, title, source = "Selected") {
    if (destroyed || !members.length) return false;
    clear();
    selection = { members: new Set(members), title, source };
    onChange(selection);
    // Manual selections remain temporary even when the automatic tour is paused.
    timer = setTimeout(overview, focusMs);
    return true;
  }
  return {
    focus,
    overview,
    setPlaying(value) {
      playing = value;
      if (!selection) scheduleOverview();
    },
    start: scheduleOverview,
    destroy() {
      destroyed = true;
      clear();
    },
  };
}
