import type { Step, Variables } from "../types";

export interface SortState {
	array: number[];
	comparing: number[];
	swapping: number[];
	marked: number[];
	sorted: number[];
}

export type SortStep = Step<SortState>;
export type SortHighlight = Exclude<keyof SortState, "array">;

export class SortTracer {
	readonly steps: SortStep[] = [];
	private readonly sorted = new Set<number>();

	constructor(private readonly array: number[]) {}

	markSorted(...indices: number[]): void {
		indices.forEach((index) => this.sorted.add(index));
	}

	markAllSorted(): void {
		this.markSorted(...this.array.keys());
	}

	record(
		line: string,
		message: string,
		variables: Variables,
		highlights: Partial<Record<"comparing" | "swapping" | "marked", number[]>> = {},
	): void {
		this.steps.push({
			line,
			message,
			variables: { ...variables },
			state: {
				array: [...this.array],
				comparing: highlights.comparing ?? [],
				swapping: highlights.swapping ?? [],
				marked: highlights.marked ?? [],
				sorted: [...this.sorted],
			},
		});
	}
}
