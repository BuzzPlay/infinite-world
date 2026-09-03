# Web Application Boundary

This package contains the browser experience built with React and Next.js. The current surface is the local Live World control console.

Suggested future areas:

```text
src/
├── app/          # application composition, routing, and globals.css
├── components/   # reusable interface components
├── features/     # world creation, branching, and preview workflows
├── lib/          # browser adapters and API clients
└── hooks/        # reusable browser hooks
```

Keep API access in `lib/`, reusable primitives in `components/ui/`, and world runtime behavior in feature components. The first implementation establishes world creation, continuous scene generation, and local preview before adding broader product surfaces.
