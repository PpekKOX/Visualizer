import type { AlgorithmModule } from "./types";

type CategoryLoader = () => Promise<{ algorithms: Map<string, AlgorithmModule> }>;

const categories = new Map<string, CategoryLoader>([
	["sortingAlgorithms", () => import("./sorting/sortingAlgorithms")],
	["searchingAlgorithms", () => import("./searching/searchingAlgorithms")],
	["graphAlgorithms", () => import("./graph/graphAlgorithms")],
	["pathfindingAlgorithms", () => import("./pathfinding/pathfindingAlgorithms")],
]);

export async function getAlgorithmModule(category: string, slug: string): Promise<AlgorithmModule | undefined> {
	const load = categories.get(category);

	return load ? (await load()).algorithms.get(slug) : undefined;
}
