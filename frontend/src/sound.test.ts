import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_VOLUME, Sound } from "./sound";

function stubWebAudio(): OscillatorOptions[] {
	const played: OscillatorOptions[] = [];
	const param = { setValueAtTime() {}, linearRampToValueAtTime() {}, exponentialRampToValueAtTime() {} };
	const node = { connect: (next: unknown) => next, start() {}, stop() {} };

	vi.stubGlobal("AudioContext", class { state = "running"; currentTime = 0; destination = {}; });
	vi.stubGlobal("GainNode", class { gain = param; connect = node.connect; });
	vi.stubGlobal(
		"OscillatorNode",
		class {
			constructor(_context: unknown, options: OscillatorOptions) {
				played.push(options);
				Object.assign(this, node);
			}
		},
	);

	return played;
}

describe("Sound", () => {
	beforeEach(() => {
		const storage = new Map<string, string>();
		vi.stubGlobal("localStorage", {
			getItem: (key: string) => storage.get(key) ?? null,
			setItem: (key: string, value: string) => storage.set(key, value),
		});
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it("starts unmuted at the default volume", () => {
		expect(new Sound().volume).toBe(DEFAULT_VOLUME);
	});

	it("mutes and restores the previous volume", () => {
		const sound = new Sound();
		sound.setVolume(0.8);

		sound.toggleMute();
		expect(sound.volume).toBe(0);
		sound.toggleMute();
		expect(sound.volume).toBe(0.8);
	});

	it("unmutes to the default volume when the volume was set to zero", () => {
		const sound = new Sound();
		sound.setVolume(0);

		sound.toggleMute();
		expect(sound.volume).toBe(DEFAULT_VOLUME);
	});

	it("remembers the volume and the mute state", () => {
		const sound = new Sound();
		sound.setVolume(0.3);
		sound.toggleMute();

		const restored = new Sound();
		expect(restored.volume).toBe(0);
		restored.toggleMute();
		expect(restored.volume).toBe(0.3);
	});

	it("ignores an invalid saved volume", () => {
		localStorage.setItem("visualizer.volume", "loud");
		expect(new Sound().volume).toBe(DEFAULT_VOLUME);
	});

	it("plays a different sound for every action and a melody at the end", () => {
		const played = stubWebAudio();
		const sound = new Sound();
		const effects = ["other", "compare", "write", "select", "finish"] as const;

		const sounds = effects.map((effect) => {
			played.length = 0;
			sound.play(effect);
			return JSON.stringify(played);
		});

		expect(new Set(sounds).size).toBe(effects.length);
		expect(JSON.parse(sounds.at(-1)!).length).toBeGreaterThan(2);
	});

	it("stays silent when muted", () => {
		const played = stubWebAudio();
		const sound = new Sound();
		sound.toggleMute();

		sound.play("compare");
		expect(played).toEqual([]);
	});

	it("does nothing without Web Audio support", () => {
		expect(() => new Sound().play("finish")).not.toThrow();
	});
});
