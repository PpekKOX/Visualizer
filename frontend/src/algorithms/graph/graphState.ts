import type { Step } from "../types";

export interface GraphNode {
	label: string;
	x: number;
	y: number;
}

export interface Graph {
	nodes: GraphNode[];
	edges: [number, number][];
	directed: boolean;
	weights?: number[];
}

export interface GraphState {
	graph: Graph;
	current: number | null;
	waiting: number[];
	done: number[];
	activeEdge: number | null;
	treeEdges: number[];
	removedEdges: number[];
	badges: string[];
}

export type GraphStep = Step<GraphState>;
