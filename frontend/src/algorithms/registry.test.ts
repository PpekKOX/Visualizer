import type { AlgorithmDetails } from "@visualizer/shared";
import { describe, expect, it } from "vitest";
import { getAlgorithmModule } from "./registry";

type AlgorithmFile = Pick<AlgorithmDetails, "name" | "code">;

const files = import.meta.glob<AlgorithmFile>("../../../backend/data/*/*.json", { eager: true, import: "default" });
const algorithms = Object.entries(files).map(([path, file]) => {
	const [category, slug] = path.replace(".json", "").split("/").slice(-2);
	return { category, slug, file };
});

describe("algorithm registry", () => {
	it("finds algorithm data files", () => {
		expect(algorithms.length).toBeGreaterThan(0);
	});

	it.each(algorithms.map((algorithm) => [algorithm.file.name, algorithm]))(
		"%s: every step highlights existing code in every language",
		(_name, { category, slug, file }) => {
			const module = getAlgorithmModule(category, slug);
			expect(module, `${category}/${slug} has no registered module`).toBeDefined();

			const usedLines = new Set<string>();
			for (let run = 0; run < 25; run++) module!.generateSteps().forEach((step) => usedLines.add(step.line));

			for (const [language, snippet] of Object.entries(file.code)) {
				for (const line of usedLines) {
					expect(snippet!.steps[line], `${language} is missing step "${line}"`).toBeDefined();
				}
			}
		},
	);
});
