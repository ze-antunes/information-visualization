import { label } from "./data.js";
export function createWitnesses() {
  let rows = [],
    index = 0;
  const quote = document.querySelector("#quote"),
    meta = document.querySelector("#quote-meta");
  const previous = document.querySelector("#previous"),
    next = document.querySelector("#next");
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
    update(filtered) {
      rows = filtered.filter((d) => d.comments?.trim());
      index = 0;
      render();
    },
  };
}
