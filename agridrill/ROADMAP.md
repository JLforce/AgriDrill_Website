# AgriDrill Web Application Roadmap

## Overview
This roadmap outlines the development plan for the AgriDrill web application, led by Jafit Love Ybanez. The project leverages Next.js 14 (App Router), TypeScript, Supabase, and Tailwind CSS to deliver a real-time dashboard and HMI for field operators.

---

## Database Recommendation — Supabase (Confirmed & Enhanced)
- **PostgreSQL** for persisting all planting sessions, sensor logs, and configuration presets
- **Supabase Realtime** for live telemetry (WebSocket-based)
- **Supabase Storage** for field photos (future)
- **Row Level Security** for multi-user support
- **Suggested schema:** sessions, telemetry_events, planting_logs, configurations, fault_logs

---

## Role Overview
Ybanez, Jafit Love leads the full-stack web application for AgriDrill. The app is built with Next.js 14 App Router, TypeScript, and Tailwind CSS, connected to Supabase as the backend. It serves as the primary HMI for field operators—handling configuration, real-time monitoring, session history, emergency stop, and manual control.

---

## Key Deliverables
| Deliverable                        | Description                                                                 | Success Metric                                      |
|------------------------------------|-----------------------------------------------------------------------------|-----------------------------------------------------|
| Next.js Web Application            | Full-stack Next.js 14 App Router project with TypeScript                    | All pages load <3s; TypeScript builds with zero errors |
| Supabase Schema & Integration      | PostgreSQL tables for sessions, telemetry, planting logs, faults; Realtime  | All CRUD ops confirmed; Realtime latency <500ms      |
| Real-Time Dashboard Page           | Live telemetry via Supabase Realtime                                        | Dashboard reflects actual robot state within 2s      |
| Field Configuration Page           | Form with Zod validation; persists presets in Supabase                      | Validated config POSTed to ESP32 API; preset saved   |
| Emergency Stop & Safety UI         | Prominent E-Stop button; watchdog for connection loss                       | E-Stop command reaches ESP32 <100ms, 5/5 tests       |
| Session History & Analytics        | Past sessions table with charts (Recharts/Chart.js)                         | All session data queryable; charts render correct    |
| Thesis Abstract & Acknowledgments  | Complete Abstract & Acknowledgments for thesis submission                   | Adviser-approved; meets CIT-U template              |

---

## Phased Timeline

### PHASE 1 — Project Setup, Architecture & Supabase Schema Design (Weeks 1–2)
| Task | Timeline | Key Deliverable | Status |
|------|----------|-----------------|--------|
| Scaffold Next.js 14 App Router project with TypeScript and Tailwind CSS | Week 1 | Project builds and runs; TypeScript strict mode enabled | Pending |
| Set up Supabase project, generate API keys, install supabase-js & @supabase/ssr | Week 1 | Supabase client connects from Next.js; test query returns data | Pending |
| Design and create Supabase database schema (sessions, telemetry_events, planting_logs, fault_logs, configurations); define RLS policies | Week 1 | All 5 tables created in Supabase Dashboard; RLS policies set | Pending |
| Set up Supabase Realtime: enable publication on telemetry_events and fault_logs tables; test channel subscription from Next.js client | Week 2 | Realtime subscription fires on test INSERT; confirmed in browser console | Pending |
| Design all page wireframes in Figma: Dashboard, Configuration, Session History, Manual Control; share with team for feedback | Week 2 | Wireframes shared; team sign-off received | Pending |
| Define Next.js API Route contract with Celestra (ESP32): POST api/telemetry, POST api/command, GET api/status; agree on JSON payload schemas | Week 2 | API contract document signed off by Celestra and Ybanez | Pending |

### PHASE 2 — UI Component Library & Page Scaffolding (Weeks 3–5)
| Task | Timeline | Key Deliverable | Status |
|------|----------|-----------------|--------|
| Install and configure shadcn/ui component library; set up global Tailwind theme | Week 3 | shadcn/ui components render correctly; brand theme applied | Pending |
| Build reusable TypeScript components: StatusBadge, MetricCard, BatteryGauge, FaultAlert, NavBar, Sidebar | Week 3 | All 6 components render correctly with TypeScript props; Storybook or visual test | Pending |
| Build Configuration Page: React Hook Form + Zod schema for BedLength, BedWidth, HoleSpacing, DrillingDepth; crop profile presets dropdown | Week 4 | All form fields validated; out-of-range values show inline errors; form submits clean JSON | Pending |
| Build Real-Time Dashboard Page layout: grid of MetricCards, E-Stop button above the fold | Week 4 | Dashboard layout complete; E-Stop visible on 1280px and 375px viewports | Pending |
| Build Session History Page: data table of past sessions using TanStack Table; clickable row → session detail | Week 5 | Table renders paginated sessions from Supabase; row click opens detail view | Pending |
| Build Manual Control Page: WASD / D-pad UI for directional commands; mode toggle; manual drill trigger button | Week 5 | All control buttons send correct commands; confirmed in browser network tab | Pending |

