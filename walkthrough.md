# Code Debugger — Resilience & Security Hardening Walkthrough

## Module: Code Debugger (`features/debug-mode/`)

The Code Debugger module is now **100% resilient** to crashes from bad syntax and infinite loops. This document describes the hardening measures implemented.

---

## 1. Syntax Error Protection

**Engine layer** (`DebuggerYieldEngine.ts`):
- `compileToDebugGenerator()` wraps the entire Acorn AST parse + escodegen transform in a try/catch
- Returns structured `{ success: false, error, errorLine }` on any parse failure (unmapped tokens, invalid syntax, malformed expressions)

**Store layer** (`useLiveDebuggerStore.ts`):
- `startDebuggingSession()` checks `compileResult.success` — if `false`, fires `useToastStore().error()` with Vietnamese message: *"Mã nguồn có lỗi cú pháp hoặc không hợp lệ, vui lòng kiểm tra lại!"*
- Runtime errors during generator construction (`new Function()` eval) are also caught and trigger the same toast
- `errorLine` ref is exposed to Monaco for red underline decoration on the failing line

## 2. Infinite Loop Guard

**Engine layer** (`DebuggerYieldEngine.ts`):
- `injectLoopGuards()` injects an `if (++__loopCounter > 5000) throw Error(...)` guard at the top of every `for`, `while`, and `do-while` loop body during AST transformation
- `LOOP_LIMIT = 5000` — hard threshold, not configurable by user code
- Guard is injected at compile time, so it executes inside the generator and terminates the iterator

**Debugger layer** (`LiveCompilerDebugger.ts`):
- `continueToNextBreakpoint()` has its own `MAX_CONTINUE_STEPS = 5000` limit — if no breakpoint is hit within 5000 generator `.next()` calls, execution aborts with an error
- `stepOut()` also has the same 5000-step safety net

**Store layer** (`useLiveDebuggerStore.ts`):
- All stepping actions (`stepForward`, `continueToNextBreakpoint`, `stepOut`) have try/catch blocks
- Loop guard errors are detected via pattern matching (`/gioi han an toan.*buoc lap/`) and fire `useToastStore().warning()` with Vietnamese message: *"Phát hiện vòng lặp vô hạn! Hệ thống đã tự động dừng để bảo vệ bộ nhớ."*
- Non-loop runtime errors fire `useToastStore().error()` with the syntax error message

## 3. Recursion Depth Guard

- `MAX_RECURSION_DEPTH = 500` — injected as `if (++__recursionDepth > 500) throw Error(...)` at the top of every converted generator function
- Prevents stack overflow from deeply recursive user code

## 4. Summary of Protection Layers

| Threat | Guard | Threshold | User Notification |
|---|---|---|---|
| Syntax errors / invalid tokens | Acorn parse try/catch | N/A | Toast error (Vietnamese) |
| Runtime eval failures | `new Function()` try/catch | N/A | Toast error (Vietnamese) |
| Infinite `for`/`while`/`do-while` loops | `__loopCounter` AST injection | 5,000 iterations | Toast warning (Vietnamese) |
| Infinite `continue` stepping | `MAX_CONTINUE_STEPS` | 5,000 steps | Toast warning (Vietnamese) |
| Deep recursion | `__recursionDepth` AST injection | 500 levels | Error thrown + toast |

**Compilation status:** `dotnet build` 0 errors, `vue-tsc --noEmit` 0 errors.

---

# 🏛️ Tech Stack Integration — 6 Technical Pillars Index

This section formally indexes the six advanced technical pillars integrated into the
VisualizationDSA platform. Pillars 1–4 cover the runtime/orchestration & client compute
layers; pillars 5–6 establish the enterprise backend data foundations (Graph RAG +
Event Sourcing).

| # | Pillar | Layer | Key Artifacts |
|---|---|---|---|
| 1 | Production Docker Compose orchestration | Infra | `docker-compose.yml` (PostgreSQL + .NET backend + nginx frontend) |
| 2 | WebGPU rendering pipeline | Frontend | WebGPU pipeline foundation + Dashboard status badge |
| 3 | WASM compute engine | Frontend | Web Worker + transferable `ArrayBuffer` bridge |
| 4 | CRDT collaborative graph store | Frontend | Yjs collaborative store + WebTransport client |
| 5 | Graph RAG Backend Layer | Backend | `SemanticConceptNode`, `KnowledgeEdge`, `GET /api/v1/concepts/analytics/semantic-graph` |
| 6 | Event Sourcing Ledger | Backend | `SystemAuditEventStream`, `ImmutableAuditInterceptor`, `AuditEventActionFilter` |

## Pillar 5 — Semantic Matrix Engineering (Graph RAG Backend Layer)

Grounds the backend with an enterprise-grade semantic vector graph for Graph RAG.

