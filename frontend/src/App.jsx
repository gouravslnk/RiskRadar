import { useEffect, useState } from 'react'
import 'leaflet/dist/leaflet.css'

import { AnalysisPage } from './components/AnalysisPage'
import { Header, Footer } from './components/Header'
import { HomePage } from './components/HomePage'
import { fallbackHotspots, titleFor } from './components/shared'

const API_BASE = import.meta.env.VITE_API_BASE ?? 'http://127.0.0.1:8000'

const defaultLocation = {
  latitude: 26.1445,
  longitude: 91.7362,
  depth: 18,
  cityName: 'Guwahati, Assam',
}

const earthquakeDefaultLocation = {
  latitude: 27.7172,
  longitude: 85.324,
  depth: 18,
  cityName: 'Kathmandu, Nepal',
}

function App() {
  const [page, setPage] = useState('home')
  const [location, setLocation] = useState(defaultLocation)
  const [flood, setFlood] = useState(null)
  const [earthquake, setEarthquake] = useState(null)
  const [wildfire, setWildfire] = useState(null)
  const [dominantDisaster, setDominantDisaster] = useState(null)
  const [routes, setRoutes] = useState({ flood: null, earthquake: null, wildfire: null, dominant: null })
  const [hotspots, setHotspots] = useState({ flood: [], earthquake: [], wildfire: [] })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('System Online')
  const [theme, setTheme] = useState('dark')

  const activeResult = page === 'flood' ? flood : page === 'earthquake' ? earthquake : wildfire

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  useEffect(() => {
    loadHotspots()
    analyzeAll(defaultLocation)
  }, [])

  async function loadHotspots() {
    try {
      const response = await fetch(`${API_BASE}/api/hotspots`)
      if (!response.ok) throw new Error('Hotspot API failed')
      setHotspots(await response.json())
    } catch {
      setHotspots({
        flood: fallbackHotspots.flood,
        earthquake: fallbackHotspots.earthquake,
        wildfire: fallbackHotspots.wildfire,
      })
    }
  }

  async function openHotspot(city) {
    const next = {
      latitude: city.latitude,
      longitude: city.longitude,
      depth: city.depth ?? location.depth,
    }
    setLocation(next)
    await openAnalysis(city.disaster, next)
  }

  async function reverseGeocodeCoords(lat, lon) {
    try {
      const res = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=en`
      )
      if (res.ok) {
        const data = await res.json()
        const city = data.city || data.locality || data.principalSubdivision || ''
        const state = data.principalSubdivision || data.countryName || ''
        if (city && state && city !== state) return `${city}, ${state}`
        if (city) return city
      }
    } catch {}
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json`
      )
      if (res.ok) {
        const data = await res.json()
        const addr = data.address || {}
        const city = addr.city || addr.town || addr.village || addr.suburb || addr.county || ''
        const state = addr.state || ''
        if (city && state) return `${city}, ${state}`
        if (city) return city
      }
    } catch {}
    return `Live Location (${lat.toFixed(4)}°N, ${lon.toFixed(4)}°E)`
  }

  async function fetchIpLocation() {
    try {
      const res = await fetch('https://ipapi.co/json/')
      if (res.ok) {
        const data = await res.json()
        if (data.latitude && data.longitude) {
          const name = data.city
            ? `${data.city}, ${data.region || data.country_name}`
            : 'IP Detected Location'
          return {
            latitude: Number(Number(data.latitude).toFixed(4)),
            longitude: Number(Number(data.longitude).toFixed(4)),
            cityName: name,
          }
        }
      }
    } catch {}
    try {
      const res = await fetch('https://ipwho.is/')
      if (res.ok) {
        const data = await res.json()
        if (data.success && data.latitude && data.longitude) {
          const name = data.city
            ? `${data.city}, ${data.region || data.country}`
            : 'IP Detected Location'
          return {
            latitude: Number(Number(data.latitude).toFixed(4)),
            longitude: Number(Number(data.longitude).toFixed(4)),
            cityName: name,
          }
        }
      }
    } catch {}
    return null
  }

  async function applyDetectedLocation(lat, lon, knownCityName, nextPage) {
    let resolvedName = knownCityName
    if (!resolvedName) {
      resolvedName = await reverseGeocodeCoords(lat, lon)
    }
    const next = {
      ...location,
      latitude: Number(Number(lat).toFixed(4)),
      longitude: Number(Number(lon).toFixed(4)),
      cityName: resolvedName,
    }
    setLocation(next)
    setLoading(false)
    setMessage(`GPS Locked: ${resolvedName}`)

    if (nextPage === 'flood' || nextPage === 'earthquake' || nextPage === 'wildfire') {
      openAnalysis(nextPage, next)
    } else {
      analyzeAll(next)
    }
  }

  async function useLiveLocation(nextPage = page) {
    setLoading(true)
    setMessage('Acquiring location...')

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude
          const lon = position.coords.longitude
          await applyDetectedLocation(lat, lon, null, nextPage)
        },
        async (err) => {
          console.warn('Browser geolocation failed, trying IP fallback:', err)
          setMessage('GPS unavailable on device, querying network IP location...')
          const ipLoc = await fetchIpLocation()
          if (ipLoc) {
            await applyDetectedLocation(ipLoc.latitude, ipLoc.longitude, ipLoc.cityName, nextPage)
          } else {
            setLoading(false)
            setMessage(
              err.code === 1
                ? 'Location permission denied by browser. Please enter your city.'
                : 'Unable to detect location. Please search for your city or state.'
            )
          }
        },
        { enableHighAccuracy: false, timeout: 7000, maximumAge: 180000 },
      )
    } else {
      const ipLoc = await fetchIpLocation()
      if (ipLoc) {
        await applyDetectedLocation(ipLoc.latitude, ipLoc.longitude, ipLoc.cityName, nextPage)
      } else {
        setLoading(false)
        setMessage('Geolocation unavailable')
      }
    }
  }

  async function analyzeAll(nextLocation = location) {
    setLoading(true)
    setMessage('Scanning all hazards...')
    try {
      const response = await fetch(`${API_BASE}/api/hazards/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          latitude: Number(nextLocation.latitude),
          longitude: Number(nextLocation.longitude),
          depth: Number(nextLocation.depth ?? 18),
        }),
      })
      if (!response.ok) throw new Error('Multi-hazard analysis failed.')
      const data = await response.json()
      setFlood(data.flood)
      setEarthquake(data.earthquake)
      setWildfire(data.wildfire)
      setDominantDisaster(data.dominant_disaster)
      setRoutes((current) => ({
        ...current,
        [data.dominant_disaster]: data.route,
        dominant: data.route,
      }))
      setMessage(`Multi-hazard scan complete for ${Number(nextLocation.latitude).toFixed(2)}°N, ${Number(nextLocation.longitude).toFixed(2)}°E`)
    } catch (error) {
      setMessage(error.message)
    } finally {
      setLoading(false)
    }
  }

  async function openAnalysis(kind, nextLocation = location) {
    if (
      kind === 'earthquake' &&
      nextLocation.latitude === defaultLocation.latitude &&
      nextLocation.longitude === defaultLocation.longitude &&
      nextLocation.depth === defaultLocation.depth
    ) {
      nextLocation = earthquakeDefaultLocation
      setLocation(nextLocation)
    }
    setPage(kind)
    await analyze(kind, nextLocation)
  }

  async function analyze(kind = page, nextLocation = location) {
    if (kind !== 'flood' && kind !== 'earthquake' && kind !== 'wildfire') return
    setLoading(true)
    setMessage(`Analyzing ${kind} risk...`)

    try {
      const endpoint =
        kind === 'flood' ? '/api/flood/location' : kind === 'earthquake' ? '/api/earthquake/predict' : '/api/wildfire/predict'
      const body =
        kind === 'flood'
          ? { latitude: Number(nextLocation.latitude), longitude: Number(nextLocation.longitude) }
          : kind === 'earthquake'
            ? {
                latitude: Number(nextLocation.latitude),
                longitude: Number(nextLocation.longitude),
                depth: Number(nextLocation.depth),
              }
            : { latitude: Number(nextLocation.latitude), longitude: Number(nextLocation.longitude) }

      const response = await fetch(`${API_BASE}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (!response.ok) throw new Error('API request failed. Make sure FastAPI is running.')
      const data = await response.json()
      if (kind === 'flood') setFlood(data)
      if (kind === 'earthquake') setEarthquake(data)
      if (kind === 'wildfire') setWildfire(data)
      if (data.risk_level === 'High') {
        await loadSafestRoute(kind, nextLocation)
      } else {
        setRoutes((current) => ({ ...current, [kind]: null }))
      }
      setMessage(`${titleFor(kind)} active`)
    } catch (error) {
      setMessage(error.message)
    } finally {
      setLoading(false)
    }
  }

  async function loadSafestRoute(kind, nextLocation) {
    try {
      const response = await fetch(`${API_BASE}/api/route/safest`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          disaster: kind,
          latitude: Number(nextLocation.latitude),
          longitude: Number(nextLocation.longitude),
          depth: Number(nextLocation.depth),
        }),
      })
      if (!response.ok) throw new Error('Route API request failed')
      const data = await response.json()
      setRoutes((current) => ({ ...current, [kind]: data }))
    } catch {
      setRoutes((current) => ({ ...current, [kind]: null }))
    }
  }

  function handleNavClick(nextPage) {
    if (nextPage === 'home') {
      setPage('home')
    } else {
      openAnalysis(nextPage, location)
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#ffffff] dark:bg-[#000000] text-neutral-900 dark:text-neutral-100 transition-colors duration-150">
      <Header
        page={page}
        onNavigate={handleNavClick}
        message={message}
        location={location}
        onSyncGps={() => useLiveLocation(page)}
        hotspots={hotspots}
        onSelectHotspot={openHotspot}
        theme={theme}
        onToggleTheme={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      />

      <main className="flex-1 w-full">
        {page === 'home' && (
          <HomePage
            location={location}
            setLocation={setLocation}
            flood={flood}
            earthquake={earthquake}
            wildfire={wildfire}
            dominantDisaster={dominantDisaster}
            route={routes.dominant ?? routes.flood ?? routes.earthquake ?? routes.wildfire}
            loading={loading}
            onUseLocation={() => useLiveLocation('home')}
            onAnalyzeAll={() => analyzeAll(location)}
            onSelectLocation={(next) => {
              setLocation(next)
              analyzeAll(next)
            }}
            onOpenFlood={() => openAnalysis('flood')}
            onOpenEarthquake={() => openAnalysis('earthquake')}
            onOpenWildfire={() => openAnalysis('wildfire')}
            onOpenAnalysis={openAnalysis}
            onLiveFlood={() => useLiveLocation('flood')}
            onLiveEarthquake={() => useLiveLocation('earthquake')}
            onLiveWildfire={() => useLiveLocation('wildfire')}
          />
        )}

        {(page === 'flood' || page === 'earthquake' || page === 'wildfire') && (
          <AnalysisPage
            kind={page}
            location={location}
            setLocation={setLocation}
            result={activeResult}
            route={routes[page]}
            loading={loading}
            onBack={() => setPage('home')}
            onAnalyze={(nextLoc) => analyze(page, nextLoc ?? location)}
            onUseLocation={() => useLiveLocation(page)}
          />
        )}
      </main>

      <Footer />
    </div>
  )
}

export default App
