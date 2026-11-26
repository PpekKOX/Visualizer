import type { Variables } from "../types";
import { freeNeighbors, manhattan } from "./grid";
import type { Grid, GridStep } from "./gridState";
import { GridTracer, lowest, type GridFocus } from "./gridTracer";
import type { PathfindingConfig } from "./pathfindingModule";

export function aStar(grid: Grid): GridStep[] {
	const { start, goal } = grid;
	const g = new Map<number, number>([[start, 0]]);
	const parent = new Map<number, number>();
	const openList = [start];
	const explored: number[] = [];
	const h = (cell: number) => manhattan(grid, cell, goal);
	const f = (cell: number) => g.get(cell)! + h(cell);
	const trace = new GridTracer(grid, () => ({
		open: openList,
		explored,
		scores: grid.walls.map((_, cell) => (g.has(cell) ? f(cell) : null)),
	}));
	const { label, labels } = trace;
	const sum = (cell: number) => `${g.get(cell)} + ${h(cell)} = ${f(cell)}`;

	function record(line: string, message: string, variables: Variables, focus: GridFocus = {}): void {
		trace.record(line, message, { ...variables, openList: labels(openList) }, focus);
	}

	record(
		"init",
		`Start at S (${label(start)}) with g = 0 steps so far and put it in the open list. A* always explores the open cell with the smallest f = g + h, where h is the Manhattan distance to G (${label(goal)}).`,
		{},
	);

	while (openList.length > 0) {
		const cell = lowest(openList, f);
		const pick =
			openList.length === 1
				? `${label(cell)} is the only cell in the open list: f = g + h = ${sum(cell)}.`
				: `${label(cell)} has the smallest f in the open list: g + h = ${sum(cell)}.${trace.tieNote(openList, cell, f, "f")}`;

		if (cell === goal) {
			trace.path.push(goal);
			record(
				"reachGoal",
				`${pick} It is the goal G, and h never overestimates, so no shorter path is left. Follow the parents back to S.`,
				{ cell: label(cell) },
				{ current: cell },
			);
			trace.tracePath(parent, record);
			const free = grid.walls.filter((wall) => !wall).length;
			record("done", `Done. The shortest path from S to G takes ${trace.path.length - 1} steps. A* only explored ${explored.length} of the ${free} free cells.`, {});
			return trace.steps;
		}

		openList.splice(openList.indexOf(cell), 1);
		explored.push(cell);
		const neighbors = freeNeighbors(grid, cell);
		record(
			"pickCell",
			`${pick} It is not the goal, so take it out of the open list and check its free neighbors: ${labels(neighbors).join(", ")}.`,
			{ cell: label(cell) },
			{ current: cell },
		);

		for (const neighbor of neighbors) {
			const newG = g.get(cell)! + 1;
			const old = g.get(neighbor);
			const variables = { cell: label(cell), neighbor: label(neighbor), newG };
			const focus = { current: cell, neighbor };

			if (old === undefined || newG < old) {
				g.set(neighbor, newG);
				parent.set(neighbor, cell);
				if (!openList.includes(neighbor)) openList.push(neighbor);
				const message =
					old === undefined
						? `${label(neighbor)} is reached for the first time, ${newG} steps from S. Save g = ${newG} and ${label(cell)} as its parent, and add it to the open list with f = ${sum(neighbor)}.`
						: `Through ${label(cell)}, ${label(neighbor)} is only ${newG} steps from S instead of ${old}. Update its g to ${newG} and its parent to ${label(cell)}.`;
				record("updateNeighbor", message, variables, focus);
			} else {
				record("skipNeighbor", `Through ${label(cell)}, ${label(neighbor)} would be ${newG} steps from S, but it is already ${old} steps away. Skip it.`, variables, focus);
			}
		}
	}

	record("noPath", "The open list is empty, so no path leads from S to G.", {});
	return trace.steps;
}

export const aStarConfig: PathfindingConfig = {
	run: aStar,
	actions: {
		pickCell: "select",
		updateNeighbor: "write",
		skipNeighbor: "compare",
		tracePath: "select",
	},
	view: { score: "f = g + h" },
};
