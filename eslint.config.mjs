import { defineConfig, globalIgnores } from "eslint/config";
import tseslint from "typescript-eslint";

export default defineConfig([
  ...tseslint.configs.recommended,
  globalIgnores([".next/**", ".next-cms-proof/**", ".local/**", ".vercel/**", "next-env.d.ts", "website-2/**", "sqllite-app/**", "workers/cms/.wrangler/**"]),
]);
