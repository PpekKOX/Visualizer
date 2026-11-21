import type { AlgorithmModule, StepAction } from "../types";
import { BarChart } from "./barChart";
import type { SortState, SortStep } from "./sortTracer";

const ARRAY_SIZE = 10;

export function randomArray(size: number): number[] {
	return Array.from({ length: size }, () => 5 + Math.floor(Math.random() * 95));
}

export function sortAction({ line, state }: SortStep): StepAction {
	if (state.swapping.length > 0) return "write";
	if (state.comparing.length > 0 || line === "compare") return "compare";
	if (state.marked.length > 0) return "select";

	return "other";
}

export function createSortingModule(sort: (input: number[]) => SortStep[]): AlgorithmModule<SortState> {
	return {
		generateSteps: () => sort(randomArray(ARRAY_SIZE)),
		createVisualizer: (compact) => new BarChart(compact),
		actionOf: sortAction,
	};
}
