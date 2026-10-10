# Breeze editing notes

Read `docs/WEBSITE.md` for the route and component map before editing.

## Verification

- For small visual changes limited to CSS, such as spacing, color, or animation, make the edit without running a browser check or production build. The user will inspect the page.
- Run `npm run build` when changing routes, imports, TypeScript or component logic, dependencies, configuration, or anything that could affect compilation. Also run it when a CSS change exposes a concrete build risk.
- Do not run browser checks unless the user explicitly requests one. Respect `prefers-reduced-motion` by default; if the user explicitly requests an effect to keep moving, scope that exception to the requested effect.
