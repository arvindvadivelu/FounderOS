# FounderOS — Autonomous AI Founder Operating System (V1)

Production-grade, single-user **Founder Operating System / Company Management Dashboard** built as a 100% frontend-only static SPA with local-first IndexedDB storage (Dexie) and client-side AI Copilot integration supporting OpenRouter and custom OpenAI-compatible APIs.

---

## 🌟 Key Capabilities

1. **Executive Command Center**: Real-time visibility into Monthly Recurring Revenue (MRR), Annual Recurring Revenue (ARR), burn rate, runway calculator, active customer accounts, and high-leverage focus items.
2. **Local-First Database (IndexedDB / Dexie)**:
   - 16 structured tables with schema versioning (`DB_VERSION = 1`).
   - Zero external database servers or cloud sync dependencies.
   - Works fully offline for all business operations (Finance, CRM, Deals, Tasks, Projects, Backlog, Notes).
3. **Autonomous AI Copilot & Tool Calling**:
   - Direct read-only database query tools (`getCompanyOverview`, `getRevenue`, `getExpenses`, `getRunway`, `getCustomers`, `getDeals`, `getTasks`, `getFeatures`, `getBugs`, `getGoals`, etc.).
   - Interactive Write-Action proposals with confirmation cards (`createTask`, `updateTask`, `createCustomer`, `createDeal`, `createFeature`, `createNote`).
   - One-click **Executive Founder Briefing** generation.
4. **Data Ownership & Portability**:
   - Complete JSON export and validated import engine.
   - Instant "Load Demo Company" seed for testing.
   - Danger zone data reset with `DELETE` confirmation.
5. **Command Palette (`Ctrl+K` / `Cmd+K`)**:
   - Instant fuzzy search across all 12+ company entities and immediate jump navigation.
6. **High-Contrast Solvst Aesthetics**:
   - Extracted from `Index.html`: Deep `#030712` slate canvas, `#0050FF` electric blue accent, ambient glowing orbs, spotlight hover tracking, `Plus Jakarta Sans` & `Inter` typography.

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Run Development Server
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 3. Production Build
```bash
npm run build
```
Generates static assets in `dist/`.

---

## 🌐 Static Netlify Deployment

This project is a 100% frontend-only SPA. It requires **zero backend servers, serverless functions, or cloud databases**.

- **Build command**: `npm run build`
- **Publish directory**: `dist`
- **SPA Routing**: Handled automatically via `public/_redirects` (`/*  /index.html  200`).

---

## 🤖 AI Provider Configuration & Security

1. Navigate to **Settings → AI Providers**.
2. Add your **OpenRouter** or **OpenAI-Compatible** endpoint:
   - **OpenRouter**: Base URL `https://openrouter.ai/api/v1`, Model `anthropic/claude-3.7-sonnet` (or any model identifier).
   - **Custom OpenAI API**: Base URL `https://api.openai.com/v1` or local endpoint (Ollama / LocalAI / Together / Groq).
3. Click **[Test Connection]** to measure real-time latency and verify CORS compatibility.

> 🔒 **Security Notice**: All API keys and custom headers are stored exclusively in your browser's local IndexedDB. No backend or intermediary proxy ever intercepts your credentials.

---

## 📂 Project Architecture

```
├── public/
│   └── _redirects              # Netlify SPA routing rules
├── src/
│   ├── ai/                     # Provider client, tool definitions, tool runner loop
│   ├── components/             # Common UI, Layout (Sidebar, Topbar), AI components
│   ├── db/                     # Dexie database, seed generator, CRUD services
│   ├── pages/                  # Overview, Finance, Customers, Sales, Tasks, Projects, etc.
│   ├── types/                  # Domain TypeScript interfaces
│   ├── utils/                  # Formatters, JSON Export/Import validator
│   ├── App.tsx                 # Client-side hash routing and root state
│   ├── index.css               # Solvst CSS variables, ambient orbs, spotlight effects
│   └── main.tsx                # React root mount
```
