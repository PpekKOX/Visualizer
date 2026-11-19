import type { CallFrame, Step, VariableValue, Variables } from "../types";

export type Range = [number, number];

export interface SortState {
	array: number[];
	comparing: number[];
	swapping: number[];
	marked: number[];
	sorted: number[];
	range: Range | null;
}

export type SortStep = Step<SortState>;
export type SortHighlight = "comparing" | "swapping" | "marked" | "sorted";

interface Frame extends CallFrame {
	range: Range;
}

export class SortTracer {
	readonly steps: SortStep[] = [];
	private readonly sorted = new Set<number>();
	private readonly frames: Frame[] = [];

	constructor(private readonly array: number[]) {}

	get depth(): number {
		return this.frames.length;
	}

	call(name: string, args: VariableValue[], range: Range): void {
		this.frames.push({ name, args, range });
	}

	return(): void {
		this.frames.pop();
	}

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
			variables: structuredClone(variables),
			callStack: this.frames.map(({ name, args }) => ({ name, args: [...args] })),
			state: {
				array: [...this.array],
				comparing: highlights.comparing ?? [],
				swapping: highlights.swapping ?? [],
				marked: highlights.marked ?? [],
				sorted: [...this.sorted],
				range: this.frames.at(-1)?.range ?? null,
			},
		});
	}
}
