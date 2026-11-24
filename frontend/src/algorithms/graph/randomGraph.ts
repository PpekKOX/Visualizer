import { randomItem, shuffled } from "../random";
import type { Graph, GraphNode } from "./graphState";

const LABELS = ["A", "B", "C", "D", "E", "F", "G"];
const EDGE_CHANCE = 0.5;
const LAYOUT = [
	{ x: 14, y: 14, column: 0 },
	{ x: 14, y: 42, column: 0 },
	{ x: 52, y: 14, column: 1 },
	{ x: 52, y: 42, column: 1 },
	{ x: 90, y: 14, column: 2 },
	{ x: 90, y: 42, column: 2 },
	{ x: 128, y: 28, column: 3 },
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