### PHASE 3 — API Routes, Supabase Integration & Real-Time Live Data (Weeks 6–8)
| Task | Timeline | Key Deliverable | Status |
|------|----------|-----------------|--------|
| Implement POST /api/telemetry Next.js API Route; validate incoming JSON from ESP32, insert into Supabase telemetry_events table, return {ok:true} | Week 6 | Postman POST inserts row in Supabase; row confirmed in Dashboard | Pending |
| Implement POST /api/command Next.js API Route; receive command from dashboard, forward HTTP request to ESP32 at local IP, return ESP32 ACK to client | Week 6 | All commands (START/STOP/RESUME/MANUAL_PLANT) forwarded; ACK shown in UI | Pending |
| Connect Dashboard to Supabase Realtime: subscribe to telemetry_events INSERT channel; update MetricCards in React state on each event without page refresh | Week 7 | Dashboard metrics update live within 2s of ESP32 POST; verified on physical robot | Pending |
| Implement fault notification system: subscribe to fault_logs Realtime channel; display toast notification with fault name and timestamp | Week 7 | Test fault INSERT triggers toast on dashboard within 2s | Pending |
| Implement Wi-Fi watchdog: if no Supabase Realtime heartbeat or telemetry for >5s, automatically POST STOP command to /api/command and show 'CONNECTION LOST' overlay | Week 7 | Watchdog fires within 5–7s of network disconnection; robot halts | Pending |
| Implement Supabase configuration persistence: save and load Configuration presets per crop profile; last-used configuration auto-populated on page load | Week 8 | Preset saved to DB; reloads on page refresh; correct values populated in form | Pending |
| Build Session Detail analytics page: Recharts line chart of XTE over time, bar chart of spacing accuracy, summary statistics from Supabase | Week 8 | Charts render correctly with session data; statistics match raw data | Pending |

### PHASE 4 — Testing, Optimization & Full System Integration (Weeks 9–11)
| Task | Timeline | Key Deliverable | Status |
|------|----------|-----------------|--------|
| E-Stop end-to-end timing test: measure from button click → /api/command POST → ESP32 motor halt; run 5 consecutive tests; target <100ms | Week 9 | All 5 tests ≤100ms; results logged in test sheet | Pending |
| Cross-browser and responsive design test: Chrome, Firefox, Safari, Edge; 375px (iPhone), 768px (tablet), 1280px (desktop); fix all layout breakages | Week 9 | All 4 browsers × 3 viewports pass visual and functional test | Pending |
| 4-hour soak test: keep dashboard open and connected during full field robot test; verify no memory leaks, Realtime subscription drops, or page freezes | Week 10 | 4-hour test record; zero crashes; Supabase Realtime active throughout | Pending |
| Implement TypeScript strict type checking across all components and API routes; resolve all 'any' types | Week 10 | tsc --noEmit exits with 0 errors; no implicit any types | Pending |
| Full system integration with Celestra's ESP32 firmware: verify complete data flow ESP32 → POST /api/telemetry → Supabase → Realtime → Dashboard; test all commands from UI to motor actuation | Week 11 | Integration test report; all data flows confirmed end-to-end on physical system | Pending |
| Performance audit: Lighthouse score ≥85 for Performance; ensure dashboard LCP <2.5s; optimize Supabase queries with indexes if needed | Week 11 | Lighthouse report screenshot; LCP ≤2.5s confirmed | Pending |

### PHASE 5 — Thesis Writing & Final Documentation (Weeks 12–14)
| Task | Timeline | Key Deliverable | Status |
|------|----------|-----------------|--------|
| Write thesis Abstract (≤1 page): Introduction, Methodology, Data Analysis, Conclusion | Week 12 | Abstract ≤1 page submitted for adviser review | Pending |
| Write Acknowledgments: adviser, panelists, institution, personal supporters | Week 12 | Acknowledgments ≤1 page; team sign-off | Pending |
| Write thesis Section 1.4.6 — Software Integration and HMI: cover Next.js App Router architecture, Supabase Realtime data flow, three-tier architecture pattern, TypeScript rationale | Week 13 | Section 1.4.6 complete with academic citations; adviser-approved | Pending |
| Write Figure 2.5.1 User Interaction Flowchart description | Week 13 | Flowchart description accurate; team-reviewed | Pending |
| Write developer README: Supabase setup guide, variable configuration, Next.js local dev, Vercel deployment instructions | Week 14 | New team member can deploy from README in ≤30 minutes | Pending |
| Final code cleanup: remove all console.logs, ensure env vars in .env.local, tag release v1.0 on GitHub | Week 14 | Clean codebase; v1.0 tagged; submitted to team lead | Pending |

---

## Tools & Technologies
- **Next.js 14 (App Router):** Full-stack React framework
- **TypeScript (strict mode):** Type safety across all components, API routes, Supabase query results
- **Tailwind CSS v3:** Utility-first styling; responsive design
- **shadcn/ui:** Composable React component library
- **Supabase (PostgreSQL, Realtime, supabase-js):** Primary database and live data
- **React Hook Form + Zod:** Form validation and schema definition
- **TanStack Table:** Headless table library for session history
- **Recharts:** Charting library for analytics
- **Vercel:** Deployment platform
- **Figma:** UI wireframe design

---

## Risks & Mitigations
| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Supabase Realtime connection drops in poor field Wi-Fi conditions causing stale dashboard | High | Implement reconnect logic with exponential backoff; show 'Reconnecting...' badge; stale data indicator if last update >5s ago |
| ESP32 cannot directly insert into Supabase (cloud) when operating in offline/AP mode | High | ESP32 POSTs to Next.js /api/telemetry route on local server; Supabase sync happens server-side. For offline mode, Next.js can buffer to local SQLite via Prisma |
| Next.js App Router server/client component boundary confusion causes hydration errors | Medium | Follow strict 'use client' discipline; use React Server Components for initial data fetch |
| TypeScript type errors from Supabase auto-generated types going out of sync with schema | Medium | Use npx supabase gen types typescript after every schema change; commit generated types to version control |
| E-Stop API route introduces latency when Next.js server is under load | Low | Keep E-Stop as a direct fetch() to a dedicated lightweight route; use Edge Runtime for this route to minimize cold start latency |

---

Prepared by: Jafit Love Ybanez  
Role: Web Application Lead  
Approved by: Engr. Lindl Michael Enario
