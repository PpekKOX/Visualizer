// Storage can be unavailable (private mode, blocked cookies), so settings are optional.

export function loadSetting(key: string): string | null {
	try {
		return localStorage.getItem(key);
	} catch {
		return null;
	}
}

export function saveSetting(key: string, value: string): void {
	try {
		localStorage.setItem(key, value);
	} catch {
		// The setting only lasts until the page is closed.
	}
}
