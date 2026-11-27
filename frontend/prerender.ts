import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import type { AlgorithmDetails, CategorySummary } from "@visualizer/shared";
import { renderPage, robotsTxt, sitemapXml, staticAlgorithmPage } from "./src/staticPages";

const SITE_URL = "https://openvisualizer.com";
const distDir = path.resolve(import.meta.dirname, "dist");

function read(file: string): string {
	return readFileSync(path.join(distDir, file), "utf-8");
}

function write(file: string, content: string): void {
	const target = path.join(distDir, file);
	mkdirSync(path.dirname(target), { recursive: true });
	writeFileSync(target, content);
}

const template = read("index.html");
const categories: CategorySummary[] = JSON.parse(read("api/categories.json"));
const pages = categories.flatMap((category) =>
	category.algorithms.map((algorithm) => {
		const details: AlgorithmDetails = JSON.parse(read(`api/algorithms/${category.slug}/${algorithm.slug}.json`));
		return staticAlgorithmPage(details, categories);
	}),
);

for (const page of pages) write(`${page.path}.html`, renderPage(template, SITE_URL, page));
write("404.html", template);
write("sitemap.xml", sitemapXml(SITE_URL, ["/", ...pages.map((page) => page.path)]));
write("robots.txt", robotsTxt(SITE_URL));

console.log(`Prerendered ${pages.length} algorithm pages, 404.html, sitemap.xml and robots.txt`);
