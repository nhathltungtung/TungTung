# Architecture & Next.js 16 App Router Guidelines

## 1. Route Groups & Directory Organization

The application is structured into clear route groups to isolate layouts and access control:

- **`app/(admin)/admin/`**: Authenticated administrative dashboard.
  - Wrapped by `app/(admin)/admin/layout.tsx` which injects the Admin Sidebar, Header, Breadcrumbs, and Dark Mode controls.
  - Every administrative feature lives in its own subdirectory (e.g. `users/`, `audit-logs/`, `tables/`, `settings/`).
- **`app/(marketing)/`**: Public-facing marketing pages (e.g., Landing page, Pricing, About).
  - Uses public navigation and footer layout.
- **`app/auth/`**: Authentication routes (`signin`, `signup`, `forgot-password`, `callback`).
  - Standalone focused pages for user authentication.

## 2. Server Components vs Client Components

Follow the **RSC-First** paradigm:

- **Server Components (Default)**:
  - All `layout.tsx` and `page.tsx` should be Server Components unless client-state is fundamentally required at the page root.
  - Server components can directly fetch data using `@/lib/supabase/server`.
  - Keep secrets and database credentials on the server.
- **Client Components (`'use client'`)**:
  - Add `'use client'` at the very top of files containing interactive elements: event handlers (`onClick`, `onChange`), React state (`useState`, `useReducer`), effects (`useEffect`), or custom client hooks (`useUser`, `useTheme`).
  - Push `'use client'` boundaries down the component tree. Don't make an entire page a Client Component just because one button is interactive.

## 3. Next.js 16+ Async APIs

In Next.js 15 and 16, dynamic routing properties are asynchronous Promises:

```tsx
// Correct Next.js 16 Page Signature
export default async function EntityDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const { id } = await params;
  const search = await searchParams;
  const page = typeof search.page === 'string' ? parseInt(search.page, 10) : 1;

  return <div>Detail for {id} (Page: {page})</div>;
}
```

## 4. UI Boundaries & Resilience

- **`loading.tsx`**: Place next to `page.tsx` to display skeleton loaders (using components from `@/components/ui/Skeleton.tsx`) while server data streams in.
- **`error.tsx`**: Must be a Client Component (`'use client'`). Provide fallback UI with reset triggers (`reset()`).
- **`not-found.tsx`**: Render structured 404 page using `@/components/ui/EmptyState.tsx`.

## 5. Server Actions & Mutations

- Define server mutations with `'use server'` at the function or file level.
- Always validate incoming payload using **Zod** before querying Supabase.
- Always use `@/lib/supabase/server` to ensure cookies and auth tokens are respected.
- Call `revalidatePath('/admin/...')` after successful mutations to purge cached route data.
