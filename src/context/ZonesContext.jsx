import { createContext, useContext, useState, useEffect } from 'react'

const ZonesContext = createContext(null)

const STORAGE_KEY = 'stifficiency_zones'

const ZONE_COLORS = [
    '#7c6af7', '#4fc3f7', '#43e97b', '#fa8231',
    '#ff5757', '#f7c96a', '#e879f9', '#38f9d7',
]

export function ZonesProvider({ children }) {
    const [zones, setZones] = useState(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY)
            return saved ? JSON.parse(saved) : []
        } catch { return [] }
    })

    useEffect(() => {
        try { localStorage.setItem(STORAGE_KEY, JSON.stringify(zones)) } catch { }
    }, [zones])

    const addZone = (zone) => {
        setZones(prev => [...prev, {
            ...zone,
            id: crypto.randomUUID(),
            color: ZONE_COLORS[prev.length % ZONE_COLORS.length],
            items: [],
            depthTarget: null,
            depthTolerance: 20,
        }])
    }

    const removeZone = (id) => setZones(prev => prev.filter(z => z.id !== id))

    const setZoneDepth = (id, target, tolerance) =>
        setZones(prev => prev.map(z => z.id === id
            ? { ...z, depthTarget: target, depthTolerance: tolerance }
            : z
        ))

    const clearZoneDepth = (id) =>
        setZones(prev => prev.map(z => z.id === id
            ? { ...z, depthTarget: null, depthTolerance: 20 }
            : z
        ))

    return (
        <ZonesContext.Provider value={{ zones, addZone, removeZone, setZoneDepth, clearZoneDepth }}>
            {children}
        </ZonesContext.Provider>
    )
}

export const useZones = () => useContext(ZonesContext)
