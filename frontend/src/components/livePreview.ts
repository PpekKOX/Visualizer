import type { CodeSnippet, LanguageId } from "@visualizer/shared";
import type { AlgorithmModule, Step, Visualizer } from "../algorithms/types";
import { escapeHtml, fromHtml, slot } from "../dom";
import { formatValue } from "../languages";
import { Player } from "../player";
import { codeLinesHtml, markActiveLines } from "./codePanel";
import { hasChanged } from "./variablesPanel";

const STEP_DELAY = 450;
const RESTART_DELAY = 2500;

export class LivePreview {
	readonly element: HTMLElement;
	private readonly visualizer: Visualizer<unknown>;
	private readonly lines: HTMLElement[];
	private readonly variables: HTMLElement;
	private readonly player: Player;
	private steps: Step<unknown>[];
	private restartTimer: ReturnType<typeof setTimeout> | undefined;

	constructor(
		private readonly module: AlgorithmModule,
		private readonly snippet: CodeSnippet,
		private readonly language: LanguageId,
	) {
		this.element = fromHtml(`
			<div class="card overflow-hidden p-5 shadow-2xl shadow-sky-950/50" aria-hidden="true">
				<div class="h-32" data-slot="visualizer"></div>
				<div class="mt-5 font-mono text-xs leading-5" data-slot="code"></div>
				<div class="mt-4 flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs" data-slot="variables"></div>
			</div>`);
		this.visualizer = module.createVisualizer(true);
		slot(this.element, "visualizer").append(this.visualizer.element);

		const code = slot(this.element, "code");
		code.innerHTML = codeLinesHtml(snippet.lines, language);
		this.lines = [...code.children] as HTMLElement[];
		this.variables = slot(this.element, "variables");

		this.steps = module.generateSteps();
		this.player = new Player(this.steps.length, () => this.render());
		this.player.setDelay(STEP_DELAY);

		if (matchMedia("(prefers-reduced-motion: reduce)").matches) this.player.goTo(Math.floor(this.steps.length / 2));
		else this.player.play();
	}

	destroy(): void {
		this.player.destroy();
		clearTimeout(this.restartTimer);
	}

	private restart(): void {
		this.steps = this.module.generateSteps();
		this.player.load(this.steps.length);
		this.player.play();
	}

	private render(): void {
		const index = this.player.index;
		const step = this.steps[index];
		const previous = this.steps[index - 1];

		this.visualizer.render(step.state);
		markActiveLines(this.lines, this.snippet.steps[step.line]);
		this.variables.innerHTML = Object.entries(step.variables)
			.map(([name, value]) => {
				const style = hasChanged(name, step, previous, this.language) ? "bg-amber-400/15 text-amber-300" : "text-white";
				const label = this.snippet.identifiers?.[name] ?? name;

				return `<span class="text-slate-400">${escapeHtml(label)} = <span class="rounded px-1 ${style}">${escapeHtml(formatValue(value, this.language))}</span></span>`;
			})
			.join("");

		if (this.player.isAtEnd) {
			clearTimeout(this.restartTimer);
			this.restartTimer = setTimeout(() => this.restart(), RESTART_DELAY);
		}
	}
}
