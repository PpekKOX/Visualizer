import type { AlgorithmModule } from "../types";
import { BarChart } from "./barChart";
import type { SortState, SortStep } from "./sortTracer";

const ARRAY_SIZE = 10;

export function randomArray(size: number): number[] {
	return Array.from({ length: size }, () => 5 + Math.floor(Math.random() * 95));
}

export function createSortingModule(sort: (input: number[]) => SortStep[]): AlgorithmModule<SortState> {
	return {
		generateSteps: () => sort(randomArray(ARRAY_SIZE)),
		createVisualizer: () => new BarChart(),
	};
}
