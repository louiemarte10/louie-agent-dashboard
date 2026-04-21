# louie-agent-dashboard

Mission Control Dashboard for the [louieDevAgent](https://github.com/louiemarte10/agentic-ai-using-claude-code) multi-tenant AI bot system. Built with Vue 3 + Tailwind CSS, deployed on Vercel.

## What Is This?

A real-time web dashboard that monitors and controls your fleet of AI agents running on your local machine via Telegram. It connects to the louieDevAgent API through a Cloudflare Tunnel, giving you visibility from anywhere -- your phone, laptop, or any browser.

## Screenshots

### Agent Fleet (Cards View)
- Manager bot and tenant agents displayed as interactive cards
- Live Running/Offline status indicators
- On/Off toggle switches for tenant agents
- Click any card to expand token usage, cost breakdown, and recent activity

### Agent Fleet (Table View)
- Sortable columns: name, ID, model, status, turns, cost
- Click any row to see detailed stats

## Features

| Feature | Description |
|---------|-------------|
| **Agent Monitoring** | Real-time status of manager bot + all tenant agents |
| **Toggle Switch** | Turn tenant agents On/Off with loading spinner animation |
| **Clickable Cards** | Click any agent to expand detail panel with charts and stats |
| **Token Usage Charts** | Input/output token counts with visual bar charts per agent |
| **Token Usage Per Turn** | Table showing input, output, cache read tokens and cost per turn |
| **Cost Tracking** | Today and total cost per agent |
| **Telegram Username** | Recent Activity displays Telegram user labels with timestamps |
| **Hive Mind Feed** | Cross-agent activity log with color-coded agent badges |
| **Memory Browser** | View memory stats, fading memories, top accessed |
| **Task Management** | Scheduled cron jobs and mission task queue |
| **Sortable Table** | Switch between Cards and Table views, sort by any column |
| **Auto-Refresh** | All data refreshes every 30 seconds |
| **Dark Theme** | Full dark mode UI |
| **Connection Test** | Settings page with API connection verification |

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Framework | Vue 3 (Composition API, `<script setup>`) |
| Styling | Tailwind CSS v4 |
| Build Tool | Vite |
| Hosting | Vercel (free tier) |
| API Connection | Cloudflare Tunnel (free) to localhost:3141 |

## Pages

### Dashboard
System overview with health cards (context window %, turns, compactions, Telegram status), agent status grid, recent hive mind activity, and token cost summary.

### Agents
Interactive agent fleet view with two modes:
- **Cards View** -- visual cards for each agent with expandable detail panels showing token usage charts, costs, model info, and recent conversation
- **Table View** -- sortable data table with all agent metrics, click any column header to sort

Each tenant agent has an **On/Off toggle switch** with a loading spinner animation that starts or stops the agent process remotely.

Clicking any agent (card or table row) expands a detail panel showing:
- Input/output tokens with visual bar charts
- Today and total cost breakdown
- Turn counts and model info
- **Recent Activity** with Telegram username labels and timestamps
- **Token Usage Per Turn** table with input, output, cache read tokens and cost per individual turn

### Hive Mind
Chronological activity feed showing what all agents have been doing. Each entry has a color-coded agent badge, action type, summary, and timestamp. Auto-refreshes every 30 seconds.

### Memory
Memory system browser showing:
- Stats cards (total memories, pinned, average salience)
- Fading memories (about to decay)
- Top accessed memories

### Tasks
Two sections:
- **Scheduled Tasks** -- cron jobs with agent assignment, schedule, last/next run, active/paused status
- **Mission Tasks** -- async task queue with status badges (queued, in progress, completed, failed)

### Settings
API connection configuration:
- API URL (your Cloudflare Tunnel URL or localhost:3141)
- Dashboard Token (for authentication)
- Chat ID (your Telegram chat ID)
- **Test Connection** button to verify the API is reachable
- Cloudflare Tunnel setup instructions

## Quick Start

### Prerequisites
- [louieDevAgent](https://github.com/louiemarte10/agentic-ai-using-claude-code) running on your machine
- Node.js 20+

### 1. Clone and Install

```bash
git clone https://github.com/louiemarte10/louie-agent-dashboard.git
cd louie-agent-dashboard
npm install
```

### 2. Local Development

```bash
npm run dev
```

Opens at `http://localhost:5173`. Go to Settings and configure:
- **API URL:** `http://localhost:3141`
- **Dashboard Token:** your `DASHBOARD_TOKEN` from louieDevAgent's `.env`
- **Chat ID:** your Telegram chat ID

### 3. Deploy to Vercel

#### Option A: Via Vercel Dashboard
1. Go to [vercel.com](https://vercel.com) and sign in with GitHub
2. Click "Add New Project"
3. Import `louie-agent-dashboard` repo
4. Click Deploy (Vite is auto-detected)

#### Option B: Via CLI
```bash
npm i -g vercel
vercel
```

### 4. Set Up Remote Access

The dashboard on Vercel needs to reach your local API. Use a Cloudflare Tunnel:

```bash
# Download (Windows, no install needed)
curl -kL -o cloudflared.exe https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe

# Start tunnel
cloudflared tunnel --url http://localhost:3141
```

Copy the tunnel URL (e.g., `https://random-words.trycloudflare.com`) and paste it as the API URL in the dashboard Settings.

For a permanent URL, see the [Cloudflare Tunnel Guide](https://github.com/louiemarte10/agentic-ai-using-claude-code/blob/main/docs/cloudflare-tunnel.md).

## Project Structure

```
louie-agent-dashboard/
|-- src/
|   |-- App.vue                          # Main app shell with sidebar nav
|   |-- api.js                           # API client (fetch + auth + config)
|   |-- main.js                          # Vue app entry point
|   |-- style.css                        # Tailwind imports
|   +-- components/
|       |-- DashboardView.vue            # System overview page
|       |-- AgentsView.vue               # Agent fleet (cards + table + toggle)
|       |-- HiveMindView.vue             # Cross-agent activity feed
|       |-- MemoryView.vue               # Memory browser
|       |-- TasksView.vue                # Scheduled + mission tasks
|       +-- SettingsView.vue             # API config + connection test
|-- index.html                           # HTML entry point
|-- vite.config.js                       # Vite + Tailwind config
|-- vercel.json                          # Vercel deployment config
+-- package.json                         # Dependencies
```

## API Endpoints Used

The dashboard connects to the louieDevAgent API (ClaudeClaw) at port 3141:

| Endpoint | Description |
|----------|-------------|
| `GET /api/agents` | List all agents with status, model, turns, cost |
| `GET /api/agents/:id/status` | Check if a specific agent is running |
| `GET /api/agents/:id/tokens` | Token usage stats for an agent |
| `GET /api/agents/:id/conversation` | Recent conversation turns |
| `POST /api/agents/:id/activate` | Start an agent process |
| `POST /api/agents/:id/deactivate` | Stop an agent process |
| `GET /api/health` | System health (context %, Telegram status) |
| `GET /api/hive-mind` | Cross-agent activity feed |
| `GET /api/memories` | Memory stats and entries |
| `GET /api/tokens` | Token usage and cost stats |
| `GET /api/tasks` | Scheduled cron tasks |
| `GET /api/mission/tasks` | Mission task queue |

All endpoints require `?token=<DASHBOARD_TOKEN>` for authentication.

## Security

- **Token-based auth** -- all API requests require the dashboard token
- **CORS enabled** -- the API accepts cross-origin requests from Vercel
- **No secrets stored** -- config is saved in browser localStorage only
- **Tunnel security** -- Cloudflare Tunnel encrypts traffic end-to-end
- For production use, add [Cloudflare Access](https://developers.cloudflare.com/cloudflare-one/) for extra authentication

## Related

- [louieDevAgent](https://github.com/louiemarte10/agentic-ai-using-claude-code) -- the multi-tenant AI bot system this dashboard monitors
- [ClaudeClaw](https://github.com/earlyaidopters/claudeclaw) -- the underlying framework
- [OpenClaw](https://github.com/openclaw/openclaw) -- inspiration for multi-agent architecture

## License

MIT
