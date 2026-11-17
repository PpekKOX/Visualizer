import { SortTracer, type SortStep } from "./sortTracer";

export function bubbleSort(input: number[]): SortStep[] {
	const arr = [...input];
	const trace = new SortTracer(arr);
	const n = arr.length;
	trace.record("init", `The array has ${n} elements.`, { n });

	for (let i = 0; i < n - 1; i++) {
		let swapped = false;
		trace.record("outerLoop", `Pass ${i + 1}: push the largest unsorted element to the end.`, { n, i, swapped });

		for (let j = 0; j < n - i - 1; j++) {
			const outOfOrder = arr[j] > arr[j + 1];
			const verdict = outOfOrder ? `${arr[j]} > ${arr[j + 1]}, so swap them` : `${arr[j]} ≤ ${arr[j + 1]}, so keep them`;
			trace.record("compare", `Compare arr[${j}] and arr[${j + 1}]: ${verdict}.`, { n, i, j, swapped }, { comparing: [j, j + 1] });

			if (outOfOrder) {
				[arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];
				swapped = true;
				trace.record("swap", `Swapped. Remember that this pass made a swap.`, { n, i, j, swapped }, { swapping: [j, j + 1] });
			}
		}

		trace.markSorted(n - i - 1);
		if (!swapped) {
			trace.markAllSorted();
			trace.record("earlyExit", "No swaps in this pass, so the array is already sorted. Stop early.", { n, i, swapped });
			break;
		}
		trace.record("checkSwapped", `${arr[n - i - 1]} reached its final place. This pass made swaps, so keep going.`, { n, i, swapped });
	}

	trace.markAllSorted();
	trace.record("done", "The array is sorted.", { n });
	return trace.steps;
}
