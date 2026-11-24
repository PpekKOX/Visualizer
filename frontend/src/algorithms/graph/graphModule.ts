import type { AlgorithmModule, StepAction } from "../types";
import type { Graph, GraphState, GraphStep } from "./graphState";
import { GraphView, type GraphViewOptions } from "./graphView";

export interface GraphAlgorithmConfig {
	run: (graph: Graph) => GraphStep[];
	randomGraph: () => Graph;
	actions: Record<string, StepAction>;
	view: GraphViewOptions;
}

export function createGraphModule({ run, randomGraph, actions, view }: GraphAlgorithmConfig): AlgorithmModule<GraphState> {
	return {
		generateSteps: () => run(randomGraph()),
		createVisualizer: (compact) => new GraphView(view, compact),
		actionOf: (step) => actions[step.line] ?? "other",
	};
}
