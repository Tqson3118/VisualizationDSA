---
name: testing-visualization-modules
description: Test the System Design VCR playback and OOP visualization modules end-to-end. Use when verifying frontend-backend integration, VCR frame navigation, or interactive sandbox features.
---

# Testing VisualizationDSA Modules

## Prerequisites

### Start Backend (.NET 9.0)
```bash
cd backend/src/WebApi
dotnet run --urls="http://0.0.0.0:5050" &
```
- No PostgreSQL needed for concept endpoints (OOP, System Design) — they are stateless frame generators
- CORS is configured in `appsettings.json` under `Cors.AllowedOrigins` — includes `http://localhost:5173` by default
- Verify: `curl -s http://localhost:5050/api/v1/concepts/system-design/scenarios` should return JSON with 4 scenarios

### Start Frontend (Vue 3 + Vite)
```bash
cd frontend
VITE_API_BASE_URL=http://localhost:5050 npx vite --host 0.0.0.0 --port 5173
```
- **Critical**: Set `VITE_API_BASE_URL` env var to match the backend port. Default fallback in code is `http://localhost:5000` which may not match your backend.
- The env var is read at build time via `import.meta.env.VITE_API_BASE_URL` in `services/systemDesignApi.ts`

## Navigation

| Module | URL | Sidebar Link |
|---|---|---|
| System Design | `http://localhost:5173/system#/system` | "System Design" under CONCEPTS |
| OOP Visualization | `http://localhost:5173/system#/oop` | "OOP Viz" under CONCEPTS |
| Sorting (default) | `http://localhost:5173/system#/sorting` | "Sorting" under ALGORITHMS |

**Note**: Navigating to `http://localhost:5173/system` lands on Sorting by default. Click "System Design" in the left sidebar to reach the System Design module.

## System Design Module — Key Test Areas

### 1. VCR Scenario Playback (Backend-Driven)
- **Scenario Picker**: 4 buttons under "Backend Scenarios" — Round-Robin LB, Server Failover, DB Replication, Full Demo
- **VCR Controls** (appear only in VCR mode): ◀ Prev, ▶ Play / ⏸ Pause, Next ▶, ⏮ Reset, Speed (0.5x/1x/2x), "Exit VCR → Sandbox"
- **Key assertion**: Vietnamese explanation text in the scenario banner (e.g., "Topology sẵn sàng") is generated ONLY by `SystemDesignStrategy.cs` in the backend. If it appears, the API connection is proven working.
- **Frame counter**: Purple "VCR: X/Y" badge in header + "Frame X / Y" in VCR controls
- Interactive controls (HTTP Request, Traffic Burst, DB Write) are HIDDEN during VCR mode

### 2. Interactive Sandbox Mode
- **Traffic Controls**: "HTTP Request" injects single packet, "Xả lũ 10 hạt" injects 10-packet burst
- **Server Failure**: Click "Sập nguồn" on Server A/B node cards to toggle FAILED/HEALTHY
- **DB Replication**: "Ghi dữ liệu (DB Write)" with configurable sync delay slider (100ms–5000ms)
- **requestCount**: Node cards show "X req" — should increment on packet inject and decrement on ARRIVED/DROPPED
- **Smoke particles**: Canvas overlay renders gray smoke on FAILED nodes (FailureSmokeOverlay.vue)

### 3. API Endpoints for curl testing
```bash
# List scenarios
curl http://localhost:5050/api/v1/concepts/system-design/scenarios

# Get topology (6 nodes, 6 links)
curl http://localhost:5050/api/v1/concepts/system-design/topology

# Execute scenario (returns frame array)
curl -X POST http://localhost:5050/api/v1/concepts/system-design/execute \
  -H 'Content-Type: application/json' \
  -d '{"scenarioId":"server-failover"}'
```

## OOP Visualization Module — Key Test Areas

### 1. Scenario Playback
- 4 pillars: Encapsulation, Inheritance, Polymorphism, Abstraction
- Each scenario has multiple steps with autoplay
- Heap panel shows objects (e.g., "Shape@0x310000", "Circle@0x310010")
- Multi-object instantiation should NOT wipe previous objects

### 2. Manual Instantiation
- Class definition panel on left, heap on right
- Instantiate Shape, then Circle — both should coexist ("2/10 objects")

## Troubleshooting

- **"Loading from backend..." stuck**: Backend not running or CORS blocking. Check `appsettings.json` AllowedOrigins includes your frontend URL.
- **Fallback topology loads instead of API**: `VITE_API_BASE_URL` not set. Restart vite with the env var.
- **requestCount not updating on node cards**: This was a pre-existing reactivity bug fixed by `syncNodes()` shallow copy pattern. If it regresses, check `useSystemDesignStore.ts` tickEngine/injectHttpRequest calls syncNodes().
- **Smoke particles not appearing**: Check that `FailureSmokeOverlay.vue` is mounted inside `.architecture-canvas` in `SystemDesignWorkspace.vue`.

## Unit Tests
```bash
cd frontend && npx vitest run
```
- API calls are mocked in tests via `vi.mock('../services/systemDesignApi')` — all reject to trigger fallback topology
- Expected: 1528+ tests pass

## Devin Secrets Needed
No secrets required — both backend and frontend run locally without authentication.
