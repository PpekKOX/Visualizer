import type { CategorySummary, LanguageId } from "@visualizer/shared";
import { getAlgorithmModule } from "../algorithms/registry";
import { fetchAlgorithm, fetchCategories } from "../api";
import { createAlgorithmInfo } from "../components/algorithmInfo";
import { CodePanel } from "../components/codePanel";
import { Controls } from "../components/controls";
import { VariablesPanel } from "../components/variablesPanel";
import { escapeHtml, fromHtml, slot } from "../dom";
import { loadPreferredLanguage, savePreferredLanguage } from "../languages";
import { Player } from "../player";
import { navigate, type Params, type View } from "../router";
import { Sound } from "../sound";
import { notFoundPage } from "./messagePage";

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

function handleShortcut(event: KeyboardEvent, player: Player): void {
	const target = event.target as HTMLElement;
	if (target.closest("input, select, textarea")) return;

	if (event.key === " " && !target.closest("button")) {
		event.preventDefault();
		player.toggle();
	} else if (event.key === "ArrowRight") {
		player.next();
	} else if (event.key === "ArrowLeft") {
		player.previous();
	}
}

export async function algorithmPage({ category, algorithm }: Params): Promise<View> {
	const module = await getAlgorithmModule(category, algorithm);
	if (!module) return notFoundPage();

	const [details, categories] = await Promise.all([fetchAlgorithm(category, algorithm), fetchCategories()]);
	if (!details) return notFoundPage();

	const element = fromHtml(`
		<div class="mx-auto max-w-6xl space-y-6 px-4 py-8">
			<div class="flex flex-wrap items-end justify-between gap-4">
				<div>
					<a href="/#${escapeHtml(details.category.slug)}" class="text-sm font-medium text-sky-400 hover:text-sky-300">${escapeHtml(details.category.name)}</a>
					<h1 class="mt-1 text-3xl font-bold text-white">${escapeHtml(details.name)}</h1>
					<p class="mt-2 max-w-2xl text-slate-400">${escapeHtml(details.summary)}</p>
				</div>
				<label class="flex items-center gap-2 text-sm text-slate-400">
					Algorithm
					<select class="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-slate-200" data-slot="switcher">
						${algorithmOptions(categories, location.pathname)}
					</select>
				</label>
			</div>
			<section class="card p-4 sm:p-6">
				<div data-slot="visualizer"></div>
				<p class="mt-5 min-h-12 rounded-lg bg-slate-950/60 px-4 py-3 text-center text-slate-200" aria-live="polite" data-slot="message"></p>
			</section>
			<div data-slot="controls"></div>
			<div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
				<div data-slot="code"></div>
				<div data-slot="variables"></div>
			</div>
			<div data-slot="info"></div>
		</div>`);

	const { code } = details;
	const visualizer = module.createVisualizer();
	const { actionOf } = module;
	const variablesPanel = new VariablesPanel();
	const message = slot(element, "message");
	const sound = new Sound();

	let steps = module.generateSteps();
	let shownIndex = 0;
	let language: LanguageId = loadPreferredLanguage(Object.keys(code) as LanguageId[]);

	const codePanel = new CodePanel(code, language, (selected) => {
		language = selected;
		savePreferredLanguage(selected);
		showStep();
	});

	const player = new Player(steps.length, () => showStep());
	const controls = new Controls(player, sound, () => {
		steps = module.generateSteps();
		shownIndex = 0;
		player.load(steps.length);
	});

	function showStep(): void {
		const index = player.index;
		const step = steps[index];

		if (index !== shownIndex) sound.play(player.isAtEnd ? "finish" : actionOf(step));
		shownIndex = index;
		
		visualizer.render(step.state);
		message.textContent = step.message;
		codePanel.highlight(step.line);
		variablesPanel.render(step, steps[index - 1], language, code[language]?.identifiers);
		controls.update();
	}

	slot(element, "visualizer").replaceWith(visualizer.element);
	slot(element, "controls").replaceWith(controls.element);
	slot(element, "code").replaceWith(codePanel.element);
	slot(element, "variables").replaceWith(variablesPanel.element);
	slot(element, "info").replaceWith(createAlgorithmInfo(details));

	const switcher = slot<HTMLSelectElement>(element, "switcher");
	switcher.addEventListener("change", () => navigate(switcher.value));

	const onKeyDown = (event: KeyboardEvent) => handleShortcut(event, player);
	document.addEventListener("keydown", onKeyDown);
	showStep();

	return {
		element,
		title: `${details.name} · Visualizer`,
		destroy: () => {
			player.destroy();
			document.removeEventListener("keydown", onKeyDown);
		},
	};
}
