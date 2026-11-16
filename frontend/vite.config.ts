import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vitest/config";

const api = { "/api": "http://localhost:3000" };

export default defineConfig({
	plugins: [tailwindcss()],
	server: { proxy: api },
	preview: { proxy: api },
});
