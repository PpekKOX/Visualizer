import type { AlgorithmDetails } from "@visualizer/shared";
import { escapeHtml, fromHtml } from "../dom";

function row(label: string, value: string): string {
	return `
		<tr>
			<th scope="row" class="py-2 text-left font-normal text-slate-400">${escapeHtml(label)}</th>
			<td class="py-2 text-right font-mono text-white">${escapeHtml(value)}</td>
		</tr>`;
}

export function createAlgorithmInfo(details: AlgorithmDetails): HTMLElement {
	const { complexity } = details;

	return fromHtml(`
		<section class="card grid gap-8 p-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
			<div class="space-y-4">
				<h2 class="text-xl font-semibold text-white">How ${escapeHtml(details.name)} works</h2>
				${details.description.map((paragraph) => `<p class="leading-7">${escapeHtml(paragraph)}</p>`).join("")}
			</div>
			<div>
				<h3 class="mb-2 text-sm font-semibold tracking-wide text-slate-400 uppercase">At a glance</h3>
				<table class="w-full text-sm">
					<tbody class="divide-y divide-slate-800">
						${row("Best time", complexity.best)}
						${row("Average time", complexity.average)}
						${row("Worst time", complexity.worst)}
						${row("Extra space", complexity.space)}
						${details.properties.map((property) => row(property.label, property.value)).join("")}
					</tbody>
				</table>
			</div>
		</section>`);
}
