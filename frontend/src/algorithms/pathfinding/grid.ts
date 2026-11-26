import type { Grid } from "./gridState";

// Up, right, down, left: the order of the neighbors in the code examples.
const DIRECTIONS = [
	[-1, 0],
	[0, 1],
	[1, 0],
	[0, -1],
];

export function cellLabel({ cols }: Grid, cell: number): string {
	return `${String.fromCharCode(65 + (cell % cols))}${Math.floor(cell / cols) + 1}`;
}

export function freeNeighbors(grid: Grid, cell: number): number[] {
	const row = Math.floor(cell / grid.cols);
	const col = cell % grid.cols;

	return DIRECTIONS.flatMap(([dRow, dCol]) => {
		const [nextRow, nextCol] = [row + dRow, col + dCol];
		const next = nextRow * grid.cols + nextCol;
		const inside = nextRow >= 0 && nextRow < grid.rows && nextCol >= 0 && nextCol < grid.cols;

		return inside && !grid.walls[next] ? [next] : [];
	});
}

export function manhattan({ cols }: Grid, a: number, b: number): number {
	return Math.abs(Math.floor(a / cols) - Math.floor(b / cols)) + Math.abs((a % cols) - (b % cols));
}

// Breadth-first search: the fewest steps from the start to every cell, Infinity if a cell cannot be reached.
export function stepsFromStart(grid: Grid): number[] {
	const steps = grid.walls.map(() => Infinity);
	const queue = [grid.start];
	steps[grid.start] = 0;

	for (const cell of queue) {
		for (const next of freeNeighbors(grid, cell)) {
			if (steps[next] < Infinity) continue;
			steps[next] = steps[cell] + 1;
			queue.push(next);
		}
	}

	return steps;
}
