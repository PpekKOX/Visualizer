export class Player {
	private position = 0;
	private timer: ReturnType<typeof setTimeout> | undefined;
	private delay = 500;

	constructor(
		private stepCount: number,
		private readonly onChange: () => void,
	) {}

	get index(): number {
		return this.position;
	}

	get count(): number {
		return this.stepCount;
	}

	get isPlaying(): boolean {
		return this.timer !== undefined;
	}

	get isAtEnd(): boolean {
		return this.position >= this.stepCount - 1;
	}

	load(stepCount: number): void {
		this.stop();
		this.stepCount = stepCount;
		this.position = 0;
		this.onChange();
	}

	play(): void {
		if (this.isPlaying || this.stepCount < 2) return;
		if (this.isAtEnd) this.position = 0;
		this.scheduleNext();
		this.onChange();
	}

	pause(): void {
		this.stop();
		this.onChange();
	}

	toggle(): void {
		if (this.isPlaying) this.pause();
		else this.play();
	}

	next(): void {
		this.goTo(this.position + 1);
	}

	previous(): void {
		this.goTo(this.position - 1);
	}

	goTo(index: number): void {
		this.stop();
		this.position = Math.max(Math.min(index, this.stepCount - 1), 0);
		this.onChange();
	}

	setDelay(delay: number): void {
		this.delay = delay;
	}

	destroy(): void {
		this.stop();
	}

	private stop(): void {
		clearTimeout(this.timer);
		this.timer = undefined;
	}

	private scheduleNext(): void {
		this.timer = setTimeout(() => {
			this.position++;
			this.timer = undefined;
			if (!this.isAtEnd) this.scheduleNext();
			this.onChange();
		}, this.delay);
	}
}
