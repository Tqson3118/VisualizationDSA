---
name: testing-visualization-modules
description: Test the OOP Visualization and System Design modules end-to-end. Use when verifying canvas rendering, particle effects, packet animation, scenario playback, or type safety changes.
---

# Testing OOP & System Design Visualization Modules

## Dev Server

```bash
cd frontend && npm run dev
# Runs on http://localhost:5173
```

## Navigation Routes

| Module | URL | Sidebar Link |
|---|---|---|
| System Design | `localhost:5173/system` | Click "System Design" in left sidebar under CONCEPTS |
| OOP Visualization | `localhost:5173/oop` | Click "OOP Viz" in left sidebar under CONCEPTS |

**Note:** Navigating directly to `/system` or `/oop` may redirect to `/sorting` (default route). Use the sidebar links to navigate reliably.

## System Design Module

### Key UI Controls

- **"HTTP Request"** button — sends 1 packet via round-robin LB to a healthy server
- **"Xả lũ 10 hạt"** button — sends 10-packet burst
- **"Sập nguồn"** button on WEB_SERVER cards — toggles server to FAILED (shows "Khôi phục" when failed)
- **"Reset Demo"** — reinitializes the 6-node demo topology
- **"Clear All"** — removes all nodes/packets
- **"Ghi dữ liệu (DB Write)"** — triggers DB write + replication lag packet

### Packet Animation

- Packets take ~20 seconds to traverse (after BUG-SD-4 deltaTime normalization)
- Packet count shown in header badge: "Packets: N"
- Failed node count shown as: "Failed: N"

### Smoke Overlay

- Gray smoke particles appear on FAILED server nodes
- Each node gets its own `FailureSmokeEmitterEngine` instance
- MAX_PARTICLES cap = 200
- Recovery ("Khôi phục") clears smoke per-node

### requestCount Reactivity Gap (Known Issue)

The `requestCount` field on node cards (`"X req"`) may NOT update in the Vue UI even though the engine correctly increments/decrements it. This is because the engine mutates raw JavaScript objects that bypass Vue 3's reactive Proxy system. `syncPackets()` only syncs packet arrays, not node state.

**To verify requestCount changes, use browser console:**

```javascript
const pinia = document.querySelector('#app').__vue_app__.config.globalProperties.$pinia;
const store = pinia._s.get('systemDesign');
const serverA = store.nodes.find(n => n.nodeId === 'server-a');
const serverB = store.nodes.find(n => n.nodeId === 'server-b');
console.log(`A: ${serverA.requestCount}, B: ${serverB.requestCount}, Packets: ${store.activePackets.length}`);
```

## OOP Visualization Module

### Scenarios

Click scenario cards in the left panel to start guided walkthroughs:
- **Đóng gói (Encapsulation)** — 4 steps: INSTANTIATE → VIOLATE_ACCESS → CALL_METHOD → VALIDATE_SETTER
- **Kế thừa (Inheritance)** — 4 steps: CLONE_MEMBERS → INSTANTIATE → CALL_METHOD seeking → CALL_METHOD resolved
- **Đa hình (Polymorphism)** — 3 steps: INSTANTIATE → CALL_METHOD seeking → CALL_METHOD resolved
- **Trừu tượng (Abstraction)** — 3 steps: SHOW_ABSTRACT_ERROR → INSTANTIATE → CALL_METHOD resolved

Use ⏭ (next) / ⏮ (prev) buttons to step through. Step counter shown as "N / M".

### Manual Sandbox

- **"+ new Shape()"** / **"+ new Circle()"** — instantiate objects on heap
- Heap counter shows "N/10 objects"
- Objects show at addresses like `0x310000`

### SVG Connector

The purple dashed line between Shape and Circle class cards uses `stroke-dasharray="4 4"`. To verify SVG correctness:

```javascript
const path = document.querySelector('path[stroke-dasharray]');
console.log(path.getAttribute('stroke-dasharray')); // Should be "4 4"
console.log(window.getComputedStyle(path).strokeDasharray); // Should be "4px, 4px"
```

## Unit Tests

```bash
cd frontend && npx vitest run   # 1528 tests across 90 files
```

## Type Checking

```bash
cd frontend && npx vue-tsc --noEmit
```

## Devin Secrets Needed

No secrets required — the app runs entirely locally with no authentication.
