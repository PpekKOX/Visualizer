import { escapeHtml, fromHtml } from "../dom";
import type { View } from "../router";

function messageView(title: string, text: string): View {
	const element = fromHtml(`
		<section class="mx-auto max-w-xl px-4 py-24 text-center">
			<h1 class="text-3xl font-bold text-white">${escapeHtml(title)}</h1>
			<p class="mt-4 text-slate-400">${escapeHtml(text)}</p>
			<a href="/" class="button mt-8">Back to home</a>
		</section>`);
	return { element, title: `${title} · Visualizer` };
}

export function notFoundPage(): View {
	return messageView("Page not found", "The page or algorithm you are looking for does not exist.");
}

export function errorPage(error: unknown): View {
	console.error(error);
	return messageView("Something went wrong", "The data could not be loaded. Please make sure the server is running and try again.");
}
