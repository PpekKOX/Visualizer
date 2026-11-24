import { SortTracer, type SortStep } from "./sortTracer";

export function heapSort(input: number[]): SortStep[] {
	const arr = [...input];
	const trace = new SortTracer(arr);
	const n = arr.length;
	const lastParent = Math.floor(n / 2) - 1;

	function heapify(size: number, i: number): void {
		trace.call("heapify", ["arr", size, i], [0, size - 1]);
		let largest = i;
		const left = 2 * i + 1;
		const right = 2 * i + 2;
		const variables = () => ({ n: size, i, largest, left, right });
		const children = [
			{ child: left, side: "left", compare: "compareLeft", pick: "pickLeft" },
			{ child: right, side: "right", compare: "compareRight", pick: "pickRight" },
		];

		const family = left >= size ? "It has no children inside the heap." : right >= size ? `Its only child is at left = ${left}.` : `Its children are at left = ${left} and right = ${right}.`;
		trace.record("heapify", `Look at arr[${i}] = ${arr[i]}. ${family}`, variables(), { marked: [i] });

		for (const { child, side, compare, pick } of children) {
			if (child >= size) continue;

			const larger = arr[child] > arr[largest];
			const verdict = larger ? "the child is larger" : "the child is not larger";
			trace.record(compare, `Compare the ${side} child arr[${child}] = ${arr[child]} with arr[${largest}] = ${arr[largest]}: ${verdict}.`, variables(), {
				comparing: [child, largest],
			});

			if (larger) {
				largest = child;
				trace.record(pick, `The largest value so far is the ${side} child: largest = ${child}.`, variables(), { marked: [largest] });
			}
		}

		if (largest !== i) {
			[arr[i], arr[largest]] = [arr[largest], arr[i]];
			trace.record(
				"swap",
				`arr[${largest}] was larger than its parent, so swap arr[${i}] and arr[${largest}]. Keep sifting down from index ${largest}.`,
				variables(),
				{ swapping: [i, largest] },
			);
			heapify(size, largest);
		} else {
			const reason = left >= size ? "has no children" : "is at least as large as its children";
			trace.record("heapOk", `arr[${i}] = ${arr[i]} ${reason}, so the heap below index ${i} is in order. Return.`, variables());
		}
		trace.return();
	}

	trace.call("heapSort", ["arr"], [0, n - 1]);
	trace.record(
		"init",
		"First turn the array into a max heap: a tree stored in the array, where the children of arr[i] are at 2i + 1 and 2i + 2 and every parent is at least as large as its children.",
		{ n },
	);

	for (let i = lastParent; i >= 0; i--) {
		const message =
			i === lastParent
				? `Everything after index ${i} is a leaf. Build the heap from the bottom up, starting by sifting down arr[${i}] = ${arr[i]}.`
				: `Sift down arr[${i}] = ${arr[i]}.`;
		trace.record("buildHeap", message, { n, i });
		heapify(n, i);
	}

	for (let end = n - 1; end > 0; end--) {
		const root = arr[0];
		[arr[0], arr[end]] = [arr[end], arr[0]];
		trace.markSorted(end);
		const intro = end === n - 1 ? "The array is now a max heap, so its largest value is the root arr[0]. " : "";
		trace.record(
			"extract",
			`${intro}Swap the root ${root} with arr[${end}], the last element of the heap. ${root} is now in its final place. Then sift the new root down.`,
			{ n, end },
			{ swapping: [0, end] },
		);
		heapify(end, 0);
	}

	trace.markAllSorted();
	trace.record("done", "The whole array is sorted.", { n });
	trace.return();

	return trace.steps;
}
