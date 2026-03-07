import { useState } from 'react'
import { ZonesProvider } from './context/ZonesContext'
import { ItemsProvider } from './context/ItemsContext'
import { DepthProvider } from './context/DepthContext'
import CameraPanel from './components/CameraPanel'
import BoundariesPanel from './components/BoundariesPanel'
import InventoryPanel from './components/InventoryPanel'
import './App.css'

const TABS = [
    { id: 'camera', label: 'Camera', icon: '📷' },
    { id: 'boundaries', label: 'Define Boundaries', icon: '🗂️' },
    { id: 'inventory', label: 'Inventory', icon: '📦' },
    { id: 'settings', label: 'Settings', icon: '⚙️' },
]

export default function App() {
    const [activeTab, setActiveTab] = useState('camera')

    return (
        <ZonesProvider>
            <ItemsProvider>
                <DepthProvider>
                    <div className="app-root">
                        <nav className="navbar">
                            <div className="navbar-brand">
                                <div className="brand-icon">⬡</div>
                                <span className="brand-name">Stifficiency</span>
                            </div>
                            <div className="tab-bar">
                                {TABS.map(tab => (
                                    <button
                                        key={tab.id}
                                        id={`tab-${tab.id}`}
                                        className={`tab-btn ${activeTab === tab.id ? 'tab-active' : ''}`}
                                        onClick={() => setActiveTab(tab.id)}
                                    >
                                        <span className="tab-icon">{tab.icon}</span>
                                        {tab.label}
                                    </button>
                                ))}
                            </div>
                            <div className="navbar-right">
                                <div className="status-pill">
                                    <span className="status-dot" />
                                    Online
                                </div>
                            </div>
                        </nav>

                        <main className="panel-area">
                            {/* Always mounted — hidden with display:none to preserve camera + MediaPipe state across tab switches */}
                            <div className="panel" style={{ padding: 0, overflow: 'hidden', display: activeTab === 'camera' ? 'flex' : 'none', flexDirection: 'column', height: '100%' }}>
                                <CameraPanel />
                            </div>
                            <div className="panel" style={{ padding: 0, overflow: 'hidden', display: activeTab === 'boundaries' ? 'flex' : 'none', flexDirection: 'column', height: '100%' }}>
                                <BoundariesPanel />
                            </div>
                            <div className="panel" style={{ padding: 0, overflow: 'hidden', display: activeTab === 'inventory' ? 'flex' : 'none', flexDirection: 'column', height: '100%' }}>
                                <InventoryPanel />
                            </div>
                            <div className="panel" style={{ display: activeTab === 'settings' ? 'flex' : 'none', flexDirection: 'column', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                                <div className="panel-empty">
                                    <span className="empty-icon">⚙️</span>
                                    <h2 className="empty-title">Settings</h2>
                                    <p className="empty-sub">Configuration will appear here</p>
                                </div>
                            </div>
                        </main>
                    </div>
                </DepthProvider>
            </ItemsProvider>
        </ZonesProvider>
    )
}
