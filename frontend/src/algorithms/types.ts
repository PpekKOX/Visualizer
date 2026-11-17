export type VariableValue = number | string | boolean;
export type Variables = Record<string, VariableValue>;

export interface Step<TState> {
	line: string;
	message: string;
	variables: Variables;
	state: TState;
}

export interface Visualizer<TState> {
	readonly element: HTMLElement;
	render(state: TState): void;
}

export interface AlgorithmModule<TState = unknown> {
	generateSteps(): Step<TState>[];
	createVisualizer(): Visualizer<TState>;
}