- **Entities** (`Domain/Entities/`):
  - `SemanticConceptNode` — graph vertex modelling a software-engineering concept, carrying
    a semantic `double[] Embedding` vector (mapped to PostgreSQL `double precision[]`),
    `Importance` weight, `ConceptKey` (unique), `Category`.
  - `KnowledgeEdge` — directed edge modelling cross-cutting dependencies
    (`RelationType`, `Weight`) between two concept nodes.
- **Persistence** (`Infrastructure/Data/ApplicationDbContext.cs`): EF Core Fluent API mappings
  (unique indexes, category index, FK with `Cascade` on source / `Restrict` on target to avoid
  multiple-cascade-path errors) + migration `AddSemanticGraph`.
- **API** (`WebApi/Controllers/ConceptsController.cs`):
  `GET /api/v1/concepts/analytics/semantic-graph?category=` — backed by
  `ISemanticGraphService` / `SemanticGraphService` using `AsNoTracking` projections,
  returns nodes, induced-subgraph edges, and graph stats (node/edge count, density, degree).

## Pillar 6 — Event Sourcing Ledger (Immutable Audit Stream)

Captures raw user interactions (VCR timeline scrubbing, code syntax gaffes, quiz telemetry)
as an append-only time-series ledger.

- **Entity** (`Domain/Entities/SystemAuditEventStream.cs`): immutable time-series frame
  (`EventType`, `UserId?`, `CorrelationId`, `HttpMethod`, `Path`, `StatusCode`,
  `Payload` as JSONB, monotonically-increasing `Sequence`, `OccurredAt`).
- **Append path** (`Infrastructure/Services/AuditEventService.cs` + `Application/Services/IAuditEventService.cs`):
  append-only writer; persisted via EF Core + migration `AddSystemAuditEventStream`
  (time/sequence/user indexes for time-series queries).
- **Reactive capture** (`WebApi/Filters/AuditEventActionFilter.cs`): global `IAsyncActionFilter`
  that appends an audit frame after every action executes (best-effort, never fails the request).
- **Immutability guard** (`Infrastructure/Interceptors/ImmutableAuditInterceptor.cs`):
  EF Core `SaveChanges` interceptor that blocks any `UPDATE`/`DELETE` on
  `SystemAuditEventStream` — only `INSERT` (append) is permitted.

**Workspace compilation status:** `dotnet build` 0 errors · `vue-tsc --noEmit` 0 errors.

---

## 🔒 Session Persistence & Checkout Security Hardening

To ensure a seamless, production-ready user experience, the authentication and checkout flows have been secured and hardened against session losses and bypass vulnerabilities.

### 1. Stateless Session Re-hydration
- **Backend Recovery**: Updated the `/refresh` endpoint (`StatelessAuthController.Refresh`) to accept an optional `userId`. The `StatelessAuthStrategy` now automatically re-hydrates the in-memory cache from PostgreSQL if a valid user ID is passed but the memory cache is empty (e.g. following a server restart).
- **Frontend Restoration**: Modified the frontend client initialization (`useAuthStore.ts`) to fetch the `savedUserId` from localStorage and pass it directly to the refresh API (`statelessAuthApi.ts`) during early bootstrap, resolving the issue where page refreshes forced user logout.

### 2. Premium Checkout & Transactional Integrity
- **Glassmorphic Gate**: Implemented a mandatory glassmorphic authentication wall in the checkout screen (`PremiumCheckoutView.vue`) that blocks guest checkouts and prompts the user to log in or register.
- **Persistent User Mapping**: Removed the fallback to the shared `'demo-user-001'` ID in the payment store (`usePaymentStore.ts`). Transactions are now bound strictly to the active user's persistent database ID.
- **Double-State Synchronization**: Hardened the backend payment processing flow (`StatelessPaymentController` and `StatelessPaymentStrategy`) by verifying that the premium status update is applied to both the database record and the active memory cache (`SetUserPremium`) immediately upon payment verification.

### 3. Verification & Diagnostic Scanning
- **Frontend Unit Tests**: Ran `npm run test` successfully, with **1528/1528** unit tests passing.
- **Backend Unit Tests**: Verified C# logic using `dotnet test`, with **19/19** unit tests passing.
- **UX UI Diagnostics**: Executed the automated Playwright diagnostic script (`node run-diagnostics.js`) across all 15 key routes, obtaining **100% PASSED** with 0 console errors and 0 unhandled exceptions.

### 4. Branding Migration to VisualizationDSA
- **Diagnostic Scripts**: Updated `run-diagnostics.js` and `run-diagnostics.bat` to refer to `VisualizationDSA` branding.
- **Monaco Themes**: Renamed `algolens-dark` to `visualizationdsa-dark` and `algolens-debug` to `visualizationdsa-debug`.
- **CSS Design Tokens**: Synced heading tags and comments across `theme.css`, `design-tokens.css`, and `style.css`.
- **Config & Metadata**: Replaced comments in `tailwind.config.js` and updated mock profile email formats from `demo@algolens.dev` to `demo@visualizationdsa.dev`.
- **Verification**: All 19 C# backend unit tests and 1539 Vue frontend unit tests passed cleanly.


