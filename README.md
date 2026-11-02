# Information Visualization

Two D3.js projects for **Information Visualization**, MSc in Design and Multimedia, **University of Coimbra (2022/23)**, revisited for a web portfolio.

**Authors:** José Antunes and Ana Inês França.  
**Supervisors:** Catarina Maçãs and Evgheni Polisciuc.

## 01 · Car Goes Brrr

A static bubble chart explores power-to-weight ratios across **406 cars**. Position encodes weight and horsepower, colour encodes origin, and circle area encodes time to accelerate.

![Power and weight](docs/images/p1.png)

- Responsive layout, aligned size legend and labelled ratio reference lines.
- Visible top-five ranking preserves the assignment's static brief.
- The suspicious **283 lb** Ford Grenada l stays visible but is excluded from the ranking. The original CSV is unchanged.
- Point descriptions and a text table supplement the chart.

Entry: [Car Goes Brrr](Visualizacao_de_Informacao_P1/Projeto_1/src/index.html).

## 02 · The Paranormal

An interactive newspaper explores **80,332 UFO reports**, dated **1906–2014**, through a map, a streamgraph and witness comments.

![Sighting geography](docs/images/p2.png)

- Shared country, shape and inclusive year filters update every view.
- Seven progressive map layers split geographic clusters as you zoom: 20°, 10°, 5°, 2.5°, 1.25°, 0.625°, then exact report coordinates at 64×. Zooming out merges them again. Each cluster uses José Antunes’s original icon for its most frequent reported shape, computed from the underlying reports rather than a vote among child clusters. Ties are resolved alphabetically.
- Cluster counts are explicit. Icon bounding-box area scales with count within each layer, with a minimum size for readability. Icons keep their on-screen size while zooming; only visible clusters are drawn. Filters invalidate the cached layers. Coincident report locations stay grouped at maximum zoom.
- Select a cluster, press Enter/Space, use the +/− buttons or scroll/pinch to explore. The current layer and visible cluster count appear above the map. The question mark represents other or unknown shapes without changing the underlying categories.
- Local world outline, pan/zoom, reset and an illustrated legend. Shape-mode streamgraph legends also use the original icons.
- Streamgraph grouped by country, shape or duration, with complete year bins and a dynamic vertical domain.
- Eight categories plus a **Remaining categories** bucket preserve the long tail. Duration uses ranges instead of selected exact values.
- Selecting a witness account shows that exact event across all views; selecting a cluster or streamgraph band shows its related reports. A click starts the chosen interval, shown by the progress bar. When it ends, all views return to the full **80,332-report sample**, clearing country/shape/year filters and resetting the map. **Pause all** and hiding the tab freeze this countdown. Hover and keyboard focus do not stop playback; the explicit pause control does. **Show full sample** returns immediately. After the selected interval ends, playback stays active and advances immediately to the next witness in the full sample, then continues at the chosen interval. Pausing freezes both the selected countdown and subsequent playback; no random country/shape tour runs.
- The edition starts **fully paused**. **Play witnesses** advances accounts sequentially at the chosen **Interval (seconds)**, from **1 to 120 seconds** (default **15**; saved in this browser), keeping the same denominator and dataset. Changing the interval restarts the waiting period, preserving the current witness and playback state. A progress bar and seconds remaining follow the chosen interval. **Pause all** freezes playback and the clock; resuming continues the remaining time. Hiding the tab also freezes the clock. Previous/Next follow the same sequence without wrapping at either end.
- Chart redraws preserve the current witness and position when the dataset is unchanged. Counters display exact values immediately. No automatic country/shape tours, timed selection resets or decorative looping animations remain.
- Witness comments load once and support optional sequential playback and manual previous/next controls. Dataset text is inserted as text rather than executable HTML.
- Empty states, loading errors and year-range validation.

Entry: [The Paranormal](Visualizacao_de_Informacao_P2/Entrega_Final/código/index.html).

## Run locally

No frontend build, package installation or CDN connection is required. Serve the repository root with **Python 3**:

```sh
python -m http.server 8000 --bind 127.0.0.1
```

Open **http://localhost:8000/**. Use HTTP rather than opening HTML files directly: CSV loading and JavaScript modules require a server. Serve the whole repository because both projects share `vendor/`. The UFO CSV is about 14 MB.

Optional shortcuts with Node.js 22 or later:

```sh
npm start
npm test
```

Tests use Node's built-in runner and check date parsing, duration boundaries, inclusive filters, conservation of streamgraph totals and geographic aggregation. GitHub Actions runs them on pushes and pull requests. There are no npm dependencies.

## GitHub Pages

After pushing, open **Settings → Pages → Build and deployment**, select **Deploy from a branch**, then **main / (root)**. The root landing page links to both projects. `.nojekyll` keeps this a plain static site. Relative asset paths support deployment under a repository subpath.

## Structure

```text
index.html                        Portfolio entry
Visualizacao_de_Informacao_P1/     Car chart, CSV, report and original screenshot
Visualizacao_de_Informacao_P2/     Newspaper, CSV, reports and original assets
vendor/                           Pinned libraries, world outline and licences
docs/images/                      Current browser previews
tests/                            Data transformation checks
.github/workflows/check.yml       Continuous integration
```

P2 starts in `app.js`; `data.js` holds pure normalization and aggregation functions; `map.js`, `streamgraph.js` and `commentcarousel.js` render the views. Original SCSS and the CSS source map remain as academic source material. The revised page uses `index.css` directly; recompiling the legacy SCSS would overwrite the revised styles.

## Data and interpretation

Original CSV files are preserved without corrections.

- **Cars:** the course report describes prior edits, including filled horsepower values. Fields resemble [UCI Auto MPG](https://archive.ics.uci.edu/dataset/9/auto+mpg), but the edited file contains 406 rows and must not be described as the unmodified 398-row UCI release. Acceleration is interpreted as elapsed seconds, consistent with Auto MPG; the supplied CSV has no data dictionary. Rankings describe this file rather than verified vehicle specifications.
- **UFO reports:** country is not inferred from coordinates. Missing country/shape stays **Not recorded**. One invalid coordinate record still contributes to non-geographic views. Dates are explicitly parsed as month/day/year. Missing, negative or non-numeric durations get their own category. Self-reported observations are not evidence of extraterrestrial activity. Counts reflect archive coverage rather than population-adjusted incidence; the final year may have partial coverage.
- The UFO file contains no definitive source or licence notice. Confirm provenance and redistribution terms before representing it as openly licensed. This repository assigns no blanket licence to course materials or datasets.

## Academic materials and credits

PDF reports, screenshots, images and EB Garamond with its OFL licence remain in their existing folders. Original contributions: Ana Inês França — concept, visual structure, palette and report; José Antunes — development. The revision adds coordinated filtering, map data, data handling, responsive presentation and documentation.

The original `The Paranormal.mp4` remains on disk but is excluded from Git because it exceeds GitHub's 100 MiB per-file limit. It can be shared separately with Git LFS or as a release asset.

Bundled dependencies and licences: [vendor/README.md](vendor/README.md).
