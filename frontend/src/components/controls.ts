import { fromHtml, slot } from "../dom";
import type { Player } from "../player";
import type { Sound } from "../sound";

const SPEEDS = [
	{ label: "0.25×", delay: 2000 },
	{ label: "0.5×", delay: 1000 },
	{ label: "1×", delay: 500 },
	{ label: "2×", delay: 250 },
	{ label: "4×", delay: 100 },
];
const DEFAULT_SPEED = 2;

const ICONS = {
	first: '<path d="M11 17l-5-5 5-5M18 17l-5-5 5-5" />',
	previous: '<path d="M15 18l-6-6 6-6" />',
	play: '<path d="M7 4.5v15l12-7.5z" fill="currentColor" />',
	pause: '<path d="M8 5v14M16 5v14" />',
	next: '<path d="M9 18l6-6-6-6" />',
	last: '<path d="M13 17l5-5-5-5M6 17l5-5-5-5" />',
	sound: '<path d="M11 5L6 9H3v6h3l5 4z" fill="currentColor" /><path d="M15.5 8.5a5 5 0 010 7M18.5 5.5a9 9 0 010 13" />',
	muted: '<path d="M11 5L6 9H3v6h3l5 4z" fill="currentColor" /><path d="M22 9l-6 6M16 9l6 6" />',
};

function icon(path: string): string {
	return `<svg viewBox="0 0 24 24" class="h-5 w-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${path}</svg>`;
}

function iconButton(name: keyof typeof ICONS, label: string, extraClass = ""): string {
	return `<button type="button" class="button px-2.5 ${extraClass}" data-slot="${name}" title="${label}" aria-label="${label}">${icon(ICONS[name])}</button>`;
}

function setIconButton(button: HTMLButtonElement, path: string, label: string): void {
	button.innerHTML = icon(path);
	button.title = label;
	button.setAttribute("aria-label", label);
}

export class Controls {
	readonly element: HTMLElement;
	private readonly first: HTMLButtonElement;
	private readonly previous: HTMLButtonElement;
	private readonly play: HTMLButtonElement;
	private readonly next: HTMLButtonElement;
	private readonly last: HTMLButtonElement;
	private readonly progress: HTMLInputElement;
	private readonly counter: HTMLElement;
	private readonly mute: HTMLButtonElement;
	private readonly volume: HTMLInputElement;

	constructor(
		private readonly player: Player,
		private readonly sound: Sound,
		onRandomize: () => void,
	) {
		this.element = fromHtml(`
			<div class="card flex flex-wrap items-center gap-x-4 gap-y-3 p-3">
				<div class="flex items-center gap-1">
					${iconButton("first", "Go to start")}
					${iconButton("previous", "Previous step (←)")}
					${iconButton("play", "Play (Space)", "border-sky-500 bg-sky-500 text-slate-950 hover:bg-sky-400")}
					${iconButton("next", "Next step (→)")}
					${iconButton("last", "Go to end")}
				</div>
				<div class="flex min-w-48 flex-1 items-center gap-3">
					<input type="range" min="0" value="0" class="w-full accent-sky-400" data-slot="progress" aria-label="Step" />
					<span class="text-sm whitespace-nowrap text-slate-400 tabular-nums" data-slot="counter"></span>
				</div>
				<label class="flex items-center gap-2 text-sm text-slate-400">
					Speed
					<select class="rounded-lg border border-slate-700 bg-slate-800 px-2 py-2 text-slate-200" data-slot="speed">
						${SPEEDS.map((speed, index) => `<option value="${speed.delay}" ${index === DEFAULT_SPEED ? "selected" : ""}>${speed.label}</option>`).join("")}
					</select>
				</label>
				<div class="flex items-center gap-2">
					${iconButton("sound", "Mute")}
					<input type="range" min="0" max="1" step="0.05" class="w-24 accent-sky-400" data-slot="volume" aria-label="Volume" />
				</div>
				<button type="button" class="button" data-slot="randomize">Randomize</button>
			</div>`);

		this.first = slot(this.element, "first");
		this.previous = slot(this.element, "previous");
		this.play = slot(this.element, "play");
		this.next = slot(this.element, "next");
		this.last = slot(this.element, "last");
		this.progress = slot(this.element, "progress");
		this.counter = slot(this.element, "counter");
		this.mute = slot(this.element, "sound");
		this.volume = slot(this.element, "volume");
		
		const speed = slot<HTMLSelectElement>(this.element, "speed");

		this.first.addEventListener("click", () => player.goTo(0));
		this.previous.addEventListener("click", () => player.previous());
		this.play.addEventListener("click", () => player.toggle());
		this.next.addEventListener("click", () => player.next());
		this.last.addEventListener("click", () => player.goTo(player.count - 1));
		this.progress.addEventListener("input", () => player.goTo(Number(this.progress.value)));
		speed.addEventListener("change", () => player.setDelay(Number(speed.value)));

		slot(this.element, "randomize").addEventListener("click", onRandomize);

		this.mute.addEventListener("click", () => {
			sound.toggleMute();
			sound.play("compare");
			this.updateSound();
		});

		this.volume.addEventListener("input", () => {
			sound.setVolume(Number(this.volume.value));
			this.updateSound();
		});

		this.volume.addEventListener("change", () => sound.play("compare"));

		player.setDelay(SPEEDS[DEFAULT_SPEED].delay);
		this.updateSound();
	}

	update(): void {
		const { index, count, isPlaying, isAtEnd } = this.player;

		setIconButton(this.play, isPlaying ? ICONS.pause : ICONS.play, isPlaying ? "Pause (Space)" : "Play (Space)");

		this.first.disabled = this.previous.disabled = index === 0;
		this.next.disabled = this.last.disabled = isAtEnd;
		this.progress.max = String(count - 1);
		this.progress.value = String(index);
		this.counter.textContent = `Step ${index + 1} / ${count}`;
	}

	private updateSound(): void {
		const { volume } = this.sound;

		setIconButton(this.mute, volume === 0 ? ICONS.muted : ICONS.sound, volume === 0 ? "Unmute" : "Mute");
		this.volume.value = String(volume);
	}
}
