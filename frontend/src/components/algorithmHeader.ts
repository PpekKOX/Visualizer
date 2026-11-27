import type { AlgorithmDetails, CategorySummary } from "@visualizer/shared";
import { escapeHtml } from "../dom";

export function algorithmTitle(name: string): string {
	return `${name} Visualization, Step by Step | Visualizer`;
}

function algorithmOptions(categories: CategorySummary[], currentPath: string): string {
	return categories
		.map(
			(category) => `
				<optgroup label="${escapeHtml(category.name)}">
					${category.algorithms
						.map((algorithm) => {
							const path = `/${category.slug}/${algorithm.slug}`;
							return `<option value="${escapeHtml(path)}" ${path === currentPath ? "selected" : ""}>${escapeHtml(algorithm.name)}</option>`;
						})
						.join("")}
				</optgroup>`,
		)
		.join("");
}

export function algorithmHeaderHtml(details: AlgorithmDetails, categories: CategorySummary[]): string {
	const path = `/${details.category.slug}/${details.slug}`;

	return `
		<div class="flex flex-wrap items-end justify-between gap-4">
			<div>
				<a href="/#${escapeHtml(details.category.slug)}" class="text-sm font-medium text-sky-400 hover:text-sky-300">${escapeHtml(details.category.name)}</a>
				<h1 class="mt-1 text-3xl font-bold text-white">${escapeHtml(details.name)}</h1>
				<p class="mt-2 max-w-2xl text-slate-400">${escapeHtml(details.summary)}</p>
			</div>
			<label class="flex items-center gap-2 text-sm text-slate-400">
				Algorithm
				<select class="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-200" data-slot="switcher">
					${algorithmOptions(categories, path)}
				</select>
			</label>
		</div>`;
}
