import path from "node:path";
import request from "supertest";
import { describe, expect, it } from "vitest";
import { loadAlgorithmRepository } from "./algorithmRepository.js";
import { createApp } from "./app.js";

const repository = loadAlgorithmRepository(path.resolve(import.meta.dirname, "../data"));
const app = createApp(repository);

describe("API", () => {
	it("lists categories with their algorithms", async () => {
		const response = await request(app).get("/api/categories");

		expect(response.status).toBe(200);
		expect(response.body[0].slug).toBe("sortingAlgorithms");
		expect(response.body[0].algorithms.map((a: { slug: string }) => a.slug)).toEqual([
			"bubblesort",
			"selectionsort",
			"insertionsort",
			"mergesort",
			"quicksort",
		]);
	});

	it("returns algorithm details", async () => {
		const response = await request(app).get("/api/algorithms/sortingAlgorithms/bubblesort");

		expect(response.status).toBe(200);
		expect(response.body.name).toBe("Bubble Sort");
		expect(response.body.category).toEqual({ slug: "sortingAlgorithms", name: "Sorting Algorithms" });
		expect(Object.keys(response.body.code)).toEqual(["javascript", "python", "java"]);
	});

	it("returns 404 for unknown algorithms and endpoints", async () => {
		expect((await request(app).get("/api/algorithms/sortingAlgorithms/unknown")).status).toBe(404);
		expect((await request(app).get("/api/unknown")).status).toBe(404);
	});
});

describe("algorithm data", () => {
	const algorithms = repository
		.getCategories()
		.flatMap((category) => category.algorithms.map((a) => repository.getAlgorithm(category.slug, a.slug)!));

	it.each(algorithms.map((a) => [a.name, a] as const))("%s has valid code snippets", (_name, algorithm) => {
		const snippets = Object.values(algorithm.code);
		const stepKeys = Object.keys(snippets[0]!.steps).sort();

		for (const snippet of snippets) {
			expect(Object.keys(snippet!.steps).sort()).toEqual(stepKeys);
			for (const [step, lines] of Object.entries(snippet!.steps)) {
				expect(lines.length).toBeGreaterThan(0);
				for (const line of lines) {
					expect(line).toBeGreaterThanOrEqual(1);
					expect(line).toBeLessThanOrEqual(snippet!.lines.length);
					expect(snippet!.lines[line - 1], `step "${step}" points to line ${line}, which has no code`).toMatch(/[^\s}]/);
				}
			}
		}
	});
});
