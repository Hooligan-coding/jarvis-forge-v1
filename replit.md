# JARVIS Forge v1 — AI Hardware Design Copilot

## Overview

Futuristic AI-powered hardware design platform. Users interact with JARVIS AI assistant to design hardware products, visualize system schematics, select components, run simulations, and generate technical documentation.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React + Vite (artifacts/jarvis-forge)
- **Backend**: Express 5 (artifacts/api-server)
- **Styling**: TailwindCSS v4 with glassmorphism dark theme
- **Animations**: Framer Motion
- **Visualization**: SVG-based schematic diagram (Three.js WebGL not available in headless env)
- **API framework**: Express 5
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Architecture

- `artifacts/jarvis-forge/` — React frontend (port assigned via PORT env)
- `artifacts/api-server/` — Node.js/Express API (port 8080)
- `lib/api-spec/openapi.yaml` — OpenAPI contract
- `lib/api-client-react/` — Generated React Query hooks
- `lib/api-zod/` — Generated Zod validation schemas

## Key Features

1. **JARVIS AI Chat** — Mock AI responses with hardware design knowledge
2. **Schematic Viewer** — Interactive SVG diagram of solar streetlight with clickable components
3. **Component Library** — 10 hardware components with specs and pricing
4. **Simulation Panel** — Power output, battery life, efficiency, thermal risk calculator
5. **Documentation Generator** — Spec sheets, BOM, summary reports

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks from OpenAPI spec
- `pnpm --filter @workspace/api-server run dev` — run API server locally
- `pnpm --filter @workspace/jarvis-forge run dev` — run frontend locally

## API Routes

- `GET /api/healthz` — Health check
- `POST /api/jarvis/chat` — JARVIS AI response
- `GET /api/components` — List all hardware components
- `GET /api/components/:id` — Get component by ID
- `GET /api/projects` — List projects
- `POST /api/projects` — Create project
- `GET /api/projects/:id` — Get project by ID
- `GET /api/projects/stats/summary` — Dashboard stats
- `POST /api/simulation/run` — Run power simulation
- `POST /api/documentation/generate` — Generate spec sheet + BOM + report

## Notes

- `@react-three/fiber` and `@react-three/drei` are installed but not used (React 19 peer dep conflict + no WebGL in headless container). SVG-based schematic used instead.
- All data is in-memory (no database). Projects persist only per server restart.
- JARVIS responses are keyword-based mock AI (no real LLM). Supports: solar, wind, IoT, drone keywords.
