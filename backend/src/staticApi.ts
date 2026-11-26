import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { AlgorithmRepository } from "./algorithmRepository.js";

function writeJson(filePath: string, data: unknown): void {
	mkdirSync(path.dirname(filePath), { recursive: true });
	writeFileSync(filePath, JSON.stringify(data));
}

export function writeStaticApi(repository: AlgorithmRepository, apiDir: string): string[] {
	const files: string[] = [];
	const write = (file: string, data: unknown) => {
		writeJson(path.join(apiDir, file), data);
		files.push(file);
	};

	const categories = repository.getCategories();
	write("categories.json", categories);

	for (const category of categories) {
		for (const { slug } of category.algorithms) {
			write(`algorithms/${category.slug}/${slug}.json`, repository.getAlgorithm(category.slug, slug));
		}
	}

	return files;
}
