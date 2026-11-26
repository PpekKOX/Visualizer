import type { AlgorithmModule } from "../types";
import { breadthFirstSearchConfig } from "./breadthFirstSearch";
import { depthFirstSearchConfig } from "./depthFirstSearch";
import { dijkstraConfig } from "./dijkstra";
import { createGraphModule } from "./graphModule";
import { topologicalSortConfig } from "./topologicalSort";

export const algorithms = new Map<string, AlgorithmModule>([
	["breadthfirstsearch", createGraphModule(breadthFirstSearchConfig)],
	["depthfirstsearch", createGraphModule(depthFirstSearchConfig)],
	["topologicalsort", createGraphModule(topologicalSortConfig)],
	["dijkstra", createGraphModule(dijkstraConfig)],
]);
