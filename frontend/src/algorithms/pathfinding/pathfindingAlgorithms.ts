import type { AlgorithmModule } from "../types";
import { aStarConfig } from "./aStar";
import { greedyBestFirstSearchConfig } from "./greedyBestFirstSearch";
import { createPathfindingModule } from "./pathfindingModule";

export const algorithms = new Map<string, AlgorithmModule>([
	["greedybestfirstsearch", createPathfindingModule(greedyBestFirstSearchConfig)],
	["astar", createPathfindingModule(aStarConfig)],
]);
