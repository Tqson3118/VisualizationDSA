---
name: testing-visualization-dsa
description: Test the VisualizationDSA app end-to-end — OOP, System Design, and Algorithm Dashboard modules. Use when verifying animation, heap memory, packet routing, scenario playback, or sorting/searching algorithm changes.
---

# Testing VisualizationDSA Modules

## Prerequisites

- Node.js installed
- .NET 9.0 SDK installed
- `npm install` completed in `frontend/`

## Devin Secrets Needed

None — no authentication required for any module.

## Dev Server Setup

### Frontend
```bash
cd frontend && VITE_API_BASE_URL=http://localhost:5050 npx vite --host 0.0.0.0 --port 5173
```
Note: If port 5173 is in use, Vite will auto-increment. Check terminal output.
CRITICAL: `VITE_API_BASE_URL` must be set BEFORE starting vite (it's baked at build time). If frontend is already running without the env var, kill it and restart.

### Backend (.NET 9.0)
```bash
cd backend/src/WebApi && dotnet run --urls "http://0.0.0.0:5050"
```
Note: PostgreSQL connection errors are expected and non-fatal — algorithm/concept endpoints are stateless frame generators that work without a database.

If port 5050 is busy: `fuser -k 5050/tcp` then restart.

### Verify connectivity
```bash
curl -s http://localhost:5050/api/v1/concepts/oop/scenarios | head -1
curl -s http://localhost:5173/ | head -1
```

## Navigation Paths

| Module | Route | Sidebar Label |
|--------|-------|---------------|
| Sorting Sandbox | `/sorting` (default tab) | "Sorting" under ALGORITHMS |
| Algorithm Dashboard | `/sorting` (2nd tab) | Click "Searching & Linear DSA" tab |
| Graph | `/graph` | "Graph" under ALGORITHMS |
| OOP Visualization | `/oop` | "OOP Viz" under CONCEPTS |
| System Design | `/system` | "System Design" under CONCEPTS |

The app uses hash routing: `localhost:5173/#/sorting`, `localhost:5173/#/oop`, etc.

## Algorithm Dashboard Testing (Searching & Linear DSA Tab)

### Navigation
1. Go to `http://localhost:5173/#/sorting`
2. Click the **"Searching & Linear DSA"** tab (2nd tab, green icon)
3. Dashboard shows terminal-style algorithm cards grouped by category

### Key UI Elements
- **Category groups**: `ls searching/` (3 skills), `ls stack-queue/` (3 skills), etc.
- **"Mo phong" button** (orange) — launches VCR playback for that algorithm
- **"Ly thuyet" button** — shows theory/explanation view
- **Difficulty filter**: `all/`, `easy/`, `medium/`, `hard/` buttons
- **Search bar**: placeholder shows total skill count (e.g., "Search 10 skills")

### Full-Stack Integration Test (Binary Search)
1. Click "Mo phong" on binary-search card
2. VCR loads with frames from backend API (`POST /api/v1/algorithms/execute`)
3. **Key verification**: Explanation text is in Vietnamese (e.g., "Bắt đầu Tìm kiếm nhị phân...") — this text exists ONLY in backend C# strategy code. If you see English or no text, the API connection failed and it fell back to local generators.
4. Frame navigation: Step Forward (→) and Step Back (←) buttons
5. Step counter shows `X / N` format

### Catalog Verification (via Browser Console)
To verify the full algorithm catalog (including sorting algorithms not visible on this tab):
```javascript
const app = document.querySelector('#app').__vue_app__;
const pinia = app.config.globalProperties.$pinia;
const stores = pinia._s;
for (const [key, store] of stores) {
  if (key.includes('algorithm')) {
    console.log('Total:', store.algorithms?.length);
    console.log('Sorting:', store.algorithms?.filter(a => a.category === 'Sorting').map(a => a.id));
  }
}
```
Expected: 17 total algorithms (7 sorting + 3 searching + 3 stack-queue + 4 graph/tree).

## Backend API Testing (curl)

### List All Algorithms
```bash
curl -s http://localhost:5050/api/v1/algorithms | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d),'algorithms'); [print(f'  {a[\"id\"]}') for a in d]"
```

### Execute a Sorting Strategy
```bash
curl -s -X POST http://localhost:5050/api/v1/algorithms/execute \
  -H "Content-Type: application/json" \
  -d '{"algorithmId":"bubble-sort","inputData":[45,12,85,32,9]}' | \
  python3 -c "import sys,json; d=json.load(sys.stdin); frames=d.get('frames',[]); print(f'Frames: {len(frames)}'); print(f'Last: {frames[-1][\"dataState\"]}')"
```
Expected last frame: `[9, 12, 32, 45, 85]`

### All 7 Sorting Algorithm IDs
`bubble-sort`, `quick-sort`, `merge-sort`, `heap-sort`, `radix-sort`, `counting-sort`, `bucket-sort`

### OOP Concepts API
```bash
curl -s http://localhost:5050/api/v1/concepts/oop/scenarios
curl -s -X POST http://localhost:5050/api/v1/concepts/oop/execute -H "Content-Type: application/json" -d '{"scenarioId":"encapsulation"}'
```

### System Design API
```bash
curl -s http://localhost:5050/api/v1/concepts/system-design/topology
curl -s -X POST http://localhost:5050/api/v1/concepts/system-design/execute -H "Content-Type: application/json" -d '{"scenarioId":"server-failover"}'
```

## Testing VCR Playback (Backend API Frames)

### How to Verify Backend API Connectivity
The key assertion is that explanation text shown in the UI matches the **backend** text, NOT the local fallback. The texts are deliberately different:

| Source | Encapsulation Frame 1 Text |
|---|---|
| Backend (OOPConceptsStrategy.cs) | "Khởi tạo đối tượng Circle. Trường radius là PRIVATE — không cho phép truy cập trực tiếp." |
| Local fallback (oopScenarios.ts) | "Khởi tạo đối tượng \`Circle\`. Trường \`radius\` được đánh dấu PRIVATE (khóa đỏ). Không cho phép truy cập trực tiếp từ bên ngoài." |

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

## System Design Module Testing

### Key UI Elements
- **"HTTP Request" button** — injects a single packet
- **"Xa lu 10 hat" button** — injects 10 packets (burst mode)
- **"Sap nguon" buttons** — toggles server failure
- **"Ghi du lieu (DB Write)" button** — triggers DB replication
- **Scenario Picker** (4 buttons) — launches VCR mode with backend frames
- **VCR Playback Panel** — prev/play/next/reset + speed controls
- **Explanation Banner** — shows actionType + Vietnamese explanation

### Packet Animation Speed
With `PACKET_SPEED=0.05` and deltaTime in seconds, packets take ~20s per hop. If they flash instantly, deltaTime normalization is broken.

### VCR Scenario Mode
Click a scenario button (e.g., "Server Failover") → enters VCR mode with backend-generated frames. Verify explanation banner shows Vietnamese text and actionType changes per frame.

### Failover Testing
Click "Sap nguon" on Server A → status should change to FAILED (red). New HTTP requests should route to Server B instead.

## OOP Visualization Module Testing

### Key UI Elements
- **Pillar tabs**: Dong Goi, Ke Thua, Da Hinh, Truu Tuong
- **"+ new Shape()" / "+ new Circle()" buttons** — manual instantiation
- **Heap Memory Allocator** (right side) — shows objects with hex addresses
- **Scenario cards** (left panel) — 4 predefined OOP scenarios
- **VCR controls**: ⏮ ▶Play 🔄 ⏭ and step counter
- **"Backend Frame" badge** — confirms API-driven mode
- **ActionName badge** — shows INSTANTIATE, VIOLATE_ACCESS, CALL_METHOD, etc.

### Full-Stack Integration Test
1. Click a scenario (e.g., "Dong Goi" / Encapsulation)
2. VCR loads backend frames — look for "Backend Frame" badge
3. Vietnamese explanation text confirms API connection
4. Step through frames and verify actionName changes

### Multi-Object Heap Verification
Click "+ new Shape()" then "+ new Circle()". Heap should show **"2/10 objects"** with both objects visible (different hex addresses). If only the latest object appears (1/10), the INSTANTIATE handler might be wiping the heap.

### Scenario Step Types
| Action | What to verify |
|--------|---------------|
| RESET | Heap cleared, class cards shown |
| CLONE_MEMBERS | Inherited members appear on child class |
| INSTANTIATE | New object appears on heap with correct class |
| CALL_METHOD | VTable dispatch animation, call stack updates |
| VIOLATE_ACCESS | Error shake animation on class card |
| VALIDATE_SETTER | Green flash on field update |

## Running Unit Tests

```bash
cd frontend && npx vitest run
```
Expected: All tests pass (1528+ tests).

```bash
cd frontend && npx vue-tsc --noEmit  # Type checking — expect 0 errors
```

API service is mocked in tests (`vi.mock('../services/oopApi')`) so tests don't require a running backend.

## Troubleshooting

- **API calls going to wrong port:** Check that `VITE_API_BASE_URL=http://localhost:5050` is set. Vite env vars are baked at startup — restart vite if changed.
- **CORS errors:** Backend `appsettings.json` AllowedOrigins includes `http://localhost:5173`. If using a different port, update CORS config.
- **Backend not starting:** May need `dotnet restore` first. Check that .NET 9.0 SDK is installed.
- **Fallback mode instead of API mode:** If "Backend Frame" badge doesn't appear, the API call failed silently and fell back to local scenarios. Check backend is running and CORS is configured.
- **HeapObject Maps not working:** Backend returns plain JSON objects for `fieldsData`/`vTable`. Frontend converts via `snapshotToInstance()` using `new Map(Object.entries(...))`. If heap fields show as empty, the conversion may have failed.
- The Algorithm Dashboard tab is the **2nd tab** ("Searching & Linear DSA"), not the default "Sorting Sandbox" tab.
- The dashboard only shows algorithms matching `allowedCategories` filter — sorting algorithms won't appear on the Searching tab (by design). Use console to verify full catalog.
- Backend might show PostgreSQL connection errors on startup — this is normal. Algorithm endpoints work without a database.
- Port conflicts: Kill existing processes with `fuser -k <port>/tcp` before restarting.
- CountingSortStrategy: Watch for sorting-by-ones-digit bugs. The correct implementation uses `(value - minVal)` offset indexing, not `% 10`.
- The ⏭ (next step) button in scenario mode can be hard to click precisely — it's a small button in the VCR control bar.
- The app redirects to `/sorting` by default. Navigate via the sidebar or directly to the route.
