import type { Variables } from "../types";
import type { GraphAlgorithmConfig } from "./graphModule";
import type { Graph, GraphStep } from "./graphState";
import { GraphTracer, type GraphFocus } from "./graphTracer";
import { randomUndirectedGraph } from "./randomGraph";

export function breadthFirstSearch(graph: Graph): GraphStep[] {
	const start = graph.nodes.findIndex((node) => node.label === "A");
	const visited = new Set([start]);
	const queue = [start];
	const order: number[] = [];
	const trace = new GraphTracer(graph, () => ({ waiting: queue, done: order }));
	const { label, labels } = trace;

	function record(line: string, message: string, variables: Variables, focus: GraphFocus = {}): void {
		trace.record(line, message, { ...variables, visited: labels(visited), queue: labels(queue), order: labels(order) }, focus);
	}

	record("init", `Start at ${label(start)}: mark it as visited and put it in the queue. Neighbors are always checked in alphabetical order.`, {});

	while (queue.length > 0) {
		const node = queue.shift()!;
		order.push(node);
		const neighbors = trace.neighbors(node);
		record(
			"takeNode",
			`Take ${label(node)} from the front of the queue and add it to the order. Then check its neighbors: ${labels(neighbors.map((next) => next.node)).join(", ")}.`,
			{ node: label(node) },
			{ current: node },
		);

		for (const { node: neighbor, edge } of neighbors) {
			const variables = { node: label(node), neighbor: label(neighbor) };

			if (visited.has(neighbor)) {
				const where = queue.includes(neighbor) ? " and waits in the queue" : "";
				record("skipNeighbor", `${label(neighbor)} is already visited${where}. Skip it.`, variables, { current: node, edge });
			} else {
				visited.add(neighbor);
				queue.push(neighbor);
				trace.treeEdges.push(edge);
				record("discover", `${label(neighbor)} is new: mark it as visited and add it to the end of the queue.`, variables, { current: node, edge });
			}
		}
	}

	record("done", `Done. BFS reached the nodes in the order ${labels(order).join(" → ")}: first the neighbors of ${label(start)}, then their neighbors, and so on.`, {});

	return trace.steps;
}

export const breadthFirstSearchConfig: GraphAlgorithmConfig = {
	run: breadthFirstSearch,
	randomGraph: randomUndirectedGraph,
	actions: {
		takeNode: "select",
		discover: "write",
		skipNeighbor: "compare",
	},
	view: {
		waiting: "In queue",
		done: "In order",
		treeEdge: "Path from A",
		lists: [
			{ label: "Queue", nodes: "waiting" },
			{ label: "Order", nodes: "done" },
		],
	},
};
