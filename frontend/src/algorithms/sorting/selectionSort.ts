import { SortTracer, type SortStep } from "./sortTracer";

export function selectionSort(input: number[]): SortStep[] {
	const arr = [...input];
	const trace = new SortTracer(arr);
	const n = arr.length;
	trace.record("init", `The array has ${n} elements.`, { n });

	for (let i = 0; i < n - 1; i++) {
		let minIndex = i;
		trace.record(
			"outerLoop",
			`Pass ${i + 1}: find the smallest element from index ${i} on. Start with arr[${i}] = ${arr[i]}.`,
			{ n, i, minIndex },
			{ marked: [minIndex] },
		);

		for (let j = i + 1; j < n; j++) {
			const smaller = arr[j] < arr[minIndex];
			const verdict = smaller ? `${arr[j]} < ${arr[minIndex]}` : `${arr[j]} ≥ ${arr[minIndex]}`;
			trace.record(
				"compare",
				`Compare arr[${j}] with the current minimum arr[${minIndex}]: ${verdict}.`,
				{ n, i, j, minIndex },
				{ comparing: [j], marked: [minIndex] },
			);

			if (smaller) {
				minIndex = j;
				trace.record("newMin", `${arr[j]} is the new minimum.`, { n, i, j, minIndex }, { marked: [minIndex] });
			}
		}

		trace.markSorted(i);
		if (minIndex !== i) {
			[arr[i], arr[minIndex]] = [arr[minIndex], arr[i]];
			trace.record("swap", `Swap the minimum ${arr[i]} into position ${i}.`, { n, i, minIndex }, { swapping: [i, minIndex] });
		} else {
			trace.record("noSwap", `arr[${i}] = ${arr[i]} is already the minimum, no swap needed.`, { n, i, minIndex });
		}
	}

	trace.markAllSorted();
	trace.record("done", "The array is sorted.", { n });
	return trace.steps;
}
