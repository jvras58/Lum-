<!--
SYNC IMPACT REPORT
==================
Version change: 0.0.0 → 1.0.0
Bump rationale: MAJOR — first concrete adoption; all placeholder tokens replaced,
                six principles defined, two supporting sections added.

Modified principles: (none previously — all are new)
  Added:
    I.   App Router & React Server Components
    II.  Server Actions for All Mutations
    III. Type-Safe Data Layer (Drizzle ORM + PostgreSQL)
    IV.  Smart Data Fetching — No useEffect
    V.   Form Discipline (react-hook-form)
    VI.  UI Consistency & Performance (Shadcn UI)

Added sections:
  - Non-Functional Standards
  - Development Workflow

Removed sections: (none — template stubs replaced)

Templates requiring updates:
  ✅ .specify/templates/plan-template.md  — Constitution Check gates align
  ✅ .specify/templates/spec-template.md  — no structural change required
  ✅ .specify/templates/tasks-template.md — no structural change required

Deferred TODOs:
  - RATIFICATION_DATE set to today (2026-04-19) as first adoption date.
  - Project name inferred as "Lum" from working directory; update if incorrect.
-->

# Lum Constitution

## Core Principles

### I. App Router & React Server Components

Every page and layout MUST use the Next.js 16 App Router. The Pages Router is
forbidden. Components are Server Components by default; Client Components MUST be
explicitly opted in with `"use client"` and kept as leaf nodes in the tree.

The React 19 `use` hook MUST be used to unwrap async data in Client Components when
streaming or passing server Promises; legacy patterns like wrapping in `useEffect` or
redundant `useState` for server data are prohibited.

**Rationale**: RSC moves data-fetching cost to the server, eliminating client
waterfalls and reducing JavaScript bundle size, which are core performance targets.

### II. Server Actions for All Mutations

All data-writing operations (create, update, delete) MUST be implemented as Next.js
Server Actions (`"use server"` functions). Client-side `fetch` calls targeting
internal API routes for mutations are prohibited.

Server Actions MUST:
- Be typed end-to-end (input inferred from Zod schema, return type explicit).
- Return a discriminated union `{ success: true; data: T } | { success: false; error: string }`.
- Revalidate relevant cache paths via `revalidatePath` or `revalidateTag` on success.

**Rationale**: Server Actions eliminate a client/server boundary for writes, enforce
type safety without a separate API contract, and keep mutation logic co-located with
the data layer.

### III. Type-Safe Data Layer (Drizzle ORM + PostgreSQL)

Drizzle ORM is the ONLY permitted ORM/query builder. Raw SQL queries are allowed only
for performance-critical aggregations not expressible in Drizzle, and MUST be wrapped
in a typed helper with explicit return type annotation.

Rules:
- Schema MUST be defined in `src/db/schema.ts`; types inferred with `typeof table.$inferSelect`.
- Migrations MUST be generated via `drizzle-kit` and committed; no manual schema edits.
- All database access MUST occur in server-only modules (no DB client imported in Client Components or browser bundles). Enforce with `import "server-only"`.
- Connection pool MUST be a singleton (module-level) to avoid connection exhaustion under serverless.

**Rationale**: Drizzle provides SQL-first type inference with zero runtime overhead,
and its explicit schema keeps the single source of truth for all entity types.

### IV. Smart Data Fetching — No useEffect

`useEffect` for data fetching is **prohibited**. The following patterns MUST be used
instead:

| Scenario | Required pattern |
|---|---|
| Initial page data (server) | React Server Component with `async/await` |
| Streaming server data to client | `use(promise)` in a Client Component with `<Suspense>` |
| Client-side reactive / paginated / real-time | `useQuery` (TanStack Query v5) |
| Dependent queries | `useQuery` with `enabled` flag |
| Optimistic mutation UI | `useMutation` from TanStack Query |

`useQuery` MUST be configured with appropriate `staleTime` to avoid unnecessary
refetches; the global default MUST be at least `60_000` ms unless a feature explicitly
requires freshness.

**Rationale**: useEffect-based fetching causes layout jitter, race conditions, and
duplicate requests. RSC + useQuery covers all valid scenarios with better UX and DX.

### V. Form Discipline (react-hook-form)

Every user-facing form MUST use `react-hook-form`. Uncontrolled one-off `useState`
forms are prohibited.

Rules:
- Schema validation MUST use Zod with `@hookform/resolvers/zod`.
- Form submission MUST call a Server Action via `form.handleSubmit(action)` or the
  `action` prop on `<form>` using `useActionState` (React 19).
- Field errors MUST be rendered using `formState.errors`; no custom error state.
- Forms MUST disable the submit button while `formState.isSubmitting` is `true`.

