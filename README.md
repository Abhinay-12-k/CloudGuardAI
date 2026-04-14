<div align="center">

# ☁️ CloudGuard AI

### Enterprise-Grade AI-Driven Cloud Fault Prediction Dashboard

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Visit%20Site-6366f1?style=for-the-badge&logo=render&logoColor=white)](https://cloudguardai-tirb.onrender.com)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Claude AI](https://img.shields.io/badge/Claude-Sonnet%204.6-8b5cf6?style=for-the-badge&logo=anthropic&logoColor=white)](https://anthropic.com)

<br />

> **Predict failures before they happen.** CloudGuard AI combines a real-time 12-node cloud infrastructure simulator with Claude AI to deliver proactive fault predictions, intelligent alert routing, and an interactive SRE chat assistant — all in a clean, professional light-theme dashboard.

<br />

![CloudGuard AI Dashboard](https://raw.githubusercontent.com/Abhinay-12-k/CloudGuardAI/main/src/assets/hero.png)

</div>

---

## ✨ Features

| Feature | Description |
|---|---|
| **🔮 AI Fault Prediction** | Claude AI analyzes live node metrics and predicts failures with estimated time-to-failure, root cause, and ranked remediation steps |
| **💬 Streaming AI Chat** | Ask your infrastructure anything — real-time SSE streaming chat with full context injection of nodes, alerts, and predictions |
| **⚡ Live Simulation Engine** | 12-node cloud environment (web servers, databases, caches, load balancers, API gateways) with realistic metric fluctuation and fault injection |
| **🚨 Intelligent Alert Engine** | Auto-generates severity-classified alerts with 60-second deduplication, team assignment, notes, and acknowledge workflows |
| **📊 Rich Analytics** | CPU trend lines, memory distribution, alerts-by-hour, MTTR trend, incident type pie chart — all with live data |
| **📋 Incident History** | 20 pre-seeded incidents with sortable table, expandable row details, and one-click CSV export |
| **🎛️ Command Palette** | `Ctrl+K` / `⌘K` global search across pages, nodes, and recent alerts |
| **📡 Service Health** | Dependency-aware service status tracking across 5 critical services |
| **⚙️ Configurable** | Adjustable fault frequency, alert thresholds, update intervals, accent color, font size, and team members |

---

## 🖥️ Pages

```
/                → Dashboard       — KPI cards, CPU/memory charts, node table, service health
/infrastructure  → Infrastructure  — Filterable node grid with sparklines and detail sheet
/predictions     → Predictions     — Auto-scan + manual AI fault analysis with probability gauges
/alerts          → Alerts Center   — Live feed, hourly chart, team on-call panel, detail modal
/incidents       → Incidents       — Sortable history table, expandable details, CSV export
/ai-chat         → AI Chat         — Streaming Claude chat with live infra context
/settings        → Settings        — API key, thresholds, simulation config, team management
```

---

## 🛠️ Tech Stack

**Frontend**
- [React 19](https://react.dev) + [TypeScript 5](https://www.typescriptlang.org) — component model and type safety
- [Vite 8](https://vitejs.dev) — lightning-fast dev server and production bundler
- [Tailwind CSS 3](https://tailwindcss.com) — utility-first styling with custom design tokens
- [Framer Motion](https://www.framer.com/motion/) — page transitions and list animations
- [React Router v7](https://reactrouter.com) — client-side routing with lazy-loaded pages

**State & Data**
- [Zustand 5](https://zustand-demo.pmnd.rs) — global state slices (nodes, alerts, predictions, settings, UI)
- [Recharts 3](https://recharts.org) — LineChart, BarChart, PieChart with responsive containers
- [date-fns](https://date-fns.org) — relative timestamps and date formatting

**UI Components**
- [Radix UI](https://www.radix-ui.com) — accessible Dialog, Dropdown, Tooltip primitives
- [cmdk](https://cmdk.paco.me) — command palette
- [Sonner](https://sonner.emilkowal.ski) — toast notifications
- [Lucide React](https://lucide.dev) — icon system

**AI**
- [Anthropic Claude API](https://anthropic.com) (`claude-sonnet-4-6`) — fault predictions (JSON mode) and streaming chat (SSE)

**Deployment**
- [Render](https://render.com) — static site hosting with automatic GitHub deploys

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** 18+ and **npm** 9+
- An **Anthropic API key** — get one at [console.anthropic.com](https://console.anthropic.com) (the AI features are optional; the simulation and dashboard work without it)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/Abhinay-12-k/CloudGuardAI.git
cd CloudGuardAI

# 2. Install dependencies
npm install

# 3. Start the development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Configure AI Features

1. Navigate to **Settings** (`/settings`) in the app
2. Paste your Anthropic API key (`sk-ant-api03-...`) into the **API Key** field
3. Click **Save API Key**, then **Test Connection** to verify
4. The **Predictions** and **AI Chat** pages are now fully enabled

> **Note:** The simulation engine, dashboard, alerts, and incident history all work without an API key. Only the AI Fault Prediction and AI Chat features require one.

---

## 📁 Project Structure

```
cloudGuard.AI/
├── public/
│   ├── _redirects          # SPA routing for Render
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── charts/         # Recharts wrappers (CPU, Memory, Alerts, MTTR, etc.)
│   │   ├── layout/         # Sidebar, TopBar, PageWrapper
│   │   ├── modals/         # CommandPalette, NodeDetailSheet, WelcomeModal
│   │   └── shared/         # AnimatedNumber, CircularProgress, StatusBadge, Sparkline
│   ├── data/
│   │   └── mockIncidents.ts  # 20 pre-seeded incident records
│   ├── hooks/
│   │   ├── useCloudSimulation.ts  # Singleton simulation engine (setInterval owner)
│   │   └── useKeyboardShortcuts.ts
│   ├── lib/
│   │   ├── alertEngine.ts      # Alert generation + deduplication
│   │   ├── claudeApi.ts        # Anthropic API — predictions + streaming chat
│   │   ├── csvExport.ts        # Incident CSV export
│   │   ├── simulationEngine.ts # Node seeds, metric profiles, tick logic
│   │   └── utils.ts
│   ├── pages/              # Dashboard, Infrastructure, Predictions, Alerts,
│   │                       # Incidents, AiChat, Settings
│   ├── store/
│   │   └── index.ts        # Zustand store (nodes, alerts, predictions, incidents, settings, ui)
│   └── types/
│       └── index.ts        # All TypeScript interfaces
├── render.yaml             # Render static site deployment config
├── tailwind.config.js
└── vite.config.ts
```

---

## ☁️ Deployment

The project is pre-configured for **Render** via `render.yaml`. Deploying is a single click:

1. Fork or clone this repo to your GitHub account
2. Go to [render.com](https://render.com) → **New → Static Site**
3. Connect your GitHub repo — Render auto-detects `render.yaml`
4. Click **Deploy**

Render will run `npm ci && npm run build` and serve the `dist/` directory. All React Router deep links are handled by the `routes` rewrite rule in `render.yaml`.

**Build details:**
| Setting | Value |
|---|---|
| Build Command | `npm ci && npm run build` |
| Publish Directory | `dist` |
| Node Version | 18+ |

---

## 🔑 How the Claude API Integration Works

CloudGuard AI calls the Anthropic API **directly from the browser** using the `anthropic-dangerous-direct-browser-access` header — no backend server required. Your API key is stored only in your browser's `localStorage` and never sent anywhere except directly to `api.anthropic.com`.

**Fault Prediction flow:**
1. The auto-scanner identifies nodes that are critical, have fault imminent flags, or exceed threshold metrics
2. Each candidate node's live telemetry (CPU, memory, error rate, latency + 5-snapshot history) is sent to `claude-sonnet-4-6`
3. Claude returns a structured JSON prediction: fault type, severity, probability (0–100), time-to-failure, root cause, remediation steps, and affected services
4. Results are stored in Zustand and displayed on the Predictions page

**AI Chat flow:**
1. Every message includes a system prompt with the full live infrastructure snapshot (all 12 nodes, active alerts, active predictions, health score)
2. Responses stream via SSE — tokens appear in real-time as Claude generates them

---

## 📸 Screenshots

| Dashboard | Infrastructure |
|---|---|
| KPI cards, CPU/memory trend charts, node status table, service health panel | Filterable node grid with sparklines, real-time metric bars, node detail side sheet |

| Predictions | AI Chat |
|---|---|
| Auto-scan + manual analysis, probability gauges, time-to-failure countdown | Streaming responses with full infra context, quick-prompt chips |

---

## 📄 License

MIT — free to use, fork, and build upon.

---

<div align="center">

Built with ❤️ using **React**, **TypeScript**, and **Claude AI**

⭐ Star this repo if you find it useful!

</div>
