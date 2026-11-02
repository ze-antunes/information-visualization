import { label } from "./data.js";
export function createWitnesses(onSelect = () => {}, onFocusEnd = () => {}) {
  let rows = [],
    index = 0,
    playing = false,
    selectionActive = false,
    timer,
    hovered = false,
    focused = false;
  let intervalSeconds = 15,
    remainingMs = 15000,
    startedAt = null,
    frame;
  const progress = document.querySelector("#story-progress");
  const track = document.querySelector(".story-track");
  const countdown = document.querySelector("#playback-countdown");
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
    "Show this event across the page until its interval ends",
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
  function remaining() {
    return Math.max(
      0,
      remainingMs - (startedAt === null ? 0 : performance.now() - startedAt),
    );
  }
  function paintClock() {
    const left = remaining(),
      ended = !selectionActive && (!rows.length || index === rows.length - 1);
    const fraction = ended
      ? 0
      : Math.min(1, Math.max(0, 1 - left / (intervalSeconds * 1000)));
    progress.style.transform = `scaleX(${fraction})`;
    track.setAttribute("aria-valuenow", String(Math.round(fraction * 100)));
    const text = ended
      ? "No next account"
      : `${startedAt === null ? "Paused" : selectionActive ? "Full sample in" : "Next account in"} · ${Math.ceil(left / 1000)} s`;
    if (countdown.textContent !== text) countdown.textContent = text;
    track.setAttribute("aria-valuetext", text);
  }
  function stopClock() {
    remainingMs = remaining();
    startedAt = null;
    clearTimeout(timer);
    cancelAnimationFrame(frame);
  }
  function schedule(reset = false) {
    stopClock();
    if (reset) remainingMs = intervalSeconds * 1000;
    if (
      playing &&
      (selectionActive || (!hovered && !focused)) &&
      (selectionActive || index < rows.length - 1)
    ) {
      startedAt = performance.now();
      timer = setTimeout(() => {
        stopClock();
        if (selectionActive) {
          onFocusEnd();
          return;
        }
        index++;
        render();
        schedule(true);
      }, remainingMs);
      const tick = () => {
        paintClock();
        frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
    }
    paintClock();
  }
  function render() {
    previous.disabled = !rows.length || index === 0;
    next.disabled = !rows.length || index === rows.length - 1;
    playback.textContent = selectionActive
      ? "Selected reports · the full 80,332-report sample returns when this interval ends"
      : playing && index < rows.length - 1
        ? `Playing in order · one account every ${intervalSeconds} seconds · pauses while you read here`
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
      schedule(true);
    }
  });
  next.addEventListener("click", () => {
    if (index < rows.length - 1) {
      index++;
      render();
      schedule(true);
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
    setSelection(value) {
      selectionActive = value;
      schedule(true);
    },
    setInterval(seconds) {
      if (!Number.isInteger(seconds) || seconds < 1 || seconds > 120)
        return false;
      stopClock();
      intervalSeconds = seconds;
      render();
      schedule(true);
      return true;
    },
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
      schedule(true);
    },
    destroy() {
      stopClock();
    },
  };
}
