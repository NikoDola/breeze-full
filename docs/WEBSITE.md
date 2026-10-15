# Breeze website guide

Read this file before editing the site. The project is a Next.js 16 App Router site with plain CSS. The original `website-2/` folder is the visual reference; the live site uses the assets copied into `public/template-2/`.

## Where code lives

| Location | Purpose |
| --- | --- |
| `src/app/` | Thin Next.js route entry files. Public page adapters live under `(site)/`, whose layout adds the public header/footer without changing URLs. Admin and API routes stay outside that group. `src/app/layout.tsx` loads CSS and re-exports the common HTML shell. |
| `src/featured/<route>/page.tsx` | Page composition, route-specific content, and metadata. `/` is `src/featured/home/page.tsx`. |
| `src/featured/site/layout.tsx` | Shared HTML shell and site metadata. `PublicLayout.tsx` contains the public header, main, and footer. Geist is scoped to the CMS editor and login through `src/featured/admin-test/font.ts`; public pages use the existing template font stacks. |
| `src/featured/seo/` | Sitemap and robots responses. |
| `src/featured/admin/` | Admin page and API implementation. |
| `src/components/sections/` | Complete visual sections or larger page blocks, such as `PageHero`, `ServicePage`, `CtaBand`, and the request form. |
| `src/components/sections/home/` | Landing-page section components, assembled in `src/featured/home/page.tsx` and `src/featured/why-choose-breeze/page.tsx`. |
| `src/components/ui/` | Reusable controls: `Button`, `Input`, `Select`, `Textarea`, and `Icon`. Controls preserve any CSS class passed by their parent. |
| `src/styles/` | All global vanilla CSS. Import order is listed in `src/app/layout.tsx`. |
| `src/lib/` and `src/content/` | Site data and derived helpers. Published Global settings override the `src/content/site.json` baseline through `src/lib/cms/site.ts`. Content source files seed the database; published documents are read through `src/lib/cms/public.ts`. |
| `public/` | Images, logos, and other served assets. |

## Landing page sections

`src/featured/home/page.tsx` loads the published version-2 test document (or the
original seed outside the enabled test environment). `HomeContent.tsx` renders
these original components in order. See [CMS-HOMEPAGE-MIGRATION.md](CMS-HOMEPAGE-MIGRATION.md).

| Component | Page area / ID |
| --- | --- |
| `HeroSection` | Hero |
| `SeasonsSection` | Heating and cooling / `#heating-cooling` |
| `ContactSection` | Service request / `#contact` |
| `ReviewsSection` | Testimonials / `#reviews` |
| `AreaSection` | Service area / `#area` |

The `/why-choose-breeze` page renders `SmileSection`, `ServicesSection`, `BestSection`, and `StorySection` in that order beneath its hero, followed by `ExpertsContent`.

Homepage reviews and service area inherit the shared `.section` vertical spacing: 105px on desktop and 75px at widths up to 700px. They use the same `.wrap` horizontal gutters as the preceding sections; avoid adding separate spacing overrides for these two sections.

Public email links use `src/components/ui/PublicEmail.tsx` for an orange envelope matching the phone icon, including the footer, legal contact details, and service copy. The Contact us card retains its existing matching mail badge.

The shared header is `src/components/sections/SiteHeader.tsx`; the shared footer is `src/components/sections/SiteFooter.tsx`. The header owns the navigation links and the mobile menu state. At the mobile menu breakpoint (930px), its 47.6px top strip shows Request service beside the phone number, replacing the desktop tagline. The main row contains a 153px logo and a menu toggle without a circular border; narrower phones retain that logo size. The desktop request button stays in the main row. Homepage request links target `#service-form`, with smooth scrolling on click and clearance for the sticky header. Native anchors provide the fallback; cancelled clicks and modified clicks keep their normal behavior. Other routes use Next.js navigation to `/contact-us#service-form`.

## Routes and content

