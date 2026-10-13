# Koharu Vue template: project instructions

## Project objective

Build a static, interactive blog frontend template with Vue 3, Vite, and TypeScript. Use https://github.com/cosZone/astro-koharu as a visual and interaction reference, not as an application architecture to migrate verbatim. The project will later connect to a separate backend; for now, pages use local mock data. `README.md` describes the current scope and planned pages. The repository directory name is historical and does not prescribe VitePress.

## Current scope

- Implement the site shell, responsive navigation, light/dark theme, home, post list/detail, categories, tags, archives, friends, and about pages in manageable stages.
- Use Vue 3 single-file components with `<script setup lang="ts">`. Prefer Vue Router for page navigation. Use TypeScript types for content and UI states.
- Make the template useful with representative mock data and working interactions. Support loading, empty, error, and not-found states where data is read.
- Keep `pages/` dependent on typed functions in `services/`, not directly on `data/`. Start with a local implementation; preserve the boundary for a later HTTP implementation. Do not invent a production API or put credentials in client code.
- Treat search, series, music, Bangumi, internationalization, and third-party comments as optional follow-up work requiring an explicit decision before implementation.

## Out of scope

Do not add VitePress, Astro runtime, React, Markdown/MDX as a content source or parser, a CMS/editor, backend, database, authentication, authoring APIs, RSS, sitemap, or article prerendering to satisfy the current template goal. Do not carry over the former VitePress migration plan. Documentation files such as this one may of course be Markdown.

A Vite-built client app can be hosted as static assets, but this does not produce standalone article HTML. If direct server-readable post content or SEO prerendering becomes a requirement, discuss and design that separately. For history-mode routes, document and verify the hosting fallback to `index.html`; client-side navigation alone does not prove deep links work after refresh.

## Reference and assets

- Read the upstream repository as a reference. Before detailed visual work, select and record a reference commit and capture representative desktop/mobile screenshots. Do not silently change the chosen reference midway through implementation.
- Reimplement layouts and behavior in Vue. Do not bulk-copy Astro/React templates or bring their dependencies into this application.
- Check the upstream license and each image/font/third-party asset's terms before copying. Record the origin and attribution for assets actually used. Do not assume all public repository assets have the same license.
- Do not modify an upstream checkout or unrelated sibling project. Keep reference material outside the application bundle and public assets unless it is intentionally licensed and used.

## Development conventions

- Use Bun for dependency management and project scripts. When initializing, verify the installed Bun version, set `packageManager`, and commit its lockfile (`bun.lock` for versions that generate it). Do not mix npm, pnpm, or yarn lockfiles.
- Follow existing project conventions before adding new dependencies or abstractions. Use CSS variables for shared color and theme tokens; ensure responsive layouts work at desktop and narrow mobile widths.
- Keep mock entities stable and realistic: IDs, slugs, dates, excerpts, categories, and tags should be coherent across pages. Define service return types so the eventual API adapter can replace the mock implementation without changing presentation components.
- Keep page components focused on presentation and interaction. Shared layout and reusable UI belong in components; routing/configuration in app; types in types; mock content in data; data access in services.
- Preserve user changes. Inspect Git status before edits, avoid unrelated rewrites, and do not restore old VitePress files just because they remain in Git history.

## Execution and validation

1. Initialize a minimal Vue + Vite + TypeScript project using Bun, Vue Router, type checking, and focused tests. Verify the development server and production build.
2. Establish a documented visual baseline from the chosen upstream revision; implement theme tokens, site shell, and responsive navigation.
3. Implement home, post list, and post detail against typed mock services. Test routes, major interactions, and data states.
4. Add category, tag, archive, friends, and about views. Compare desktop/mobile screenshots to the reference and document deliberate differences.
5. Run type checks, tests, production build, route/deep-link checks, basic accessibility checks, and an asset/license review. Record remaining optional features and future backend integration points.

Each stage should leave a working build for behavior it introduces. Do not claim pages or tests have been completed merely because they are listed in documentation. Keep changes scoped and report what was verified versus what still requires deployment-specific configuration.

## Immediate next task

The minimal Vue 3 + Vite + TypeScript app, Bun lockfile, routing, and typed mock-post service are in place. Next, record an upstream visual reference, refine the site shell and home page against it, and expand the remaining planned routes. Do not start a Markdown migration or a backend service.
