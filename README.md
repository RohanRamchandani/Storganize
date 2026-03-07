<div align="center">

# 📦 Stifficiency

### ✨ AI-Powered, Hands-Free Inventory Management ✨

<br/>

> **Wave. 👋 Show. 📸 Place. 📍 Done. ✅**

<br/>

A fixed camera watches your storage area. Hold up an item — it identifies it.\
Place it on a shelf — it logs where. Ask *"where's my blue toolbox?"* — it highlights the shelf.

**No scanning. No typing. No barcodes.**\
Just your voice, your hands, and a camera.

<br/>

[![React](https://img.shields.io/badge/React_18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite_5-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![Supabase](https://img.shields.io/badge/Supabase-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)
[![Gemini](https://img.shields.io/badge/Gemini_Vision-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev)
[![ElevenLabs](https://img.shields.io/badge/ElevenLabs-000000?style=for-the-badge&logo=elevenlabs&logoColor=white)](https://elevenlabs.io)

<br/>

<!-- Add a demo GIF or screenshot here -->
<!-- ![Demo](assets/demo.gif) -->

</div>

---

<br/>

## 😤 The Problem

Every warehouse, office, school, and small business has the same headache:

> *"Where did that thing go?"*

Someone puts a toolbox on Shelf 3, forgets to log it, and three days later the entire team is opening every drawer and checking every bin. Sound familiar? 😅

Sure, barcode systems exist — but they need labels on *everything*, dedicated scanners, and someone who actually remembers to scan every single time. For most small teams, the reality is: **nobody does it consistently**.

The result? Lost items, wasted time, and a lot of frustration. 😩

<br/>

---

<br/>

## 💡 The Solution

Stifficiency throws out the barcode scanner and replaces the entire workflow with something radically simpler:

> **🎥 One fixed camera + 🧠 AI + 🗣️ Your voice = Inventory that manages itself**

You walk up. Hold the item to the camera. Place it where it goes. That's it — the system identifies it, logs it, and remembers where it is. When you need to find something later, just *ask*.

<br/>

### 🔑 The Key Insight — We Don't Waste AI Calls

Most camera-to-AI systems stream every frame and burn through API credits in minutes. **We don't do that.**

We built a **quality gate** that evaluates every frame *locally* using cheap Canvas API checks:

| Check | What It Does | Cost |
|:---:|:---|:---:|
| 🌀 **Blur Detection** | Is the item being held still? | Free |
| 🔲 **Edge Analysis** | Is the item fully in frame? | Free |
| 💡 **Brightness Check** | Is the lighting good enough? | Free |

Only when a frame passes **all three checks** does it get sent to Gemini Vision. The result?

```
┌─────────────────────────────────────────────────────────┐
│  Frames evaluated: 847  │  Sent to AI: 4  │  Tokens: 312  │
└─────────────────────────────────────────────────────────┘
```

> 🎯 Out of **hundreds** of frames, typically only **3–6 ever hit the API**.\
> Fast. Cheap. Demo-ready.

<br/>

---

<br/>

## 🔄 How It Works

<br/>

### 🛠️ Step 1 — Setup (One Time Only)

> *"Hey camera, here's what you're looking at."*

1. Open Stifficiency — your live camera feed appears 🎥
2. **Draw rectangles** directly on the video around each storage area
3. Name each zone → *"Shelf 1"*, *"Tool Bin"*, *"Top Drawer"*
4. Pick a type → 🗄️ Shelf · 🗃️ Drawer · 📦 Bin · 🏗️ Rack
5. Click **Done** — zones are saved and permanently overlaid on the feed

That's it. You never do this again unless you rearrange your storage. ✅

<br/>

### ➕ Step 2 — Add an Item

> *"Here's a blue toolbox. I'm putting it on Shelf 1."*

1. 👋 **Wave at the camera** → system wakes up (Presage gesture detection)
2. 🖐️ **Hold up the item** — a water bottle, a toolbox, a jacket, anything
3. 🧠 **Quality gate watches** every frame, rejecting blurry/dark/cut-off ones
4. 📸 **One clean frame captured** → sent to Gemini Vision
5. 🤖 **Gemini returns:**

```json
{
  "name": "toolbox",
  "item_type": "toolbox",
  "distinguishing_features": {
    "color": "blue",
    "brand": "DeWalt",
    "size": "large",
    "condition": "good"
  },
  "confidence": 92
}
```

6. 🚶 **Walk to a zone & place the item** — system tracks which zone you're at
7. ✅ **Confirmation appears:**

> *"Blue DeWalt toolbox → Shelf 1 ✓"* (auto-dismisses in 3s)

> 🔊 Or if voice mode is on, ElevenLabs speaks the confirmation and waits for your *"yes"* or *"no"*

<br/>

### 🔍 Step 3 — Find an Item

> *"Where's the blue toolbox?"*

1. 🗣️ Ask out loud or type your question
2. 🔎 System queries the database by name + features
3. ✨ **The matching zone GLOWS** on the camera feed
4. 📋 Inventory panel scrolls to the matching item card
5. 🔊 ElevenLabs: *"The blue toolbox is on Shelf 1"*

<br/>

### 🗑️ Step 4 — Remove an Item

> *"I'm taking this back."*

1. 👋 Wake the system
2. 🖐️ Hold the item up → quality gate → Gemini identifies it
3. 🔄 System matches it against the database
4. ✅ Confirm removal → item marked as **out**
5. 📊 Zone count updates in real time

<br/>

---

<br/>

## ⚡ Tech Stack

<table>
<tr>
<td align="center" width="150">

**🖥️ Frontend**

React 18\
+ Vite 5
</td>
<td align="center" width="150">

**⚙️ Backend**

Node.js\
+ Express
</td>
<td align="center" width="150">

**🗄️ Database**

Supabase\
(PostgreSQL)
</td>
<td align="center" width="150">

**👁️ Vision AI**

Gemini\
Vision API
</td>
</tr>
<tr>
<td align="center">

**🔊 Voice Out**

ElevenLabs\
REST API
</td>
<td align="center">

**🎤 Voice In**

Web Speech\
API
</td>
<td align="center">

**👋 Gesture**

Presage\
SDK
</td>
<td align="center">

**🧑‍💻 Tracking**

MediaPipe\
+ Canvas API
</td>
</tr>
</table>

<br/>

| Layer | Technology | Why We Chose It |
|:---|:---|:---|
| 🖥️ Frontend | **React 18 + Vite** | Blazing fast HMR, perfect for canvas & camera work |
| ⚙️ Backend | **Node.js + Express** | Same language as frontend, minimal boilerplate |
| 🗄️ Database | **Supabase** | Instant REST API, real-time subscriptions, free tier |
| 👁️ Vision | **Gemini Vision API** | Multimodal, structured JSON output, function calling |
| 🔊 Voice Out | **ElevenLabs** | Simple POST → audio, natural sounding speech |
| 🎤 Voice In | **Web Speech API** | Browser-native, zero setup, no API key needed |
| 👋 Gesture | **Presage SDK** | Plug-and-play wave detection via webcam |
| 🏃 Tracking | **MediaPipe** | Runs in-browser, no backend needed |
| 🖼️ Frame Analysis | **Canvas API** | Vanilla JS — no library, no cost, no latency |

<br/>

---

<br/>

## 📁 Project Structure

```
stifficiency/
│
├── 🖥️ frontend/                  React + Vite
│   └── src/
│       ├── components/
│       │   ├── 📹 camera/        Live feed, zone overlays, token counter
│       │   ├── 🛠️ setup/         Zone drawing, name/type forms
│       │   ├── 📋 inventory/     Item list, search, location browser
│       │   ├── ⚙️ settings/      Config-driven settings panel
│       │   └── 🧩 shared/        ConfirmationDialog, StatusBadge
│       ├── 🪝 hooks/             useCamera, useSpeech, usePresage
│       ├── 🌐 context/           Settings, Inventory, Session
│       └── 🔧 utils/             frameDiff, frameQuality, zoneMapper
│
├── ⚙️ backend/                   Node.js + Express
│   ├── routes/                   /api/items, /api/zones, /api/events
│   ├── controllers/              Request/response handling
│   ├── services/                 Supabase queries + business logic
│   └── db/schema/                SQL table definitions
│
├── 🧠 ai/                        Pure functions, no side effects
│   ├── 👁️ vision/                Gemini Vision integration
│   ├── 🔊 voice/                 ElevenLabs + Web Speech
│   ├── 👋 gesture/               Presage wake detection
│   └── 📝 prompts/               Modular prompt templates
│
└── 📚 docs/                      API contract, demo script
```

<br/>

---

<br/>

## 🚀 Getting Started

### Prerequisites

| Requirement | Link |
|:---|:---|
| 📦 Node.js 18+ | [nodejs.org](https://nodejs.org) |
| 🗄️ Supabase account | [supabase.com](https://supabase.com) (free tier works!) |
| 🔑 Gemini API key | [ai.google.dev](https://ai.google.dev) |
| 🔑 ElevenLabs API key | [elevenlabs.io](https://elevenlabs.io) |
| 🌐 Chrome browser | Required for Web Speech API |

### ⚡ Quick Start

```bash
# 1️⃣ Clone it
git clone https://github.com/your-username/stifficiency.git
cd stifficiency

# 2️⃣ Set up the database
#    → Go to Supabase → SQL Editor → paste backend/db/schema/001_initial.sql → Run

# 3️⃣ Start the backend
cd backend
cp .env.example .env          # ← Add your Supabase keys here
npm install
npm run dev                    # → http://localhost:3001

# 4️⃣ Start the frontend
cd ../frontend
cp .env.example .env
npm install
npm run dev                    # → http://localhost:5173
```

### 🎬 First Run

1. 🎥 Allow camera access when prompted
2. ✏️ Click **"Draw Zone"** → drag rectangles on the camera feed
3. 📝 Name each zone, pick a type
4. ✅ Click **"Done"** — you're all set!

<br/>

---

<br/>

## 🏗️ Architecture Decisions

<details>
<summary>🤔 <b>Why a quality gate instead of continuous streaming?</b></summary>
<br/>

💰 **Cost and speed.** Gemini Vision charges per call. Streaming at 30fps would burn through API credits in under a minute. Our quality gate evaluates frames locally for free, and only sends the 1-in-200 frame that will actually produce a good result. Typical session: **847 frames evaluated, 4 sent to AI**.

</details>

<details>
<summary>🤔 <b>Why normalized coordinates (0–1) for zones?</b></summary>
<br/>

📐 **Resolution independence.** Browser windows resize. Camera resolutions differ between devices. By normalizing all zone coordinates to 0–1 at draw time and re-scaling to pixels at render time, zones always align perfectly — on any screen, any device.

</details>

<details>
<summary>🤔 <b>Why Supabase?</b></summary>
<br/>

⚡ **Speed to ship.** Instant PostgreSQL with REST API + real-time subscriptions (inventory panel updates live when items are logged) + generous free tier. For a 48-hour hackathon, it eliminates 100% of database infrastructure work.

</details>

<details>
<summary>🤔 <b>Why are all AI modules pure functions?</b></summary>
<br/>

🧪 **Testability and parallelism.** Every file in `/ai/` exports pure functions — no Express, no React, no side effects. Independently testable, reusable on both frontend and backend, and safe for four people to develop in parallel.

</details>

<br/>

---

<br/>

## ⚙️ Settings

Stifficiency includes a **config-driven settings panel** — adding a new setting requires zero UI code changes. Just add one object to `settingsConfig.js`. 🔧

| Setting | Default | Options |
|:---|:---|:---|
| 🔔 Wake trigger | Gesture | 👋 gesture / 🎤 voice |
| 🎯 Confidence threshold | 80% | 0–100 slider |
| ✅ High confidence mode | UI only | 🖥️ ui-only / 🔊 voice |
| ⚠️ Low confidence mode | Voice | 🖥️ ui-only / 🔊 voice |
| 🔊 Voice enabled | On | toggle |
| 🌀 Motion threshold | 15% | 0–100 slider |
| ⏱️ AI cooldown | 3000ms | 1000–10000 slider |
| 🤖 Agent mode | Warehouse | 🏭 warehouse / 🏫 school / 🏢 office |

<br/>

---

<br/>

## 🏆 Hackathon Prizes Targeted

| Prize | How We Use It |
|:---|:---|
| 🥇 **MLH Best Use of Gemini API** | Core item identification from quality-gated camera frames |
| 🥇 **MLH Best Hack with Google Antigravity** | Built using Antigravity IDE, fully documented |
| 🥇 **MLH Best Use of Presage** | Wave-to-wake gesture activates the entire system |
| 🥇 **Stan — Build in Public** | 3+ LinkedIn posts documenting the journey via Stanley |

<br/>

---

<br/>

## 👥 The Team

| Role | Owns | Key Deliverables |
|:---|:---|:---|
| 🎥 **Person 1** | Camera + Vision | Frame quality gate, Gemini integration, zone tracking, token counter |
| 🗣️ **Person 2** | Voice + Gesture | ElevenLabs, Web Speech, Presage, prompt templates |
| ⚙️ **Person 3** | Backend | Supabase schema, all API routes, services, held_items logic |
| 🎨 **Person 4** | Frontend UI | Setup flow, inventory panel, settings, confirmation dialog |

<br/>

---

<br/>

## 📜 License

MIT — do whatever you want with it. 🎉

<br/>

---

<br/>

<div align="center">

### Built with ❤️ in 48 hours

### Powered by ☕ caffeine and 🤖 Gemini

<br/>

*Wave at it. It waves back.* 👋

</div>
