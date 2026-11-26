import { escapeHtml, fromHtml } from "../../dom";
import { legendHtml, type LegendItem } from "../legend";
import type { Visualizer } from "../types";
import { cellLabel } from "./grid";
import type { Grid, GridState } from "./gridState";

export interface GridViewOptions {
	score: string;
}

type CellStatus = "current" | "path" | "open" | "explored" | "wall" | "idle";

const CELL = 8;
const GAP = 0.8;
const AXIS = 5;
const CELL_COLORS: Record<CellStatus, { fill: string; bg: string }> = {
	current: { fill: "fill-violet-400", bg: "bg-violet-400" },
	open: { fill: "fill-amber-400", bg: "bg-amber-400" },
	explored: { fill: "fill-sky-500", bg: "bg-sky-500" },
	path: { fill: "fill-emerald-500", bg: "bg-emerald-500" },
	wall: { fill: "fill-slate-500", bg: "bg-slate-500" },
	idle: { fill: "fill-slate-800", bg: "bg-slate-800" },
};
const LEGEND: LegendItem[] = [
	{ label: "Current cell", color: CELL_COLORS.current.bg },
	{ label: "Open list", color: CELL_COLORS.open.bg },
	{ label: "Explored", color: CELL_COLORS.explored.bg },
	{ label: "Path", color: CELL_COLORS.path.bg },
	{ label: "Wall", color: CELL_COLORS.wall.bg },
	{ label: "Neighbor in focus", color: "border-2 border-rose-500" },
];

function cellStatus(state: GridState, cell: number): CellStatus {
	if (cell === state.current) return "current";
	if (state.path.includes(cell)) return "path";
	if (state.open.includes(cell)) return "open";
	if (state.explored.includes(cell)) return "explored";

	return state.grid.walls[cell] ? "wall" : "idle";
}

function axisHtml(grid: Grid): string {
	const text = (x: number, y: number, value: string) =>
		`<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="central" class="fill-slate-500 font-mono text-[3px]">${value}</text>`;
	const columns = Array.from({ length: grid.cols }, (_, col) => text(col * CELL + CELL / 2, -AXIS / 2, cellLabel(grid, col).slice(0, 1)));
	const rows = Array.from({ length: grid.rows }, (_, row) => text(-AXIS / 2, row * CELL + CELL / 2, cellLabel(grid, row * grid.cols).slice(1)));

	return columns.join("") + rows.join("");
}

function cellHtml({ cols }: Grid, cell: number): string {
	const size = CELL - GAP;
	const x = (cell % cols) * CELL + GAP / 2;
	const y = Math.floor(cell / cols) * CELL + GAP / 2;

	return `
		<g data-cell>
			<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="1" stroke-width="0.7" />
			<text x="${x + size / 2}" y="${y + size / 2}" text-anchor="middle" dominant-baseline="central"></text>
		</g>`;
}

export class GridView implements Visualizer<GridState> {
	readonly element: HTMLElement;
	private readonly svg: SVGSVGElement;
	private grid: Grid | undefined;
	private cells: SVGGElement[] = [];

	constructor(
		options: GridViewOptions,
		private readonly compact = false,
	) {
		this.element = fromHtml(`
			<div class="${compact ? "h-full" : ""}">
				<svg class="${compact ? "h-full w-full" : "h-56 w-full sm:h-72"}" aria-hidden="true"></svg>
				${compact ? "" : legendHtml(LEGEND)}
				${compact ? "" : `<p class="mt-2 text-center text-xs text-slate-500">S is the start and G the goal. The number in a cell is its ${escapeHtml(options.score)}.</p>`}
			</div>`);
		this.svg = this.element.querySelector("svg")!;
	}

	render(state: GridState): void {
		if (state.grid !== this.grid) this.draw(state.grid);
		const { start, goal } = state.grid;

		this.cells.forEach((cell, index) => {
			const [rect, text] = cell.children;
			const status = cellStatus(state, index);
			const marker = index === start ? "S" : index === goal ? "G" : null;
			const score = this.compact ? null : state.scores[index];
			const textColor = status === "idle" || status === "wall" ? "fill-slate-200" : "fill-slate-950";
			const font = marker ? "font-display text-[4.5px] font-bold" : "font-mono text-[3px] font-semibold";

			rect.setAttribute("class", `transition-colors duration-200 ${CELL_COLORS[status].fill} ${index === state.neighbor ? "stroke-rose-500" : "stroke-transparent"}`);
			text.setAttribute("class", `${font} ${textColor}`);
			text.textContent = marker ?? (score === null ? "" : String(score));
		});
	}

	private draw(grid: Grid): void {
		const width = grid.cols * CELL;
		const height = grid.rows * CELL;

		this.grid = grid;
		this.svg.setAttribute("viewBox", this.compact ? `0 0 ${width} ${height}` : `${-AXIS} ${-AXIS} ${width + 2 * AXIS} ${height + AXIS}`);
		this.svg.innerHTML = (this.compact ? "" : axisHtml(grid)) + grid.walls.map((_, cell) => cellHtml(grid, cell)).join("");
		this.cells = [...this.svg.querySelectorAll<SVGGElement>("[data-cell]")];
	}
}
