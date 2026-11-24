import type { SortStep } from "../sorting/sortTracer";
import type { StepAction, Variables } from "../types";

export const binarySearchActions: Record<string, StepAction> = {
	pickMiddle: "select",
	found: "compare",
	goRight: "compare",
	goLeft: "compare",
};

export function binarySearch(arr: number[], target: number): SortStep[] {
	const steps: SortStep[] = [];
	let low = 0;
	let high = arr.length - 1;

	function record(line: string, message: string, variables: Variables = {}, focus: { middle?: number; found?: number } = {}): void {
		steps.push({
			line,
			message,
			variables: { target, low, high, ...variables },
			state: {
				array: [...arr],
				comparing: focus.middle === undefined ? [] : [focus.middle],
				swapping: [],
				marked: [],
				sorted: focus.found === undefined ? [] : [focus.found],
				range: [low, high],
			},
		});
	}

	record("init", `Look for ${target} in the sorted array. At first it could be anywhere between low = 0 and high = ${high}.`);

	while (low <= high) {
		const mid = Math.floor((low + high) / 2);
		record("pickMiddle", `low ≤ high, so there is still a range to search. Check the middle of arr[${low}..${high}]: mid = ${mid}.`, { mid }, { middle: mid });

		if (arr[mid] === target) {
			record("found", `arr[${mid}] = ${target} is the target. Found it at index ${mid}.`, { mid }, { found: mid });
			return steps;
		}

		if (arr[mid] < target) {
			low = mid + 1;
			record("goRight", `arr[${mid}] = ${arr[mid]} is smaller than ${target}, so the target can only be on its right. Move low to ${low}.`, { mid }, { middle: mid });
		} else {
			high = mid - 1;
			record("goLeft", `arr[${mid}] = ${arr[mid]} is larger than ${target}, so the target can only be on its left. Move high to ${high}.`, { mid }, { middle: mid });
		}
	}

	record("notFound", `low = ${low} is past high = ${high}, so there is nothing left to search. ${target} is not in the array: return -1.`);

	return steps;
}
