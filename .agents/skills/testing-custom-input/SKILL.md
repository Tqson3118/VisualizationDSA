---
name: testing-custom-input
description: End-to-end testing guide for VisualizationDSA OOP and System Design visualization modules. Covers server startup, navigation, VCR playback testing, and backend API frame verification.
---

# Testing VisualizationDSA — OOP & System Design Modules

## Prerequisites

### Devin Secrets Needed
- None required — both modules use stateless backend endpoints (no DB, no auth)

### Server Startup

1. **Backend (.NET 9.0):**
   ```bash
   cd /home/ubuntu/repos/VisualizationDSA-fork/backend
   dotnet run --project src/WebApi/WebApi.csproj --urls http://localhost:5050 &
   ```
   - No PostgreSQL needed — concept endpoints are stateless frame generators
   - Wait for "Now listening on: http://localhost:5050" before proceeding

2. **Frontend (Vue 3 + Vite):**
   ```bash
   cd /home/ubuntu/repos/VisualizationDSA-fork/frontend
   VITE_API_BASE_URL=http://localhost:5050 npx vite --host 0.0.0.0 --port 5173 &
   ```
   - CRITICAL: `VITE_API_BASE_URL` must be set BEFORE starting vite (it's baked at build time)
   - If frontend is already running without the env var, kill it and restart

3. **Verify connectivity:**
   ```bash
   curl -s http://localhost:5050/api/v1/concepts/oop/scenarios | head -1
   curl -s http://localhost:5173/ | head -1
   ```

## Navigation Paths

- **OOP Visualization:** `http://localhost:5173/system#/oop`
  - Left sidebar → CONCEPTS → OOP Viz
  - 4 pillar tabs at top: Đóng Gói, Kế Thừa, Đa Hình, Trừu Tượng
  - Scenario selector in left panel → click scenario to enter VCR mode

- **System Design:** `http://localhost:5173/system#/system-design`
  - Left sidebar → CONCEPTS → System Design
  - Scenario buttons appear after page loads (Server Failover, Round Robin LB, etc.)

## Testing VCR Playback (Backend API Frames)

### How to Verify Backend API Connectivity
The key assertion is that explanation text shown in the UI matches the **backend** text, NOT the local fallback. The texts are deliberately different:

| Source | Encapsulation Frame 1 Text |
|---|---|
| Backend (OOPConceptsStrategy.cs) | "Khởi tạo đối tượng Circle. Trường radius là PRIVATE — không cho phép truy cập trực tiếp." |
| Local fallback (oopScenarios.ts) | "Khởi tạo đối tượng \`Circle\`. Trường \`radius\` được đánh dấu PRIVATE (khóa đỏ). Không cho phép truy cập trực tiếp từ bên ngoài." |

Additional proof: Backend returns `Shape` as `<<abstract>>` with `getRadius(): double` on Circle. Local has non-abstract Shape with `x: number`, `y: number` fields.

### VCR Mode Indicators
- "Backend Frame" badge next to actionName badge (e.g., "INSTANTIATE Backend Frame")
- Frame counter "X / Y" in VCR controls
- ActionName badges: INSTANTIATE, VIOLATE_ACCESS, CALL_METHOD, VALIDATE_SETTER, CLONE_MEMBERS, SHOW_ABSTRACT_ERROR

### Frame Navigation Test Pattern
1. Click scenario → verify frame 1/N loads with correct badge
2. Click ⏭ (Next) → verify frame counter increments + actionName changes
3. Click ⏮ (Prev) → verify frame counter decrements
4. Click 🔄 (Reset) → verify returns to frame 1
5. Click "Thoát kịch bản" → verify sandbox mode restores (no badges, scenario selector reappears)

### Pillar Switching
Click different pillar tabs (Đóng Gói → Kế Thừa → Đa Hình → Trừu Tượng) to verify each fetches a different backend scenario with different frame sequences.

## System Design VCR Testing
Similar pattern to OOP:
- Click scenario button (e.g., "Server Failover") → verify VCR mode with backend frames
- Vietnamese explanation text from backend (e.g., "Topology sẵn sàng") proves API connectivity
- Frame navigation: Next/Prev/Reset all update topology visualization
- Exit VCR restores interactive sandbox with packet injection controls

### System Design Key UI Elements
- **"HTTP Request" button** — injects a single packet into the network
- **"Xa lu 10 hat" button** — injects 10 packets at once (burst mode)
- **"Sap nguon" buttons** — toggles server failure (on Server A / Server B)
- **"Ghi du lieu (DB Write)" button** — triggers database replication
- **Sync Delay slider** — controls replication lag (100ms–5000ms)
- **Packets badge** (top-right) — shows current in-flight packet count

## OOP Module Key UI Elements
- **Pillar tabs** (top bar): Dong Goi, Ke Thua, Da Hinh, Truu Tuong
- **"+ new Shape()" / "+ new Circle()" buttons** — manual heap object instantiation
- **Heap Memory Allocator panel** (right side) — shows objects with hex addresses
- **Scenario cards** (left panel) — 4 predefined OOP scenarios
- **VCR controls** (when scenario active): ⏮ ▶Play 🔄 ⏭ and step counter (e.g., "2 / 4")

## Troubleshooting

- **API calls going to wrong port:** Check that `VITE_API_BASE_URL=http://localhost:5050` is set. Vite env vars are baked at startup — restart vite if changed.
- **CORS errors:** Backend `appsettings.json` AllowedOrigins includes `http://localhost:5173`. If using a different port, update CORS config.
- **Backend not starting:** May need `dotnet restore` first. Check that .NET 9.0 SDK is installed.
- **Fallback mode instead of API mode:** If "Backend Frame" badge doesn't appear, the API call failed silently and fell back to local scenarios. Check backend is running and CORS is configured.
- **HeapObject Maps not working:** Backend returns plain JSON objects for `fieldsData`/`vTable`. Frontend converts via `snapshotToInstance()` using `new Map(Object.entries(...))`. If heap fields show as empty, the conversion may have failed.
- The app redirects to `/sorting` by default. Navigate via the sidebar or directly to the route.
- Port 5173 might already be in use from a previous session. Check Vite output for the actual port.

## Running Unit Tests
```bash
cd /home/ubuntu/repos/VisualizationDSA-fork/frontend
npx vitest run  # Expect 1528+ tests pass
npx vue-tsc --noEmit  # Expect 0 errors
```

API service is mocked in tests (`vi.mock('../services/oopApi')`) so tests don't require a running backend.
