import { readFileSync } from "node:fs";
import path from "node:path";
import type { AlgorithmDetails, CategorySummary } from "@visualizer/shared";

interface CategoryEntry {
	slug: string;
	name: string;
	description: string;
	algorithms: string[];
}

type AlgorithmFile = Omit<AlgorithmDetails, "slug" | "category">;

export interface AlgorithmRepository {
	getCategories(): CategorySummary[];
	getAlgorithm(category: string, slug: string): AlgorithmDetails | undefined;
}

function readJson<T>(filePath: string): T {
	return JSON.parse(readFileSync(filePath, "utf-8")) as T;
}

export function loadAlgorithmRepository(dataDir: string): AlgorithmRepository {
	const entries = readJson<CategoryEntry[]>(path.join(dataDir, "categories.json"));
	const algorithms = new Map<string, AlgorithmDetails>();

	const categories = entries.map((entry) => ({
		slug: entry.slug,
		name: entry.name,
		description: entry.description,
		algorithms: entry.algorithms.map((slug) => {
			const file = readJson<AlgorithmFile>(path.join(dataDir, entry.slug, `${slug}.json`));
			const details: AlgorithmDetails = { slug, category: { slug: entry.slug, name: entry.name }, ...file };
			algorithms.set(`${entry.slug}/${slug}`, details);
			
			return { slug, name: details.name, summary: details.summary };
		}),
	}));

	return {
		getCategories: () => categories,
		getAlgorithm: (category, slug) => algorithms.get(`${category}/${slug}`),
	};
}
