import type { AlgorithmDetails, CategorySummary } from "@visualizer/shared";

async function getJson<T>(url: string): Promise<T | undefined> {
	const response = await fetch(url);
	
	if (response.status === 404) return undefined;
	if (!response.ok) throw new Error(`Request to ${url} failed with status ${response.status}.`);

	return (await response.json()) as T;
}

export async function fetchCategories(): Promise<CategorySummary[]> {
	return (await getJson<CategorySummary[]>("/api/categories.json")) ?? [];
}

export function fetchAlgorithm(category: string, slug: string): Promise<AlgorithmDetails | undefined> {
	return getJson<AlgorithmDetails>(`/api/algorithms/${encodeURIComponent(category)}/${encodeURIComponent(slug)}.json`);
}
