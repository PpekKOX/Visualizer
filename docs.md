# Visualizer – developer docs

## Getting started

Requirements: Node.js 22.12 or newer.

```bash
npm install        # installs all workspaces
npm run dev        # backend on :3000 + frontend (Vite) on :5173, /api is proxied
npm test           # backend + frontend tests
npm run typecheck
npm run build      # builds backend/dist and frontend/dist, exports the API and prerenders the pages
npm start          # production: Express serves the API and the built frontend on :3000 (PORT to override)
```

## Project structure

```
shared/      TypeScript types for the API contract (types only, no runtime code)
backend/     Express API (TypeScript)
	data/    Algorithm content as JSON (descriptions, complexity, code per language)
	src/     Repository (loads JSON), routes, app, server, static API export
frontend/    Vanilla TypeScript + Vite + Tailwind CSS
	src/algorithms/ Step generators and visualizers, grouped by category
	src/components/ Code panel, variables panel, playback controls, algorithm header and info, live preview
	src/pages/      Home, algorithm and message (404 / error) pages
	prerender.ts    Writes the static pages, sitemap.xml and robots.txt after the build (src/staticPages.ts)
	src/router.ts   History API router (/:category/:algorithm)
	src/player.ts   Step playback (play, pause, step, seek, speed)
```

### API

| Method | Path                                    | Response             |
| ------ | --------------------------------------- | -------------------- |
| GET    | `/api/categories.json`                  | `CategorySummary[]`  |
| GET    | `/api/algorithms/:category/:slug.json`  | `AlgorithmDetails`   |

