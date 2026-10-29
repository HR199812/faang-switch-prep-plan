import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  // Practice code-runner workers are module workers (the Python one dynamic-imports Pyodide).
  worker: { format: "es" },
});
