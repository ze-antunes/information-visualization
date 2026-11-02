import { label } from "./data.js";
export function createWitnesses(onSelect = () => {}) {
  let rows = [],
    index = 0;
  const quote = document.querySelector("#quote"),
    meta = document.querySelector("#quote-meta");
  const previous = document.querySelector("#previous"),
    next = document.querySelector("#next");
  quote.setAttribute("role", "button");
  quote.tabIndex = 0;
  quote.setAttribute(
    "aria-label",
    "Select this witness account to explore reports with the same country and shape",
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
  function render() {
    const row = rows[index];
    previous.disabled = next.disabled = rows.length < 2;
    if (!row) {
      quote.textContent = "No witness comments match these filters.";
      meta.textContent = "";
      document.querySelector("#quote-count").textContent = "0 / 0";
      return;
    }
    // Decode archived entities in an inert document, then insert only text.
    const decoded = new DOMParser().parseFromString(row.comments, "text/html")
      .body.textContent;
    quote.textContent = `“${decoded}”`;
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches)
      quote.animate(
        [
          { opacity: 0, transform: "translateY(10px)" },
          { opacity: 1, transform: "translateY(0)" },
        ],
        { duration: 500, easing: "ease-out" },
      );
    meta.textContent = `${row.city}, ${label(row.country)} · ${row.datetime} · ${row.shape}`;
    document.querySelector("#quote-count").textContent =
      `${index + 1} / ${rows.length.toLocaleString("en")}`;
  }
  previous.addEventListener("click", () => {
    index = (index - 1 + rows.length) % rows.length;
    render();
  });
  next.addEventListener("click", () => {
    index = (index + 1) % rows.length;
    render();
  });
  return {
    next() {
      if (rows.length > 1) {
        index = (index + 1) % rows.length;
        render();
      }
    },
    update(filtered) {
      rows = filtered.filter((d) => d.comments?.trim());
      index = 0;
      render();
    },
  };
}
