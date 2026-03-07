import { useState } from 'react'
import { useItems } from '../context/ItemsContext'
import { useZones } from '../context/ZonesContext'
import './InventoryPanel.css'

function timeAgo(iso) {
    const s = Math.floor((Date.now() - new Date(iso)) / 1000)
    if (s < 60) return 'just now'
    if (s < 3600) return `${Math.floor(s / 60)}m ago`
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`
    return `${Math.floor(s / 86400)}d ago`
}

function groupBy(arr, key) {
    return arr.reduce((acc, item) => {
        const k = item[key] || 'Uncategorized'
        if (!acc[k]) acc[k] = []
        acc[k].push(item)
        return acc
    }, {})
}

function FeaturePills({ features }) {
    if (!features) return null
    return (
        <div className="feature-pills">
            {Object.entries(features).map(([k, v]) => v && (
                <span key={k} className="feature-pill">
                    <span className="pill-key">{k}:</span> {v}
                </span>
            ))}
        </div>
    )
}

function ItemCard({ item, onRemove }) {
    const [expanded, setExpanded] = useState(false)
    return (
        <div className="item-card" onClick={() => setExpanded(e => !e)}>
            <div className="item-card-header">
                <div className="item-card-left">
                    <span className="item-name">{item.name}</span>
                    <span className="item-type">{item.item_type}</span>
                </div>
                <div className="item-card-right">
                    <span className="item-time">{timeAgo(item.timestamp)}</span>
                    <button className="item-remove" onClick={e => { e.stopPropagation(); onRemove(item.id) }}>✕</button>
                </div>
            </div>
            {expanded && (
                <div className="item-card-body">
                    {item.zone
                        ? <div className="item-loc">📍 {item.zone}</div>
                        : <div className="item-loc unassigned">📍 Location not set</div>
                    }
                    <FeaturePills features={item.distinguishing_features} />
                </div>
            )}
        </div>
    )
}

function CategoryGroup({ name, items, onRemove }) {
    const [open, setOpen] = useState(true)
    return (
        <div className="cat-group">
            <button className="cat-group-header" onClick={() => setOpen(o => !o)}>
                <span className="cat-chevron">{open ? '▾' : '▸'}</span>
                <span className="cat-name">{name}</span>
                <span className="cat-count">{items.length}</span>
            </button>
            {open && (
                <div className="cat-group-body">
                    {items.map(item => <ItemCard key={item.id} item={item} onRemove={onRemove} />)}
                </div>
            )}
        </div>
    )
}

export default function InventoryPanel() {
    const { items, removeItem } = useItems()
    const { zones } = useZones()
    const [tab, setTab] = useState('category')

    const byCategory = groupBy(items, 'category')
    const byZone = groupBy(items, 'zone')
    const unassigned = byZone['null'] || byZone[null] || []
    const assigned = zones.map(z => ({ zone: z, items: byZone[z.id] || [] }))

    return (
        <div className="inventory-root">
            {/* Header */}
            <div className="inventory-header">
                <div className="inv-title">
                    <span>📦</span> Inventory
                    <span className="inv-total">{items.length} item{items.length !== 1 ? 's' : ''}</span>
                </div>
                <div className="inv-tab-bar">
                    <button
                        className={`inv-tab ${tab === 'category' ? 'inv-tab-active' : ''}`}
                        onClick={() => setTab('category')}
                    >
                        By Category
                    </button>
                    <button
                        className={`inv-tab ${tab === 'location' ? 'inv-tab-active' : ''}`}
                        onClick={() => setTab('location')}
                    >
                        By Location
                    </button>
                </div>
            </div>

            {/* Body */}
            <div className="inventory-body">
                {items.length === 0 ? (
                    <div className="inv-empty">
                        <span style={{ fontSize: 40, opacity: 0.3 }}>📦</span>
                        <p className="inv-empty-title">No items scanned yet</p>
                        <p className="inv-empty-sub">Go to the <strong>Camera</strong> tab and scan your first item.</p>
                    </div>
                ) : tab === 'category' ? (
                    <div className="group-list">
                        {Object.entries(byCategory).map(([cat, catItems]) => (
                            <CategoryGroup key={cat} name={cat} items={catItems} onRemove={removeItem} />
                        ))}
                    </div>
                ) : (
                    <div className="group-list">
                        {/* Zone groups */}
                        {assigned.map(({ zone, items: zItems }) => (
                            <div key={zone.id} className="cat-group">
                                <div className="cat-group-header loc-header">
                                    <div className="loc-dot" style={{ background: zone.color }} />
                                    <span className="cat-name">{zone.label}</span>
                                    <span className="cat-count">{zItems.length}</span>
                                </div>
                                <div className="cat-group-body">
                                    {zItems.length === 0
                                        ? <p className="loc-empty">No items stored here yet</p>
                                        : zItems.map(item => <ItemCard key={item.id} item={item} onRemove={removeItem} />)
                                    }
                                </div>
                            </div>
                        ))}
                        {/* Unassigned */}
                        {unassigned.length > 0 && (
                            <div className="cat-group">
                                <div className="cat-group-header loc-header">
                                    <div className="loc-dot" style={{ background: '#4a5568' }} />
                                    <span className="cat-name">Unassigned</span>
                                    <span className="cat-count">{unassigned.length}</span>
                                </div>
                                <div className="cat-group-body">
                                    {unassigned.map(item => <ItemCard key={item.id} item={item} onRemove={removeItem} />)}
                                </div>
                            </div>
                        )}
                        {zones.length === 0 && (
                            <div className="inv-empty">
                                <span style={{ fontSize: 32, opacity: 0.3 }}>🗂️</span>
                                <p className="inv-empty-title">No zones defined</p>
                                <p className="inv-empty-sub">Define boundaries first to enable location grouping.</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    )
}
