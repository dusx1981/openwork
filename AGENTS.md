# AGENTS.md

OpenWork is a desktop app that helps users run agents, skills, and MCP. It is an open-source alternative to Claude Cowork/Codex.

## What OpenWork Is

- Run local and remote agent workflows from one place.
- Use OpenCode capabilities directly through OpenWork.
- Compose desktop app, server, and messaging connectors without lock-in.

## Technology Stack

| Layer                | Technology                |
| -------------------- | ------------------------- |
| Desktop/Mobile shell | Tauri 2.x                 |
| Frontend             | SolidJS + TailwindCSS     |
| State                | Solid stores + IndexedDB  |
| IPC                  | Tauri commands + events   |

Read INFRASTRUCTURE.md and ARCHITECTURE.md for more context.

---

# Build, Test & Development Commands

## Running Tests

All tests are integration tests that run against a real OpenWork server instance using Chrome MCP. They require Docker to be running.

```bash
# Run all e2e tests
pnpm test:e2e

# Run individual test suites
pnpm test:health        # Health endpoint verification
pnpm test:sessions      # Session management
pnpm test:events        # Event handling
pnpm test:todos         # Todo functionality
pnpm test:permissions  # Permission prompts
pnpm test:session-switch # Session switching
pnpm test:fs-engine     # Filesystem engine
pnpm test:orchestrator  # Orchestrator router tests

# Type checking
pnpm typecheck          # Full typecheck
```

## Building

```bash
# Build all packages
pnpm build

# Build UI/web only
pnpm build:ui
pnpm build:web

# Build desktop app (requires Tauri)
pnpm tauri build
```

## Development

```bash
# Start dev server
pnpm dev                # Full dev mode
pnpm dev:ui             # UI dev server only

# Start Docker dev stack (required for tests)
./packaging/docker/dev-up.sh
```

## Dev Debugging

If you change `packages/server/src`, rebuild the OpenWork server binary:
```bash
pnpm --filter openwork-server build:bin
```

---

# Code Style Guidelines

## General Principles

- **No comments** unless explicitly required by the user
- Use **type-safe patterns** with TypeScript
- Prefer **immutable data** - never mutate arrays/objects stored in signals
- Keep **async actions scoped** - use per-action pending state, not global flags

## TypeScript

- Enable `strict: true` in tsconfig
- Always type function parameters and return values
- Use interfaces for object shapes, types for unions
- Avoid `any` - use `unknown` when type is truly unknown

## SolidJS Patterns

Follow `.opencode/skills/solidjs-patterns/SKILL.md`:

```ts
// DO: Fine-grained scoped signals
const [replying, setReplying] = createSignal(false);

// DON'T: Global busy flag (causes deadlocks with permission prompts)
const [busy, setBusy] = createSignal(false);

// DO: Derived state with createMemo
const canSend = createMemo(() => prompt().trim().length > 0 && !replying());

// DO: Snapshot signals before async operations
const request = activePermission();
if (!request) return;
const requestID = request.id;
await respondPermission(requestID, "always");
```

## Imports

- Use explicit relative imports for internal modules
- Group imports: external → internal → types
- Prefer named exports over default exports

## Naming Conventions

| Type              | Convention                      |
| ----------------- | ------------------------------ |
| Files             | kebab-case (`session-switch.tsx`) |
| Components        | PascalCase (`SessionSwitch.tsx`)  |
| Hooks/Utilities   | camelCase, prefix with `use`  |
| Types/Interfaces  | PascalCase                     |
| Config constants  | SCREAMING_SNAKE_CASE           |

## Error Handling

- Use typed error results: `Result<T, ErrorType>` pattern
- Never swallow errors silently - log or surface to user
- Prefer explicit error messages over generic ones

## Reactivity (SolidJS)

- Never mutate signals: `setItems([...items, new])` not `items.push(new)`
- Use setter callbacks: `setItems(current => current.filter(...))`
- Be careful reading signals after `await` - values may change

---

## Task Intake (Required)

Before making changes, explicitly confirm the target repository in your first task update.

Required format:
1. `Target repo: <path>`
2. `Out of scope repos: <list>`
3. `Planned output: <what will be changed/tested>`

## New Feature Workflow

1. Make sure you are up to date on all submodules and repos synced to head of remotes.
2. Create a worktree.
3. Implement the feature.
4. Start Docker dev stack: `./packaging/docker/dev-up.sh`
5. Use Chrome MCP to fully test the feature.
6. Take screenshots and put them in the repo.
7. Refer to these screenshots in the PR.
8. Always test the flow you just implemented.

If you cannot complete steps 4-8, say so explicitly and include:
- which steps you could not run and why
- what you verified instead (tests, logs, manual checks)
- exact commands/steps for the reviewer to reproduce

## Pull Request Expectations

If you open a PR, you must run tests and report what you ran (commands + result).

---

## Repository Structure

```
openwork/
  AGENTS.md
  INFRASTRUCTURE.md
  ARCHITECTURE.md
  packages/
    app/           # SolidJS UI
    desktop/       # Tauri app
    orchestrator/  # Node.js orchestration
    server/        # OpenWork server
```
