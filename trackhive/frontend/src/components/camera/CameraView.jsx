import { useState, useRef, useCallback, useEffect } from 'react';
import Webcam from 'react-webcam';
import { GoogleGenerativeAI } from '@google/generative-ai';
import './CameraView.css';

const VIDEO_CONSTRAINTS = {
  facingMode: 'environment',
  width: { ideal: 1280 },
  height: { ideal: 720 },
};

const SYSTEM_PROMPT = `You are an environment analysis AI for a smart storage system called TrackHive.
You are looking at a camera feed of a room or storage area.

Your job is to identify and list every distinct item/object you can see in the frame.

Respond ONLY with a valid JSON object in this exact format:
{
  "summary": "A brief 1-sentence description of the environment",
  "items": [
    { "name": "Item name", "category": "Category", "location": "Where in the frame (e.g. left side, center, top shelf)" }
  ]
}

Categories to use: Furniture, Electronics, Storage, Clothing, Food/Drink, Books/Paper, Tools, Decor, Personal Items, Other.

Be specific with item names (e.g. "blue water bottle" not just "bottle").
Do NOT include any markdown, explanation, or text outside the JSON.`;

export default function CameraView() {
  const webcamRef = useRef(null);
  const [apiKey, setApiKey] = useState(() => localStorage.getItem('th_gemini_key') || '');
  const [keyInput, setKeyInput] = useState('');
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [error, setError] = useState('');
  const [cameraReady, setCameraReady] = useState(false);
  const [autoScan, setAutoScan] = useState(false);
  const intervalRef = useRef(null);

  // ── Save API key ──
  const saveKey = () => {
    if (!keyInput.trim()) return;
    localStorage.setItem('th_gemini_key', keyInput.trim());
    setApiKey(keyInput.trim());
    setKeyInput('');
  };

  // ── Capture frame as base64 ──
  const captureFrame = useCallback(() => {
    if (!webcamRef.current) return null;
    const screenshot = webcamRef.current.getScreenshot();
    if (!screenshot) return null;
    // Strip the data:image/jpeg;base64, prefix
    return screenshot.split(',')[1];
  }, []);

  // ── Analyze with Gemini Vision ──
  const analyzeEnvironment = useCallback(async () => {
    if (!apiKey) {
      setError('Please enter your Gemini API key first.');
      return;
    }
    if (analyzing) return;

    const base64Image = captureFrame();
    if (!base64Image) {
      setError('Could not capture frame. Make sure camera is active.');
      return;
    }

    setAnalyzing(true);
    setError('');

    try {
      const genAI = new GoogleGenerativeAI(apiKey);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });

      const result = await model.generateContent([
        SYSTEM_PROMPT,
        {
          inlineData: {
            mimeType: 'image/jpeg',
            data: base64Image,
          },
        },
      ]);

      const text = result.response.text();
      // Extract JSON from the response (handle possible markdown wrapping)
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Could not parse AI response');
      }

      const parsed = JSON.parse(jsonMatch[0]);
      setSummary(parsed.summary || '');
      setItems(parsed.items || []);
    } catch (err) {
      console.error('[TrackHive] Gemini error:', err);
      setError(err.message || 'Failed to analyze environment');
    } finally {
      setAnalyzing(false);
    }
  }, [apiKey, analyzing, captureFrame]);

  // ── Auto-scan interval ──
  useEffect(() => {
    if (autoScan && apiKey && cameraReady) {
      intervalRef.current = setInterval(() => {
        analyzeEnvironment();
      }, 8000); // every 8 seconds to be token-conscious
      return () => clearInterval(intervalRef.current);
    } else {
      clearInterval(intervalRef.current);
    }
  }, [autoScan, apiKey, cameraReady, analyzeEnvironment]);

  // ── Render ──

  // API key entry screen
  if (!apiKey) {
    return (
      <div className="key-screen">
        <div className="key-card">
          <span className="key-icon">🔑</span>
          <h1>TrackHive</h1>
          <p>Enter your Gemini API key to get started</p>
          <div className="key-input-row">
            <input
              type="password"
              placeholder="Paste your Gemini API key…"
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && saveKey()}
              className="key-input"
              id="api-key-input"
            />
            <button onClick={saveKey} className="key-btn" id="save-key-btn">
              Continue →
            </button>
          </div>
          <p className="key-hint">
            Get a key at{' '}
            <a href="https://aistudio.google.com/apikey" target="_blank" rel="noreferrer">
              aistudio.google.com/apikey
            </a>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="camera-app">
      {/* ── Header ── */}
      <header className="app-header">
        <div className="header-left">
          <span className="logo-icon">📦</span>
          <h1 className="logo-text">TrackHive</h1>
        </div>
        <div className="header-right">
          {analyzing && <span className="analyzing-badge">⏳ Analyzing…</span>}
          <button
            className={`auto-btn ${autoScan ? 'auto-on' : ''}`}
            onClick={() => setAutoScan((prev) => !prev)}
            id="auto-scan-toggle"
          >
            {autoScan ? '⏸ Auto Scan On' : '▶ Auto Scan Off'}
          </button>
          <button
            className="scan-btn"
            onClick={analyzeEnvironment}
            disabled={analyzing}
            id="scan-btn"
          >
            {analyzing ? 'Scanning…' : '🔍 Scan Environment'}
          </button>
        </div>
      </header>

      {/* ── Main content ── */}
      <main className="app-main">
        {/* Camera feed */}
        <section className="camera-section">
          <div className="camera-viewport">
            <Webcam
              ref={webcamRef}
              audio={false}
              screenshotFormat="image/jpeg"
              videoConstraints={VIDEO_CONSTRAINTS}
              className="camera-video"
              onUserMedia={() => setCameraReady(true)}
            />
            {analyzing && (
              <div className="scan-overlay">
                <div className="scan-line" />
              </div>
            )}
          </div>
        </section>

        {/* Items panel */}
        <aside className="items-panel">
          <h2 className="panel-title">Environment</h2>

          {error && <div className="error-msg">{error}</div>}

          {summary && (
            <div className="env-summary">
              <p>{summary}</p>
            </div>
          )}

          {items.length === 0 && !analyzing && !error && (
            <div className="empty-state">
              <span className="empty-icon">👁️</span>
              <p>Point your camera at your environment and click <strong>Scan Environment</strong> to identify items.</p>
            </div>
          )}

          {items.length > 0 && (
            <div className="items-list">
              <div className="items-count">{items.length} items detected</div>
              {items.map((item, i) => (
                <div key={i} className="item-card">
                  <div className="item-name">{item.name}</div>
                  <div className="item-meta">
                    <span className="item-category">{item.category}</span>
                    <span className="item-location">📍 {item.location}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </aside>
      </main>
    </div>
  );
}
