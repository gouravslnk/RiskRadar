import { useEffect, useRef, useState } from 'react'
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  Compass,
  Cpu,
  Database,
  Droplets,
  ExternalLink,
  Flame,
  Layers,
  Loader2,
  LocateFixed,
  MapPin,
  Navigation,
  Radio,
  RefreshCw,
  Route,
  Satellite,
  Search,
  ShieldAlert,
  Sparkles,
  Waves,
  X,
  Zap,
} from 'lucide-react'
import { INDIAN_CITIES, INDIAN_STATES_AND_REGIONS, riskBadgeClasses } from './shared'

function CitySearchInput({ location, setLocation, onSelectLocation }) {
  const [inputText, setInputText] = useState('')
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  const [selectedIndex, setSelectedIndex] = useState(-1)
  const searchRef = useRef(null)
  const isSelectingRef = useRef(false)
  const abortControllerRef = useRef(null)

  // Sync input text when coordinates change from external actions (e.g. GPS, presets)
  useEffect(() => {
    if (isSelectingRef.current) return
    if (location.cityName) {
      setInputText(location.cityName)
      return
    }
    const matchedState = INDIAN_STATES_AND_REGIONS.find(
      (s) =>
        Math.abs(s.lat - Number(location.latitude)) < 0.1 &&
        Math.abs(s.lon - Number(location.longitude)) < 0.1
    )
    if (matchedState) {
      setInputText(`${matchedState.name} (${matchedState.type}, India)`)
      return
    }
    const matched = INDIAN_CITIES.find(
      (c) =>
        Math.abs(c.lat - Number(location.latitude)) < 0.05 &&
        Math.abs(c.lon - Number(location.longitude)) < 0.05
    )
    if (matched) {
      setInputText(`${matched.name}, ${matched.state}`)
      return
    }
    setInputText(`Location (${Number(location.latitude).toFixed(4)}°N, ${Number(location.longitude).toFixed(4)}°E)`)
  }, [location.latitude, location.longitude, location.cityName])

  // Debounced search for ANY city, state, or UT
  useEffect(() => {
    if (isSelectingRef.current) return

    const query = inputText.trim().toLowerCase()
    if (!query || query.length < 2) {
      setResults([])
      setLoading(false)
      setSelectedIndex(-1)
      return
    }

    // 1. Instant local search across Indian States & UTs (Assam, Odisha, Maharashtra, etc.)
    const stateMatches = INDIAN_STATES_AND_REGIONS.filter(
      (s) =>
        s.name.toLowerCase().includes(query) ||
        s.capital.toLowerCase().includes(query) ||
        s.aliases.some((a) => a.toLowerCase().includes(query))
    ).map((s) => ({
      name: s.name,
      admin1: `Cap: ${s.capital}`,
      country: `${s.type}, India`,
      latitude: s.lat,
      longitude: s.lon,
      depth: s.depth ?? 18,
      tag: s.type.toUpperCase(),
      isState: true,
    }))

    // 2. Instant local search across Indian Regional Cities
    const cityMatches = INDIAN_CITIES.filter(
      (c) =>
        c.name.toLowerCase().includes(query) ||
        c.state.toLowerCase().includes(query)
    ).map((c) => ({
      name: c.name,
      admin1: c.state,
      country: 'India',
      latitude: c.lat,
      longitude: c.lon,
      depth: c.depth ?? 18,
      tag: 'CITY',
      isCity: true,
    }))

    const localMatches = [...stateMatches, ...cityMatches]
    setResults(localMatches)

    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    const controller = new AbortController()
    abortControllerRef.current = controller

    const timer = setTimeout(async () => {
      if (isSelectingRef.current) return
      setLoading(true)
      try {
        const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
          query
        )}&count=8&language=en&format=json`
        const res = await fetch(url, { signal: controller.signal })
        if (!res.ok) throw new Error('Geocoding fetch failed')
        const data = await res.json()

        if (data.results && data.results.length > 0) {
          const apiResults = data.results.map((r) => ({
            name: r.name,
            admin1: r.admin1 || '',
            country: r.country || '',
            latitude: r.latitude,
            longitude: r.longitude,
            depth: 18,
            tag: r.country_code ? r.country_code.toUpperCase() : 'GEO',
            isState: false,
          }))

          const seen = new Set(localMatches.map((m) => `${m.latitude.toFixed(2)},${m.longitude.toFixed(2)}`))
          const uniqueApi = apiResults.filter(
            (r) => !seen.has(`${Number(r.latitude).toFixed(2)},${Number(r.longitude).toFixed(2)}`)
          )

          setResults([...localMatches, ...uniqueApi])
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          // Keep local matches if API fails
        }
      } finally {
        setLoading(false)
      }
    }, 250)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [inputText])

  // Handle outside click to close dropdown
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsOpen(false)
        setSelectedIndex(-1)
      }
    }
    document.addEventListener('pointerdown', handleClickOutside)
    return () => document.removeEventListener('pointerdown', handleClickOutside)
  }, [])

  function handleSelectCity(selected) {
    isSelectingRef.current = true
    const nextLoc = {
      latitude: Number(selected.latitude).toFixed(4),
      longitude: Number(selected.longitude).toFixed(4),
      depth: selected.depth ?? location.depth ?? 18,
      cityName: selected.name,
    }
    setLocation(nextLoc)
    setInputText(
      selected.isState
        ? `${selected.name} (${selected.country})`
        : selected.admin1
        ? `${selected.name}, ${selected.admin1}`
        : `${selected.name}, ${selected.country}`
    )
    setIsOpen(false)
    setSelectedIndex(-1)
    if (onSelectLocation) {
      onSelectLocation(nextLoc)
    }
    setTimeout(() => {
      isSelectingRef.current = false
    }, 300)
  }

  function handleSelectPreset(preset) {
    isSelectingRef.current = true
    const nextLoc = {
      latitude: Number(preset.lat).toFixed(4),
      longitude: Number(preset.lon).toFixed(4),
      depth: preset.depth ?? location.depth ?? 18,
      cityName: preset.name,
    }
    setLocation(nextLoc)
    setInputText(`${preset.name}, ${preset.state}`)
    setIsOpen(false)
    setSelectedIndex(-1)
    if (onSelectLocation) {
      onSelectLocation(nextLoc)
    }
    setTimeout(() => {
      isSelectingRef.current = false
    }, 300)
  }

  function handleKeyDown(e) {
    if (!isOpen || results.length === 0) {
      if (e.key === 'ArrowDown' || e.key === 'Enter') {
        setIsOpen(true)
      }
      return
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (selectedIndex >= 0 && selectedIndex < results.length) {
        handleSelectCity(results[selectedIndex])
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false)
      setSelectedIndex(-1)
    }
  }

  return (
    <div ref={searchRef} className="relative w-full">
      <div className="relative flex items-center">
        <input
          type="text"
          value={inputText}
          onChange={(e) => {
            isSelectingRef.current = false
            setInputText(e.target.value)
            setIsOpen(true)
            setSelectedIndex(-1)
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Search city, state (e.g. Assam, Mumbai, Delhi)..."
          className="w-full pl-8 pr-8 py-2 text-xs font-mono bg-white dark:bg-[#000000] border border-neutral-300 dark:border-[#262626] text-neutral-900 dark:text-white placeholder:text-neutral-400 focus:outline-none focus:border-black dark:focus:border-white transition-colors"
        />
        <div className="absolute left-2.5 text-neutral-400 pointer-events-none">
          {loading ? (
            <Loader2 size={13} className="animate-spin text-neutral-500" />
          ) : (
            <Search size={13} />
          )}
        </div>
        {inputText && (
          <button
            type="button"
            onClick={() => {
              setInputText('')
              setResults([])
              setIsOpen(false)
            }}
            className="absolute right-2 text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200"
          >
            <X size={12} />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1 max-h-64 overflow-y-auto bg-white dark:bg-[#121212] border border-neutral-300 dark:border-[#262626] shadow-xl z-50 divide-y divide-neutral-100 dark:divide-neutral-800">
          {results.length > 0 ? (
            results.map((c, idx) => (
              <button
                key={`${c.name}-${c.latitude}-${c.longitude}-${idx}`}
                type="button"
                onPointerDown={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleSelectCity(c)
                }}
                className={`w-full px-3 py-2 text-left text-xs font-mono flex items-center justify-between transition-colors cursor-pointer ${
                  selectedIndex === idx
                    ? 'bg-neutral-100 dark:bg-[#222222]'
                    : 'hover:bg-neutral-50 dark:hover:bg-[#1a1a1a]'
                }`}
              >
                <div className="flex items-center gap-1.5 truncate pr-2">
                  <span
                    className={`font-mono text-[8px] px-1 py-0.5 font-bold uppercase leading-none border ${
                      c.isState
                        ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30'
                        : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 border-neutral-300 dark:border-neutral-700'
                    }`}
                  >
                    {c.tag || 'GEO'}
                  </span>
                  <span className="font-bold text-neutral-900 dark:text-white">
                    {c.name}
                  </span>
                  <span className="text-[10px] text-neutral-500 truncate">
                    {c.admin1 ? `${c.admin1}, ` : ''}{c.country || ''}
                  </span>
                </div>
                <span className="text-[10px] text-neutral-400 flex-shrink-0">
                  {Number(c.latitude).toFixed(2)}°, {Number(c.longitude).toFixed(2)}°
                </span>
              </button>
            ))
          ) : inputText.length >= 2 && !loading ? (
            <div className="p-3 text-center text-xs font-mono text-neutral-500">
              No matching location found. Enter custom coordinates below.
            </div>
          ) : (
            <div>
              <div className="px-2.5 py-1 text-[9px] font-mono uppercase font-bold text-neutral-400 bg-neutral-50 dark:bg-[#0c0c0c] flex items-center justify-between">
                <span>Suggested Indian States & Hubs</span>
                <span className="text-[9px] text-neutral-400 font-normal">Click to load</span>
              </div>
              {INDIAN_STATES_AND_REGIONS.slice(0, 6).map((s) => (
                <button
                  key={`state-${s.name}`}
                  type="button"
                  onPointerDown={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleSelectCity({
                      name: s.name,
                      admin1: `Cap: ${s.capital}`,
                      country: `${s.type}, India`,
                      latitude: s.lat,
                      longitude: s.lon,
                      depth: s.depth,
                      tag: s.type.toUpperCase(),
                      isState: true,
                    })
                  }}
                  className="w-full px-2.5 py-1.5 text-left text-xs font-mono flex items-center justify-between transition-colors hover:bg-neutral-100 dark:hover:bg-[#1c1c1c] group cursor-pointer"
                >
                  <div className="flex items-center gap-1.5 truncate pr-2">
                    <span className="font-mono text-[8px] px-1 py-0.5 font-bold uppercase bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/30 leading-none">
                      STATE
                    </span>
                    <span className="font-medium text-neutral-800 dark:text-neutral-200 group-hover:underline">
                      {s.name} <span className="text-[10px] text-neutral-500">({s.capital})</span>
                    </span>
                  </div>
                  <span className="text-[10px] text-neutral-400">
                    {s.lat}°, {s.lon}°
                  </span>
                </button>
              ))}

              <div className="px-2.5 py-1 text-[9px] font-mono uppercase font-bold text-neutral-400 bg-neutral-50 dark:bg-[#0c0c0c] border-t border-neutral-100 dark:border-neutral-800 mt-1">
                Regional Disaster Hubs
              </div>
              {INDIAN_CITIES.slice(0, 6).map((c) => (
                <button
                  key={c.name}
                  type="button"
                  onPointerDown={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    handleSelectPreset(c)
                  }}
                  className="w-full px-2.5 py-1.5 text-left text-xs font-mono flex items-center justify-between transition-colors hover:bg-neutral-100 dark:hover:bg-[#1c1c1c] group cursor-pointer"
                >
                  <div className="flex items-center gap-1.5 truncate pr-2">
                    <span className="font-mono text-[8px] px-1 py-0.5 font-bold uppercase bg-neutral-100 dark:bg-neutral-800 text-neutral-500 border border-neutral-300 dark:border-neutral-700 leading-none">
                      CITY
                    </span>
                    <span className="font-medium text-neutral-800 dark:text-neutral-200 group-hover:underline">
                      {c.name} <span className="text-[10px] text-neutral-500">({c.state})</span>
                    </span>
                  </div>
                  <span className="text-[10px] text-neutral-400">
                    {c.lat}°, {c.lon}°
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function StatCard({ label, value, detail, icon, color = 'neutral' }) {
  return (
    <div className="p-5 bg-white dark:bg-[#0c0c0c] border border-neutral-200 dark:border-[#1e1e1e] flex flex-col justify-between">
      <div className="flex items-center justify-between text-neutral-500 dark:text-neutral-400">
        <span className="font-mono text-[11px] uppercase tracking-wider font-semibold">
          {label}
        </span>
        {icon}
      </div>
      <div className="my-2.5">
        <span
          className={`font-serif text-3xl sm:text-4xl font-bold tracking-tight ${
            color === 'rose'
              ? 'text-rose-500 dark:text-rose-400'
              : color === 'emerald'
              ? 'text-emerald-500 dark:text-emerald-400'
              : color === 'amber'
              ? 'text-amber-500 dark:text-amber-400'
              : 'text-neutral-900 dark:text-white'
          }`}
        >
          {value}
        </span>
      </div>
      <span className="font-mono text-[11px] text-neutral-500 dark:text-neutral-400">
        {detail}
      </span>
    </div>
  )
}

function LocationPanel({
  location,
  setLocation,
  onSelectLocation,
  onAnalyze,
  onUseLocation,
  loading,
  compact = false,
}) {
  return (
    <div className={`space-y-3 ${compact ? '' : 'p-4 bg-neutral-50 dark:bg-[#0c0c0c] border border-neutral-200 dark:border-[#1e1e1e]'}`}>
      <div className="flex items-center justify-between border-b border-neutral-200 dark:border-[#1e1e1e] pb-2">
        <div className="flex items-center gap-2 font-mono text-xs uppercase font-bold text-neutral-900 dark:text-white">
          <Compass size={14} />
          <span>Coordinates</span>
        </div>
        <div className="font-mono text-xs text-neutral-500">
          <span>{Number(location.latitude).toFixed(4)}°N</span>
          <span className="mx-1">/</span>
          <span>{Number(location.longitude).toFixed(4)}°E</span>
        </div>
      </div>

      <CitySearchInput location={location} setLocation={setLocation} onSelectLocation={onSelectLocation} />

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="block font-mono text-[10px] uppercase tracking-wider text-neutral-500 mb-0.5">
            Latitude (°N)
          </label>
          <input
            type="number"
            value={location.latitude}
            step="0.0001"
            onChange={(event) => setLocation({ ...location, latitude: event.target.value })}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                onAnalyze && onAnalyze(location)
              }
            }}
            className="w-full px-2.5 py-1.5 font-mono text-xs bg-white dark:bg-[#000000] border border-neutral-300 dark:border-[#262626] text-neutral-900 dark:text-white focus:outline-none focus:border-black dark:focus:border-white"
            placeholder="26.1445"
          />
        </div>
        <div>
          <label className="block font-mono text-[10px] uppercase tracking-wider text-neutral-500 mb-0.5">
            Longitude (°E)
          </label>
          <input
            type="number"
            value={location.longitude}
            step="0.0001"
            onChange={(event) => setLocation({ ...location, longitude: event.target.value })}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                onAnalyze && onAnalyze(location)
              }
            }}
            className="w-full px-2.5 py-1.5 font-mono text-xs bg-white dark:bg-[#000000] border border-neutral-300 dark:border-[#262626] text-neutral-900 dark:text-white focus:outline-none focus:border-black dark:focus:border-white"
            placeholder="91.7362"
          />
        </div>
      </div>

      <div>
        <label className="block font-mono text-[10px] uppercase tracking-wider text-neutral-500 mb-0.5">
          Depth (km)
        </label>
        <input
          type="number"
          value={location.depth}
          min="0"
          max="700"
          onChange={(event) => setLocation({ ...location, depth: event.target.value })}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              onAnalyze && onAnalyze(location)
            }
          }}
          className="w-full px-2.5 py-1.5 font-mono text-xs bg-white dark:bg-[#000000] border border-neutral-300 dark:border-[#262626] text-neutral-900 dark:text-white focus:outline-none focus:border-black dark:focus:border-white"
          placeholder="18"
        />
      </div>

      {(onAnalyze || onUseLocation) && (
        <div className="flex items-center gap-2 pt-2 border-t border-neutral-100 dark:border-[#1a1a1a]">
          {onAnalyze && (
            <button
              type="button"
              onClick={() => onAnalyze(location)}
              disabled={loading}
              className="flex-1 py-2 px-3 bg-black text-white dark:bg-white dark:text-black font-mono font-bold text-xs uppercase hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <RefreshCw size={13} className={loading ? 'animate-spin' : ''} />
              <span>{loading ? 'Analyzing...' : 'Re-analyze'}</span>
            </button>
          )}
          {onUseLocation && (
            <button
              type="button"
              onClick={onUseLocation}
              disabled={loading}
              className="py-2 px-3 border border-neutral-300 dark:border-[#2a2a2a] text-neutral-800 dark:text-neutral-200 font-mono text-xs uppercase hover:bg-neutral-100 dark:hover:bg-[#171717] transition-all disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <LocateFixed size={13} />
              <span>GPS Sync</span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export function HomePage({
  location,
  setLocation,
  flood,
  earthquake,
  wildfire,
  dominantDisaster,
  route,
  loading,
  onUseLocation,
  onAnalyzeAll,
  onSelectLocation,
  onOpenFlood,
  onOpenEarthquake,
  onOpenWildfire,
  onOpenAnalysis,
}) {
  const PRESET_REGIONS = [
    { name: 'Guwahati, Assam', lat: '26.1445', lon: '91.7362', tag: 'FLOODPLAIN', note: 'Brahmaputra Basin' },
    { name: 'Chamoli, Uttarakhand', lat: '30.4000', lon: '79.3300', tag: 'SEISMIC V', note: 'Himalayan Arc' },
    { name: 'Simlipal, Odisha', lat: '21.8000', lon: '86.3000', tag: 'WILDFIRE', note: 'Eastern Ghats' },
    { name: 'Bhuj, Gujarat', lat: '23.2420', lon: '69.6669', tag: 'SEISMIC V', note: 'Kutch Fault' },
    { name: 'Wayanad, Kerala', lat: '11.6854', lon: '76.1320', tag: 'MONSOON', note: 'Western Ghats' },
    { name: 'New Delhi / NCR', lat: '28.6139', lon: '77.2090', tag: 'SEISMIC IV', note: 'Yamuna Floodplain' },
  ]

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">
      {/* 1. Hero & Mission Control Header */}
      <div className="p-6 sm:p-10 bg-white dark:bg-[#0c0c0c] border border-neutral-200 dark:border-[#1e1e1e] relative overflow-hidden">
        {/* Subtle grid pattern background accent */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-blue-500/5 via-emerald-500/5 to-transparent pointer-events-none -mr-20 -mt-20 rounded-full blur-3xl" />

        <div className="relative z-10 space-y-6">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-[10px] uppercase font-bold tracking-widest px-2.5 py-1 bg-neutral-100 dark:bg-[#1a1a1a] text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-[#262626]">
              NATIONAL DISASTER INTELLIGENCE PLATFORM
            </span>
            <div className="flex items-center gap-1.5 px-2 py-0.5 text-[10px] font-mono text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>LIVE TELEMETRY ACTIVE</span>
            </div>
          </div>

          <div className="max-w-3xl space-y-3">
            <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-neutral-900 dark:text-white leading-[1.08]">
              Predict Multi-Hazards. <br className="hidden sm:inline" />
              <span className="italic font-normal text-neutral-500 dark:text-neutral-400">
                Chart Safe Corridors.
              </span>
            </h1>
            <p className="text-sm sm:text-base text-neutral-600 dark:text-neutral-300 leading-relaxed max-w-2xl">
              An AI-powered environmental monitoring suite for India. We integrate dual-polarization Sentinel-1 radar satellite masks, deep LSTM seismic sequence regression, and NASA VIIRS 375m thermal infrared passes into a unified threat index with road evacuation guidance.
            </p>
          </div>

          {/* Quick Mission Control Location Bar */}
          <div className="p-4 bg-neutral-50 dark:bg-[#141414] border border-neutral-200 dark:border-[#222222] space-y-3">
            <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
              <div className="flex-1">
                <label className="block font-mono text-[10px] uppercase tracking-wider text-neutral-500 mb-1 font-semibold">
                  Target Zone / Search Indian City or State:
                </label>
                <CitySearchInput
                  location={location}
                  setLocation={setLocation}
                  onSelectLocation={onSelectLocation}
                />
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 md:w-auto">
                <div>
                  <label className="block font-mono text-[9px] uppercase tracking-wider text-neutral-400 mb-1">
                    Lat (°N)
                  </label>
                  <input
                    type="number"
                    value={location.latitude}
                    step="0.0001"
                    onChange={(e) => setLocation({ ...location, latitude: e.target.value })}
                    className="w-full sm:w-24 px-2.5 py-1.5 font-mono text-xs bg-white dark:bg-[#000000] border border-neutral-300 dark:border-[#262626] text-neutral-900 dark:text-white focus:outline-none"
                    placeholder="26.1445"
                  />
                </div>
                <div>
                  <label className="block font-mono text-[9px] uppercase tracking-wider text-neutral-400 mb-1">
                    Lon (°E)
                  </label>
                  <input
                    type="number"
                    value={location.longitude}
                    step="0.0001"
                    onChange={(e) => setLocation({ ...location, longitude: e.target.value })}
                    className="w-full sm:w-24 px-2.5 py-1.5 font-mono text-xs bg-white dark:bg-[#000000] border border-neutral-300 dark:border-[#262626] text-neutral-900 dark:text-white focus:outline-none"
                    placeholder="91.7362"
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block font-mono text-[9px] uppercase tracking-wider text-neutral-400 mb-1">
                    Depth (km)
                  </label>
                  <input
                    type="number"
                    value={location.depth ?? 18}
                    onChange={(e) => setLocation({ ...location, depth: e.target.value })}
                    className="w-full sm:w-20 px-2.5 py-1.5 font-mono text-xs bg-white dark:bg-[#000000] border border-neutral-300 dark:border-[#262626] text-neutral-900 dark:text-white focus:outline-none"
                    placeholder="18"
                  />
                </div>
              </div>

              <div className="flex items-end gap-2 pt-2 md:pt-0">
                <button
                  type="button"
                  onClick={onUseLocation}
                  disabled={loading}
                  title="Detect live GPS Coordinates"
                  className="px-3.5 py-2 border border-neutral-300 dark:border-[#2a2a2a] text-neutral-800 dark:text-neutral-200 font-mono text-xs uppercase font-bold hover:bg-neutral-200 dark:hover:bg-[#202020] transition-colors flex items-center gap-1.5"
                >
                  <LocateFixed size={13} />
                  <span className="hidden sm:inline">GPS</span>
                </button>
                <button
                  type="button"
                  onClick={() => onAnalyzeAll(location)}
                  disabled={loading}
                  className="flex-1 md:flex-initial px-5 py-2 bg-black text-white dark:bg-white dark:text-black font-mono font-bold text-xs uppercase tracking-wider hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 size={13} className="animate-spin" />
                      <span>Scanning...</span>
                    </>
                  ) : (
                    <>
                      <Zap size={13} />
                      <span>Scan All Hazards</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Quick Vulnerability Presets */}
            <div className="pt-2 border-t border-neutral-200 dark:border-[#1e1e1e] flex flex-wrap items-center gap-1.5 text-xs font-mono">
              <span className="text-[10px] text-neutral-400 uppercase font-semibold mr-1">
                Regional Hubs:
              </span>
              {PRESET_REGIONS.map((preset) => (
                <button
                  key={preset.name}
                  type="button"
                  onClick={() => {
                    const next = {
                      latitude: preset.lat,
                      longitude: preset.lon,
                      depth: 18,
                      cityName: preset.name,
                    }
                    setLocation(next)
                    onAnalyzeAll(next)
                  }}
                  className="px-2 py-0.5 text-[10px] bg-white dark:bg-[#0c0c0c] border border-neutral-200 dark:border-[#262626] text-neutral-700 dark:text-neutral-300 hover:border-black dark:hover:border-white hover:text-black dark:hover:text-white transition-colors flex items-center gap-1"
                >
                  <span className="font-bold">{preset.name}</span>
                  <span className="text-[9px] text-neutral-400">({preset.tag})</span>
                </button>
              ))}
            </div>
          </div>

          {/* Telemetry Source Ticker */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-[10px] text-neutral-500 dark:text-neutral-400">
            <div className="flex items-center gap-1.5">
              <Satellite size={12} className="text-blue-500" />
              <span>Sentinel-1 SAR Dual-Pol</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Activity size={12} className="text-amber-500" />
              <span>USGS + Tectonic Prior</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Flame size={12} className="text-rose-500" />
              <span>NASA FIRMS VIIRS 375m</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Route size={12} className="text-emerald-500" />
              <span>OSRM Safe Road Routing</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Real-Time Risk Barometer (The 4 Stat Cards) */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldAlert size={16} className="text-neutral-500" />
            <h2 className="font-serif text-xl font-bold text-neutral-900 dark:text-white">
              Current Location Telemetry & Risk Matrix
            </h2>
          </div>
          <span className="font-mono text-xs text-neutral-500">
            Coordinates: {Number(location.latitude).toFixed(3)}°N, {Number(location.longitude).toFixed(3)}°E
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Dominant Threat"
            value={dominantDisaster ? dominantDisaster.toUpperCase() : 'Scan Ready'}
            detail={dominantDisaster ? `Highest risk factor: ${dominantDisaster}` : 'Multi-sensor fused evaluation'}
            icon={<Layers size={16} />}
            color={
              dominantDisaster === 'flood'
                ? flood?.risk_level === 'High'
                  ? 'rose'
                  : flood?.risk_level === 'Moderate'
                  ? 'amber'
                  : 'emerald'
                : dominantDisaster === 'earthquake'
                ? earthquake?.risk_level === 'High'
                  ? 'rose'
                  : earthquake?.risk_level === 'Moderate'
                  ? 'amber'
                  : 'emerald'
                : dominantDisaster === 'wildfire'
                ? wildfire?.risk_level === 'High'
                  ? 'rose'
                  : wildfire?.risk_level === 'Moderate'
                  ? 'amber'
                  : 'emerald'
                : 'neutral'
            }
          />
          <StatCard
            label="Flood Risk"
            value={flood ? `${flood.risk_percent}%` : '—'}
            detail={flood ? `${flood.risk_level} • ${flood.nearest_sensitive_region || 'Regional Basin'}` : 'Live rainfall & SAR radar masks'}
            icon={<Waves size={16} />}
            color={flood ? (flood.risk_level === 'High' ? 'rose' : flood.risk_level === 'Moderate' ? 'amber' : 'emerald') : 'emerald'}
          />
          <StatCard
            label="Seismic Risk"
            value={earthquake ? `M ${earthquake.predicted_magnitude}` : '—'}
            detail={earthquake ? `${earthquake.risk_percent}% (${earthquake.risk_level}) • Tectonic fault baseline` : 'LSTM sequence predictor'}
            icon={<Activity size={16} />}
            color={earthquake ? (earthquake.risk_level === 'High' ? 'rose' : earthquake.risk_level === 'Moderate' ? 'amber' : 'emerald') : 'amber'}
          />
          <StatCard
            label="Wildfire Thermal"
            value={wildfire ? `${wildfire.risk_percent}%` : '—'}
            detail={wildfire ? `${wildfire.risk_level} • ${wildfire.recent_fire_days} active fire days` : 'NASA VIIRS 375m thermal passes'}
            icon={<Flame size={16} />}
            color={wildfire ? (wildfire.risk_level === 'High' ? 'rose' : wildfire.risk_level === 'Moderate' ? 'amber' : 'emerald') : 'rose'}
          />
        </div>
      </div>

      {/* 3. Emergency Evacuation Corridor Card */}
      {route && (
        <div className="p-6 bg-white dark:bg-[#0c0c0c] border border-neutral-200 dark:border-[#1e1e1e] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 dark:border-[#1e1e1e] pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <Navigation size={18} />
              </div>
              <div>
                <h3 className="font-serif font-bold text-lg text-neutral-900 dark:text-white">
                  {route.needed ? 'Emergency Evacuation & Escape Corridor' : 'Safe Zone Assessment'}
                </h3>
                <p className="font-mono text-xs text-neutral-500 mt-0.5">
                  {route.message}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className={`font-mono text-xs px-2.5 py-1 font-semibold ${riskBadgeClasses(route.end_risk_level ?? route.start_risk_level)}`}>
                Destination: {route.end_risk_level ?? route.start_risk_level} Risk Zone
              </span>
              {dominantDisaster && onOpenAnalysis && (
                <button
                  type="button"
                  onClick={() => onOpenAnalysis(dominantDisaster)}
                  className="px-3 py-1 bg-black text-white dark:bg-white dark:text-black font-mono text-xs uppercase hover:opacity-90 transition-all flex items-center gap-1.5"
                >
                  <span>Open Evacuation Map</span>
                  <ArrowRight size={12} />
                </button>
              )}
            </div>
          </div>

          {route.steps?.length > 0 && (
            <div className="space-y-2">
              <div className="font-mono text-[11px] uppercase tracking-wider text-neutral-400 font-bold">
                Turn-by-turn road navigation instructions (OSRM)
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {route.steps.map((step, idx) => (
                  <div
                    key={`${step.instruction}-${idx}`}
                    className="flex items-center justify-between p-2.5 bg-neutral-50 dark:bg-[#141414] border border-neutral-200 dark:border-[#222222] text-xs font-mono"
                  >
                    <span className="text-neutral-800 dark:text-neutral-200 pr-2">
                      <span className="font-bold mr-1.5 text-neutral-400">{idx + 1}.</span>
                      {step.instruction}
                    </span>
                    <span className="text-neutral-500 font-bold flex-shrink-0">
                      {step.distance_m}m
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* 4. Three Dedicated AI Deep-Dive Showcases (Clean feature showcases replacing redundant cards!) */}
      <div className="space-y-4">
        <div>
          <span className="font-mono text-[10px] uppercase font-bold tracking-widest text-neutral-400">
            SPECIALIZED RESEARCH SUITES
          </span>
          <h2 className="font-serif text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white mt-0.5">
            Dedicated AI Hazard Radars
          </h2>
          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 mt-1 max-w-3xl">
            Each disaster module is powered by an independent machine learning architecture. Launch the dedicated radars below to interact with satellite TIFF segmentation, seismic sequence plots, and live NASA fire radii.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Showcase 1: Flood Radar */}
          <div className="p-6 bg-white dark:bg-[#0c0c0c] border border-neutral-200 dark:border-[#1e1e1e] flex flex-col justify-between hover:border-blue-400 dark:hover:border-blue-500/50 transition-all group">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="p-2.5 bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
                  <Waves size={24} />
                </div>
                <span className="font-mono text-[10px] uppercase font-bold px-2 py-0.5 bg-blue-50 dark:bg-[#161616] text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50">
                  PyTorch Deep U-Net
                </span>
              </div>

              <div>
                <h3 className="font-serif text-xl font-bold text-neutral-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                  Flood Inundation Radar
                </h3>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-2 leading-relaxed">
                  Processes dual-polarization (VV/VH) Synthetic Aperture Radar (SAR) imagery to segment standing floodwaters through heavy monsoon cloud cover.
                </p>
              </div>

              <div className="space-y-2 pt-2 border-t border-neutral-100 dark:border-[#1a1a1a] text-xs font-mono text-neutral-600 dark:text-neutral-400">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-blue-500 flex-shrink-0" />
                  <span>Sentinel-1 SAR satellite TIFF masks</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-blue-500 flex-shrink-0" />
                  <span>Live 24h & 72h precipitation tracking</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-blue-500 flex-shrink-0" />
                  <span>Zone Radius & spatial contour control</span>
                </div>
              </div>
            </div>

            <div className="pt-6 mt-4 border-t border-neutral-100 dark:border-[#1a1a1a] flex items-center justify-between">
              <span className="font-mono text-[11px] font-bold text-neutral-500">
                IoU: 0.642 • Sentinel-1
              </span>
              <button
                type="button"
                onClick={onOpenFlood}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-mono text-xs uppercase font-bold tracking-wider transition-all group-hover:translate-x-0.5"
              >
                <span>Launch Radar</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>

          {/* Showcase 2: Seismic Predictor */}
          <div className="p-6 bg-white dark:bg-[#0c0c0c] border border-neutral-200 dark:border-[#1e1e1e] flex flex-col justify-between hover:border-amber-400 dark:hover:border-amber-500/50 transition-all group">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="p-2.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                  <Activity size={24} />
                </div>
                <span className="font-mono text-[10px] uppercase font-bold px-2 py-0.5 bg-amber-50 dark:bg-[#161616] text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50">
                  LSTM Neural Net
                </span>
              </div>

              <div>
                <h3 className="font-serif text-xl font-bold text-neutral-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
                  Seismic Sequence Model
                </h3>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-2 leading-relaxed">
                  Sequential earthquake recurrence model analyzing tectonic plate baseline, hypocenter depth (0–700km), and Himalayan collision belt risk factors.
                </p>
              </div>

              <div className="space-y-2 pt-2 border-t border-neutral-100 dark:border-[#1a1a1a] text-xs font-mono text-neutral-600 dark:text-neutral-400">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-amber-500 flex-shrink-0" />
                  <span>LSTM magnitude regression (M 4.0+)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-amber-500 flex-shrink-0" />
                  <span>Hypocenter depth & tectonic priors</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-amber-500 flex-shrink-0" />
                  <span>India Seismic Zones IV & V tracking</span>
                </div>
              </div>
            </div>

            <div className="pt-6 mt-4 border-t border-neutral-100 dark:border-[#1a1a1a] flex items-center justify-between">
              <span className="font-mono text-[11px] font-bold text-neutral-500">
                USGS + Historic Arc
              </span>
              <button
                type="button"
                onClick={onOpenEarthquake}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-mono text-xs uppercase font-bold tracking-wider transition-all group-hover:translate-x-0.5"
              >
                <span>Launch Seismic</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>

          {/* Showcase 3: Wildfire Detector */}
          <div className="p-6 bg-white dark:bg-[#0c0c0c] border border-neutral-200 dark:border-[#1e1e1e] flex flex-col justify-between hover:border-rose-400 dark:hover:border-rose-500/50 transition-all group">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="p-2.5 bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                  <Flame size={24} />
                </div>
                <span className="font-mono text-[10px] uppercase font-bold px-2 py-0.5 bg-rose-50 dark:bg-[#161616] text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50">
                  XGBoost Classifier
                </span>
              </div>

              <div>
                <h3 className="font-serif text-xl font-bold text-neutral-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 transition-colors">
                  NASA Wildfire Radar
                </h3>
                <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-2 leading-relaxed">
                  Evaluates 375m thermal anomaly pixels from NASA VIIRS satellites, Fire Radiative Power (FRP), and moisture deficits for next-day wildfire escalation.
                </p>
              </div>

              <div className="space-y-2 pt-2 border-t border-neutral-100 dark:border-[#1a1a1a] text-xs font-mono text-neutral-600 dark:text-neutral-400">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-rose-500 flex-shrink-0" />
                  <span>NASA FIRMS VIIRS live satellite telemetry</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-rose-500 flex-shrink-0" />
                  <span>94.8% test accuracy on Indian forest cells</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={13} className="text-rose-500 flex-shrink-0" />
                  <span>Interactive thermal buffer & radius tools</span>
                </div>
              </div>
            </div>

            <div className="pt-6 mt-4 border-t border-neutral-100 dark:border-[#1a1a1a] flex items-center justify-between">
              <span className="font-mono text-[11px] font-bold text-neutral-500">
                94.8% Acc • NASA 375m
              </span>
              <button
                type="button"
                onClick={onOpenWildfire}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-mono text-xs uppercase font-bold tracking-wider transition-all group-hover:translate-x-0.5"
              >
                <span>Launch Wildfire</span>
                <ArrowRight size={13} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export { LocationPanel, CitySearchInput }
