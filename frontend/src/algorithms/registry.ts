import { createGraphModule } from "./graph/graphModule";
import { topologicalSort, topologicalSortActions } from "./graph/topologicalSort";
import { bubbleSort } from "./sorting/bubbleSort";
import { insertionSort } from "./sorting/insertionSort";
import { mergeSort } from "./sorting/mergeSort";
import { quickSort } from "./sorting/quickSort";
import { selectionSort } from "./sorting/selectionSort";
import { createSortingModule } from "./sorting/sortingModule";
import type { AlgorithmModule } from "./types";

const modules = new Map<string, AlgorithmModule>([
	["sortingAlgorithms/bubblesort", createSortingModule(bubbleSort)],
	["sortingAlgorithms/selectionsort", createSortingModule(selectionSort)],
	["sortingAlgorithms/insertionsort", createSortingModule(insertionSort)],
	["sortingAlgorithms/mergesort", createSortingModule(mergeSort)],
	["sortingAlgorithms/quicksort", createSortingModule(quickSort)],
	["graphAlgorithms/topologicalsort", createGraphModule(topologicalSort, topologicalSortActions)],
]);

export function getAlgorithmModule(category: string, slug: string): AlgorithmModule | undefined {
	return modules.get(`${category}/${slug}`);
}
