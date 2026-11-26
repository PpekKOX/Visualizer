import { randomItem } from "../random";
import { manhattan, stepsFromStart } from "./grid";
import type { Grid } from "./gridState";

const ROWS = 6;
const COLS = 12;
const WALL_SEGMENTS = 8;
const MIN_SEGMENT = 2;
const MAX_SEGMENT = 4;
const VERTICAL_CHANCE = 0.65;

const randomInt = (max: number) => Math.floor(Math.random() * max);

function randomWalls(): boolean[] {
	const walls = Array.from({ length: ROWS * COLS }, () => false);

	for (let segment = 0; segment < WALL_SEGMENTS; segment++) {
		const length = MIN_SEGMENT + randomInt(MAX_SEGMENT - MIN_SEGMENT + 1);
		const vertical = Math.random() < VERTICAL_CHANCE;
		const row = randomInt(vertical ? ROWS - length + 1 : ROWS);
		const col = 1 + randomInt(vertical ? COLS - 2 : COLS - length - 1);

		for (let i = 0; i < length; i++) walls[(row + (vertical ? i : 0)) * COLS + col + (vertical ? 0 : i)] = true;
	}

	return walls;
}

// The start is in the first column and the goal in the last one. The walls always leave a path between them,
// but never a straight one, so the search has to find its way around them.
export function randomGrid(): Grid {
	const rows = Array.from({ length: ROWS }, (_, row) => row);

	for (;;) {
		const start = randomItem(rows) * COLS;
		const goal = randomItem(rows) * COLS + COLS - 1;
		const grid: Grid = { rows: ROWS, cols: COLS, walls: randomWalls(), start, goal };
		const shortest = stepsFromStart(grid)[goal];

		if (shortest < Infinity && shortest > manhattan(grid, start, goal)) return grid;
	}
}
