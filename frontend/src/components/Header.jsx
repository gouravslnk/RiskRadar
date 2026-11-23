import { useEffect, useRef, useState } from 'react'
import { ChevronDown, LocateFixed, MoonStar, Navigation, Sun } from 'lucide-react'
import { riskBadgeClasses } from './shared'

function HotspotGroup({ title, cities, onSelect, onClose }) {
  const visible = cities.slice(0, 5)
  return (
    <div className="space-y-1">
      <div className="px-2 py-1 font-mono text-[10px] uppercase font-bold tracking-wider text-neutral-400 dark:text-neutral-500 border-b border-neutral-100 dark:border-neutral-800/80">
        {title} High-Risk
      </div>
      <div className="space-y-0.5">
        {visible.map((city) => (
          <button
            key={`${city.disaster}-${city.name}`}
            type="button"
            onClick={() => {
              onSelect(city)
              onClose()
            }}
            className="w-full flex items-center justify-between px-2.5 py-1.5 text-left text-xs transition-colors hover:bg-neutral-100 dark:hover:bg-neutral-800 group"
          >
            <div className="flex flex-col">
              <span className="font-medium text-neutral-900 dark:text-neutral-100 group-hover:underline">
                {city.name}
              </span>
              <span className="font-mono text-[10px] text-neutral-500">{city.country}</span>
            </div>
            <span className={`font-mono text-[10px] px-1.5 py-0.5 font-semibold ${riskBadgeClasses(city.risk_level)}`}>
              {city.risk_level}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}

function HotspotPanel({ hotspots, onSelect }) {
  const [isOpen, setIsOpen] = useState(false)
  const panelRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }
    document.addEventListener('pointerdown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [])

  return (
    <div className="relative inline-block" ref={panelRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 py-4 font-mono text-xs uppercase tracking-wider transition-colors ${
          isOpen
            ? 'text-neutral-900 dark:text-white font-bold'
            : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
        }`}
        aria-expanded={isOpen}
      >
        <span>Watchlist</span>
        <ChevronDown size={12} className={`transition-transform duration-150 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 sm:left-0 sm:right-auto top-full mt-1 w-72 sm:w-80 max-h-[75vh] overflow-y-auto p-3 bg-white dark:bg-[#121212] border border-neutral-300 dark:border-neutral-700 shadow-2xl z-50 space-y-3">
          <div className="border-b border-neutral-200 dark:border-neutral-800 pb-2 flex items-center justify-between">
            <span className="font-mono text-[10px] uppercase tracking-wider text-neutral-500 font-bold">
              India High-Risk Watchlist
            </span>
            <span className="font-mono text-[10px] text-neutral-400">
              Click to load
            </span>
          </div>
          <HotspotGroup title="Flood" cities={hotspots.flood} onSelect={onSelect} onClose={() => setIsOpen(false)} />
          <HotspotGroup title="Earthquake" cities={hotspots.earthquake} onSelect={onSelect} onClose={() => setIsOpen(false)} />
          <HotspotGroup title="Wildfire" cities={hotspots.wildfire} onSelect={onSelect} onClose={() => setIsOpen(false)} />
        </div>
      )}
    </div>
  )
}

export function Header({
  page,
  onNavigate,
  message,
  location,
  onSyncGps,
  hotspots,
  onSelectHotspot,
  theme,
  onToggleTheme,
}) {
  return (
    <header className="sticky top-0 z-40 w-full bg-white dark:bg-[#000000] border-b border-neutral-200 dark:border-[#1e1e1e]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Brand Box Logo */}
          <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
            <button
              type="button"
              onClick={() => onNavigate('home')}
              className="flex items-center gap-3 text-left focus:outline-none group"
            >
              <div className="px-2.5 py-1 bg-black text-white dark:bg-white dark:text-black font-mono font-bold text-xs tracking-wider">
                RR
              </div>
              <div className="flex flex-col">
                <span className="font-serif font-bold text-lg tracking-tight text-neutral-900 dark:text-white leading-none">
                  RiskRadar
                </span>
                <span className="font-mono text-[9px] uppercase tracking-widest text-neutral-500 dark:text-neutral-400 mt-0.5">
                  Disaster Monitor
                </span>
              </div>
            </button>

            {/* Live Location Pill */}
            {location && (
              <button
                type="button"
                onClick={onSyncGps}
                title="Active target location. Click to sync GPS."
                className="flex items-center gap-2 px-2.5 py-1 bg-neutral-100 dark:bg-[#0f0f0f] border border-neutral-200 dark:border-[#222222] text-[11px] font-mono text-neutral-700 dark:text-neutral-300 hover:border-black dark:hover:border-white transition-colors"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse flex-shrink-0" />
                <span className="font-bold">{Number(location.latitude).toFixed(4)}°N, {Number(location.longitude).toFixed(4)}°E</span>
              </button>
            )}
          </div>

          {/* Underline Tabs Navigation */}
          <nav className="flex items-center gap-4 sm:gap-6">
            <button
              type="button"
              onClick={() => onNavigate('home')}
              className={`py-4 font-mono text-xs uppercase tracking-wider transition-all border-b-2 whitespace-nowrap ${
                page === 'home'
                  ? 'border-black dark:border-white text-neutral-900 dark:text-white font-bold'
                  : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              Dashboard
            </button>
            <button
              type="button"
              onClick={() => onNavigate('flood')}
              className={`py-4 font-mono text-xs uppercase tracking-wider transition-all border-b-2 whitespace-nowrap ${
                page === 'flood'
                  ? 'border-black dark:border-white text-neutral-900 dark:text-white font-bold'
                  : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              Flood Radar
            </button>
            <button
              type="button"
              onClick={() => onNavigate('earthquake')}
              className={`py-4 font-mono text-xs uppercase tracking-wider transition-all border-b-2 whitespace-nowrap ${
                page === 'earthquake'
                  ? 'border-black dark:border-white text-neutral-900 dark:text-white font-bold'
                  : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              Seismic Seq
            </button>
            <button
              type="button"
              onClick={() => onNavigate('wildfire')}
              className={`py-4 font-mono text-xs uppercase tracking-wider transition-all border-b-2 whitespace-nowrap ${
                page === 'wildfire'
                  ? 'border-black dark:border-white text-neutral-900 dark:text-white font-bold'
                  : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
              }`}
            >
              Wildfire
            </button>

            <HotspotPanel hotspots={hotspots} onSelect={onSelectHotspot} />
          </nav>

          {/* Right Controls */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              type="button"
              onClick={onToggleTheme}
              className="p-2 border border-neutral-200 dark:border-[#222222] text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-[#121212] transition-colors"
              aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              {theme === 'dark' ? <Sun size={15} /> : <MoonStar size={15} />}
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}

export function Footer() {
  return (
    <footer className="w-full border-t border-neutral-200 dark:border-[#1e1e1e] py-6 px-4 sm:px-6 lg:px-8 mt-auto bg-neutral-50 dark:bg-[#080808] text-xs font-mono text-neutral-500 dark:text-neutral-400">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Academic Disclaimer Callout */}
        <div className="p-3 bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 text-[11px] leading-relaxed flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-start gap-2">
            <span className="font-bold uppercase tracking-wider text-[10px] px-1.5 py-0.5 bg-amber-500/20 border border-amber-500/30 flex-shrink-0">
              Academic Prototype
            </span>
            <span>
              RiskRadar is an educational prototype combining open telemetry (Open-Meteo, USGS, NASA FIRMS) with machine learning models. It is <strong>not</strong> an official government warning or emergency dispatch system. For life safety and active alerts, always follow <strong>NDMA, IMD, or local civil defense directives</strong>.
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2 border-t border-neutral-200 dark:border-[#1a1a1a]">
          <div className="flex items-center gap-2">
            <span className="px-1.5 py-0.5 bg-neutral-200 dark:bg-neutral-800 text-[10px] text-neutral-700 dark:text-neutral-300 font-bold">
              RISK RADAR
            </span>
            <span>Multi-Hazard Academic Research Platform</span>
          </div>
          <div className="text-[11px] text-neutral-500 dark:text-neutral-500">
            <span>Telemetry: Sentinel-1 SAR (ESA) • NASA FIRMS VIIRS • USGS Earthquake Hazards • Open-Meteo</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
