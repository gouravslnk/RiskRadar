import { useEffect, useRef, useState } from 'react'
import { Activity, ArrowRight, Check, Compass, Droplets, Flame, Layers, Loader2, LocateFixed, MapPin, Navigation, Radio, RefreshCw, Route, Search, Waves, X, Zap } from 'lucide-react'
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
        const res = await fetch(
          `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
            inputText.trim()
          )}&count=8&language=en&format=json`,
          { signal: controller.signal }
        )
        if (res.ok) {
          const data = await res.json()
          if (!isSelectingRef.current) {
            const apiResults = (data.results || []).map((c) => ({
              name: c.name,
              admin1: c.admin1 || '',
              country: c.country || '',
              latitude: c.latitude,
              longitude: c.longitude,
              depth: 18,
              tag: 'GLOBAL',
            }))
            // Merge local states/cities on top, then API results (avoid duplicates)
            const combined = [...localMatches]
            for (const r of apiResults) {
              const exists = combined.some(
                (item) =>
                  Math.abs(item.latitude - r.latitude) < 0.1 &&
                  Math.abs(item.longitude - r.longitude) < 0.1
              )
              if (!exists) {
                combined.push(r)
              }
            }
            setResults(combined)
            setSelectedIndex(-1)
          }
        }
      } catch (err) {
        if (err.name !== 'AbortError') {
          setResults(localMatches)
        }
      } finally {
        if (!isSelectingRef.current) {
          setLoading(false)
        }
      }
    }, 180)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [inputText])

  // Click outside to close suggestions
  useEffect(() => {
    function handleClickOutside(event) {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('pointerdown', handleClickOutside)
    return () => document.removeEventListener('pointerdown', handleClickOutside)
  }, [])

  function handleSelectCity(city) {
    isSelectingRef.current = true
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    const lat = Number(Number(city.latitude).toFixed(4))
    const lon = Number(Number(city.longitude).toFixed(4))
    const next = {
      ...location,
      latitude: lat,
      longitude: lon,
      depth: city.depth || location.depth,
    }
    setLocation(next)
    if (onSelectLocation) {
      onSelectLocation(next)
    }
    const displayName = city.isState
      ? `${city.name} (${city.country})`
      : `${city.name}${city.admin1 ? `, ${city.admin1}` : ''} (${city.country || 'India'})`
    setInputText(displayName)
    setResults([])
    setIsOpen(false)
    setLoading(false)
    setSelectedIndex(-1)
    setTimeout(() => {
      isSelectingRef.current = false
    }, 350)
  }

  function handleSelectPreset(preset) {
    isSelectingRef.current = true
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    const next = {
      ...location,
      latitude: preset.lat,
      longitude: preset.lon,
      depth: preset.depth || location.depth,
    }
    setLocation(next)
    if (onSelectLocation) {
      onSelectLocation(next)
    }
    setInputText(`${preset.name}, ${preset.state}`)
    setResults([])
    setIsOpen(false)
    setLoading(false)
    setSelectedIndex(-1)
    setTimeout(() => {
      isSelectingRef.current = false
    }, 350)
  }

  const hasResults = results.length > 0
  const activeItems = hasResults ? results : (inputText.length < 2 ? INDIAN_CITIES.slice(0, 8) : [])

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (isOpen && selectedIndex >= 0 && selectedIndex < activeItems.length) {
        const item = activeItems[selectedIndex]
        if (hasResults) {
          handleSelectCity(item)
        } else {
          handleSelectPreset(item)
        }
        return
      }
      if (hasResults) {
        handleSelectCity(results[0])
        return
      }
      if (inputText.trim().length >= 2) {
        const query = inputText.trim().toLowerCase()
        const matchedState = INDIAN_STATES_AND_REGIONS.find(
          (s) =>
            s.name.toLowerCase().includes(query) ||
            s.capital.toLowerCase().includes(query) ||
            s.aliases.some((a) => a.toLowerCase().includes(query))
        )
        if (matchedState) {
          handleSelectCity({
            name: matchedState.name,
            admin1: `Cap: ${matchedState.capital}`,
            country: `${matchedState.type}, India`,
            latitude: matchedState.lat,
            longitude: matchedState.lon,
            depth: matchedState.depth,
            tag: matchedState.type.toUpperCase(),
            isState: true,
          })
          return
        }
        const matchedCity = INDIAN_CITIES.find(
          (c) =>
            c.name.toLowerCase().includes(query) ||
            c.state.toLowerCase().includes(query)
        )
        if (matchedCity) {
          handleSelectCity({
            name: matchedCity.name,
            admin1: matchedCity.state,
            country: 'India',
            latitude: matchedCity.lat,
            longitude: matchedCity.lon,
            depth: matchedCity.depth,
            tag: 'CITY',
            isCity: true,
          })
          return
        }
      }
      if (onSelectLocation) {
        onSelectLocation(location)
      }
      return
    }

    if (!isOpen) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        setIsOpen(true)
      }
      return
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev + 1 >= activeItems.length ? 0 : prev + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex((prev) => (prev - 1 < 0 ? activeItems.length - 1 : prev - 1))
    } else if (e.key === 'Escape') {
      setIsOpen(false)
    }
  }

  return (
    <div className="relative w-full" ref={searchRef}>
      <label className="block font-mono text-[9px] uppercase tracking-wider text-neutral-500 mb-0.5">
        Search Any City, State or Region
      </label>
      <div className="relative flex items-center">
        <Search size={12} className="absolute left-2 text-neutral-400 pointer-events-none" />
        <input
          type="text"
          value={inputText}
          onChange={(e) => {
            isSelectingRef.current = false
            setInputText(e.target.value)
            setIsOpen(true)
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder="Type city or state (e.g. Assam, Odisha, Pune, Delhi...)"
          className="w-full pl-6 pr-6 py-1.5 font-mono text-xs bg-white dark:bg-[#000000] border border-neutral-300 dark:border-[#262626] text-neutral-900 dark:text-white focus:outline-none focus:border-black dark:focus:border-white transition-colors"
        />
        {loading && (
          <Loader2 size={12} className="absolute right-2 text-neutral-400 animate-spin" />
        )}
        {!loading && inputText && (
          <button
            type="button"
            onPointerDown={(e) => {
              e.preventDefault()
              isSelectingRef.current = false
              setInputText('')
              setResults([])
              setIsOpen(true)
            }}
            className="absolute right-2 text-neutral-400 hover:text-neutral-900 dark:hover:text-white p-0.5"
          >
            <X size={12} />
          </button>
        )}
      </div>

      {/* Autocomplete Dropdown List */}
      {isOpen && (
        <div className="absolute left-0 right-0 top-full mt-1 max-h-56 overflow-y-auto bg-white dark:bg-[#121212] border border-neutral-300 dark:border-[#262626] shadow-2xl z-50 divide-y divide-neutral-100 dark:divide-neutral-800">
          {/* Live Search Results */}
          {hasResults ? (
            results.map((c, idx) => (
              <button
                key={`${c.id || idx}-${c.name}-${c.latitude}-${c.longitude}`}
                type="button"
                onPointerDown={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleSelectCity(c)
                }}
                onClick={(e) => {
                  e.preventDefault()
                  e.stopPropagation()
                  handleSelectCity(c)
                }}
                className={`w-full px-2.5 py-2 text-left text-xs font-mono flex items-center justify-between transition-colors group cursor-pointer ${
                  selectedIndex === idx
                    ? 'bg-neutral-200 dark:bg-[#262626]'
                    : 'hover:bg-neutral-100 dark:hover:bg-[#1c1c1c]'
                }`}
              >
                <div className="flex items-center gap-1.5 truncate pr-2">
                  {c.tag && (
                    <span
                      className={`font-mono text-[8px] px-1 py-0.5 font-bold uppercase border flex-shrink-0 leading-none ${
                        c.tag === 'STATE'
                          ? 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/30'
                          : c.tag === 'UT'
                          ? 'bg-purple-500/15 text-purple-600 dark:text-purple-400 border-purple-500/30'
                          : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 border-neutral-300 dark:border-neutral-700'
                      }`}
                    >
                      {c.tag}
                    </span>
                  )}
                  <span className="font-bold text-neutral-900 dark:text-white group-hover:underline">
                    {c.name}
                  </span>
                  <span className="text-[10px] text-neutral-500 ml-1 truncate">
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
              No matching city or state found. Enter custom coordinates below.
            </div>
          ) : (
            <div>
              <div className="px-2.5 py-1 text-[9px] font-mono uppercase font-bold text-neutral-400 bg-neutral-50 dark:bg-[#0c0c0c] flex items-center justify-between">
                <span>Suggested Indian States & Hubs</span>
                <span className="text-[9px] text-neutral-400 font-normal">Click to load</span>
              </div>
              {/* Top Indian States */}
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

function LocationCard({ location, setLocation, onSelectLocation, onAnalyzeAll, onOpenEarthquake, onOpenWildfire, onUseLocation, loading }) {
  return (
    <div className="p-5 bg-white dark:bg-[#0c0c0c] border border-neutral-200 dark:border-[#1e1e1e] flex flex-col justify-between hover:border-neutral-400 dark:hover:border-[#383838] transition-colors">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="p-2 bg-neutral-100 dark:bg-[#171717] text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-[#222222]">
            <Compass size={20} />
          </div>
          <button
            type="button"
            onClick={onUseLocation}
            disabled={loading}
            title="Locate via GPS"
            className="flex items-center gap-1 font-mono text-[10px] uppercase font-bold px-2 py-0.5 border border-neutral-200 dark:border-[#262626] text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-[#171717] transition-colors"
          >
            <LocateFixed size={11} />
            <span>GPS Fix</span>
          </button>
        </div>

        <div>
          <h3 className="font-serif font-bold text-lg text-neutral-900 dark:text-white">
            Location Settings
          </h3>
          <p className="font-mono text-[11px] text-neutral-500 mt-0.5">
            Search any city or specify coordinates.
          </p>
        </div>

        {/* Global City Search Autocomplete */}
        <CitySearchInput location={location} setLocation={setLocation} onSelectLocation={onSelectLocation} />

        {/* Numerical Coordinates Grid */}
        <div className="grid grid-cols-2 gap-2 pt-0.5">
          <div>
            <label className="block font-mono text-[9px] uppercase tracking-wider text-neutral-500 mb-0.5">
              Lat (°N)
            </label>
            <input
              type="number"
              value={location.latitude}
              step="0.0001"
              onChange={(event) => setLocation({ ...location, latitude: event.target.value })}
              className="w-full px-2 py-1 font-mono text-xs bg-white dark:bg-[#000000] border border-neutral-300 dark:border-[#262626] text-neutral-900 dark:text-white focus:outline-none focus:border-black dark:focus:border-white"
              placeholder="26.1445"
            />
          </div>
          <div>
            <label className="block font-mono text-[9px] uppercase tracking-wider text-neutral-500 mb-0.5">
              Lon (°E)
            </label>
            <input
              type="number"
              value={location.longitude}
              step="0.0001"
              onChange={(event) => setLocation({ ...location, longitude: event.target.value })}
              className="w-full px-2 py-1 font-mono text-xs bg-white dark:bg-[#000000] border border-neutral-300 dark:border-[#262626] text-neutral-900 dark:text-white focus:outline-none focus:border-black dark:focus:border-white"
              placeholder="91.7362"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 pt-1 mt-1">
          <button
            type="button"
            onClick={onAnalyzeAll}
            disabled={loading}
            className="flex-1 py-2 px-3 bg-black text-white dark:bg-white dark:text-black font-mono font-bold text-xs uppercase hover:opacity-90 active:scale-[0.99] transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 size={13} className="animate-spin" />
                <span>Scanning...</span>
              </>
            ) : (
              <>
                <RefreshCw size={13} />
                <span>Re-analyze</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onUseLocation}
            disabled={loading}
            title="Sync GPS Live Location"
            className="py-2 px-3 border border-neutral-300 dark:border-[#2a2a2a] text-neutral-800 dark:text-neutral-200 font-mono font-bold text-xs uppercase hover:bg-neutral-100 dark:hover:bg-[#171717] transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
          >
            <LocateFixed size={13} />
            <span>GPS Sync</span>
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-3 mt-3 border-t border-neutral-100 dark:border-[#1a1a1a]">
        <button
          type="button"
          onClick={onOpenEarthquake}
          disabled={loading}
          className="flex-1 py-2 px-2 border border-neutral-300 dark:border-[#2a2a2a] text-neutral-800 dark:text-neutral-200 font-mono text-xs uppercase hover:bg-neutral-100 dark:hover:bg-[#171717] transition-all text-center disabled:opacity-50"
        >
          Seismic
        </button>
        <button
          type="button"
          onClick={onOpenWildfire}
          disabled={loading}
          className="flex-1 py-2 px-2 border border-neutral-300 dark:border-[#2a2a2a] text-neutral-800 dark:text-neutral-200 font-mono text-xs uppercase hover:bg-neutral-100 dark:hover:bg-[#171717] transition-all text-center disabled:opacity-50"
        >
          Fire
        </button>
      </div>
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
        <span className={`font-serif text-3xl sm:text-4xl font-bold tracking-tight ${
          color === 'rose'
            ? 'text-rose-500 dark:text-rose-400'
            : color === 'emerald'
            ? 'text-emerald-500 dark:text-emerald-400'
            : color === 'amber'
            ? 'text-amber-500 dark:text-amber-400'
            : 'text-neutral-900 dark:text-white'
        }`}>
          {value}
        </span>
      </div>
      <span className="font-mono text-[11px] text-neutral-500 dark:text-neutral-400">
        {detail}
      </span>
    </div>
  )
}

function HazardLaneCard({ icon, title, label, description, onOpen, onLive, loading }) {
  return (
    <div className="p-5 bg-white dark:bg-[#0c0c0c] border border-neutral-200 dark:border-[#1e1e1e] flex flex-col justify-between hover:border-neutral-400 dark:hover:border-[#383838] transition-colors">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="p-2 bg-neutral-100 dark:bg-[#171717] text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-[#222222]">
            {icon}
          </div>
          <span className="font-mono text-[10px] uppercase font-bold px-2 py-0.5 border border-neutral-200 dark:border-[#262626] text-neutral-600 dark:text-neutral-300">
            {label}
          </span>
        </div>

        <div>
          <h3 className="font-serif font-bold text-lg text-neutral-900 dark:text-white">
            {title}
          </h3>
          <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-1 leading-relaxed">
            {description}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 pt-3 mt-3 border-t border-neutral-100 dark:border-[#1a1a1a]">
        <button
          type="button"
          onClick={onLive}
          disabled={loading}
          className="flex-1 py-2 px-3 bg-black text-white dark:bg-white dark:text-black font-mono font-bold text-xs uppercase hover:opacity-90 active:scale-[0.99] transition-all disabled:opacity-50"
        >
          Live Sync
        </button>
        <button
          type="button"
          onClick={onOpen}
          disabled={loading}
          className="py-2 px-3 border border-neutral-300 dark:border-[#2a2a2a] text-neutral-800 dark:text-neutral-200 font-mono text-xs uppercase hover:bg-neutral-100 dark:hover:bg-[#171717] transition-all disabled:opacity-50"
        >
          Analyze
        </button>
      </div>
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

      {/* Global City Search Autocomplete */}
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

      {/* Action buttons directly under the location selector */}
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
  onLiveFlood,
  onLiveEarthquake,
  onLiveWildfire,
}) {
  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Editorial Hero Banner */}
      <div className="p-6 sm:p-10 bg-white dark:bg-[#0c0c0c] border border-neutral-200 dark:border-[#1e1e1e] flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="max-w-2xl space-y-2">
          <span className="font-mono text-[11px] uppercase tracking-widest text-neutral-500 font-bold block">
            RISK RADAR MONITOR — LIVE TRACKING // INDIA
          </span>
          <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-neutral-900 dark:text-white leading-[1.1]">
            Predict hazards. Know when they strike.
          </h1>
          <p className="text-sm text-neutral-600 dark:text-neutral-400 pt-0.5">
            Real-time satellite & seismic telemetry for India disaster mitigation and evacuation.
          </p>
        </div>

        {/* Action Button Stack */}
        <div className="flex flex-wrap md:flex-nowrap items-center gap-3 flex-shrink-0">
          <button
            type="button"
            onClick={onUseLocation}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2.5 bg-black text-white dark:bg-white dark:text-black font-mono font-bold text-xs uppercase tracking-wider hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
          >
            <LocateFixed size={14} />
            <span>+ Sync GPS Location</span>
          </button>
          <button
            type="button"
            onClick={onAnalyzeAll}
            disabled={loading}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-emerald-600 text-white font-mono font-bold text-xs uppercase tracking-wider hover:bg-emerald-700 transition-all disabled:opacity-50"
          >
            {loading ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
            <span>Scan All Hazards</span>
          </button>
        </div>
      </div>

      {/* 4 Stat Cards Strip with Live Telemetry */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Dominant Threat"
          value={dominantDisaster ? dominantDisaster.toUpperCase() : "Live"}
          detail={dominantDisaster ? `Highest risk factor: ${dominantDisaster}` : "U-Net SAR • LSTM • XGBoost"}
          icon={<Layers size={16} />}
          color={
            dominantDisaster === 'flood'
              ? (flood?.risk_level === 'High' ? 'rose' : flood?.risk_level === 'Moderate' ? 'amber' : 'emerald')
              : dominantDisaster === 'earthquake'
              ? (earthquake?.risk_level === 'High' ? 'rose' : earthquake?.risk_level === 'Moderate' ? 'amber' : 'emerald')
              : dominantDisaster === 'wildfire'
              ? (wildfire?.risk_level === 'High' ? 'rose' : wildfire?.risk_level === 'Moderate' ? 'amber' : 'emerald')
              : 'neutral'
          }
        />
        <StatCard
          label="Flood Inundation"
          value={flood ? `${flood.risk_percent}%` : "Live"}
          detail={flood ? `${flood.risk_level} • ${flood.nearest_sensitive_region}` : "24h/72h rainfall & SAR masks"}
          icon={<Waves size={16} />}
          color={flood ? (flood.risk_level === 'High' ? 'rose' : flood.risk_level === 'Moderate' ? 'amber' : 'emerald') : 'emerald'}
        />
        <StatCard
          label="Seismic Threat"
          value={earthquake ? `M ${earthquake.predicted_magnitude}` : "M 4.2+"}
          detail={earthquake ? `${earthquake.risk_percent}% (${earthquake.risk_level}) • Fault Zone Baseline` : "Tectonic fault tracking"}
          icon={<Activity size={16} />}
          color={earthquake ? (earthquake.risk_level === 'High' ? 'rose' : earthquake.risk_level === 'Moderate' ? 'amber' : 'emerald') : 'amber'}
        />
        <StatCard
          label="Fire Intensity"
          value={wildfire ? `${wildfire.risk_percent}%` : "Active"}
          detail={wildfire ? `${wildfire.risk_level} • ${wildfire.recent_fire_days} fire days` : "NASA VIIRS 375m passes"}
          icon={<Flame size={16} />}
          color={wildfire ? (wildfire.risk_level === 'High' ? 'rose' : wildfire.risk_level === 'Moderate' ? 'amber' : 'emerald') : 'rose'}
        />
      </div>

      {/* Evacuation Route & Corridor Card */}
      {route && (
        <div className="p-6 bg-white dark:bg-[#0c0c0c] border border-neutral-200 dark:border-[#1e1e1e] space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-200 dark:border-[#1e1e1e] pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                <Navigation size={18} />
              </div>
              <div>
                <h3 className="font-serif font-bold text-lg text-neutral-900 dark:text-white">
                  {route.needed ? 'Emergency Evacuation & Escape Corridor' : 'Active Safe Zone Assessment'}
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

      {/* Main 4-Card Unified Operational Grid */}
      <div className="space-y-4">
        <div>
          <h2 className="font-serif text-2xl font-bold text-neutral-900 dark:text-white">
            Hazard Intelligence Lanes
          </h2>
          <p className="font-mono text-xs text-neutral-500 mt-0.5">
            Targeted hazard prediction modules & sensor inputs.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <LocationCard
            location={location}
            setLocation={setLocation}
            onSelectLocation={onSelectLocation}
            onAnalyzeAll={onAnalyzeAll}
            onOpenEarthquake={onOpenEarthquake}
            onOpenWildfire={onOpenWildfire}
            onUseLocation={onUseLocation}
            loading={loading}
          />
          <HazardLaneCard
            icon={<Waves size={20} />}
            title="Flood Inundation"
            label="Sentinel-1 SAR"
            description="24h/72h rainfall tracking and Sentinel-1 SAR water segmentation."
            onOpen={onOpenFlood}
            onLive={onLiveFlood}
            loading={loading}
          />
          <HazardLaneCard
            icon={<Zap size={20} />}
            title="Seismic Risk"
            label="USGS + Tectonic Prior"
            description="Tectonic fault zone baseline & sequence monitoring across seismic zones."
            onOpen={onOpenEarthquake}
            onLive={onLiveEarthquake}
            loading={loading}
          />
          <HazardLaneCard
            icon={<Flame size={20} />}
            title="Wildfire Hotspot"
            label="NASA VIIRS"
            description="NASA VIIRS active fire & next-day hotspot prediction."
            onOpen={onOpenWildfire}
            onLive={onLiveWildfire}
            loading={loading}
          />
        </div>
      </div>
    </div>
  )
}

export { LocationPanel, CitySearchInput }
