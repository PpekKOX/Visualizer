import { randomItem, shuffled } from "../random";
import { BarChart, type BarHighlight } from "../sorting/barChart";
import type { SortState, SortStep } from "../sorting/sortTracer";
import type { AlgorithmModule, StepAction } from "../types";

const ARRAY_SIZE = 15;
const MISSING_CHANCE = 0.25;
const VALUES = Array.from({ length: 95 }, (_, index) => index + 5);
const HIGHLIGHTS: BarHighlight[] = [
	{ key: "comparing", label: "Middle", color: "bg-amber-400" },
	{ key: "sorted", label: "Found", color: "bg-emerald-500" },
];

export interface SearchInput {
	array: number[];
	target: number;
}

export function randomSearchInput(): SearchInput {
	const [missing, ...values] = shuffled(VALUES).slice(0, ARRAY_SIZE + 1);
	const array = values.sort((a, b) => a - b);

	return { array, target: Math.random() < MISSING_CHANCE ? missing : randomItem(array) };
}

export function createSearchingModule(
	search: (array: number[], target: number) => SortStep[],
	actions: Record<string, StepAction>,
): AlgorithmModule<SortState> {
	return {
		generateSteps: () => {
			const { array, target } = randomSearchInput();
			return search(array, target);
		},
		createVisualizer: (compact) => new BarChart(compact, HIGHLIGHTS),
		actionOf: (step) => actions[step.line] ?? "other",
	};
}
