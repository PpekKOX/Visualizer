import type { Variables } from "../types";
import type { GraphAlgorithmConfig } from "./graphModule";
import type { Graph, GraphStep } from "./graphState";
import { GraphTracer, type GraphFocus } from "./graphTracer";
import { randomDag } from "./randomGraph";

function joinLabels(labels: string[]): string {
	return labels.length > 1 ? `${labels.slice(0, -1).join(", ")} and ${labels.at(-1)}` : labels.join("");
}

export function topologicalSort(graph: Graph): GraphStep[] {
	const inDegree = graph.nodes.map(() => 0);
	const queue: number[] = [];
	const order: number[] = [];
	const trace = new GraphTracer(graph, () => ({ waiting: queue, done: order, badges: inDegree.map(String) }));
	const { label, labels } = trace;
	const outgoing = graph.nodes.map((_, node) => graph.edges.flatMap(([from], edge) => (from === node ? [edge] : [])));

	function record(line: string, message: string, variables: Variables, focus: GraphFocus = {}): void {
		trace.record(line, message, { ...variables, inDegree: Object.fromEntries(graph.nodes.map((node, index) => [node.label, inDegree[index]])) }, focus);
	}

	record("init", "Start with an in-degree of 0 for every node. The in-degree counts the edges that point to a node.", {});

	graph.nodes.forEach((_, node) => {
		for (const edge of outgoing[node]) {
			const neighbor = graph.edges[edge][1];
			inDegree[neighbor]++;
			record(
				"countEdge",
				`Edge ${label(node)} → ${label(neighbor)}: ${label(neighbor)} depends on ${label(node)}, so its in-degree grows to ${inDegree[neighbor]}.`,
				{ node: label(node), neighbor: label(neighbor) },
				{ edge },
			);
		}
	});

	graph.nodes.forEach((_, node) => {
		if (inDegree[node] === 0) queue.push(node);
	});
	const sources = joinLabels(labels(queue));
	const fillMessage =
		queue.length === 1
			? `${sources} has no incoming edges, so nothing has to come before it. Put it in the queue.`
			: `${sources} have no incoming edges, so nothing has to come before them. Put them in the queue.`;
	record("fillQueue", fillMessage, { queue: labels(queue), order: [] });

	while (queue.length > 0) {
		const node = queue.shift()!;
		order.push(node);
		const next = outgoing[node].length > 0 ? "Now remove its outgoing edges." : "It has no outgoing edges.";
		record("takeNode", `Take ${label(node)} from the front of the queue and append it to the order. ${next}`, {
			node: label(node),
			queue: labels(queue),
			order: labels(order),
		}, { current: node });

		for (const edge of outgoing[node]) {
			const neighbor = graph.edges[edge][1];
			inDegree[neighbor]--;
			trace.removedEdges.push(edge);
			const left = inDegree[neighbor];
			const verdict = left === 0 ? `${label(neighbor)} no longer waits for anything.` : `${label(neighbor)} still waits for ${left} more node${left > 1 ? "s" : ""}.`;
			const variables = { node: label(node), neighbor: label(neighbor), queue: labels(queue), order: labels(order) };
			record("removeEdge", `Remove the edge ${label(node)} → ${label(neighbor)}: the in-degree of ${label(neighbor)} drops to ${left}. ${verdict}`, variables, {
				current: node,
				edge,
			});

			if (left === 0) {
				queue.push(neighbor);
				record("enqueue", `Add ${label(neighbor)} to the end of the queue.`, { ...variables, queue: labels(queue) }, { current: node });
			}
		}
	}

	record("checkCycle", `The order contains all ${order.length} nodes, so the graph has no cycle.`, { queue: [], order: labels(order) });
	record("done", `Done. ${labels(order).join(" → ")} is a valid order: every edge points forward.`, { queue: [], order: labels(order) });

	return trace.steps;
}

export const topologicalSortConfig: GraphAlgorithmConfig = {
	run: topologicalSort,
	randomGraph: randomDag,
	actions: {
		countEdge: "compare",
		fillQueue: "write",
		takeNode: "select",
		removeEdge: "compare",
		enqueue: "write",
	},
	view: {
		waiting: "In queue",
		done: "In order",
		lists: [
			{ label: "Queue", nodes: "waiting" },
			{ label: "Order", nodes: "done" },
		],
	},
};
