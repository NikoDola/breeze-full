# Breeze website guide

Read this file before editing the site. The project is a Next.js 16 App Router site with plain CSS. The original `website-2/` folder is the visual reference; the live site uses the assets copied into `public/template-2/`.

## Where code lives

| Location | Purpose |
| --- | --- |
| `src/app/` | Thin Next.js route entry files. Pages re-export their implementation from `src/featured/`. `src/app/layout.tsx` loads CSS and re-exports the site layout. API route files expose the handlers and their required runtime settings. |
| `src/featured/<route>/page.tsx` | Page composition, route-specific content, and metadata. `/` is `src/featured/home/page.tsx`. |
| `src/featured/site/layout.tsx` | Shared HTML shell, site metadata, header, and footer. |
| `src/featured/seo/` | Sitemap and robots responses. |
| `src/featured/admin/` | Admin page and API implementation. |
| `src/components/sections/` | Complete visual sections or larger page blocks, such as `PageHero`, `ServicePage`, `CtaBand`, and the request form. |
| `src/components/sections/home/` | The nine landing-page sections, assembled in `src/featured/home/page.tsx`. |
| `src/components/ui/` | Reusable controls: `Button`, `Input`, `Select`, `Textarea`, and `Icon`. Controls preserve any CSS class passed by their parent. |
| `src/styles/` | All global vanilla CSS. Import order is listed in `src/app/layout.tsx`. |
| `src/lib/` and `src/content/` | Site data and derived helpers. Business contact details come from `src/content/site.json` through `src/lib/site.ts`; promotions come from `src/content/promotions.json` and `src/lib/promotions.ts`. |
| `public/` | Images, logos, and other served assets. |

## Landing page sections

`src/featured/home/page.tsx` renders these in order:

| Component | Page area / ID |
| --- | --- |
| `HeroSection` | Hero |
| `SeasonsSection` | Heating and cooling / `#heating-cooling` |
| `ContactSection` | Service request / `#contact` |
| `SmileSection` | Brand introduction / `#smile` |
| `ServicesSection` | Featured services / `#services` |
| `BestSection` | Why Breeze / `#why-breeze` |
| `StorySection` | Company story / `#about` |
| `AreaSection` | Service area / `#area` |
| `ReviewsSection` | Testimonials / `#reviews` |

The shared header is `src/components/sections/SiteHeader.tsx`; the shared footer is `src/components/sections/SiteFooter.tsx`. The header owns the navigation links and the mobile menu state.

## Routes and content

- Service routes such as `/heating`, `/cooling`, and `/mini-split-systems` live in matching `src/featured/<route>/page.tsx` files. They use `src/components/sections/ServicePage.tsx` and data in `src/lib/services.ts`.
- Company and client routes, including `/about-us`, `/reviews`, `/gallery`, `/careers`, and `/contact-us`, have matching feature pages. Shared page blocks live in `src/components/sections/`.
- Promotions use `src/featured/promotions/`, `src/featured/summer-promotions/`, and `src/featured/winter-promotions/`, with data in `src/lib/promotions.ts` and `src/content/promotions.json`.
- `/admin` is implemented in `src/featured/admin/page.tsx`. Its API reads and writes the JSON files in `src/content/` and uploads images to `public/images/`. Set `ADMIN_PASSWORD` for the admin API.
- The service and careers forms prepare an email in the visitor's mail application. Their behavior is in `src/components/sections/ServiceRequestForm.tsx` and `CareersForm.tsx`.

## Styling and DevTools

The CSS is loaded in this order: `src/styles/globals.css`, `src/styles/template-2.css`, `src/styles/interior.css`, `src/styles/header-adjustments.css`, then `src/styles/hero.css`. Later files override earlier rules. No CSS framework is used.

- Landing-page layout, cards, and footer: `src/styles/template-2.css`.
- Interior pages: `src/styles/interior.css`.
- Header top strip, logo, button sizing, and mobile header adjustments: `src/styles/header-adjustments.css`.
- Home hero image layers and five animated, interrupted breeze lines: `src/styles/hero.css`. Each moving dash has an even width and rounded ends. The center line is thickest and slowest; the outer lines are thinnest and fastest. Desktop stacks `public/images/hero-bg.webp`, the SVG lines, and the transparent `public/images/hero-family.webp`; mobile uses `public/images/hero-full.webp`.
- Earlier shared styles and admin styles: `src/styles/globals.css`.

Select an element in DevTools and search its class with `rg`. For example, `.header-tagline-smile` is in `src/styles/header-adjustments.css`, `.service-card` is in `src/styles/template-2.css`, and `.inner-hero` is in `src/styles/interior.css`. When editing a control, check both its `ui-*` class and the section-specific class.

## Editing workflow

1. Read the relevant local Next.js guide in `node_modules/next/dist/docs/` before changing framework code, as required by `AGENTS.md`.
2. Edit the feature page for route-level content, a section component for a full visual block, or a UI component for a reusable control. Keep `src/app/` as route adapters.
3. For a new public route, add `src/featured/<route>/page.tsx` with its metadata, then add a one-line re-export in `src/app/<route>/page.tsx`.
4. Follow the verification guidance in `codex.md`: the user inspects visual changes in the browser; run `npm run build` for code or configuration changes that could affect compilation.

The `@/` import alias points to `src/` (see `tsconfig.json`). Next.js keeps `public/` and project configuration at the repository root.
