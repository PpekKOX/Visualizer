import type { AlgorithmModule } from "../types";
import { binarySearch, binarySearchActions } from "./binarySearch";
import { createSearchingModule } from "./searchingModule";

export const algorithms = new Map<string, AlgorithmModule>([
	["binarysearch", createSearchingModule(binarySearch, binarySearchActions)],
]);
