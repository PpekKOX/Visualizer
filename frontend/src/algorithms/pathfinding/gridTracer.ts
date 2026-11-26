import type { Variables } from "../types";
import { cellLabel } from "./grid";
import type { Grid, GridState, GridStep } from "./gridState";

export interface GridFocus {
	current?: number;
	neighbor?: number;
}

type Snapshot = Pick<GridState, "open" | "explored" | "scores">;
type RecordStep = (line: string, message: string, variables: Variables, focus?: GridFocus) => void;

// The last cell with the lowest priority wins, like the `<=` in the code examples.
export function lowest(cells: number[], priority: (cell: number) => number): number {
	return cells.reduce((best, cell) => (priority(cell) <= priority(best) ? cell : best));
}

export class GridTracer {
	readonly steps: GridStep[] = [];
	readonly path: number[] = [];

	constructor(
		readonly grid: Grid,
		private readonly snapshot: () => Snapshot,
	) {}

	label = (cell: number): string => cellLabel(this.grid, cell);

	labels = (cells: number[]): string[] => cells.map(this.label);

	tieNote(openList: number[], cell: number, priority: (cell: number) => number, name: string): string {
		const ties = openList.filter((other) => other !== cell && priority(other) === priority(cell));
		if (ties.length === 0) return "";

		const others = ties.length === 1 ? `${this.label(ties[0])} has` : `${ties.length} other cells have`;
		return ` ${others} the same ${name}, but ${this.label(cell)} was added last.`;
	}

	record(line: string, message: string, variables: Variables, focus: GridFocus = {}): void {
		const { open, explored, scores } = this.snapshot();

		this.steps.push({
			line,
			message,
			variables: structuredClone(this.path.length > 0 ? { ...variables, path: this.labels(this.path) } : variables),
			state: {
				grid: this.grid,
				current: focus.current ?? null,
				neighbor: focus.neighbor ?? null,
				open: [...open],
				explored: [...explored],
				path: [...this.path],
				scores: [...scores],
			},
		});
	}

	// Expects the goal to be in the path already.
	tracePath(parent: ReadonlyMap<number, number | null>, record: RecordStep): void {
		while (this.path[0] !== this.grid.start) {
			const child = this.path[0];
			this.path.unshift(parent.get(child)!);
			record("tracePath", `The parent of ${this.label(child)} is ${this.label(this.path[0])}. Put it at the front of the path.`, {}, { current: this.path[0] });
		}
	}
}
