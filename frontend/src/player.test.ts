import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { Player } from "./player";

describe("Player", () => {
	beforeEach(() => vi.useFakeTimers());
	afterEach(() => vi.useRealTimers());

	it("plays through all steps and stops at the end", () => {
		const player = new Player(3, () => {});
		player.setDelay(100);
		player.play();

		vi.advanceTimersByTime(100);
		expect(player.index).toBe(1);
		vi.advanceTimersByTime(100);
		expect(player.index).toBe(2);
		expect(player.isPlaying).toBe(false);
		vi.advanceTimersByTime(1000);
		expect(player.index).toBe(2);
	});

	it("restarts from the beginning when played at the end", () => {
		const player = new Player(3, () => {});
		player.goTo(2);
		player.play();
		expect(player.index).toBe(0);
		expect(player.isPlaying).toBe(true);
	});

	it("keeps manual navigation within bounds and pauses playback", () => {
		const player = new Player(3, () => {});
		player.previous();
		expect(player.index).toBe(0);

		player.play();
		player.goTo(10);
		expect(player.index).toBe(2);
		expect(player.isPlaying).toBe(false);
	});

	it("notifies about every change", () => {
		const onChange = vi.fn();
		const player = new Player(3, onChange);
		player.next();
		player.load(5);
		expect(onChange).toHaveBeenCalledTimes(2);
		expect(player.index).toBe(0);
		expect(player.count).toBe(5);
	});
});
