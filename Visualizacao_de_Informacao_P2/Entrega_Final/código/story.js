// Only deliberate user actions change the active dataset. Playback never does.
export function createStory({ onChange }) {
  let destroyed = false;
  return {
    focus(members, title, source = "Selected") {
      if (destroyed || !members.length) return false;
      onChange({ members: new Set(members), title, source });
      return true;
    },
    overview() {
      if (!destroyed) onChange(null);
    },
    destroy() {
      destroyed = true;
    },
  };
}
