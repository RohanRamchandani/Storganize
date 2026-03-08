import { useState, useEffect, useRef, useLayoutEffect } from 'react'
import { ZonesProvider } from './context/ZonesContext'
import { ItemsProvider } from './context/ItemsContext'
import { DepthProvider } from './context/DepthContext'
import { SearchProvider } from './context/SearchContext'
import CameraPanel from './components/CameraPanel'
import BoundariesPanel from './components/BoundariesPanel'
import InventoryPanel from './components/InventoryPanel'
import OnboardingModal, { shouldShowOnboarding } from './components/OnboardingModal'
import './App.css'

const TABS = [
    { id: 'camera', label: 'Camera' },
    { id: 'boundaries', label: 'Define Boundaries' },
    { id: 'inventory', label: 'Inventory' },
]

export default function App() {
    const [activeTab, setActiveTab] = useState('camera')
    const [showOnboarding, setShowOnboarding] = useState(() => shouldShowOnboarding())
    const tabRefs = useRef({})
    const [indicatorStyle, setIndicatorStyle] = useState({ left: 0, width: 0 })

    // Admin command listener
    useEffect(() => {
        const handler = (e) => {
            if (e.detail === 'TESTONBOARDING') setShowOnboarding(true)
        }
        window.addEventListener('storganize:admin', handler)
        return () => window.removeEventListener('storganize:admin', handler)
    }, [])

    // Slide the underline indicator to the active tab
    useLayoutEffect(() => {
        const el = tabRefs.current[activeTab]
        if (!el) return
        const parent = el.parentElement
        const parentRect = parent.getBoundingClientRect()
        const elRect = el.getBoundingClientRect()
        setIndicatorStyle({
            left: elRect.left - parentRect.left + 16, // 16px = tab padding-left
            width: elRect.width - 32,                  // subtract both paddings
        })
    }, [activeTab])

    return (
        <ZonesProvider>
            <ItemsProvider>
                <DepthProvider>
                    <SearchProvider>
                        <div className="app-root">
                            <nav className="navbar">
                                <div className="navbar-brand">
                                    <div className="brand-icon">S</div>
                                    <span className="brand-name">Storganize</span>
                                </div>
                                <div className="tab-bar" style={{ position: 'relative' }}>
                                    {TABS.map(tab => (
                                        <button
                                            key={tab.id}
                                            id={`tab-${tab.id}`}
                                            ref={el => { tabRefs.current[tab.id] = el }}
                                            className={`tab-btn ${activeTab === tab.id ? 'tab-active' : ''}`}
                                            onClick={() => setActiveTab(tab.id)}
                                        >
                                            {tab.label}
                                        </button>
                                    ))}
                                    {/* Shared animated underline indicator */}
                                    <span
                                        className="tab-indicator"
                                        style={{
                                            left: indicatorStyle.left,
                                            width: indicatorStyle.width,
                                        }}
                                    />
                                </div>
                                <div className="navbar-right">
                                    <div className="status-pill">
                                        <span className="status-dot" />
                                        Online
                                    </div>
                                </div>
                            </nav>

                            <main className="panel-area">
                                {/* Always mounted — hidden with display:none to preserve camera + MediaPipe state */}
                                <div className="panel" style={{ padding: 0, overflow: 'hidden', display: activeTab === 'camera' ? 'flex' : 'none', flexDirection: 'column', height: '100%' }}>
                                    <CameraPanel />
                                </div>
                                <div className="panel" style={{ padding: 0, overflow: 'hidden', display: activeTab === 'boundaries' ? 'flex' : 'none', flexDirection: 'column', height: '100%' }}>
                                    <BoundariesPanel />
                                </div>
                                {/* Inventory: align-items: stretch so it fills the full panel width */}
                                <div className="panel" style={{ padding: 0, overflow: 'hidden', display: activeTab === 'inventory' ? 'flex' : 'none', flexDirection: 'column', height: '100%', alignItems: 'stretch' }}>
                                    <InventoryPanel />
                                </div>
                            </main>

                            {showOnboarding && (
                                <OnboardingModal onClose={() => setShowOnboarding(false)} />
                            )}
                        </div>
                    </SearchProvider>
                </DepthProvider>
            </ItemsProvider>
        </ZonesProvider>
    )
}
