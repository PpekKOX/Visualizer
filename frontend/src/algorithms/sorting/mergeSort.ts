import { SortTracer, type SortStep } from "./sortTracer";

export function mergeSort(input: number[]): SortStep[] {
	const arr = [...input];
	const trace = new SortTracer(arr);

	function merge(left: number, mid: number, right: number): void {
		trace.call("merge", ["arr", left, mid, right], [left, right]);
		const leftPart = arr.slice(left, mid + 1);
		const rightPart = arr.slice(mid + 1, right + 1);
		let i = 0;
		let j = 0;
		let k = left;
		const variables = () => ({ left, mid, right, leftPart, rightPart, i, j, k });
		trace.record("copyHalves", "Copy both sorted halves aside. k points to where the next element is written.", variables(), { marked: [k] });

		while (i < leftPart.length && j < rightPart.length) {
			const takeLeft = leftPart[i] <= rightPart[j];
			const verdict = takeLeft ? `${leftPart[i]} ≤ ${rightPart[j]}, take ${leftPart[i]} from the left half` : `${leftPart[i]} > ${rightPart[j]}, take ${rightPart[j]} from the right half`;
			trace.record("compare", `Compare leftPart[${i}] and rightPart[${j}]: ${verdict}.`, variables(), { marked: [k] });

			if (takeLeft) {
				arr[k] = leftPart[i];
				i++;
			} else {
				arr[k] = rightPart[j];
				j++;
			}
			k++;
			trace.record(takeLeft ? "takeLeft" : "takeRight", `Write ${arr[k - 1]} to arr[${k - 1}].`, variables(), { swapping: [k - 1] });
		}

		while (i < leftPart.length) {
			arr[k] = leftPart[i];
			i++;
			k++;
			trace.record("copyLeft", `The right half is used up. Copy the remaining ${arr[k - 1]} to arr[${k - 1}].`, variables(), { swapping: [k - 1] });
		}

		while (j < rightPart.length) {
			arr[k] = rightPart[j];
			j++;
			k++;
			trace.record("copyRight", `The left half is used up. Copy the remaining ${arr[k - 1]} to arr[${k - 1}].`, variables(), { swapping: [k - 1] });
		}

		trace.return();
	}

	function sort(left: number, right: number): void {
		trace.call("mergeSort", ["arr", left, right], [left, right]);

		if (left >= right) {
			trace.record("baseCase", `arr[${left}..${right}] has at most one element, so it is already sorted. Return.`, { left, right });
		} else {
			const mid = Math.floor((left + right) / 2);
			trace.record("split", `Split arr[${left}..${right}] in the middle, at mid = ${mid}.`, { left, right, mid });
			trace.record("sortLeft", `Sort the left half arr[${left}..${mid}] first.`, { left, right, mid });
			sort(left, mid);
			trace.record("sortRight", `The left half is sorted. Now sort the right half arr[${mid + 1}..${right}].`, { left, right, mid });
			sort(mid + 1, right);
			trace.record("callMerge", `Both halves are sorted. Merge them into arr[${left}..${right}].`, { left, right, mid });
			merge(left, mid, right);
		}

		if (trace.depth === 1) {
			trace.markAllSorted();
			trace.record("done", "The whole array is sorted.", { left, right });
		}
		trace.return();
	}

	sort(0, arr.length - 1);

	return trace.steps;
}