**Rationale**: react-hook-form avoids controlled re-renders per keystroke,
integrates cleanly with Server Actions, and Zod schemas serve as the single
validation contract shared between client and server.

### VI. UI Consistency & Performance (Shadcn UI)

Shadcn UI is the sole approved component library. Installing conflicting UI
libraries (e.g., MUI, Ant Design, Chakra) is prohibited without a documented
ADR and explicit constitution amendment.

Rules:
- New UI primitives MUST be added via `npx shadcn@latest add <component>` to keep
  them in `components/ui/` and under the project's direct control.
- Custom components MUST be composed from Shadcn primitives; do not duplicate
  primitives already available.
- All interactive components MUST meet WCAG 2.1 AA contrast and keyboard-navigation
  requirements (Shadcn's Radix UI base satisfies this when used without override).
- `next/image` MUST be used for all images; raw `<img>` tags are prohibited.
- `next/font` MUST be used for web fonts; no external font CDN imports.

**Rationale**: A single, owned component library prevents bundle bloat, theming
conflicts, and accessibility regressions. Shadcn's copy-into-project model gives full
control without dependency lock-in.

## Non-Functional Standards

### Performance

- **Time to First Byte (TTFB)**: p95 ≤ 200 ms for server-rendered pages under normal load.
- **Largest Contentful Paint (LCP)**: ≤ 2.5 s on a simulated 4G connection.
- **JavaScript bundle (initial load)**: ≤ 150 kB compressed per route segment.
- Route segments MUST use `loading.tsx` with skeleton UI for any async boundary.
- Dynamic imports (`next/dynamic`) MUST be used for components > 30 kB that are not
  needed on initial render.

### Type Safety

- TypeScript `strict: true` is **non-negotiable**; `any` requires a `// eslint-disable` comment with justification.
- All API surface types (Server Action inputs/outputs, query return types, form
  schemas) MUST be exported from a co-located `types.ts` file.
- `satisfies` operator MUST be used where `as` would otherwise be needed.

### Security

- Environment variables containing secrets MUST be prefixed `SECRET_` and MUST NOT be
  prefixed `NEXT_PUBLIC_`; access is server-only.
- All Server Actions MUST validate session/authentication before executing any
  database operation.
- User-supplied strings inserted into Drizzle queries MUST use parameterized
  expressions (Drizzle handles this by default; raw SQL bypasses it and requires review).

### Observability

- Server errors MUST be logged with structured JSON to stdout (compatible with
  Vercel/cloud log aggregation).
- Server Actions MUST log operation name, duration, and success/failure at `info` level.
- Client errors MUST be captured via an error boundary at the root layout level.

## Development Workflow

### Branching & Commits

- Feature work MUST be done on a branch named `###-feature-name` (sequential number
  + kebab description).
- Each commit MUST reference the task ID (e.g., `T012`).
- Squash-merge to `main`; no merge commits.

### Quality Gates (required before merge)

1. `tsc --noEmit` passes with zero errors.
2. `eslint` passes with zero warnings (warnings are errors in CI).
3. All Drizzle migrations applied cleanly in a test database.
4. Lighthouse CI score: Performance ≥ 90, Accessibility ≥ 95 on key pages.
5. No `useEffect` with fetch dependencies introduced (automated lint rule).

### Testing

- Server Actions MUST have integration tests that hit a real (test) PostgreSQL
  database; mocking the DB layer is prohibited.
- Client Components with user interaction MUST have `@testing-library/react` tests.
- Unit tests are optional for pure utility functions but encouraged.

## Governance

This constitution supersedes all other practices, README guidelines, and verbal
agreements. Any code, PR, or design decision that conflicts with a principle MUST
either be brought into compliance or trigger a formal amendment.

**Amendment procedure**:
1. Open a discussion issue titled `[Constitution] Amend <Principle>`.
2. State the current rule, the proposed change, and the rationale (must cite a
   concrete problem the current rule causes).
3. Obtain approval from at least one other project maintainer.
4. Update this file, increment the version, and update `LAST_AMENDED_DATE`.
5. Propagate changes to all dependent templates (checklist in step 4 of the
   speckit-constitution skill).

**Versioning policy**: MAJOR for principle removal/redefinition; MINOR for new
principles or sections; PATCH for clarifications and wording fixes.

**Compliance review**: Every PR description MUST include a "Constitution Check"
section confirming no principles are violated, or explicitly documenting a
justified exception.

**Runtime guidance**: See `CLAUDE.md` for agent-specific development instructions.

**Version**: 1.0.0 | **Ratified**: 2026-04-19 | **Last Amended**: 2026-04-19
