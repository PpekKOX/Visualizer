# Visualizer – developer docs

## Getting started

Requirements: Node.js 22.12 or newer.

```bash
npm install        # installs all workspaces
npm run dev        # backend on :3000 + frontend (Vite) on :5173, /api is proxied
npm test           # backend + frontend tests
npm run typecheck
npm run build      # builds backend/dist and frontend/dist
npm start          # production: Express serves the API and the built frontend on :3000 (PORT to override)
```

## Project structure

```
shared/      TypeScript types for the API contract (types only, no runtime code)
backend/     Express API (TypeScript)
	data/    Algorithm content as JSON (descriptions, complexity, code per language)
	src/     Repository (loads JSON), routes, app, server
frontend/    Vanilla TypeScript + Vite + Tailwind CSS
	src/algorithms/ Step generators and visualizers, grouped by category
	src/components/ Code panel, variables panel, playback controls, algorithm info, live preview
	src/pages/      Home, algorithm and message (404 / error) pages
	src/router.ts   History API router (/:category/:algorithm)
	src/player.ts   Step playback (play, pause, step, seek, speed)
```

### API

| Method | Path                                | Response             |
| ------ | ----------------------------------- | -------------------- |
| GET    | `/api/categories`                   | `CategorySummary[]`  |
| GET    | `/api/algorithms/:category/:slug`   | `AlgorithmDetails`   |

## How a visualization works

The frontend runs the algorithm once and records every step up front. A step is:

```ts
{ line: "compare", message: "Compare arr[1] and arr[2]: …", variables: { i: 0, j: 1 }, state: { array, comparing, … } }
```

- `state` is drawn by the category's visualizer (e.g. the bar chart for sorting).
- `variables` fill the variables panel. Values that differ from the previous step are highlighted.
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

### Sound

Every time the shown step changes, the page asks the module what the step does (`actionOf(step)`:
`compare`, `write`, `select` or `other`) and `Sound` (`frontend/src/sound.ts`) plays the matching effect.
The last step plays a short melody instead. Changing the language, pausing or randomizing is silent.
Sorting derives the action from the step's highlights (`sortAction` in `sorting/sortingModule.ts`), so a new
sorting algorithm gets sounds without extra work. The sounds are generated with the Web Audio API, the volume
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
JetBrains Mono for code (`font-mono`).

## Adding an algorithm

1. **Data**: add `backend/data/<category>/<slug>.json` (copy an existing one) and list the slug in
	`backend/data/categories.json`. Every language must define the same step keys.
2. **Step generator**: add a function to `frontend/src/algorithms/<category>/` that returns the recorded
	steps. For sorting, use `SortTracer` and call `trace.record(stepKey, message, variables, highlights)`
	exactly where the corresponding code line runs. Recursive algorithms also use `trace.call` / `trace.return`
	(see above).
3. **Register** it in `frontend/src/algorithms/registry.ts` under `"<category>/<slug>"`.
4. Run `npm test`. The tests check that:
	- every line number in the JSON exists and all languages share the same step keys (backend),
	- every step key the generator emits exists in every language (`registry.test.ts`),
	- the generator really sorts and only changes the array on write steps (`sorting.test.ts`),
	- recursive generators keep the call stack and the highlighted range in sync (`sorting.test.ts`).

It is also worth running the code snippets themselves once in each language before adding them.

The URL is `/<category>/<slug>`, e.g. `/sortingAlgorithms/bubblesort`.

## Adding a new category (e.g. path-finding)

Create a new folder in `frontend/src/algorithms/` with its own state type, a tracer or step helper, and a
class implementing `Visualizer<TState>` (`element` + `render(state)`, with a compact variant for the home
page). Wrap them in an `AlgorithmModule`
together with an `actionOf(step)` function for the sounds (see `sorting/sortingModule.ts`) and register the
algorithms. The page, player, code panel and variables
panel need no changes.

## Adding a programming language

Add the id to `LanguageId` in `shared/index.d.ts`, the label in `frontend/src/languages.ts`, register the
highlight.js grammar in `frontend/src/components/codePanel.ts` and add the code to the JSON files.
