# Koharu VitePress migration: Codex project instructions

项目说明：本期只迁移公开博客前端，保留 Markdown；不做写作室、CMS、碎碎念或 Python 后端。先盘点和验证，再逐阶段实现。下文是供 Codex 在新项目目录执行的长期约束。

## Objective and context

Rebuild the public publishing site of https://github.com/cosZone/astro-koharu/ with VitePress, Vue 3 and TypeScript. Keep Markdown files as the content source. This is a static-site migration, not a Vue + Vite SPA conversion: every public article must have build-generated HTML, working direct links and page metadata. In a later, separate phase, a Python service may provide authoring, persistence and audit history; do not build that service now.

The reference review used upstream commit `329ce55513a8057708c93c11c5b8c096680ad83c`. On project start, record the actual reference commit in `docs/migration-inventory.md`. Do not silently upgrade the reference during migration.

## Scope

Included: published Markdown articles and existing public blog pages; home, article, category, tag, archive, series, friend links and enabled standalone pages; responsive visual style; theme switching; table of contents and reading interactions; configured search, comments, music, Bangumi, internationalization, RSS, sitemap, canonical and social metadata; enabled Markdown extensions (including Shoka syntax); encrypted posts and blocks. Inventory optional features before implementing them, and track parity against the selected reference configuration.

Excluded: writing room/editor, React CMS, moments, Python backend, authentication, authoring APIs, and the original management/backup CLI. Do not bring editor, CMS or moments code or dependencies into the publishing app. Whether AI summaries, semantic recommendations, analytics and other optional upstream features are included must be decided explicitly in the inventory; do not claim full parity while leaving enabled features unaccounted for.

## Source and workspace rules

- Treat the Astro repository as read-only reference. Work only in this project's directory. Do not modify a sibling project or a system temp checkout.
- Clone the upstream repository into a separate reference directory (or use an existing local clone), pin its commit, and keep it out of this application's build, Git commits and public assets. Document upstream license and attribution obligations before copying code or assets.
- Use `pnpm`, Vue 3 SFCs with `<script setup lang="ts">`, and VitePress custom theme conventions. Check installed VitePress documentation before depending on version-specific APIs.
- Reuse design tokens and assets where appropriate, but rewrite Astro templates and React islands as Vue components. Avoid a bulk file-extension rename or embedding React merely to preserve the old implementation.
- Keep content conversion in a testable build-time layer. Separate source Markdown/frontmatter, normalized article metadata, page generation, and rendered Vue UI. This boundary should later allow Python-generated content to replace the initial Markdown feed without rewriting the theme.
- Keep a compatibility inventory for every existing article URL and image path. Preserve routes where practical; otherwise generate explicit redirects. Do not change slugs as a side effect of file placement.
- Respect existing user changes in any workspace; do not delete or overwrite unrelated work.

## Content and security invariants

- Drafts are absent from emitted HTML, assets, feeds, indexes, sitemap and exposed source files.
- Encrypted post/block plaintext must not appear in generated HTML, JavaScript, JSON, search indexes, RSS, source `.md` downloads or other deployable files. Encrypt before publishing and add a build-output leak test using a distinctive fixture secret. Do not use CSS hiding as encryption.
- Public Markdown source download/copy actions, if retained, are disabled for posts with a password or any encrypted block, matching the reference behavior.
- Preserve public frontmatter meaning, date/time zone behavior, translated content fallbacks and links. Report unsupported directives with file and line context rather than silently dropping them.
- Do not expose credentials or server-only configuration through VitePress theme data or client bundles.

## Implementation order and gates

1. Inventory and feasibility: compare upstream routes, configuration, public widgets, Markdown syntax, assets and a representative article corpus. Produce `docs/migration-inventory.md` with feature status (`required`, `optional/enabled`, `excluded`), source location, target approach, risk, acceptance case and URL mapping. Test one ordinary article, one rich-syntax article, one multilingual article and one encrypted fixture. Do not start a full visual port before this gate.
2. Skeleton and content model: initialize VitePress/TypeScript, a custom Vue theme, normalized content metadata and build-time generated article/index pages. Establish route and metadata tests. Validate that direct navigation to a nested article URL returns rendered HTML without relying on client-side routing.
3. Public pages and style: migrate site shell, article layout, home/list/detail pages, category/tag/archive/series navigation, mobile layout, light/dark themes and shared assets. Compare reference and new site at desktop/mobile widths.
4. Markdown parity: implement the syntax actually present or explicitly required, then extend toward the selected upstream feature set. Verify headings/anchors, links, code blocks, diagrams/math, directives, embeds, image behavior and encrypted content against snapshot fixtures.
5. Public integrations: search, comments, feeds, sitemap/robots/SEO, locale routes, music/Bangumi and other enabled public integrations. Decide per integration whether it runs at build time or in the client; document third-party keys and availability behavior.
6. Release validation: run production build, static-output security scan, broken-link checks, representative content comparison, viewport tests, accessibility checks and smoke tests for deep links and optional integrations. Publish a parity report listing deliberate differences and remaining gaps.

Each phase should end with a working build and tests for the behavior it introduces. Do not claim a phase complete on visual similarity alone. Keep migration commits small.

## Working estimates

Baseline for one full-time developer: 22 effective work weeks / approximately 880 hours, excluding holidays and waiting for approvals. Planning buckets: inventory 80h; foundation 80h; pages and styling 200h; Markdown 160h; public integrations 160h; encryption/advanced features 80h; validation/release 80h; contingency 40h. This is a planning baseline, not a promise of feature parity before the inventory is complete. Re-estimate if the selected reference enables additional integrations or syntax.

## Definition of done

- Published routes have statically generated HTML, correct metadata and functional direct/deep links.
- The agreed public feature matrix is marked implemented or explicitly accepted as a difference, with evidence.
- Markdown source remains maintainable and representative articles render correctly.
- Draft and encrypted plaintext leak tests pass against the actual deployable output.
- Build, type checks, unit/integration tests and desktop/mobile smoke tests pass; deployment and future Python content-boundary notes are documented.

## First task for Codex in this folder

Inspect the chosen upstream revision and create the migration inventory with a small VitePress feasibility spike. Show the feature matrix, route map, source-content shape, security findings and revised estimate before bulk migration. Ask for a decision only when a product choice cannot be inferred from the selected upstream configuration.
