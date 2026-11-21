import type { Step } from "../types";

export interface GraphNode {
	label: string;
	x: number;
	y: number;
}

export interface Graph {
	nodes: GraphNode[];
	edges: [number, number][];
}

export interface GraphState {
	graph: Graph;
	inDegree: number[];
	queue: number[];
	order: number[];
	current: number | null;
	activeEdge: number | null;
	removedEdges: number[];
}

export type GraphStep = Step<GraphState>;