- Service routes such as `/heating`, `/cooling`, and `/mini-split-systems` use matching feature adapters and `src/featured/content-page/Page.tsx`. `ContentPageView.tsx` renders published schema-6 documents, seeded from `src/lib/services.ts`. The service image appears only in the hero, followed by body copy, schedule/emergency cards and `ServiceNavigation.tsx`. Service summaries in listings come from the same publications.
- `/reviews` (Client in the header) uses the homepage's shared `ReviewCard` with four columns on desktop, two on tablet and one on mobile. The three homepage reviewers appear first, followed by the remaining existing reviews. Long quotes expand through a native Read full review disclosure; all original testimonial text remains available.
- Company and client routes, including `/about-us`, `/reviews`, `/gallery`, `/careers`, and `/contact-us`, have matching feature pages. Shared page blocks live in `src/components/sections/`.
- `/meet-the-hvac-experts` and `/going-green` use the shared article renderer in `ContentPageView.tsx` with independent documents: body copy below the hero, without the rounded content image, and Keep reading cards below the article. `/why-choose-breeze` retains its feature sections, rendered from its own document through `WhyContent.tsx` and `ExpertsContent.tsx`.
- Promotions uses one database document for `/promotions`, `/summer-promotions` and `/winter-promotions`. `PromotionsContent.tsx` and `PromoPageContent.tsx` render its listing and fixed seasonal offers. `src/content/promotions.json` remains the initial seed and fixed asset/destination source.
- `/admin-test` is the protected visual CMS editor in `src/featured/admin-test/`. `AdminShell.tsx` provides a Brzio-inspired desktop sidebar and a mobile dialog menu, with Homepage navigation, a Leave admin link and support contacts. It has no public header/footer. Homepage editing uses component-specific fields and a protected responsive `/admin-test/preview` iframe that keeps the public website shell. Its CSS modules are scoped to this workspace. `/admin` redirects there after authorization. The legacy JSON-write and filesystem-upload APIs return `410`; `ADMIN_PASSWORD` is no longer used. See `docs/CMS-HOMEPAGE-MIGRATION.md` and `docs/CMS-VISUAL-EDITOR.md`.
- `/cms-proof` is temporarily disabled and returns 404 during normal use. Its navigation item, editor actions and invalidation are also disabled; editor requests without a page ID now target Homepage. Proof drafts, immutable revisions and images are preserved. Isolated `cms:proof` tests retain access; future Preview testing may opt in with `CMS_PROOF_ENABLED=true`. The client/Production site always keeps the proof disabled. See `docs/CMS-CLIENT-LAUNCH.md` and `docs/CMS-MILESTONE-1.md`.
- The four editable homepage headings use a compact Tiptap editor on `cms-testing`. Template version 2 stores validated inline text/formatting; older template version 1 remains readable. The public renderer stays independent of Tiptap, and draft/publish/retry use the existing workflow. See `docs/CMS-RICH-TEXT.md` for security limits, verification and the required compatible release order.
- Gallery exposes the R2 image library independently of the disabled proof. Migration `0004_content_media.sql` adds schema-6 publication validation and asset reference tracking. Media bytes remain in R2 and documents/reference records in D1. See `docs/CMS-MEDIA.md`.
- Reviews and Global settings use the same protected draft/publish/retry workflow. Reviews manages the Client library, its page/search text and up to three homepage favorites. Global manages phone, emails, social links, address, Google Maps directions and shared banner/callout copy. Its preview offers Footer, Header, Hero, Service request, Contact location and Contact banner. Footer social icons stay below phone/email, using project-controlled navy outlines and tagline-colored backgrounds. Existing credentials remain valid. See `docs/CMS-REVIEWS-GLOBAL.md`.
- The service and careers forms prepare an email in the visitor's mail application. Their behavior is in `src/components/sections/ServiceRequestForm.tsx` and `CareersForm.tsx`.

## Styling and DevTools

