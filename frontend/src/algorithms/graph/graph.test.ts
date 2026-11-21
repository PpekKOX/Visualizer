import { describe, expect, it } from "vitest";
import { createGraphModule, randomGraph } from "./graphModule";
import type { Graph } from "./graphState";
import { topologicalSort, topologicalSortActions } from "./topologicalSort";

const graphs = Array.from({ length: 200 }, () => randomGraph());

function graphOf(labels: string, edges: string[]): Graph {
	return {
		nodes: [...labels].map((label, index) => ({ label, x: index * 10, y: 0 })),
		edges: edges.map(([from, to]) => [labels.indexOf(from), labels.indexOf(to)]),
	};
}

describe("randomGraph", () => {
	it("uses every label once and connects every node", () => {
		for (const graph of graphs) {
			expect(graph.nodes.map((node) => node.label).sort()).toEqual(["A", "B", "C", "D", "E", "F", "G"]);
			graph.nodes.forEach((_, node) => expect(graph.edges.some((edge) => edge.includes(node))).toBe(true));
		}
	});

	it("only has edges pointing to the right, so it never has a cycle", () => {
		for (const graph of graphs) {
			for (const [from, to] of graph.edges) expect(graph.nodes[from].x).toBeLessThan(graph.nodes[to].x);
		}
	});
});

describe("topologicalSort", () => {
	it("takes the nodes in the order of the queue", () => {
		const last = topologicalSort(graphOf("CABD", ["CB", "AB", "AD"])).at(-1)!;

		expect(last.line).toBe("done");
		expect(last.variables.order).toEqual(["C", "A", "B", "D"]);
	});

	it("puts every node after all the nodes it depends on", () => {
		for (const graph of graphs) {
			const order = topologicalSort(graph).at(-1)!.state.order;

			expect([...order].sort()).toEqual(graph.nodes.map((_, index) => index));
			for (const [from, to] of graph.edges) expect(order.indexOf(from)).toBeLessThan(order.indexOf(to));
		}
	});

	it("counts and removes every edge once and takes every node once", () => {
		for (const graph of graphs) {
			const steps = topologicalSort(graph);
			const count = (line: string) => steps.filter((step) => step.line === line).length;
			const last = steps.at(-1)!.state;

			expect(count("countEdge")).toBe(graph.edges.length);
			expect(count("removeEdge")).toBe(graph.edges.length);
			expect(count("takeNode")).toBe(graph.nodes.length);
			expect(last.inDegree.every((degree) => degree === 0)).toBe(true);
			expect([...last.removedEdges].sort((a, b) => a - b)).toEqual(graph.edges.map((_, index) => index));
		}
	});

	it("keeps the in-degrees of the variables and the state in sync", () => {
		for (const step of topologicalSort(graphs[0])) {
			expect(Object.values(step.variables.inDegree)).toEqual(step.state.inDegree);
		}
	});
});

describe("graph module", () => {
	it("plays a sound for every action of Kahn's algorithm", () => {
		const module = createGraphModule(topologicalSort, topologicalSortActions);
		const actions = Object.fromEntries(module.generateSteps().map((step) => [step.line, module.actionOf(step)]));

		expect(actions).toEqual({
			init: "other",
			countEdge: "compare",
			fillQueue: "write",
			takeNode: "select",
			removeEdge: "compare",
			enqueue: "write",
			checkCycle: "other",
			done: "other",
		});
	});
});
