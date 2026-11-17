import type { StepAction } from "./algorithms/types";
import { loadSetting, saveSetting } from "./storage";

export type SoundEffect = StepAction | "finish";

interface Note {
	frequency: number;
	wave: OscillatorType;
	duration: number;
	gain: number;
	delay?: number;
}

const VOLUME_KEY = "visualizer.volume";
const MUTED_KEY = "visualizer.muted";
export const DEFAULT_VOLUME = 0.5;
const ATTACK = 0.005;
const SILENCE = 0.0001;
const FINISH_MELODY = [523, 659, 784, 1047]; // C5 E5 G5 C6

const EFFECTS: Record<SoundEffect, Note[]> = {
	other: [{ frequency: 1200, wave: "sine", duration: 0.06, gain: 0.5 }],
	compare: [{ frequency: 660, wave: "triangle", duration: 0.08, gain: 0.5 }],
	write: [{ frequency: 196, wave: "square", duration: 0.1, gain: 0.2 }],
	select: [
		{ frequency: 784, wave: "sine", duration: 0.06, gain: 0.45 },
		{ frequency: 1047, wave: "sine", duration: 0.08, gain: 0.45, delay: 0.06 },
	],
	finish: FINISH_MELODY.map((frequency, index) => ({
		frequency,
		wave: "triangle",
		duration: index === FINISH_MELODY.length - 1 ? 0.5 : 0.12,
		gain: 0.6,
		delay: index * 0.12,
	})),
};

function loadVolume(): number {
	const saved = Number(loadSetting(VOLUME_KEY) ?? DEFAULT_VOLUME);
	return Number.isFinite(saved) ? Math.min(Math.max(saved, 0), 1) : DEFAULT_VOLUME;
}

export class Sound {
	private context: AudioContext | undefined;
	private level = loadVolume();
	private isMuted = loadSetting(MUTED_KEY) === "true";

	get volume(): number {
		return this.isMuted ? 0 : this.level;
	}

	setVolume(volume: number): void {
		this.level = volume;
		this.isMuted = volume === 0;
		this.save();
	}

	toggleMute(): void {
		this.isMuted = !this.isMuted;
		if (!this.isMuted && this.level === 0) this.level = DEFAULT_VOLUME;
		this.save();
	}

	play(effect: SoundEffect): void {
		const context = this.volume > 0 ? this.getContext() : undefined;
		if (!context) return;

		for (const note of EFFECTS[effect]) this.playNote(context, note);
	}

	private getContext(): AudioContext | undefined {
		if (typeof AudioContext === "undefined") return undefined;

		this.context ??= new AudioContext();
		if (this.context.state === "suspended") void this.context.resume();

		return this.context;
	}

	private playNote(context: AudioContext, { frequency, wave, duration, gain, delay = 0 }: Note): void {
		const start = context.currentTime + delay;
		const oscillator = new OscillatorNode(context, { type: wave, frequency });
		const envelope = new GainNode(context, { gain: 0 });

		envelope.gain.setValueAtTime(0, start);
		envelope.gain.linearRampToValueAtTime(gain * this.volume, start + ATTACK);
		envelope.gain.exponentialRampToValueAtTime(SILENCE, start + duration);
		oscillator.connect(envelope).connect(context.destination);
		oscillator.start(start);
		oscillator.stop(start + duration);
	}

	private save(): void {
		saveSetting(VOLUME_KEY, String(this.level));
		saveSetting(MUTED_KEY, String(this.isMuted));
	}
}
