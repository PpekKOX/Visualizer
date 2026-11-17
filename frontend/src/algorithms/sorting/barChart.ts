import { fromHtml, slot } from "../../dom";
import type { Visualizer } from "../types";
import type { SortHighlight, SortState } from "./sortTracer";

const HIGHLIGHTS: { key: SortHighlight; label: string; color: string }[] = [
	{ key: "swapping", label: "Writing", color: "bg-rose-500" },
	{ key: "comparing", label: "Comparing", color: "bg-amber-400" },
	{ key: "marked", label: "Selected", color: "bg-violet-400" },
	{ key: "sorted", label: "Sorted", color: "bg-emerald-500" },
];
const IDLE_COLOR = "bg-sky-500";
const BAR_CLASS = "absolute inset-x-0 bottom-0 rounded-t-md transition-[height,background-color] duration-200";

function barColor(state: SortState, index: number): string {
	return HIGHLIGHTS.find(({ key }) => state[key].includes(index))?.color ?? IDLE_COLOR;
}

export class BarChart implements Visualizer<SortState> {
	readonly element: HTMLElement;
	private readonly container: HTMLElement;
	private bars: HTMLElement[] = [];

	constructor() {
		this.element = fromHtml(`
			<div>
				<div class="flex h-56 gap-1 pt-6 sm:h-72 sm:gap-2" data-slot="bars"></div>
				<ul class="mt-4 flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-slate-400">
					${HIGHLIGHTS.map(({ label, color }) => `<li class="flex items-center gap-2"><span class="h-3 w-3 rounded-sm ${color}"></span>${label}</li>`).join("")}
				</ul>
			</div>`);
		this.container = slot(this.element, "bars");
	}

	render(state: SortState): void {
		if (this.bars.length !== state.array.length) this.createBars(state.array.length);

		const max = Math.max(...state.array, 1);
		state.array.forEach((value, index) => {
			const bar = this.bars[index];
			bar.className = `${BAR_CLASS} ${barColor(state, index)}`;
			bar.style.height = `${(value / max) * 100}%`;
			bar.firstElementChild!.textContent = String(value);
		});
	}

	private createBars(count: number): void {
		this.container.innerHTML = Array.from(
			{ length: count },
			(_, index) => `
				<div class="flex flex-1 flex-col items-center gap-1">
					<div class="relative w-full flex-1">
						<div data-bar><span class="absolute inset-x-0 -top-5 text-center text-xs font-medium tabular-nums text-slate-200"></span></div>
					</div>
					<span class="text-[10px] tabular-nums text-slate-500">${index}</span>
				</div>`,
		).join("");
		this.bars = [...this.container.querySelectorAll<HTMLElement>("[data-bar]")];
	}
}
