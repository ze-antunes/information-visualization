import { label } from "./data.js";
export function createWitnesses(onSelect = () => {}) {
  let rows = [],
    index = 0,
    playing = false,
    timer,
    hovered = false,
    focused = false;
  const quote = document.querySelector("#quote"),
    meta = document.querySelector("#quote-meta");
  const previous = document.querySelector("#previous"),
    next = document.querySelector("#next");
  const section = quote.closest("article");
  const scope = document.createElement("p");
  scope.id = "witness-scope";
  scope.className = "note";
  quote.before(scope);
  const playback = document.createElement("p");
  playback.className = "note";
  playback.id = "witness-playback";
  document.querySelector(".quote-controls").after(playback);
  quote.setAttribute("role", "button");
  quote.tabIndex = 0;
  quote.setAttribute(
    "aria-label",
    "Explore reports with the same country and shape as this witness",
  );
  const select = () => {
    if (rows[index]) onSelect(rows[index]);
  };
  quote.addEventListener("click", select);
  quote.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      select();
    }
  });
  function schedule() {
    clearTimeout(timer);
    if (playing && !hovered && !focused && index < rows.length - 1)
      timer = setTimeout(() => {
        index++;
        render();
        schedule();
      }, 15000);
  }
  function render() {
    previous.disabled = !rows.length || index === 0;
    next.disabled = !rows.length || index === rows.length - 1;
    playback.textContent =
      playing && index < rows.length - 1
        ? "Playing in order · one account every 15 seconds · pauses while you read here"
        : index === rows.length - 1 && rows.length > 0
          ? "End of this edition’s witness accounts"
          : "Paused · use Previous / Next or Play witnesses";
    const row = rows[index];
    document.querySelector("#quote-count").textContent = rows.length
      ? `${index + 1} / ${rows.length.toLocaleString("en")}`
      : "0 / 0";
    if (!row) {
      quote.textContent = "No witness comments match these filters.";
      meta.textContent = "";
      return;
    }
    const decoded = new DOMParser().parseFromString(row.comments, "text/html")
      .body.textContent;
    quote.textContent = `“${decoded}”`;
    meta.textContent = `${row.city}, ${label(row.country)} · ${row.datetime} · ${row.shape}`;
    if (
      playing &&
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      quote.animate([{ opacity: 0.25 }, { opacity: 1 }], { duration: 600 });
  }
  previous.addEventListener("click", () => {
    if (index > 0) {
      index--;
      render();
      schedule();
    }
  });
  next.addEventListener("click", () => {
    if (index < rows.length - 1) {
      index++;
      render();
      schedule();
    }
  });
  section.addEventListener("pointerenter", () => {
    hovered = true;
    schedule();
  });
  section.addEventListener("pointerleave", () => {
    hovered = false;
    schedule();
  });
  section.addEventListener("focusin", () => {
    focused = true;
    schedule();
  });
  section.addEventListener("focusout", (event) => {
    focused = section.contains(event.relatedTarget);
    schedule();
  });
  return {
    setPlaying(value) {
      playing = value;
      render();
      schedule();
    },
    update(filtered) {
      const nextRows = filtered.filter((d) => d.comments?.trim());
      scope.textContent = `${nextRows.length.toLocaleString("en")} witness accounts from ${filtered.length.toLocaleString("en")} reports in this edition · ${(filtered.length - nextRows.length).toLocaleString("en")} reports have no comment.`;
      // Redrawing charts or changing their grouping does not reset the sequence.
      if (
        nextRows.length === rows.length &&
        nextRows.every((row, i) => row === rows[i])
      )
        return;
      const current = rows[index];
      rows = nextRows;
      index = Math.max(0, rows.indexOf(current));
      render();
      schedule();
    },
    destroy() {
      clearTimeout(timer);
    },
  };
}