The root layout loads `src/styles/globals.css`, `src/styles/template-2.css`, `src/styles/header-adjustments.css`, then `src/styles/hero.css`. `globals.css` retains the shared reset, tokens and 404 styles. `PageHero.tsx` loads `interior-page.css`, which imports `legacy-sections.css`, `interior.css` and `reviews-and-services.css` in the original order. The proof component uses the same entry for its shared hero shade. Keep these section styles scoped to their entry components so the homepage does not download them; use the common entry to preserve their cascade. No CSS framework is used.

- Landing-page layout, cards, and footer: `src/styles/template-2.css`.
- Interior pages: `src/styles/interior.css`.
- Public hover feedback uses colors, light-blue borders and shadows. Card frames, buttons, text and icons stay stationary. Service, promotion and gallery cards allow a 10% zoom of only the image within its clipped frame on devices with hover support, with a smooth 600ms transition. Their 2px light-blue outline fades in only on hover; no outline is visible at rest. These explicitly requested image and outline transitions stay enabled under reduced-motion preferences through a scoped override in `interior.css`; other effects retain the global motion preference. Legacy `globals.css` does not add hover movement or image scaling.
- `/services` cards share equal row heights with a 600px minimum, fixed 195px image frames and bottom-aligned Read more links. Rows can grow together if wrapping or enlarged text requires more space. Repairs & Services uses the generated `/images/repairs-service-technician-v2.webp` in its cards and page hero; the original asset remains available elsewhere. See `docs/REPAIRS-IMAGE.md` for the generation prompt.
- Client reviews and full-width service layout: `src/styles/reviews-and-services.css`. The desktop/mobile services picker uses `src/components/sections/service-navigation.module.css`.
- Service hero images use `ParallaxHeroPhoto.tsx` and its CSS module for scroll movement (up to 120px), driven by the hero's viewport position. This specifically requested effect remains enabled with reduced-motion preferences; the exception is limited to service hero images. The image extends beyond the hero edges to keep them covered while moving. Other page heroes remain static. Service body text aligns with the left edge of the cards below it.
- Header top strip, logo, button sizing, and mobile header adjustments: `src/styles/header-adjustments.css`.
- Home hero image layers and five animated, interrupted breeze lines: `src/styles/hero.css`. Each moving dash has an even width and rounded ends. The center line is thickest and slowest; the outer lines are thinnest and fastest. Desktop stacks `public/images/hero-bg.webp`, the SVG lines, and the transparent `public/images/hero-family.webp`; mobile uses `public/images/hero-full.webp`. `HeroSection.tsx` preloads only the matching viewport's images from the initial HTML.
- Shared reset and tokens: `src/styles/globals.css`. Earlier interior section rules: `src/styles/legacy-sections.css`.

The service request form imports only `src/lib/service-labels.ts`. Full descriptions stay in `src/lib/services.ts`, which uses those same labels. Keep full service-page content out of the form's client bundle.

Select an element in DevTools and search its class with `rg`. For example, `.header-tagline-smile` is in `src/styles/header-adjustments.css`, `.service-card` is in `src/styles/template-2.css`, and `.inner-hero` is in `src/styles/interior.css`. When editing a control, check both its `ui-*` class and the section-specific class.

## Editing workflow

The remaining-page CMS audit and proposed migration order are documented in
[CMS-REMAINING-PAGES.md](CMS-REMAINING-PAGES.md). It covers services and company
articles, promotions, careers cards, Global address/maps and the remaining public
pages. It is implemented and seeded locally; the document records verification
and the compatible production release steps still required.

1. Read the relevant local Next.js guide in `node_modules/next/dist/docs/` before changing framework code, as required by `AGENTS.md`.
2. Edit the feature page for route-level content, a section component for a full visual block, or a UI component for a reusable control. Keep `src/app/` as route adapters.
3. For a new public route, add `src/featured/<route>/page.tsx` with its metadata, then add a one-line re-export in `src/app/<route>/page.tsx`.
4. Follow the verification guidance in `codex.md`: the user inspects visual changes in the browser; run `npm run build` for code or configuration changes that could affect compilation.

The `@/` import alias points to `src/` (see `tsconfig.json`). Next.js keeps `public/` and project configuration at the repository root.
