# Breeze Heating & Cooling website

Run `npm install` and `npm run dev` to work on the site. Run `npm run build` to check the production build.

When `.env.local` enables the local CMS (`CMS_TEST_ENABLED=true` and a loopback `CMS_WORKER_URL`), `npm run dev` starts the CMS Worker and waits for it before starting Next.js. Both run in the same terminal and stop with Ctrl+C. An already running Worker is reused and left running when Next stops.

For the first CMS setup, also run `npm --prefix workers/cms install` and `npm --prefix workers/cms run migrate:local`. Existing CMS configuration and local content stay in `.env.local`, `workers/cms/.dev.vars`, and `workers/cms/.wrangler/`; see [the local CMS setup guide](docs/CMS-MEDIA.md#local-setup-and-missing-schema-recovery). For website development without the CMS, set `CMS_TEST_ENABLED=false` in `.env.local` and restart.

`ECONNREFUSED 127.0.0.1:8787` means the local CMS Worker is stopped. Use `npm run dev` to start the complete local app; running `next dev` directly starts only the website. The Next.js slow filesystem warning is separate from this connection error.

Read [docs/WEBSITE.md](docs/WEBSITE.md) for the route map, component structure, content sources, and styling guide. Application code lives in `src/`: `src/app/` contains the Next.js route entry files, page implementations live in `src/featured/`, full visual blocks are in `src/components/sections/`, reusable controls are in `src/components/ui/`, and vanilla CSS is in `src/styles/`. Served assets remain in root `public/`.

To request a visual change, select the element in DevTools and share its class name. The guide maps common classes to their stylesheet.
