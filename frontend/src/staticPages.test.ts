import type { AlgorithmDetails, CategorySummary } from "@visualizer/shared";
import { describe, expect, it } from "vitest";
import template from "../index.html?raw";
import { renderPage, robotsTxt, sitemapXml, staticAlgorithmPage } from "./staticPages";

const SITE_URL = "https://example.com";
const snippet = { lines: [], steps: {} };
const details: AlgorithmDetails = {
	slug: "quicksort",
	name: "Quick Sort",
	summary: "Sorts <fast> & well.",
	category: { slug: "sortingAlgorithms", name: "Sorting Algorithms" },
	complexity: { best: "O(n log n)", average: "O(n log n)", worst: "O(n²)", space: "O(log n)" },
	description: ["First paragraph.", "Second paragraph."],
	properties: [{ label: "Stable", value: "No" }],
	code: { javascript: snippet, python: snippet, java: snippet },
};
const categories: CategorySummary[] = [{ slug: "sortingAlgorithms", name: "Sorting Algorithms", description: "", algorithms: [details] }];
const page = staticAlgorithmPage(details, categories);

describe("static algorithm page", () => {
	it("has the path, title and description of the algorithm", () => {
		expect(page.path).toBe("/sortingAlgorithms/quicksort");
		expect(page.title).toBe("Quick Sort Visualization, Step by Step | Visualizer");
		expect(page.description).toBe("Sorts <fast> & well. Watch it run step by step in JavaScript, Python and Java.");
	});

	it("shows the header and the explanation of the algorithm", () => {
		expect(page.body).toContain(">Quick Sort</h1>");
		expect(page.body).toContain("First paragraph.");
		expect(page.body).toContain("Second paragraph.");
		expect(page.body).toContain('value="/sortingAlgorithms/quicksort" selected');
	});
});

describe("renderPage", () => {
	const html = renderPage(template, SITE_URL, page);

	it("replaces the title, the description and the links of the template", () => {
		expect(html).toContain("<title>Quick Sort Visualization, Step by Step | Visualizer</title>");
		expect(html).toContain('<meta property="og:title" content="Quick Sort Visualization, Step by Step | Visualizer"');
		expect(html).toContain('<meta name="description" content="Sorts &#60;fast&#62; &#38; well.');
		expect(html).toContain('<meta property="og:description" content="Sorts &#60;fast&#62; &#38; well.');
		expect(html).toContain('<link rel="canonical" href="https://example.com/sortingAlgorithms/quicksort"');
		expect(html).toContain('<meta property="og:url" content="https://example.com/sortingAlgorithms/quicksort"');
	});

	it("puts the page content into the outlet and keeps the rest of the template", () => {
		expect(html).toMatch(/<main id="outlet"[^>]*>\s*<div class="mx-auto max-w-6xl/);
		expect(html).toContain('<script type="module" src="/src/main.ts"></script>');
		expect(html).toContain("Source code on GitHub");
	});

	it("fails when the template is missing a tag", () => {
		expect(() => renderPage("<html></html>", SITE_URL, page)).toThrow("has no match");
	});
});

describe("sitemap and robots.txt", () => {
	it("lists every page with its full URL", () => {
		const xml = sitemapXml(SITE_URL, ["/", "/sortingAlgorithms/quicksort"]);

		expect(xml).toContain("<loc>https://example.com/</loc>");
		expect(xml).toContain("<loc>https://example.com/sortingAlgorithms/quicksort</loc>");
		expect(xml.match(/<url>/g)).toHaveLength(2);
	});

	it("allows every crawler and points to the sitemap", () => {
		expect(robotsTxt(SITE_URL)).toBe("User-agent: *\nAllow: /\n\nSitemap: https://example.com/sitemap.xml\n");
	});
});
