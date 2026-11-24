import type { Variables } from "../types";
import type { GraphAlgorithmConfig } from "./graphModule";
import type { Graph, GraphStep } from "./graphState";
import { GraphTracer, type GraphFocus } from "./graphTracer";
import { randomUndirectedGraph } from "./randomGraph";

export function depthFirstSearch(graph: Graph): GraphStep[] {
	const start = graph.nodes.findIndex((node) => node.label === "A");
	const visited: number[] = [];
	const path: number[] = [];
	const trace = new GraphTracer(graph, () => ({ waiting: path, done: visited }));
	const { label, labels } = trace;

	function record(line: string, message: string, variables: Variables, focus: GraphFocus = {}): void {
		trace.record(line, message, { ...variables, visited: labels(visited) }, focus);
	}

	function dfs(node: number): void {
		trace.call("dfs", ["graph", label(node), "visited"]);
		path.push(node);
		visited.push(node);
		const neighbors = trace.neighbors(node);
		const intro = trace.depth === 1 ? `Start at ${label(node)} with an empty visited set. ` : "";
		const next = `Its neighbors, in alphabetical order: ${labels(neighbors.map((neighbor) => neighbor.node)).join(", ")}.`;
		record("visit", `${intro}Mark ${label(node)} as visited. ${next}`, { node: label(node) }, { current: node });

		for (const { node: neighbor, edge } of neighbors) {
			const variables = { node: label(node), neighbor: label(neighbor) };

			if (visited.includes(neighbor)) {
				record("skipNeighbor", `${label(neighbor)} is already visited. Skip it.`, variables, { current: node, edge });
			} else {
				trace.treeEdges.push(edge);
				record(
					"goDeeper",
					`${label(neighbor)} is not visited yet. Go deeper right away: call dfs for ${label(neighbor)} before the other neighbors of ${label(node)}.`,
					variables,
					{ current: node, edge },
				);
				dfs(neighbor);
			}
		}

		if (trace.depth > 1) {
			record("backtrack", `Every neighbor of ${label(node)} is visited. Return to ${label(path.at(-2)!)}.`, { node: label(node) }, { current: node });
			path.pop();
		} else {
			path.pop();
			record("done", `Done. DFS visited ${labels(visited).join(" → ")}, always going as deep as possible before it backtracked.`, { node: label(node) });
		}
		trace.return();
	}

	dfs(start);

	return trace.steps;
}

export const depthFirstSearchConfig: GraphAlgorithmConfig = {
	run: depthFirstSearch,
	randomGraph: randomUndirectedGraph,
	actions: {
		visit: "select",
		goDeeper: "compare",
		skipNeighbor: "compare",
	},
	view: {
		waiting: "On the call stack",
		done: "Finished",
		treeEdge: "Path from A",
		lists: [{ label: "Visited", nodes: "done" }],
	},
};
