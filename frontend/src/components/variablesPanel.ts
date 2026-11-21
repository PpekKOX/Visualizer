import type { LanguageId } from "@visualizer/shared";
import type { CallFrame, Step, VariableValue } from "../algorithms/types";
import { escapeHtml, fromHtml, slot } from "../dom";
import { formatValue } from "../languages";

export function hasChanged(name: string, step: Step<unknown>, previous: Step<unknown> | undefined, language: LanguageId): boolean {
	const previousValue = previous?.variables[name];
	return previousValue === undefined || formatValue(previousValue, language) !== formatValue(step.variables[name], language);
}

export class VariablesPanel {
	readonly element: HTMLElement;
	private readonly callStack: HTMLElement;
	private readonly body: HTMLElement;

	constructor() {
		this.element = fromHtml(`
			<section class="card flex flex-col">
				<h2 class="border-b border-slate-800 px-4 py-3.5 text-sm font-semibold text-white">Variables</h2>
				<div class="border-b border-slate-800 px-4 py-3" data-slot="callStack"></div>
				<div class="flex-1 py-2 font-mono text-sm" data-slot="body"></div>
				<p class="border-t border-slate-800 px-4 py-2.5 text-xs text-slate-500">
					<span class="rounded bg-amber-400/15 px-1 text-amber-300">Highlighted</span> values changed in this step.
				</p>
			</section>`);
		this.callStack = slot(this.element, "callStack");
		this.body = slot(this.element, "body");
	}

	render(step: Step<unknown>, previous: Step<unknown> | undefined, language: LanguageId, identifiers: Record<string, string> = {}): void {
		const format = (value: VariableValue) => formatValue(value, language);
		const rows = Object.entries(step.variables).map(([name, value]) => {
			const style = hasChanged(name, step, previous, language) ? "bg-amber-400/15 text-amber-300" : "text-white";

			return `
				<div class="flex items-start justify-between gap-4 px-4 py-1.5">
					<dt class="text-slate-400">${escapeHtml(identifiers[name] ?? name)}</dt>
					<dd class="rounded px-1.5 text-right break-all tabular-nums ${style}">${escapeHtml(format(value))}</dd>
				</div>`;
		});

		this.body.innerHTML = rows.length
			? `<dl>${rows.join("")}</dl>`
			: `<p class="px-4 py-1.5 font-sans text-slate-500">No variables yet.</p>`;
		this.renderCallStack(step.callStack ?? [], format, identifiers);
	}

	private renderCallStack(frames: CallFrame[], format: (value: VariableValue) => string, identifiers: Record<string, string>): void {
		this.callStack.hidden = frames.length === 0;
		this.callStack.innerHTML = `
			<h3 class="mb-1.5 text-xs font-semibold tracking-wide text-slate-500 uppercase">Call stack</h3>
			<ol class="space-y-0.5 font-mono text-sm">
				${frames
					.map((frame, index) => {
						const current = index === frames.length - 1;
						const call = `${identifiers[frame.name] ?? frame.name}(${frame.args.map(format).join(", ")})`;
						const style = current ? "bg-sky-400/15 text-sky-300" : "text-slate-400";

						return `<li class="truncate rounded px-1.5 ${style}">${escapeHtml(call)}</li>`;
					})
					.join("")}
			</ol>`;
	}
}
