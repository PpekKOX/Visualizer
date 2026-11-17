import { SortTracer, type SortStep } from "./sortTracer";

function compareMessage(arr: number[], j: number, key: number): string {
	if (j < 0) return "j < 0: reached the start of the array, stop shifting.";
	if (arr[j] > key) return `arr[${j}] = ${arr[j]} > key = ${key}, so shift it to the right.`;
	return `arr[${j}] = ${arr[j]} ≤ key = ${key}, stop shifting.`;
}

export function insertionSort(input: number[]): SortStep[] {
	const arr = [...input];
	const trace = new SortTracer(arr);
	const n = arr.length;
	trace.record("init", `The array has ${n} elements.`, { n });

	for (let i = 1; i < n; i++) {
		const key = arr[i];
		let j = i - 1;
		trace.record("outerLoop", `Take key = arr[${i}] = ${key} and insert it into the sorted part on its left.`, { n, i, key, j }, { marked: [i] });

		while (true) {
			trace.record("compare", compareMessage(arr, j, key), { n, i, key, j }, { comparing: j >= 0 ? [j] : [] });
			if (j < 0 || arr[j] <= key) break;

			arr[j + 1] = arr[j];
			j--;
			trace.record("shift", `Copy ${arr[j + 1]} one position to the right and move j to the left.`, { n, i, key, j }, { swapping: [j + 2] });
		}

		arr[j + 1] = key;
		for (let k = 0; k <= i; k++) trace.markSorted(k);
		trace.record("insert", `Put key = ${key} into the gap at index ${j + 1}.`, { n, i, key, j }, { swapping: [j + 1] });
	}

	trace.markAllSorted();
	trace.record("done", "The array is sorted.", { n });
	return trace.steps;
}
