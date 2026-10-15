# Breeze editing notes

Read `docs/WEBSITE.md` for the route and component map before editing.

## Admin interface

- The admin is a simple, practical client control panel, not a marketing page.
- Before login, show only the controls and information needed to sign in, return to the website, or get sign-in help. Do not reveal admin capabilities, available content, or internal details.
- Do not add promotional panels, slogans, feature lists, or descriptions of what the client can manage. Keep the login form centered and professional.

## Verification

- For small visual changes limited to CSS, such as spacing, color, or animation, make the edit without running a browser check or production build. The user will inspect the page.
- Run `npm run build` when changing routes, imports, TypeScript or component logic, dependencies, configuration, or anything that could affect compilation. Also run it when a CSS change exposes a concrete build risk.
- Do not run browser checks unless the user explicitly requests one. Respect `prefers-reduced-motion` by default; if the user explicitly requests an effect to keep moving, scope that exception to the requested effect.
