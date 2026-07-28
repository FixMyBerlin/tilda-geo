# Route layouts

TanStack Router layout components (`Layout*.tsx`) and shared chrome (Header, Footer, `global.css`). Each route file in `src/routes/` imports exactly one layout from here.

Folder standard: [`.agents/skills/tanstack-start-app-structure/SKILL.md`](../../../../.agents/skills/tanstack-start-app-structure/SKILL.md) → `components/` folder standards.

## Hierarchy

```
LayoutRoot          __root__     document shell (html/body, providers, app header/footer)
├── (PageIndex)     /            homepage — no separate layout route
├── LayoutPages     _pages       prose content pages (legal, docs, settings, …)
├── LayoutAdmin     admin        admin area
└── LayoutRegionen  regionen     pass-through
    └── LayoutRegionSlug  regionen/$regionSlug   map page (NuqsAdapter)
```

`LayoutRoot` hides app header/footer on full-bleed routes: `regionen/$regionSlug`, `preview/region-pending`, `preview/region-error`.

`routes/preview.tsx` is a dev-only segment parent (`beforeLoad` prod guard, shared `noindex`) for error-UI preview routes under `preview/` — not a `Layout*.tsx` here.
