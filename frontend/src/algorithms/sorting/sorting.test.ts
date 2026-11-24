import { describe, expect, it } from "vitest";
import { bubbleSort } from "./bubbleSort";
import { heapSort } from "./heapSort";
import { insertionSort } from "./insertionSort";
import { mergeSort } from "./mergeSort";
import { quickSort } from "./quickSort";
import { selectionSort } from "./selectionSort";
import { sortAction } from "./sortingModule";

const WRITE_STEPS = new Set(["swap", "shift", "insert", "takeLeft", "takeRight", "copyLeft", "copyRight", "placePivot", "extract"]);
const INPUTS = [[], [7], [2, 1], [5, 1, 4, 2, 8], [3, 3, 1, 2, 2], [9, 8, 7, 6, 5, 4, 3, 2, 1], [1, 2, 3, 4, 5]];
const ascending = (values: number[]) => [...values].sort((a, b) => a - b);

describe.each([
	["bubbleSort", bubbleSort],
	["selectionSort", selectionSort],
	["insertionSort", insertionSort],
	["mergeSort", mergeSort],
	["quickSort", quickSort],
	["heapSort", heapSort],
])("%s", (_name, sort) => {
	it.each(INPUTS.map((input) => [input]))("sorts %j and marks every element as sorted", (input) => {
		const steps = sort(input);
		const last = steps.at(-1)!;

		expect(last.line).toBe("done");
		expect(last.state.array).toEqual(ascending(input));
		expect(ascending(last.state.sorted)).toEqual(input.map((_, index) => index));
	});

	it("changes the array only on write steps", () => {
		for (const input of INPUTS) {
			sort(input).forEach((step, index, steps) => {
				const before = index === 0 ? input : steps[index - 1].state.array;
				if (!WRITE_STEPS.has(step.line)) expect(step.state.array).toEqual(before);
			});
		}
	});

	it("does not mutate the input", () => {
		const input = [3, 1, 2];
		sort(input);
		expect(input).toEqual([3, 1, 2]);
	});

	it("sounds like a write on write steps and like a compare on compare steps", () => {
		for (const step of sort([5, 1, 4, 2, 8, 3])) {
			if (WRITE_STEPS.has(step.line)) expect(sortAction(step)).toBe("write");
			if (step.line === "compare") expect(sortAction(step)).toBe("compare");
		}
	});
});

describe("sound actions", () => {
	it("follow what a step does to the array", () => {
		const actions = Object.fromEntries(quickSort([3, 1, 2]).map((step) => [step.line, sortAction(step)]));

		expect(actions).toMatchObject({ partitionCall: "other", pickPivot: "select", compare: "compare", swap: "write", placePivot: "write" });
	});

	it("selecting a new minimum or a key sounds like a selection", () => {
		const newMin = selectionSort([3, 1, 2]).find((step) => step.line === "newMin")!;
		const takeKey = insertionSort([3, 1, 2]).find((step) => step.line === "outerLoop")!;

		expect(sortAction(newMin)).toBe("select");
		expect(sortAction(takeKey)).toBe("select");
	});
});

const countLines = (lines: string[], line: string) => lines.filter((current) => current === line).length;

describe("algorithm specific behaviour", () => {
	it("bubble sort stops after one pass on sorted input", () => {
		const lines = bubbleSort([1, 2, 3, 4, 5]).map((step) => step.line);
		expect(countLines(lines, "compare")).toBe(4);
		expect(lines).toContain("earlyExit");
	});

	it("selection sort makes at most n - 1 swaps", () => {
		const lines = selectionSort([9, 8, 7, 6, 5, 4, 3, 2, 1]).map((step) => step.line);
		expect(countLines(lines, "swap")).toBeLessThanOrEqual(8);
	});

	it("insertion sort shifts nothing on sorted input", () => {
		const lines = insertionSort([1, 2, 3, 4, 5]).map((step) => step.line);
		expect(countLines(lines, "shift")).toBe(0);
	});

	it("merge sort splits n - 1 times", () => {
		const lines = mergeSort([9, 8, 7, 6, 5, 4, 3, 2, 1]).map((step) => step.line);
		expect(countLines(lines, "split")).toBe(8);
	});

	it("heap sort builds a max heap before it takes out the largest element", () => {
		const steps = heapSort([3, 9, 1, 7, 5, 8, 2, 6, 4]);
		const heap = steps[steps.findIndex((step) => step.line === "extract") - 1].state.array;

		heap.forEach((value, index) => {
			if (index > 0) expect(heap[Math.floor((index - 1) / 2)]).toBeGreaterThanOrEqual(value);
		});
	});

	it("heap sort extracts n - 1 times and dims everything outside the heap", () => {
		const steps = heapSort([5, 1, 4, 2, 8, 3]);

		expect(countLines(steps.map((step) => step.line), "extract")).toBe(5);
		for (const step of steps.filter((current) => current.callStack!.at(-1)!.name === "heapify")) {
			expect(step.state.range).toEqual([0, Number(step.callStack!.at(-1)!.args[1]) - 1]);
		}
	});

	it("quick sort puts every pivot into its final position", () => {
		const input = [5, 1, 4, 2, 8, 3, 3, 9, 0];
		const sorted = ascending(input);

		for (const step of quickSort(input).filter((current) => current.line === "placePivot")) {
			const pivotIndex = Math.min(...step.state.swapping);
			expect(step.state.array[pivotIndex]).toBe(sorted[pivotIndex]);
			expect(step.state.sorted).toContain(pivotIndex);
		}
	});
});

describe("recursion tracing", () => {
	it.each([
		["mergeSort", mergeSort, "merge"],
		["quickSort", quickSort, "partition"],
	] as const)("%s keeps the call stack and the active range in sync", (name, sort, helper) => {
		const steps = sort([5, 1, 4, 2, 8, 3]);

		expect(steps[0].callStack).toEqual([{ name, args: ["arr", 0, 5] }]);
		expect(steps.at(-1)!.callStack).toEqual([{ name, args: ["arr", 0, 5] }]);
		expect(steps.some((step) => step.callStack!.at(-1)!.name === helper)).toBe(true);

		for (const step of steps) {
			const args = step.callStack!.at(-1)!.args;
			expect(step.state.range).toEqual([args[1], args.at(-1)]);
		}
	});

	it("non-recursive sorts have no call stack and no range", () => {
		const steps = bubbleSort([3, 1, 2]);
		expect(steps.every((step) => step.callStack!.length === 0 && step.state.range === null)).toBe(true);
	});
});
