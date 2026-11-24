import { describe, expect, it } from "vitest";
import { breadthFirstSearch, breadthFirstSearchConfig } from "./breadthFirstSearch";
import { depthFirstSearch, depthFirstSearchConfig } from "./depthFirstSearch";
import { createGraphModule } from "./graphModule";
import type { Graph, GraphStep } from "./graphState";
import { randomDag, randomUndirectedGraph } from "./randomGraph";
import { topologicalSort, topologicalSortConfig } from "./topologicalSort";

const dags = Array.from({ length: 200 }, randomDag);
const undirectedGraphs = Array.from({ length: 200 }, randomUndirectedGraph);

function graphOf(labels: string, edges: string[], directed = true): Graph {
	return {
		nodes: [...labels].map((label, index) => ({ label, x: index * 10, y: 0 })),
		edges: edges.map(([from, to]) => [labels.indexOf(from), labels.indexOf(to)]),
		directed,
	};
}

const labelsOf = (graph: Graph, nodes: number[]) => nodes.map((node) => graph.nodes[node].label);
const count = (steps: GraphStep[], line: string) => steps.filter((step) => step.line === line).length;
const startOf = (graph: Graph) => graph.nodes.findIndex((node) => node.label === "A");

function shortestDistances(graph: Graph, start: number): number[] {
	const dist = graph.nodes.map((_, node) => (node === start ? 0 : Infinity));

	for (let round = 0; round < graph.nodes.length; round++) {
		graph.edges.forEach(([a, b]) => {
			dist[b] = Math.min(dist[b], dist[a] + 1);
			dist[a] = Math.min(dist[a], dist[b] + 1);
		});
	}

	return dist;
}

describe("random graphs", () => {
	it("use every label once", () => {
		for (const graph of [...dags, ...undirectedGraphs]) {
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

	it("undirected: is connected, has a cycle and never uses both diagonals of a square", () => {
		for (const graph of undirectedGraphs) {
			const edges = graph.edges.map((edge) => edge.join("-"));

			expect(graph.directed).toBe(false);
			expect(shortestDistances(graph, 0).every((distance) => distance < Infinity)).toBe(true);
			expect(graph.edges.length).toBeGreaterThanOrEqual(graph.nodes.length);
			expect(edges.includes("0-3") && edges.includes("1-2")).toBe(false);
			expect(edges.includes("2-5") && edges.includes("3-4")).toBe(false);
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

describe("breadthFirstSearch", () => {
	it("visits the neighbors of a node before their neighbors", () => {
		const graph = graphOf("ABCD", ["AB", "AC", "BD", "CD"], false);
		const last = breadthFirstSearch(graph).at(-1)!;

		expect(last.line).toBe("done");
		expect(last.variables.order).toEqual(["A", "B", "C", "D"]);
		expect(labelsOf(graph, last.state.treeEdges.map((edge) => graph.edges[edge][1]))).toEqual(["B", "C", "D"]);
	});

	it("reaches every node once, layer by layer, along shortest paths", () => {
		for (const graph of undirectedGraphs) {
			const steps = breadthFirstSearch(graph);
			const { done: order, treeEdges } = steps.at(-1)!.state;
			const distance = shortestDistances(graph, startOf(graph));

			expect(order[0]).toBe(startOf(graph));
			expect([...order].sort()).toEqual(graph.nodes.map((_, index) => index));
			order.slice(1).forEach((node, index) => expect(distance[node]).toBeGreaterThanOrEqual(distance[order[index]]));
			for (const edge of treeEdges) {
				const [a, b] = graph.edges[edge];
				expect(Math.abs(distance[a] - distance[b])).toBe(1);
			}
		}
	});

	it("checks every edge from both ends and discovers every node but the start once", () => {
		for (const graph of undirectedGraphs) {
			const steps = breadthFirstSearch(graph);
			const nodes = graph.nodes.length;

			expect(count(steps, "takeNode")).toBe(nodes);
			expect(count(steps, "discover")).toBe(nodes - 1);
			expect(count(steps, "skipNeighbor")).toBe(2 * graph.edges.length - (nodes - 1));
		}
	});
});

describe("depthFirstSearch", () => {
	it("goes as deep as possible before it backtracks", () => {
		const graph = graphOf("ABCD", ["AB", "AC", "BD", "CD"], false);
		const last = depthFirstSearch(graph).at(-1)!;

		expect(last.line).toBe("done");
		expect(last.variables.visited).toEqual(["A", "B", "D", "C"]);
		expect(last.callStack).toEqual([{ name: "dfs", args: ["graph", "A", "visited"] }]);
	});

	it("visits every node once and backtracks from every node but the start", () => {
		for (const graph of undirectedGraphs) {
			const steps = depthFirstSearch(graph);
			const nodes = graph.nodes.length;

			expect([...steps.at(-1)!.state.done].sort()).toEqual(graph.nodes.map((_, index) => index));
			expect(count(steps, "visit")).toBe(nodes);
			expect(count(steps, "goDeeper")).toBe(nodes - 1);
			expect(count(steps, "backtrack")).toBe(nodes - 1);
			expect(count(steps, "skipNeighbor")).toBe(2 * graph.edges.length - (nodes - 1));
			expect(steps.at(-1)!.state.treeEdges).toHaveLength(nodes - 1);
		}
	});

	it("keeps the call stack and the nodes on it in sync", () => {
		for (const graph of undirectedGraphs.slice(0, 20)) {
			for (const step of depthFirstSearch(graph).slice(0, -1)) {
				expect(step.callStack!.map((frame) => frame.args[1])).toEqual(labelsOf(graph, step.state.waiting));
				expect(step.variables.node).toBe(step.callStack!.at(-1)!.args[1]);
			}
		}
	});
});

describe("graph modules", () => {
	it.each([
		["topologicalSort", topologicalSortConfig],
		["breadthFirstSearch", breadthFirstSearchConfig],
		["depthFirstSearch", depthFirstSearchConfig],
	] as const)("%s: every step key with a sound exists and gets its sound", (_name, config) => {
		const module = createGraphModule(config);
		const steps = Array.from({ length: 10 }, () => module.generateSteps()).flat();
		const lines = new Set(steps.map((step) => step.line));

		expect(Object.keys(config.actions).every((line) => lines.has(line))).toBe(true);
		for (const step of steps) expect(module.actionOf(step)).toBe(config.actions[step.line] ?? "other");
	});
});
