export type VariableValue = number | string | boolean | number[];
export type Variables = Record<string, VariableValue>;
export type StepAction = "compare" | "write" | "select" | "other";

export interface CallFrame {
	name: string;
	args: VariableValue[];
}

export interface Step<TState> {
	line: string;
	message: string;
	variables: Variables;
	callStack?: CallFrame[];
	state: TState;
}

export interface Visualizer<TState> {
	readonly element: HTMLElement;
	render(state: TState): void;
}

export interface AlgorithmModule<TState = unknown> {
	generateSteps(): Step<TState>[];
	createVisualizer(compact?: boolean): Visualizer<TState>;
	actionOf(step: Step<TState>): StepAction;
}
