import type { Variables } from "../types";
import { freeNeighbors, manhattan, stepsFromStart } from "./grid";
import type { Grid, GridStep } from "./gridState";
import { GridTracer, lowest, type GridFocus } from "./gridTracer";
import type { PathfindingConfig } from "./pathfindingModule";

export function greedyBestFirstSearch(grid: Grid): GridStep[] {
	const { start, goal } = grid;
	const parent = new Map<number, number | null>([[start, null]]);
	const openList = [start];
	const explored: number[] = [];
	const h = (cell: number) => manhattan(grid, cell, goal);
	const trace = new GridTracer(grid, () => ({
		open: openList,
		explored,
		scores: grid.walls.map((_, cell) => (parent.has(cell) ? h(cell) : null)),
	}));
	const { label, labels } = trace;

	function record(line: string, message: string, variables: Variables, focus: GridFocus = {}): void {
		trace.record(line, message, { ...variables, openList: labels(openList) }, focus);
	}

	record(
		"init",
		`Start at S (${label(start)}): put it in the open list and remember that it has no parent. Greedy best-first search always explores the open cell with the smallest h, the Manhattan distance to G (${label(goal)}).`,
		{},
	);

	while (openList.length > 0) {
		const cell = lowest(openList, h);
		const pick =
			openList.length === 1
				? `${label(cell)} is the only cell in the open list: h = ${h(cell)}.`
				: `${label(cell)} has the smallest h in the open list: it is ${h(cell)} steps from G if no wall is in the way.${trace.tieNote(openList, cell, h, "h")}`;

		if (cell === goal) {
			trace.path.push(goal);
			record("reachGoal", `${pick} It is the goal G. Follow the parents back to S.`, { cell: label(cell) }, { current: cell });
			trace.tracePath(parent, record);
			const steps = trace.path.length - 1;
			const shortest = stepsFromStart(grid)[goal];
			const verdict =
				steps === shortest
					? "This time it is also the shortest path."
					: `The shortest path only takes ${shortest} steps: Greedy rushes toward G and ignores how far it has already walked.`;
			record("done", `Done. Greedy found a path with ${steps} steps after exploring only ${explored.length} cells. ${verdict}`, {});
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
			const variables = { cell: label(cell), neighbor: label(neighbor) };
			const focus = { current: cell, neighbor };

			if (!parent.has(neighbor)) {
				parent.set(neighbor, cell);
				openList.push(neighbor);
				record("discover", `${label(neighbor)} has not been seen yet. Save ${label(cell)} as its parent and add it to the open list with h = ${h(neighbor)}.`, variables, focus);
			} else {
				record("skipNeighbor", `${label(neighbor)} has already been seen. Skip it.`, variables, focus);
			}
		}
	}

	record("noPath", "The open list is empty, so no path leads from S to G.", {});
	return trace.steps;
}

export const greedyBestFirstSearchConfig: PathfindingConfig = {
	run: greedyBestFirstSearch,
	actions: {
		pickCell: "select",
		discover: "write",
		skipNeighbor: "compare",
		tracePath: "select",
	},
	view: { score: "h" },
};
