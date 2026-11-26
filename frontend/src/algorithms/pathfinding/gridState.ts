import type { Step } from "../types";

export interface Grid {
	rows: number;
	cols: number;
	walls: boolean[];
	start: number;
	goal: number;
}

export interface GridState {
	grid: Grid;
	current: number | null;
	neighbor: number | null;
	open: number[];
	explored: number[];
	path: number[];
	scores: (number | null)[];
}

export type GridStep = Step<GridState>;
