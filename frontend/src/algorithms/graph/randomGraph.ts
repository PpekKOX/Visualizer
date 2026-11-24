import { randomItem, shuffled } from "../random";
import type { Graph, GraphNode } from "./graphState";

const LABELS = ["A", "B", "C", "D", "E", "F", "G"];
const EDGE_CHANCE = 0.5;
const EXTRA_EDGE_CHANCE = 0.35;
const MAX_WEIGHT = 9;
const LAYOUT = [
	{ x: 14, y: 14, column: 0 },
	{ x: 14, y: 42, column: 0 },
	{ x: 52, y: 14, column: 1 },
	{ x: 52, y: 42, column: 1 },
	{ x: 90, y: 14, column: 2 },
	{ x: 90, y: 42, column: 2 },
	{ x: 128, y: 28, column: 3 },
];
const SIDES: [number, number][] = [[0, 1], [2, 3], [4, 5], [0, 2], [1, 3], [2, 4], [3, 5], [4, 6], [5, 6]];
const DIAGONALS: [number, number][][] = [
	[[0, 3], [1, 2]],
	[[2, 5], [3, 4]],
];

function nodesInColumn(column: number): number[] {
	return LAYOUT.flatMap((position, index) => (position.column === column ? [index] : []));
}

function randomNodes(): GraphNode[] {
	const labels = shuffled(LABELS);
	return LAYOUT.map(({ x, y }, index) => ({ label: labels[index], x, y }));
}

function sortedEdges(edges: [number, number][]): [number, number][] {
	return edges.sort(([fromA, toA], [fromB, toB]) => fromA - fromB || toA - toB);
}

// Edges only point to the next column, so the graph never has a cycle.
export function randomDag(): Graph {
	const edges: [number, number][] = [];

	LAYOUT.forEach((from, fromIndex) => {
		for (const toIndex of nodesInColumn(from.column + 1)) {
			if (Math.random() < EDGE_CHANCE) edges.push([fromIndex, toIndex]);
		}
	});

	LAYOUT.forEach((position, index) => {
		if (edges.some((edge) => edge.includes(index))) return;
		if (position.column === 0) edges.push([index, randomItem(nodesInColumn(1))]);
		else edges.push([randomItem(nodesInColumn(position.column - 1)), index]);
	});

	return { nodes: randomNodes(), edges: sortedEdges(edges), directed: true };
}

// A random spanning tree keeps the graph connected and the extra edges add cycles.
// Every square of four nodes gets only one of its diagonals, so no two edges cross.
export function randomUndirectedGraph(): Graph {
	const group = LAYOUT.map((_, index) => index);
	const tree: [number, number][] = [];
	const rest: [number, number][] = [];

	for (const [a, b] of shuffled([...SIDES, ...DIAGONALS.map(randomItem)])) {
		if (group[a] === group[b]) {
			rest.push([a, b]);
			continue;
		}
		const merged = group[b];
		group.forEach((value, index) => {
			if (value === merged) group[index] = group[a];
		});
		tree.push([a, b]);
	}

	const extra = rest.filter(() => Math.random() < EXTRA_EDGE_CHANCE);
	if (extra.length === 0) extra.push(randomItem(rest));

	return { nodes: randomNodes(), edges: sortedEdges([...tree, ...extra]), directed: false };
}

export function randomWeightedGraph(): Graph {
	const graph = randomUndirectedGraph();
	return { ...graph, weights: graph.edges.map(() => 1 + Math.floor(Math.random() * MAX_WEIGHT)) };
}
