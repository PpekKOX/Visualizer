import { bubbleSort } from "./sorting/bubbleSort";
import { insertionSort } from "./sorting/insertionSort";
import { selectionSort } from "./sorting/selectionSort";
import { createSortingModule } from "./sorting/sortingModule";
import type { AlgorithmModule } from "./types";

const modules = new Map<string, AlgorithmModule>([
	["sortingAlgorithms/bubblesort", createSortingModule(bubbleSort)],
	["sortingAlgorithms/selectionsort", createSortingModule(selectionSort)],
	["sortingAlgorithms/insertionsort", createSortingModule(insertionSort)],
]);

export function getAlgorithmModule(category: string, slug: string): AlgorithmModule | undefined {
	return modules.get(`${category}/${slug}`);
}
