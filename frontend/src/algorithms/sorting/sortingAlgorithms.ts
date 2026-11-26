import type { AlgorithmModule } from "../types";
import { bubbleSort } from "./bubbleSort";
import { heapSort } from "./heapSort";
import { insertionSort } from "./insertionSort";
import { mergeSort } from "./mergeSort";
import { quickSort } from "./quickSort";
import { selectionSort } from "./selectionSort";
import { createSortingModule } from "./sortingModule";

export const algorithms = new Map<string, AlgorithmModule>([
	["bubblesort", createSortingModule(bubbleSort)],
	["selectionsort", createSortingModule(selectionSort)],
	["insertionsort", createSortingModule(insertionSort)],
	["mergesort", createSortingModule(mergeSort)],
	["quicksort", createSortingModule(quickSort)],
	["heapsort", createSortingModule(heapSort)],
]);
