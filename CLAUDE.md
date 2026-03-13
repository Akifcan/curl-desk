# Curl Desk

## What is Curl Desk

Curl Desk is a VS Code extension that brings a full-featured HTTP client directly into the editor — think Postman, but living inside VS Code. Users can build and send HTTP requests, manage collections of saved requests, inspect responses, and handle auth/headers/body — all without leaving their IDE.

The extension is split into two distinct parts:
- **Extension host** (`src/`): Node.js/TypeScript code that runs in VS Code's extension process. Responsible for activating the extension, registering commands, and executing HTTP requests via Node's built-in `http`/`https` modules.
- **Webview UI** (`webview-ui/`): A React + TypeScript + Vite app that renders inside a VS Code webview panel. Handles all the UI (sidebar, request builder, response viewer) and communicates with the extension host via VS Code's message passing API.

These two sides talk to each other via `postMessage` — the webview sends requests to the extension host, and the extension host replies with response data. This is a core architectural constraint of VS Code extensions with webviews.

---

## Development Guidelines

### General

Follow these rules strictly when generating code or solutions:

- Do not over-engineer.
- Do not add unnecessary abstractions or complexity.
- Keep solutions simple, minimal, and direct.
- Do not introduce extra props, parameters, layers, or patterns unless they are truly needed.
- Prefer local, self-contained logic whenever possible.

Most importantly:

- If you are not 100% certain about any requirement or implementation detail, STOP and ask questions first.
- Do not assume.
- Do not guess.
- Do not invent behavior.
- Do not "fill in the gaps" yourself.
- Clarify all uncertainties before writing code.
- Only proceed when the requirements are completely clear.

### Project Structure

```
curl-desk/
├── src/                          # Extension host (Node.js/TypeScript)
│   ├── extension.ts              # Entry point, command registration
│   ├── panels/CurlDeskPanel.ts   # Webview panel management
│   ├── providers/SidebarProvider.ts
│   └── utils/httpClient.ts       # HTTP request execution (Node http/https)
│
└── webview-ui/                   # Webview UI (React + TypeScript + Vite)
    └── src/
        ├── main.tsx              # React entry point
        ├── App.tsx               # Root component, state management
        ├── vscode.ts             # VS Code webview API wrapper
        ├── types/index.ts        # All shared type definitions
        └── components/
            ├── Sidebar.tsx       # Collection/request list
            ├── RequestPanel.tsx  # Request builder
            └── ResponsePanel.tsx # Response viewer
```

### Types

All type definitions for the webview UI live in `webview-ui/src/types/index.ts`. This file also contains shared utility functions (`generateId`, `createKeyValue`, `createDefaultRequest`) and constants (`METHOD_COLORS`).

- Do NOT scatter type definitions across component files.
- Add new types to `webview-ui/src/types/index.ts`.
- Import types explicitly from `../types` or `./types`.

### Icons

We use `lucide-react` for all icons. Do not use other icon libraries or raw SVGs unless lucide-react cannot cover the use case.

```tsx
import { Plus, ChevronRight, X } from 'lucide-react';
```

### React Component Rules

**CRITICAL: NEVER define components inside other components.**

❌ NEVER DO THIS:
```tsx
const A = () => {
  const B = () => <div>Inner</div>; // Don't do this
  return <div><B /></div>;
};
```

✅ DO THIS INSTEAD:
```tsx
// components/B.tsx
export function B() {
  return <div>Inner</div>;
}

// components/A.tsx
import { B } from './B';
export function A() {
  return <div><B /></div>;
}
```

Why: Nested components recreate on every render, break React DevTools, and lose state on re-renders.

### Avoid Unnecessary Prop Drilling

If a function is only used inside a component, define it there. Do NOT pass it from the parent as a prop unless the parent actually needs to control it.

Bad:
```tsx
const navigate = () => {}
<Comp onNavigate={navigate} />
```

Good:
```tsx
function Comp() {
  const navigate = () => {};
}
```

### Props: Pass Objects, Not Destructured Properties

**NEVER** spread individual object properties as separate props. Pass the whole object.

❌ Don't:
```tsx
<Component a={obj.a} b={obj.b} c={obj.c} />
```

✅ Do:
```tsx
<Component data={obj} />
```

### Conditional UI States

Do not use inline JSX for conditional loading/error/empty states. Use early returns.

❌ Avoid:
```tsx
{isError && <ErrorComponent />}
{isLoading && <LoadingComponent />}
{!isLoading && !isError && <Content />}
```

✅ Prefer:
```tsx
if (isError) return <ErrorComponent />;
if (isLoading) return <LoadingComponent />;
return <Content />;
```

### VS Code Webview Communication

The webview and extension host communicate via message passing. The webview uses the `vscode` API from `webview-ui/src/vscode.ts`.

```tsx
// Sending a message from webview to extension host
vscode.postMessage({ type: 'executeRequest', payload: config });

// Receiving messages in the webview
window.addEventListener('message', (event) => {
  const { type, payload } = event.data;
  if (type === 'response') { ... }
});
```

Never try to import Node.js modules (`http`, `https`, `fs`, etc.) inside the webview UI — they are unavailable in a browser context. All Node.js operations must go through the extension host.

### File Size

Keep files short and focused. A single file should not exceed ~200 lines. If a file grows beyond that:

- Split it into smaller, logically grouped files.
- Each file should have a single, clear responsibility.
- Use an index/barrel file to compose and re-export if needed.

This applies to all code — TypeScript, CSS, HTML templates, inline scripts, etc.