The paths end in `.json` so that the same URLs work without a server (see [Deployment](#deployment)).

## Deployment

The API only reads the JSON files in `backend/data`, so the whole app can run as a static site. `npm run build`
ends with `npm run export -w backend` (`backend/src/exportApi.ts`), which writes every API response to a file at
the same path, e.g. `frontend/dist/api/algorithms/sortingAlgorithms/quicksort.json`. `staticApi.test.ts` checks
that every exported file is identical to the live API response.

`frontend/dist` can therefore be deployed in two ways:

- **Static hosting** (e.g. Cloudflare Pages): build command `npm run build`, output directory `frontend/dist`.
	The host must serve `sortingAlgorithms/quicksort.html` for `/sortingAlgorithms/quicksort` and `404.html` with
	status 404 for unknown paths. Cloudflare Pages does both on its own.
- **Node server**: `npm run build` and `npm start`. Express serves the same API, the prerendered pages and the
	built frontend, and answers unknown paths with `index.html`.

The frontend fetches the same URLs in both cases, so switching between them needs no code changes.

### Search engines

Many crawlers do not run JavaScript, so the build ends with `npm run prerender -w frontend` (`frontend/prerender.ts`).
It reads the exported API and writes:

- `<category>/<slug>.html` for every algorithm: the built `index.html` with the algorithm's own title, description,
	canonical URL and Open Graph tags, and the page header and explanation in `#outlet`. It uses the same functions as
	the app (`algorithmHeaderHtml`, `algorithmInfoHtml`), and the router replaces this content when the app starts.
- `404.html`, so unknown paths get a real 404 status, while the app still shows its "Page not found" page.
- `sitemap.xml` with every page and `robots.txt`, which points to it.

The site URL is `SITE_URL` in `frontend/prerender.ts`. The home page's title, description and canonical URL are in
`frontend/index.html`, and `algorithmTitle` (`components/algorithmHeader.ts`) builds the title of every algorithm
page. `staticPages.test.ts` checks the pages against the real `index.html`.

Link previews (Discord, X, …) come from the Open Graph tags. Every page has its own title and description, and all
of them show `https://openvisualizer.com/social-preview.png` (`frontend/public/social-preview.png`), a 2560 × 1280
screenshot of the home page taken in a 1600 × 800 window. The same image is the repository's social preview on GitHub.

### Code splitting

The build splits the JavaScript into small minified chunks, and no source maps are published:

- `vendor` – everything from `node_modules` (highlight.js), set up in `frontend/vite.config.ts`. It rarely
	changes, so browsers keep it cached between releases.
- `algorithmPage` – loaded with `import()` in `main.ts` when an algorithm route is opened.
- one chunk per category (`sortingAlgorithms`, `graphAlgorithms`, …) – `registry.ts` loads a category only
	when one of its algorithms is needed. An algorithm page only loads its own category, while the home page
	loads all of them for the card snapshots.

## How a visualization works

The frontend runs the algorithm once and records every step up front. A step is:

```ts
{ line: "compare", message: "Compare arr[1] and arr[2]: …", variables: { i: 0, j: 1 }, state: { array, comparing, … } }
```

- `state` is drawn by the category's visualizer (e.g. the bar chart for sorting).
- `variables` fill the variables panel. Values that differ from the previous step are highlighted. A value can
	be a number, a string, a boolean, a list or a map of numbers (like `inDegree` in Topological Sort).
	`Infinity` is shown as `∞` in every language.
- `line` is a language-independent **step key**. Each language's code in the JSON maps step keys to the
	1-based line numbers that run during that step:

```json
"python": {
	"lines": ["def bubble_sort(arr):", "    n = len(arr)", "..."],
	"steps": { "init": [2], "compare": [6], "swap": [7, 8] },
	"identifiers": { "minIndex": "min_index" }
}
```

This lets one generator drive the highlighting in every language, even when a language needs more lines
for the same step (a Java swap takes four lines, a Python swap one). `identifiers` is optional and maps a
variable or function name used by the generator to the name used in that language's code.

The `Player` only moves an index through the recorded steps, so stepping backwards is free.

### Recursive algorithms

Recursive algorithms (Merge Sort, Quick Sort) wrap every function call in `trace.call(name, args, range)`
and `trace.return()`. Each recorded step then also carries:

- `callStack` – shown above the variables, so it is clear which call is running (`mergeSort(arr, 0, 4)`),
- `state.range` – the part of the array the current call works on; the bar chart dims everything else.

The `variables` of a step always belong to the innermost call.

### Searching algorithms

Binary Search reuses the bar chart of the sorting algorithms with its own legend (`new BarChart(compact, highlights)`):
the middle element is amber, the found element is green and `state.range` dims everything outside `low..high`.
`createSearchingModule` (`searching/searchingModule.ts`) creates a sorted array of 15 distinct values and a target,
which is missing from the array in about a quarter of the runs.

### Graph algorithms

A `Graph` (`graph/graphState.ts`) has nodes with a label and a position, edges as pairs of node indices, a
`directed` flag and optional edge `weights`. `graph/randomGraph.ts` puts the labels A–G in a random order on a
fixed layout of four columns:

- `randomDag()` only adds edges from one column to the next, so the graph never has a cycle (Topological Sort).
- `randomUndirectedGraph()` picks a random spanning tree, so the graph is connected, and adds a few extra edges,
	so it has cycles (BFS, DFS). Every square of four nodes gets only one of its diagonals, so no edges cross.
- `randomWeightedGraph()` also gives every edge a weight from 1 to 9 (Dijkstra).

The step generators use `GraphTracer` (`graph/graphTracer.ts`), the graph version of `SortTracer`. It gets a
function that returns the algorithm's own lists (`waiting`, `done` and optional `badges`), and
`trace.record(stepKey, message, variables, { current, edge })` takes a snapshot of them. `trace.neighbors(node)`
returns the neighbors in alphabetical order, the same order the code examples use, and `call` / `return` keep the
call stack of recursive algorithms (DFS).

`GraphView` draws the state as SVG without knowing which algorithm runs:

| State          | Shown as                                  | For example                                     |
| -------------- | ----------------------------------------- | ----------------------------------------------- |
| `current`      | violet node                               | the node that is being processed                |
| `waiting`      | amber nodes                               | the queue, the call stack, a tentative distance |
| `done`         | green nodes                               | the order, the visited nodes, a final distance  |
| `activeEdge`   | red edge and a red badge on its other end | the edge that is being checked                  |
| `treeEdges`    | green edges                               | the edges that reached a node, shortest paths   |
| `removedEdges` | faded edges                               | the edges Kahn's algorithm removed              |
| `badges`       | small number next to every node           | the in-degree, the distance                     |

Every graph algorithm exports a `GraphAlgorithmConfig` (e.g. `dijkstraConfig`) with its step generator, its random
graph, the sound of each step key and the labels for the legend and for the lists below the graph. The chips in
those lists have the same colour as their node.

### Pathfinding algorithms

A `Grid` (`pathfinding/gridState.ts`) has `rows × cols` cells numbered row by row, the walls, a start and a goal.
Cells are named like on a chess board, with a column letter and a row number (`C4`), and the view labels its axes
the same way. `randomGrid()` (`pathfinding/randomGrid.ts`) draws a few random wall segments on a 12 × 6 grid, with
the start in the first column and the goal in the last one. It tries again until a path exists that is longer than
the Manhattan distance, so a wall is always in the way.

The code examples get the grid as a graph (`graph[cell]` lists the free neighbors up, right, down and left) and a
map `h` with the Manhattan distance from every cell to the goal. `pathfinding/grid.ts` has the same helpers for the
step generators (`freeNeighbors`, `manhattan`) and `stepsFromStart`, a breadth-first search that the tests and the
last message of Greedy best-first search use as the real shortest distance.

Both algorithms pick the open cell with the lowest priority (f = g + h for A*, h for Greedy). On a tie the cell added
last wins (`lowest` in `pathfinding/gridTracer.ts`, the `<=` in the code), so the search keeps following its newest
path instead of spreading out. Picking a cell and taking it out of the open list is a single step (`pickCell`),
which keeps A* at about 135 steps on average. `GridTracer` records the steps like `GraphTracer`: a function returns
the open list, the explored cells and the number shown in every cell (`scores`), and `trace.tracePath(parent, record)`
follows the parents back from the goal. Once the path has a cell, every step also gets the `path` variable.

`GridView` draws the state as SVG, walls in grey and the start and the goal as S and G:

| State      | Shown as                                                                 |
| ---------- | ------------------------------------------------------------------------ |
| `current`  | violet cell                                                              |
| `open`     | amber cells (the open list)                                              |
| `explored` | blue cells, already taken out of the open list                           |
| `path`     | green cells                                                              |
| `neighbor` | red outline around the neighbor that is being checked                    |
| `scores`   | number in a cell, f for A* and h for Greedy (hidden in the compact view) |

Every pathfinding algorithm exports a `PathfindingConfig` (e.g. `aStarConfig`) with its step generator, the sound
of each step key and the name of the number in the cells (`view.score`).

### Sound

Every time the shown step changes, the page asks the module what the step does (`actionOf(step)`:
`compare`, `write`, `select` or `other`) and `Sound` (`frontend/src/sound.ts`) plays the matching effect.
The last step plays a short melody instead. Changing the language, pausing or randomizing is silent.
Sorting derives the action from the step's highlights (`sortAction` in `sorting/sortingModule.ts`), so a new
sorting algorithm gets sounds without extra work. Searching, graph and pathfinding algorithms map their step keys to
actions (`binarySearchActions`, `actions` in a `GraphAlgorithmConfig` or a `PathfindingConfig`). The sounds are generated with the Web Audio API, the volume
and the mute state are saved in `localStorage`.

### Home page

The home page reuses the same building blocks:

- the **live preview** (`components/livePreview.ts`) plays Bubble Sort in a loop with a compact visualizer,
	the real code from the JSON and its variables. With `prefers-reduced-motion` it shows a single still step.
- every **algorithm card** shows a compact snapshot of a random run at 40 % and its average time complexity.

A compact visualizer (`createVisualizer(true)`) has no labels or legend and takes the height of its parent.

### Styling

Tailwind CSS with a few shared classes in `frontend/src/style.css` (`.card`, `.button`, `.code-line`). The
fonts are self-hosted with Fontsource (imported in `main.ts`): Space Grotesk for headings (`font-display`) and
JetBrains Mono for code (`font-mono`). Ligatures are turned off for code, so `===` and `<=` look exactly as typed.

## Adding an algorithm

1. **Data**: add `backend/data/<category>/<slug>.json` (copy an existing one) and list the slug in
	`backend/data/categories.json`. Every language must define the same step keys.
2. **Step generator**: add a function to `frontend/src/algorithms/<category>/` that returns the recorded
	steps. For sorting, use `SortTracer` and call `trace.record(stepKey, message, variables, highlights)`
	exactly where the corresponding code line runs. Recursive algorithms also use `trace.call` / `trace.return`
	(see above). For graphs, use `GraphTracer` the same way and export a `GraphAlgorithmConfig`
	(see `graph/breadthFirstSearch.ts`), for pathfinding `GridTracer` and a `PathfindingConfig`
	(see `pathfinding/greedyBestFirstSearch.ts`).
3. **Register** it under its slug in the category's list, e.g. `frontend/src/algorithms/sorting/sortingAlgorithms.ts`,
	with `createSortingModule(sort)`, `createSearchingModule(search, actions)`, `createGraphModule(config)` or
	`createPathfindingModule(config)`.
4. Run `npm test`. The tests check that:
	- every line number in the JSON exists and all languages share the same step keys (backend),
	- the static export contains the new algorithm and matches the API (`staticApi.test.ts`),
	- every step key the generator emits exists in every language (`registry.test.ts`),
	- the generator really sorts and only changes the array on write steps (`sorting.test.ts`),
	- recursive generators keep the call stack and the highlighted range in sync (`sorting.test.ts`),
	- Binary Search finds every element and never loses the target from its range (`searching.test.ts`),
	- random graphs have the promised shape and every graph algorithm returns a correct result, e.g. Dijkstra the
		true shortest distances (`graph.test.ts`),
	- random grids always have a path, A* always finds the shortest one and Greedy best-first search a valid one
		(`pathfinding.test.ts`).

It is also worth running the code snippets themselves once in each language before adding them.

The URL is `/<category>/<slug>`, e.g. `/sortingAlgorithms/bubblesort`. The build prerenders the new page and adds it to
the sitemap on its own.

## Adding a new category (e.g. trees)

Create a new folder in `frontend/src/algorithms/` with its own state type, a tracer or step helper, and a
class implementing `Visualizer<TState>` (`element` + `render(state)`, with a compact variant for the home
page). Wrap them in an `AlgorithmModule`
together with an `actionOf(step)` function for the sounds (see `sorting/sortingModule.ts`,
`graph/graphModule.ts` or `pathfinding/pathfindingModule.ts`). List the algorithms in a `<category>Algorithms.ts`
file that exports `algorithms` (see `sorting/sortingAlgorithms.ts`) and add a loader for it to `registry.ts`, which
gives the category its own chunk. The page, player, code panel and variables
panel need no changes.

## Adding a programming language

Add the id to `LanguageId` in `shared/index.d.ts`, the label in `frontend/src/languages.ts`, register the
highlight.js grammar in `frontend/src/components/codePanel.ts` and add the code to the JSON files.
