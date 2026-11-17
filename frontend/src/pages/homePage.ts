import type { CategorySummary } from "@visualizer/shared";
import { fetchCategories } from "../api";
import { escapeHtml, fromHtml } from "../dom";
import type { View } from "../router";

const FEATURES = [
	{ title: "Pick an algorithm", text: "Choose from a library of algorithms grouped by topic, starting with sorting." },
	{ title: "Play it your way", text: "Run the whole algorithm at your own speed, or go through it one step at a time, forwards and backwards." },
	{ title: "Follow the code", text: "The line that runs right now is highlighted, and the current value of every variable is shown next to it." },
	{ title: "Switch languages", text: "Read the same algorithm in JavaScript, Python or Java. The highlighting follows you." },
];

const PREVIEW_BARS = [
	{ height: 45, color: "bg-sky-500" },
	{ height: 70, color: "bg-amber-400" },
	{ height: 30, color: "bg-amber-400" },
	{ height: 85, color: "bg-sky-500" },
	{ height: 55, color: "bg-sky-500" },
	{ height: 92, color: "bg-emerald-500" },
	{ height: 100, color: "bg-emerald-500" },
];

function preview(): string {
	return `
		<div class="card p-5 shadow-2xl shadow-sky-950/50" aria-hidden="true">
			<div class="flex h-40 items-end gap-2">
				${PREVIEW_BARS.map((bar) => `<div class="flex-1 rounded-t-md ${bar.color}" style="height: ${bar.height}%"></div>`).join("")}
			</div>
			<div class="mt-5 space-y-1 font-mono text-xs leading-6 text-slate-400">
				<div class="pl-3">for (let j = 0; j &lt; n - i - 1; j++) {</div>
				<div class="border-l-2 border-sky-400 bg-sky-400/15 pl-5 text-slate-100">if (arr[j] &gt; arr[j + 1]) {</div>
				<div class="pl-7">[arr[j], arr[j + 1]] = [arr[j + 1], arr[j]];</div>
			</div>
			<div class="mt-4 flex gap-4 font-mono text-xs">
				<span>i = <span class="text-white">1</span></span>
				<span>j = <span class="rounded bg-amber-400/15 px-1 text-amber-300">1</span></span>
			</div>
		</div>`;
}

function categorySection(category: CategorySummary): string {
	return `
		<section id="${escapeHtml(category.slug)}" class="scroll-mt-20">
			<h3 class="text-xl font-semibold text-white">${escapeHtml(category.name)}</h3>
			<p class="mt-1 max-w-2xl text-slate-400">${escapeHtml(category.description)}</p>
			<div class="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
				${category.algorithms
					.map(
						(algorithm) => `
							<a href="/${escapeHtml(category.slug)}/${escapeHtml(algorithm.slug)}" class="card group flex flex-col p-5 transition-colors hover:border-sky-500/60 hover:bg-slate-900">
								<span class="font-semibold text-white">${escapeHtml(algorithm.name)}</span>
								<span class="mt-2 flex-1 text-sm leading-6 text-slate-400">${escapeHtml(algorithm.summary)}</span>
								<span class="mt-4 text-sm font-medium text-sky-400 group-hover:text-sky-300">Visualize →</span>
							</a>`,
					)
					.join("")}
			</div>
		</section>`;
}

export async function homePage(): Promise<View> {
	const categories = await fetchCategories();
	const first = categories[0];
	const firstAlgorithm = first?.algorithms[0];
	const startLink = firstAlgorithm
		? `<a href="/${escapeHtml(first.slug)}/${escapeHtml(firstAlgorithm.slug)}" class="button border-sky-500 bg-sky-500 px-5 py-2.5 text-slate-950 hover:bg-sky-400">Start with ${escapeHtml(firstAlgorithm.name)}</a>`
		: "";

	const element = fromHtml(`
		<div>
			<section class="mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 sm:py-24 lg:grid-cols-2">
				<div>
					<p class="text-sm font-semibold tracking-wide text-sky-400 uppercase">Open-source algorithm visualizer</p>
					<h1 class="mt-3 text-4xl font-bold tracking-tight text-white sm:text-5xl">See what your code does, step by step.</h1>
					<p class="mt-6 text-lg leading-8 text-slate-400">
						Visualizer animates algorithms and highlights the exact line of code that runs at every step.
						It connects the idea behind an algorithm with the code that implements it.
					</p>
					<div class="mt-8 flex flex-wrap gap-3">
						${startLink}
						<a href="#algorithms" class="button px-5 py-2.5">Browse algorithms</a>
					</div>
				</div>
				${preview()}
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
							(feature, index) => `
								<div class="card p-5">
									<span class="flex h-8 w-8 items-center justify-center rounded-full bg-sky-500/15 text-sm font-semibold text-sky-300">${index + 1}</span>
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

	return { element, title: "Visualizer · See your code step by step" };
}
