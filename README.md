<div align="center">

# Storganize

### AI-Powered, Hands-Free Inventory Management

A fixed camera watches your storage area. Hold up an item — it identifies it.
Place it in a zone — it logs where. Ask *"where's my blue toolbox?"* — it highlights the zone.
The entire time a natural language voice model using ElevenLabs guides you through it.

**No scanning. No typing. No barcodes.**

<br/>

[![React](https://img.shields.io/badge/React_18-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite_6-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![Gemini](https://img.shields.io/badge/Gemini_Flash-4285F4?style=for-the-badge&logo=google&logoColor=white)](https://ai.google.dev)
[![ElevenLabs](https://img.shields.io/badge/ElevenLabs-000000?style=for-the-badge&logo=elevenlabs&logoColor=white)](https://elevenlabs.io)
[![MediaPipe](https://img.shields.io/badge/MediaPipe-FF6F00?style=for-the-badge&logo=google&logoColor=white)](https://mediapipe.dev)

</div>

---

## The Problem

Every warehouse, workshop, and small business has the same headache:

> *"Where did that thing go?"*

Barcode systems exist — but they require labels on everything, dedicated scanners, and someone who actually remembers to scan every time. For most small teams, the reality is that nobody does it consistently.

---

## How It Works

### Step 1 — Define Your Zones (One Time)

Open Storganize and draw rectangles directly onto the live camera feed around each storage area — a shelf, a drawer, a bin. Name each zone. Zones are saved persistently and overlaid on the feed from that point on.

### Step 2 — Add an Item

Move in front of the camera. The system detects motion and wakes up automatically using a **pixel-difference motion gate** — it compares each frame against the last to detect when something is happening, then activates without any button press.

Say **"scan"** (or click the Scan button). Storganize captures a frame and sends it to **Gemini Vision**, which returns:

```json
{
  "name": "toolbox",
  "category": "Tools",
  "item_type": "toolbox",
  "distinguishing_features": {
    "color": "blue",
    "brand": "DeWalt",
    "size": "large"
  }
}
```

Hold your hand over the target zone. **MediaPipe** tracks your hand in real time. A dwell ring fills as you hold position — once it completes, the item is logged to that zone automatically.

> The system also uses **depth calibration** — your palm size on screen is a reliable proxy for distance. After a quick two-step calibration (near/far), zones can require the correct depth before confirming a placement, preventing accidental assignments.

### Step 3 — Find an Item

Say **"find blue toolbox"**, **"where is the screwdriver"**, or **"what's in Shelf 1"**. The matching zone glows on the camera feed, the inventory panel scrolls to the item card, and **ElevenLabs** speaks the location aloud.

### Step 4 — Remove an Item

Say **"remove toolbox"**. The system finds the best match in inventory, reads back what it found, and waits for you to say **"confirm"** or **"cancel"**.

---

## Tech Stack

| Layer | Technology | Role |
|---|---|---|
| Frontend | React 18 + Vite 6 | Component UI, fast HMR, canvas/camera work |
| Vision AI | Gemini 2.5 Flash | Item identification from quality-gated frames |
| Hand Tracking | MediaPipe Hands | In-browser hand detection, no server needed |
| Voice Output | ElevenLabs | Natural-sounding speech feedback |
| Voice Input | Web Speech API | Browser-native, no API key required |
| Frame Analysis | Canvas API | Motion detection and frame capture |
| Data | LocalStorage | Client-side persistence for zones and inventory |

---

## Project Structure

```
src/
├── components/
│   ├── CameraPanel.jsx       Live feed, motion detection, Gemini scan, voice commands
│   ├── BoundariesPanel.jsx   Zone drawing tool, depth calibration per zone
│   ├── InventoryPanel.jsx    Item list, search, zone filter, removed items
│   ├── CalibrationModal.jsx  Two-step near/far depth calibration UI
│   └── ZoneDepthModal.jsx    Per-zone depth target assignment
│
├── context/
│   ├── ZonesContext.jsx      Zone CRUD + depth settings (localStorage)
│   ├── ItemsContext.jsx      Item CRUD + soft-remove (localStorage)
│   ├── DepthContext.jsx      MediaPipe lifecycle + calibration state
│   └── SearchContext.jsx     Cross-panel find highlighting and zone filter
│
└── lib/
    ├── handTracker.js        MediaPipe Hands wrapper with grace period logic
    ├── zoneTracker.js        Dwell timer + 2D/depth zone matching
    └── depthCalibration.js   Palm-size math, calibration build/validate, persistence
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- Chrome (required for Web Speech API)
- A [Gemini API key](https://ai.google.dev)
- An [ElevenLabs API key](https://elevenlabs.io) (optional — falls back to browser TTS)

### Quick Start

```bash
git clone https://github.com/your-username/storganize.git
cd storganize
npm install
npm run dev
# Open http://localhost:5173 in Chrome
```

On first run:
1. Allow camera and microphone access when prompted
2. Go to the **Define Boundaries** tab and draw zones on the camera feed
3. (Optional) Click **Calibrate Depth** to enable depth-gated placement
4. Switch to the **Camera** tab and start scanning

### API Keys

The Gemini key can be set in two ways:
- Add `VITE_GEMINI_API_KEY=your_key` to a `.env` file at the root
- Enter it directly in the Camera panel UI — it is saved to LocalStorage

---

## Architecture Notes

**Quality-gated scanning** — The system does not stream frames to Gemini continuously. It detects motion locally using a pixel-diff check, evaluates frame quality (brightness, blur, edge content) for free using the Canvas API, and only sends a frame to Gemini when all checks pass. A typical session sends 3–6 frames to the API out of hundreds evaluated.

**Normalized zone coordinates** — All zone bounds are stored as 0–1 values relative to the video dimensions. This ensures zones align correctly regardless of window size or camera resolution.

**Depth inference without a depth camera** — Palm size on screen scales predictably with distance. By calibrating near and far positions once, the system can infer whether a hand is at the right depth for a given zone — enabling precise placement even when multiple zones overlap in 2D.
