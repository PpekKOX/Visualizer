import { describe, expect, it } from "vitest";
import { aStar, aStarConfig } from "./aStar";
import { cellLabel, freeNeighbors, manhattan, stepsFromStart } from "./grid";
import type { Grid, GridStep } from "./gridState";
import { greedyBestFirstSearch, greedyBestFirstSearchConfig } from "./greedyBestFirstSearch";
import { createPathfindingModule } from "./pathfindingModule";
import { randomGrid } from "./randomGrid";

const grids = Array.from({ length: 200 }, randomGrid);

// "S" is the start, "G" the goal and "#" a wall.
function gridOf(...rows: string[]): Grid {
	const cells = [...rows.join("")];
	return { rows: rows.length, cols: rows[0].length, walls: cells.map((cell) => cell === "#"), start: cells.indexOf("S"), goal: cells.indexOf("G") };
}

const OPEN_GRID = gridOf("S..", "...", "..G");
const WALL_AT_GOAL = gridOf("S....", ".....", "...#.", "...#G");
const WALLED_IN_GOAL = gridOf("S.#.", "..#G");

const labelsOf = (grid: Grid, cells: number[]) => cells.map((cell) => cellLabel(grid, cell));
const count = (steps: GridStep[], line: string) => steps.filter((step) => step.line === line).length;
const pathOf = (steps: GridStep[]) => steps.at(-1)!.state.path;

describe("grid", () => {
	it("names the cells with a column letter and a row number", () => {
		expect(labelsOf(OPEN_GRID, [0, 2, 3, 8])).toEqual(["A1", "C1", "A2", "C3"]);
	});

	it("lists the free neighbors up, right, down and left", () => {
		const grid = gridOf("...", ".S#", "..G");
		expect(labelsOf(grid, freeNeighbors(grid, grid.start))).toEqual(["B1", "B3", "A2"]);
		expect(labelsOf(grid, freeNeighbors(grid, 0))).toEqual(["B1", "A2"]);
	});

	it("counts the fewest steps around the walls", () => {
		expect(manhattan(WALL_AT_GOAL, WALL_AT_GOAL.start, WALL_AT_GOAL.goal)).toBe(7);
		expect(stepsFromStart(WALL_AT_GOAL)[WALL_AT_GOAL.goal]).toBe(7);
		expect(stepsFromStart(WALLED_IN_GOAL)[WALLED_IN_GOAL.goal]).toBe(Infinity);
	});
});

describe("randomGrid", () => {
	it("puts the start in the first column and the goal in the last one", () => {
		for (const grid of grids) {
			expect(grid.start % grid.cols).toBe(0);
			expect(grid.goal % grid.cols).toBe(grid.cols - 1);
			expect(grid.walls[grid.start] || grid.walls[grid.goal]).toBe(false);
		}
	});

	it("always leaves a path, but never a straight one", () => {
		for (const grid of grids) {
			const shortest = stepsFromStart(grid)[grid.goal];
			expect(shortest).toBeLessThan(Infinity);
			expect(shortest).toBeGreaterThan(manhattan(grid, grid.start, grid.goal));
		}
	});
});

describe.each([
	["aStar", aStar],
	["greedyBestFirstSearch", greedyBestFirstSearch],
])("%s", (_name, search) => {
	it("finds a path of neighboring free cells from S to G", () => {
		for (const grid of grids) {
			const steps = search(grid);
			const path = pathOf(steps);

			expect(steps.at(-1)!.line).toBe("done");
			expect(path[0]).toBe(grid.start);
			expect(path.at(-1)).toBe(grid.goal);
			path.slice(1).forEach((cell, index) => expect(freeNeighbors(grid, path[index])).toContain(cell));
			expect(steps.at(-1)!.variables.path).toEqual(labelsOf(grid, path));
			expect(count(steps, "tracePath")).toBe(path.length - 1);
		}
	});

	it("explores every free cell at most once", () => {
		for (const grid of grids) {
			const { explored } = search(grid).at(-1)!.state;
			expect(new Set(explored).size).toBe(explored.length);
			expect(explored.some((cell) => grid.walls[cell])).toBe(false);
		}
	});

	it("follows its newest cell on a tie", () => {
		expect(labelsOf(OPEN_GRID, search(OPEN_GRID).at(-1)!.state.explored)).toEqual(["A1", "A2", "A3", "B3"]);
	});

	it("shows the open list of the variables on the grid", () => {
		for (const step of search(grids[0])) expect(step.variables.openList).toEqual(labelsOf(grids[0], step.state.open));
	});

	it("reports that no path exists when the goal is walled in", () => {
		const last = search(WALLED_IN_GOAL).at(-1)!;
		expect(last.line).toBe("noPath");
		expect(last.state.path).toEqual([]);
	});
});

describe("aStar", () => {
	it("always finds the shortest path", () => {
		for (const grid of grids) expect(pathOf(aStar(grid)).length - 1).toBe(stepsFromStart(grid)[grid.goal]);
	});

	it("explores a cell only once its g is the real distance from S and shows f = g + h on it", () => {
		for (const grid of grids.slice(0, 50)) {
			const { explored, scores } = aStar(grid).at(-1)!.state;
			const distance = stepsFromStart(grid);
			for (const cell of explored) expect(scores[cell]).toBe(distance[cell] + manhattan(grid, cell, grid.goal));
		}
	});
});

describe("greedyBestFirstSearch", () => {
	it("can find a longer path than A*", () => {
		expect(labelsOf(WALL_AT_GOAL, pathOf(greedyBestFirstSearch(WALL_AT_GOAL)))).toEqual(["A1", "A2", "A3", "A4", "B4", "C4", "C3", "C2", "D2", "E2", "E3", "E4"]);
		expect(pathOf(aStar(WALL_AT_GOAL))).toHaveLength(8);
		expect(greedyBestFirstSearch(WALL_AT_GOAL).at(-1)!.message).toContain("The shortest path only takes 7 steps");
	});

	it("shows h on every cell it has seen", () => {
		for (const step of greedyBestFirstSearch(grids[0])) {
			for (const cell of [...step.state.open, ...step.state.explored]) expect(step.state.scores[cell]).toBe(manhattan(grids[0], cell, grids[0].goal));
		}
	});
});

describe("pathfinding modules", () => {
	it.each([
		["greedyBestFirstSearch", greedyBestFirstSearchConfig],
		["aStar", aStarConfig],
	] as const)("%s: every step key with a sound exists and gets its sound", (_name, config) => {
		const module = createPathfindingModule(config);
		const steps = Array.from({ length: 10 }, () => module.generateSteps()).flat();
		const lines = new Set(steps.map((step) => step.line));

		expect(Object.keys(config.actions).every((line) => lines.has(line))).toBe(true);
		for (const step of steps) expect(module.actionOf(step)).toBe(config.actions[step.line] ?? "other");
	});
});
