import type { CallFrame, VariableValue, Variables } from "../types";
import type { Graph, GraphState, GraphStep } from "./graphState";

export interface Neighbor {
	node: number;
	edge: number;
}

export interface GraphFocus {
	current?: number;
	edge?: number;
}

type Snapshot = Pick<GraphState, "waiting" | "done"> & { badges?: string[] };

export class GraphTracer {
	readonly steps: GraphStep[] = [];
	readonly treeEdges: number[] = [];
	readonly removedEdges: number[] = [];
	private readonly frames: CallFrame[] = [];

	constructor(
		readonly graph: Graph,
		private readonly snapshot: () => Snapshot,
	) {}

	get depth(): number {
		return this.frames.length;
	}

	label = (node: number): string => this.graph.nodes[node].label;

	labels = (nodes: Iterable<number>): string[] => [...nodes].map(this.label);

	private byLabel = (a: number, b: number): number => this.label(a).localeCompare(this.label(b));

	alphabetical(): number[] {
		return this.graph.nodes.map((_, index) => index).sort(this.byLabel);
	}

	neighbors(node: number): Neighbor[] {
		return this.graph.edges
			.flatMap(([from, to], edge) => {
				if (from === node) return [{ node: to, edge }];
				if (to === node && !this.graph.directed) return [{ node: from, edge }];

				return [];
			})
			.sort((a, b) => this.byLabel(a.node, b.node));
	}

	call(name: string, args: VariableValue[]): void {
		this.frames.push({ name, args });
	}

	return(): void {
		this.frames.pop();
	}

	record(line: string, message: string, variables: Variables, focus: GraphFocus = {}): void {
		const { waiting, done, badges = [] } = this.snapshot();

		this.steps.push({
			line,
			message,
			variables: structuredClone(variables),
			callStack: this.frames.map(({ name, args }) => ({ name, args: [...args] })),
			state: {
				graph: this.graph,
				current: focus.current ?? null,
				waiting: [...waiting],
				done: [...done],
				activeEdge: focus.edge ?? null,
				treeEdges: [...this.treeEdges],
				removedEdges: [...this.removedEdges],
				badges: [...badges],
			},
		});
	}
}
