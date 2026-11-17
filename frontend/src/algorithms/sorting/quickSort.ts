import { SortTracer, type SortStep } from "./sortTracer";

export function quickSort(input: number[]): SortStep[] {
	const arr = [...input];
	const trace = new SortTracer(arr);

	function partition(low: number, high: number): number {
		trace.call("partition", ["arr", low, high], [low, high]);
		const pivot = arr[high];
		let i = low - 1;
		trace.record(
			"pickPivot",
			`Use the last element ${pivot} as the pivot. Everything up to index i will be smaller than the pivot.`,
			{ low, high, pivot, i },
			{ marked: [high] },
		);

		for (let j = low; j < high; j++) {
			const smaller = arr[j] < pivot;
			const verdict = smaller ? `${arr[j]} < ${pivot}, move it to the left part` : `${arr[j]} ≥ ${pivot}, leave it`;
			trace.record("compare", `Compare arr[${j}] with the pivot: ${verdict}.`, { low, high, pivot, i, j }, { comparing: [j], marked: [high] });

			if (smaller) {
				i++;
				[arr[i], arr[j]] = [arr[j], arr[i]];
				trace.record("swap", `Grow the left part to index ${i} and swap arr[${i}] with arr[${j}].`, { low, high, pivot, i, j }, { swapping: [i, j], marked: [high] });
			}
		}

		[arr[i + 1], arr[high]] = [arr[high], arr[i + 1]];
		trace.markSorted(i + 1);
		trace.record(
			"placePivot",
			`Swap the pivot ${pivot} right behind the smaller elements, to index ${i + 1}. It is now in its final place.`,
			{ low, high, pivot, i },
			{ swapping: [i + 1, high] },
		);
		trace.return();

		return i + 1;
	}

	function sort(low: number, high: number): void {
		trace.call("quickSort", ["arr", low, high], [low, high]);

		if (low < high) {
			trace.record("partitionCall", `Partition arr[${low}..${high}] around a pivot.`, { low, high });
			const p = partition(low, high);
			trace.record("sortLeft", `The pivot is at index ${p}. Sort the part on its left, arr[${low}..${p - 1}].`, { low, high, p });
			sort(low, p - 1);
			trace.record("sortRight", `Now sort the part on the right of the pivot, arr[${p + 1}..${high}].`, { low, high, p });
			sort(p + 1, high);
		} else {
			if (low === high) trace.markSorted(low);
			const reason = low === high ? "has a single element, which is already in place" : "is empty";
			trace.record("baseCase", `arr[${low}..${high}] ${reason}. Return.`, { low, high });
		}

		if (trace.depth === 1) {
			trace.markAllSorted();
			trace.record("done", "The whole array is sorted.", { low, high });
		}
		trace.return();
	}

	sort(0, arr.length - 1);

	return trace.steps;
}
