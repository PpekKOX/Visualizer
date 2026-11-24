import { describe, expect, it } from "vitest";
import { createGraphModule } from "./graphModule";
import type { Graph, GraphStep } from "./graphState";
import { randomDag } from "./randomGraph";
import { topologicalSort, topologicalSortConfig } from "./topologicalSort";

const dags = Array.from({ length: 200 }, randomDag);

function graphOf(labels: string, edges: string[]): Graph {
	return {
		nodes: [...labels].map((label, index) => ({ label, x: index * 10, y: 0 })),
		edges: edges.map(([from, to]) => [labels.indexOf(from), labels.indexOf(to)]),
		directed: true,
	};
}

const count = (steps: GraphStep[], line: string) => steps.filter((step) => step.line === line).length;

describe("random graphs", () => {
	it("use every label once", () => {
		for (const graph of dags) {
			expect(graph.nodes.map((node) => node.label).sort()).toEqual(["A", "B", "C", "D", "E", "F", "G"]);
		}
	});

	it("DAG: connects every node and only has edges pointing to the right, so it never has a cycle", () => {
		for (const graph of dags) {
			expect(graph.directed).toBe(true);
			graph.nodes.forEach((_, node) => expect(graph.edges.some((edge) => edge.includes(node))).toBe(true));
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
		for (const graph of dags) {
			const order = topologicalSort(graph).at(-1)!.state.done;

			expect([...order].sort()).toEqual(graph.nodes.map((_, index) => index));
			for (const [from, to] of graph.edges) expect(order.indexOf(from)).toBeLessThan(order.indexOf(to));
		}
	});

	it("counts and removes every edge once and takes every node once", () => {
		for (const graph of dags) {
			const steps = topologicalSort(graph);
			const last = steps.at(-1)!.state;

			expect(count(steps, "countEdge")).toBe(graph.edges.length);
			expect(count(steps, "removeEdge")).toBe(graph.edges.length);
			expect(count(steps, "takeNode")).toBe(graph.nodes.length);
			expect(last.badges.every((degree) => degree === "0")).toBe(true);
			expect([...last.removedEdges].sort((a, b) => a - b)).toEqual(graph.edges.map((_, index) => index));
		}
	});

	it("shows the in-degrees of the variables in the badges", () => {
		for (const step of topologicalSort(dags[0])) {
			expect(Object.values(step.variables.inDegree).map(String)).toEqual(step.state.badges);
		}
	});
});

describe("graph modules", () => {
	it.each([
		["topologicalSort", topologicalSortConfig],
	] as const)("%s: every step key with a sound exists and gets its sound", (_name, config) => {
		const module = createGraphModule(config);
		const steps = Array.from({ length: 10 }, () => module.generateSteps()).flat();
		const lines = new Set(steps.map((step) => step.line));

		expect(Object.keys(config.actions).every((line) => lines.has(line))).toBe(true);
		for (const step of steps) expect(module.actionOf(step)).toBe(config.actions[step.line] ?? "other");
	});
});
