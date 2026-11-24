import type { Variables } from "../types";
import type { GraphAlgorithmConfig } from "./graphModule";
import type { Graph, GraphStep } from "./graphState";
import { GraphTracer, type GraphFocus } from "./graphTracer";
import { randomWeightedGraph } from "./randomGraph";

function distanceText(distance: number): string {
	return distance === Infinity ? "∞" : String(distance);
}

export function dijkstra(graph: Graph): GraphStep[] {
	const weights = graph.weights ?? graph.edges.map(() => 1);
	const start = graph.nodes.findIndex((node) => node.label === "A");
	const dist = graph.nodes.map(() => Infinity);
	const pathEdge: (number | null)[] = graph.nodes.map(() => null);
	const visited: number[] = [];
	const trace = new GraphTracer(graph, () => ({
		waiting: graph.nodes.flatMap((_, node) => (dist[node] < Infinity && !visited.includes(node) ? [node] : [])),
		done: visited,
		badges: dist.map(distanceText),
	}));
	const { label, labels } = trace;
	const nodes = trace.alphabetical();

	function record(line: string, message: string, variables: Variables, focus: GraphFocus = {}): void {
		const distances = Object.fromEntries(nodes.map((node) => [label(node), dist[node]]));
		trace.record(line, message, { ...variables, dist: distances, visited: labels(visited) }, focus);
	}

	dist[start] = 0;
	record("init", `Every distance starts at ∞, except the start ${label(start)}, which is 0 away from itself. No node is visited yet.`, {});

	while (visited.length < graph.nodes.length) {
		const node = nodes.filter((candidate) => !visited.includes(candidate)).reduce((best, candidate) => (dist[candidate] < dist[best] ? candidate : best));
		record("pickNode", `Of all unvisited nodes, ${label(node)} has the smallest distance: ${dist[node]}.`, { node: label(node) }, { current: node });

		visited.push(node);
		const reachedBy = pathEdge[node];
		if (reachedBy !== null) trace.treeEdges.push(reachedBy);
		const via = reachedBy === null ? "" : ` Its shortest path comes from ${label(graph.edges[reachedBy].find((end) => end !== node)!)}.`;
		record("visit", `Visit ${label(node)}. No shorter path to it can show up later, so ${dist[node]} is final.${via}`, { node: label(node) }, { current: node });

		for (const { node: neighbor, edge } of trace.neighbors(node)) {
			const weight = weights[edge];
			const newDist = dist[node] + weight;
			const variables = { node: label(node), neighbor: label(neighbor), weight };
			const sum = `${dist[node]} + ${weight} = ${newDist}`;

			if (newDist < dist[neighbor]) {
				const old = distanceText(dist[neighbor]);
				dist[neighbor] = newDist;
				pathEdge[neighbor] = edge;
				record("relax", `Through ${label(node)}: ${sum}, which is shorter than ${old}. dist[${label(neighbor)}] becomes ${newDist}.`, variables, { current: node, edge });
			} else {
				record("skipEdge", `Through ${label(node)}: ${sum}, which is not shorter than ${dist[neighbor]}. Keep dist[${label(neighbor)}].`, variables, { current: node, edge });
			}
		}
	}

	record("done", `Done. Every distance is final. The green edges form the shortest path from ${label(start)} to every node.`, {});

	return trace.steps;
}

export const dijkstraConfig: GraphAlgorithmConfig = {
	run: dijkstra,
	randomGraph: randomWeightedGraph,
	actions: {
		pickNode: "select",
		relax: "write",
		skipEdge: "compare",
	},
	view: {
		waiting: "Distance not final",
		done: "Distance final",
		treeEdge: "Shortest path from A",
		lists: [{ label: "Visited", nodes: "done" }],
	},
};
