import { breadthFirstSearchConfig } from "./graph/breadthFirstSearch";
import { depthFirstSearchConfig } from "./graph/depthFirstSearch";
import { dijkstraConfig } from "./graph/dijkstra";
import { createGraphModule } from "./graph/graphModule";
import { topologicalSortConfig } from "./graph/topologicalSort";
import { binarySearch, binarySearchActions } from "./searching/binarySearch";
import { createSearchingModule } from "./searching/searchingModule";
import { bubbleSort } from "./sorting/bubbleSort";
import { heapSort } from "./sorting/heapSort";
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
	["sortingAlgorithms/heapsort", createSortingModule(heapSort)],
	["searchingAlgorithms/binarysearch", createSearchingModule(binarySearch, binarySearchActions)],
	["graphAlgorithms/breadthfirstsearch", createGraphModule(breadthFirstSearchConfig)],
	["graphAlgorithms/depthfirstsearch", createGraphModule(depthFirstSearchConfig)],
	["graphAlgorithms/topologicalsort", createGraphModule(topologicalSortConfig)],
	["graphAlgorithms/dijkstra", createGraphModule(dijkstraConfig)],
]);

export function getAlgorithmModule(category: string, slug: string): AlgorithmModule | undefined {
	return modules.get(`${category}/${slug}`);
}
