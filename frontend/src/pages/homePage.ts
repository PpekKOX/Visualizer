import type { AlgorithmDetails, AlgorithmSummary, CategorySummary, LanguageId } from "@visualizer/shared";
import { getAlgorithmModule } from "../algorithms/registry";
import type { AlgorithmModule } from "../algorithms/types";
import { fetchAlgorithm, fetchCategories } from "../api";
import { LivePreview } from "../components/livePreview";
import { escapeHtml, fromHtml, slot, svgIcon } from "../dom";
import { loadPreferredLanguage } from "../languages";
import type { View } from "../router";

const PREVIEW = { category: "sortingAlgorithms", slug: "bubblesort" };
const SNAPSHOT_AT = 0.4;

const FEATURES = [
	{
		title: "Pick an algorithm",
		text: "Choose from a library of algorithms grouped by topic, starting with sorting.",
		icon: '<rect x="3" y="3" width="7" height="7" rx="1.5" /><rect x="14" y="3" width="7" height="7" rx="1.5" /><rect x="3" y="14" width="7" height="7" rx="1.5" /><rect x="14" y="14" width="7" height="7" rx="1.5" />',
		color: "bg-sky-500/15 text-sky-300",
	},
	{
		title: "Play it your way",
		text: "Run the whole algorithm at your own speed, or go through it one step at a time, forwards and backwards.",
		icon: '<path d="M7 4.5v15l12-7.5z" />',
		color: "bg-amber-400/15 text-amber-300",
	},
	{
		title: "Follow the code",
		text: "The line that runs right now is highlighted, and the current value of every variable is shown next to it.",
		icon: '<path d="M8 8l-4 4 4 4M16 8l4 4-4 4M13.5 5l-3 14" />',
		color: "bg-violet-400/15 text-violet-300",
	},
	{
		title: "Switch languages",
		text: "Read the same algorithm in JavaScript, Python or Java. The highlighting follows you.",
		icon: '<circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18" />',
		color: "bg-emerald-500/15 text-emerald-300",
	},
];

function createPreview(details: AlgorithmDetails | undefined): LivePreview | undefined {
	const module = getAlgorithmModule(PREVIEW.category, PREVIEW.slug);
	if (!module || !details) return undefined;

	const language = loadPreferredLanguage(Object.keys(details.code) as LanguageId[]);
	const snippet = details.code[language];

	return snippet ? new LivePreview(module, snippet, language) : undefined;
}

function snapshot(module: AlgorithmModule): HTMLElement {
	const steps = module.generateSteps();
	const visualizer = module.createVisualizer(true);
	visualizer.render(steps[Math.floor(steps.length * SNAPSHOT_AT)].state);

	return visualizer.element;
}

function addSnapshots(root: HTMLElement): void {
	for (const placeholder of root.querySelectorAll<HTMLElement>("[data-snapshot]")) {
		const [category, slug] = placeholder.dataset.snapshot!.split("/");
		const module = getAlgorithmModule(category, slug);
		if (module) placeholder.append(snapshot(module));
	}
}

function complexityStyle(value: string): string {
	if (value.includes("²")) return "bg-amber-400/10 text-amber-300 ring-amber-400/25";
	if (value.includes("log")) return "bg-emerald-400/10 text-emerald-300 ring-emerald-400/25";

	return "bg-sky-400/10 text-sky-300 ring-sky-400/25";
}

function algorithmCard(category: CategorySummary, algorithm: AlgorithmSummary): string {
	const average = algorithm.complexity.average;

	return `
		<a href="/${escapeHtml(category.slug)}/${escapeHtml(algorithm.slug)}" class="card group flex flex-col overflow-hidden transition hover:-translate-y-0.5 hover:border-sky-500/50 hover:shadow-sky-500/10">
			<div class="h-20 border-b border-slate-800 bg-slate-950/40 px-5 pt-4" data-snapshot="${escapeHtml(category.slug)}/${escapeHtml(algorithm.slug)}" aria-hidden="true"></div>
			<div class="flex flex-1 flex-col p-5">
				<div class="flex items-start justify-between gap-3">
					<span class="font-display font-semibold text-white">${escapeHtml(algorithm.name)}</span>
					<span class="shrink-0 rounded-full px-2 py-0.5 font-mono text-xs ring-1 ${complexityStyle(average)}" title="Average time">${escapeHtml(average)}</span>
				</div>
				<span class="mt-2 flex-1 text-sm leading-6 text-slate-400">${escapeHtml(algorithm.summary)}</span>
				<span class="mt-4 text-sm font-medium text-sky-400 group-hover:text-sky-300">Visualize →</span>
			</div>
		</a>`;
}

