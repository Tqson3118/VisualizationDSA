---
name: testing-oop-sysdesign-viz
description: Test the OOP Visualization and System Design modules end-to-end. Use when verifying animation, heap memory, packet routing, or scenario playback changes.
---

# Testing OOP & System Design Visualization Modules

## Prerequisites

- Node.js installed
- `npm install` completed in `frontend/`

## Devin Secrets Needed

None — this is a fully client-side application with no authentication required.

## Dev Server Setup

```bash
cd frontend && npx vite --host 0.0.0.0 --port 5173
```

Note: If port 5173 is in use, Vite will auto-increment (e.g., 5174). Check terminal output for actual port.

## Navigation Paths

| Module | Route | Sidebar Label |
|--------|-------|---------------|
| OOP Visualization | `/oop` | "OOP Viz" under CONCEPTS |
| System Design | `/system` | "System Design" under CONCEPTS |
| Sorting (default) | `/sorting` | "Sorting" under ALGORITHMS |

The app uses hash routing, so URLs look like `localhost:5174/system#/system`.

## System Design Module Testing

### Key UI Elements
- **"HTTP Request" button** — injects a single packet into the network
- **"Xa lu 10 hat" button** — injects 10 packets at once (burst mode)
- **"Sap nguon" buttons** — toggles server failure (on Server A / Server B)
- **"Ghi du lieu (DB Write)" button** — triggers database replication
- **Sync Delay slider** — controls replication lag (100ms–5000ms)
- **Packets badge** (top-right) — shows current in-flight packet count
- **Nodes badge** (top-right) — shows total node count

### Packet Animation Speed Verification
The simulation loop uses `requestAnimationFrame` with `deltaTime` in **seconds** (divided by 1000 from `performance.now()` milliseconds). With `PACKET_SPEED=0.05`, packets should take ~20 seconds to traverse each network hop. If packets flash instantly (arrive in <1 second), the deltaTime normalization might be broken.

**Test strategy:** Click "HTTP Request", verify "Packets: 1" badge persists for multiple seconds. If it flickers back to 0 instantly, the fix is broken.

### Failover Testing
Click "Sap nguon" on Server A → status should change to FAILED (red). New HTTP requests should route to Server B instead.

## OOP Visualization Module Testing

### Key UI Elements
- **Pillar tabs** (top bar): Dong Goi, Ke Thua, Da Hinh, Truu Tuong
- **"+ new Shape()" / "+ new Circle()" buttons** — manual heap object instantiation
- **Heap Memory Allocator panel** (right side) — shows objects with hex addresses
- **Scenario cards** (left panel) — 4 predefined OOP scenarios
- **VCR controls** (when scenario active): ⏮ ▶Play 🔄 ⏭ and step counter (e.g., "2 / 4")

### Multi-Object Heap Verification
Click "+ new Shape()" then "+ new Circle()". Heap should show **"2/10 objects"** with both objects visible (different hex addresses). If only the latest object appears (1/10), the INSTANTIATE handler might be wiping the heap.

### Scenario Mode Testing
- Click a scenario card (e.g., "Ke thua (Inheritance)") to enter scenario mode
- Use ⏭ button to advance steps (the button is small — click precisely at its center)
- The ⏭ button position is approximately at the 4th control in the VCR bar
- Each step updates: code highlight, explanation text, heap objects, call stack, VTable dispatch
- Verify heap objects persist across CALL_METHOD steps after INSTANTIATE

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

Expected: All tests pass (1528+ tests as of Sprint 6).

## Common Issues

- The ⏭ (next step) button in scenario mode can be hard to click precisely. It's a small button in the VCR control bar. If clicking doesn't advance the step, try clicking slightly to the left or right.
- The app redirects to `/sorting` by default. Navigate via the sidebar or directly to the route.
- Port 5173 might already be in use from a previous session. Check Vite output for the actual port.
