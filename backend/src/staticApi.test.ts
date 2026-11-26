import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import request from "supertest";
import { afterAll, describe, expect, it } from "vitest";
import { loadAlgorithmRepository } from "./algorithmRepository.js";
import { createApp } from "./app.js";
import { writeStaticApi } from "./staticApi.js";

const repository = loadAlgorithmRepository(path.resolve(import.meta.dirname, "../data"));
const app = createApp(repository);
const apiDir = mkdtempSync(path.join(tmpdir(), "visualizer-api-"));
const files = writeStaticApi(repository, apiDir);

afterAll(() => rmSync(apiDir, { recursive: true, force: true }));

describe("static API", () => {
	it("exports the categories and every algorithm", () => {
		const algorithmCount = repository.getCategories().reduce((sum, category) => sum + category.algorithms.length, 0);

		expect(files).toContain("categories.json");
		expect(files).toContain("algorithms/sortingAlgorithms/bubblesort.json");
		expect(files).toHaveLength(1 + algorithmCount);
	});

	it.each(files)("%s matches the API response at the same path", async (file) => {
		const response = await request(app).get(`/api/${file}`);

		expect(response.status).toBe(200);
		expect(readFileSync(path.join(apiDir, file), "utf-8")).toBe(response.text);
	});
});