function categorySection(category: CategorySummary): string {
	return `
		<section id="${escapeHtml(category.slug)}" class="scroll-mt-20">
			<h3 class="text-xl font-semibold text-white">${escapeHtml(category.name)}</h3>
			<p class="mt-1 max-w-2xl text-slate-400">${escapeHtml(category.description)}</p>
			<div class="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				${category.algorithms.map((algorithm) => algorithmCard(category, algorithm)).join("")}
			</div>
		</section>`;
}

export async function homePage(): Promise<View> {
	const [categories, previewDetails] = await Promise.all([
		fetchCategories(),
		fetchAlgorithm(PREVIEW.category, PREVIEW.slug).catch(() => undefined),
	]);
	const first = categories[0];
	const firstAlgorithm = first?.algorithms[0];
	const startLink = firstAlgorithm
		? `<a href="/${escapeHtml(first.slug)}/${escapeHtml(firstAlgorithm.slug)}" class="button border-sky-500 bg-sky-500 px-5 py-2.5 text-slate-950 shadow-lg shadow-sky-500/25 hover:bg-sky-400">Start with ${escapeHtml(firstAlgorithm.name)}</a>`
		: "";

	const element = fromHtml(`
		<div>
			<section class="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:py-24 lg:grid-cols-2">
				<div>
					<p class="text-sm font-semibold tracking-wide text-sky-400 uppercase">Open-source algorithm visualizer</p>
					<h1 class="mt-3 text-4xl font-bold tracking-tight text-white sm:text-5xl">
						See what your code does,
						<span class="bg-linear-to-r from-sky-400 via-violet-400 to-emerald-400 bg-clip-text text-transparent">step by step.</span>
					</h1>
					<p class="mt-6 text-lg leading-8 text-slate-400">
						Visualizer animates algorithms and highlights the exact line of code that runs at every step.
						It connects the idea behind an algorithm with the code that implements it.
					</p>
					<div class="mt-8 flex flex-wrap gap-3">
						${startLink}
						<a href="#algorithms" class="button px-5 py-2.5">Browse algorithms</a>
					</div>
				</div>
				<div data-slot="preview"></div>
			</section>

			<section class="border-y border-slate-800 bg-slate-900/40">
				<div class="mx-auto max-w-6xl px-4 py-16">
					<h2 class="text-2xl font-bold text-white">Made for visual learners</h2>
					<p class="mt-3 max-w-3xl leading-7 text-slate-400">
						Reading about an algorithm tells you what it does. Watching it run shows you how.
						Many of us understand the logic behind an algorithm but lose track of which line of code runs when.
						Visualizer puts the animation, the code and the variables side by side, so you can follow every single step.
					</p>
					<div class="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
						${FEATURES.map(
							(feature) => `
								<div class="card p-5">
									<span class="flex h-10 w-10 items-center justify-center rounded-lg ${feature.color}">${svgIcon(feature.icon)}</span>
									<h3 class="mt-4 font-semibold text-white">${feature.title}</h3>
									<p class="mt-2 text-sm leading-6 text-slate-400">${feature.text}</p>
								</div>`,
						).join("")}
					</div>
				</div>
			</section>

			<section id="algorithms" class="mx-auto max-w-6xl scroll-mt-16 px-4 py-16">
				<h2 class="text-2xl font-bold text-white">Algorithms</h2>
				<div class="mt-8 space-y-12">
					${categories.map(categorySection).join("")}
				</div>
			</section>
		</div>`);

	const preview = createPreview(previewDetails);
	if (preview) slot(element, "preview").replaceWith(preview.element);
	addSnapshots(element);

	return { element, title: "Visualizer · See your code step by step", destroy: () => preview?.destroy() };
}
