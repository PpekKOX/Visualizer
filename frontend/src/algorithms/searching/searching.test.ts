import { describe, expect, it } from "vitest";
import { binarySearch, binarySearchActions } from "./binarySearch";
import { createSearchingModule, randomSearchInput } from "./searchingModule";

const ARRAY = [3, 8, 12, 19, 25, 31, 40, 47, 53, 60, 68, 74, 81, 90, 97];
const MISSING = [1, 10, 50, 99];

describe("randomSearchInput", () => {
	it("returns 15 sorted, distinct values", () => {
		for (let run = 0; run < 100; run++) {
			const { array } = randomSearchInput();

			expect(array).toHaveLength(15);
			expect(new Set(array).size).toBe(15);
			expect(array).toEqual([...array].sort((a, b) => a - b));
		}
	});

	it("sometimes looks for a value that is not in the array", () => {
		const targets = Array.from({ length: 200 }, () => randomSearchInput()).map(({ array, target }) => array.includes(target));

		expect(targets).toContain(true);
		expect(targets).toContain(false);
	});
});

describe("binarySearch", () => {
	it.each(ARRAY.map((target, index) => [target, index]))("finds %i at index %i", (target, index) => {
		const last = binarySearch(ARRAY, target).at(-1)!;

		expect(last.line).toBe("found");
		expect(last.variables.mid).toBe(index);
		expect(last.state.sorted).toEqual([index]);
	});

	it.each(MISSING.map((target) => [target]))("reports that %i is missing", (target) => {
		const last = binarySearch(ARRAY, target).at(-1)!;

		expect(last.line).toBe("notFound");
		expect(last.variables.low).toBeGreaterThan(last.variables.high as number);
	});

	it("checks at most log2(n) + 1 elements and always keeps the target inside the range", () => {
		for (const target of [...ARRAY, ...MISSING]) {
			const steps = binarySearch(ARRAY, target);
			const index = ARRAY.indexOf(target);

			expect(steps.filter((step) => step.line === "pickMiddle").length).toBeLessThanOrEqual(4);
			for (const step of steps) {
				const [low, high] = step.state.range!;
				expect([low, high]).toEqual([step.variables.low, step.variables.high]);
				if (index >= 0) expect(index >= low && index <= high).toBe(true);
			}
		}
	});

	it("handles an empty array", () => {
		expect(binarySearch([], 5).map((step) => step.line)).toEqual(["init", "notFound"]);
	});
});

describe("searching module", () => {
	it("plays a sound for every step key that has one", () => {
		const module = createSearchingModule(binarySearch, binarySearchActions);
		const steps = Array.from({ length: 50 }, () => module.generateSteps()).flat();

		for (const step of steps) expect(module.actionOf(step)).toBe(binarySearchActions[step.line] ?? "other");
		expect(steps.some((step) => module.actionOf(step) === "select")).toBe(true);
	});
});
