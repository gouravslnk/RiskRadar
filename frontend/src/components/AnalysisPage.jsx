import { useEffect, useMemo, useState } from 'react'
import { Circle, CircleMarker, MapContainer, Polyline, TileLayer, useMap } from 'react-leaflet'
import { AlertTriangle, ArrowLeft, Compass, Flame, LocateFixed, Minus, Navigation, Plus, RefreshCw, ShieldAlert, Sliders, Waves, Zap } from 'lucide-react'

import { LocationPanel } from './HomePage'
import { riskBadgeClasses, riskColor, titleFor } from './shared'

function InfoHeader({ title, subtitle }) {
  return (
    <div className="border-b border-neutral-200 dark:border-[#1e1e1e] pb-3">
      <h3 className="font-serif font-bold text-lg text-neutral-900 dark:text-white">
        {title}
      </h3>
      {subtitle && (
        <p className="font-mono text-xs text-neutral-500 mt-1 leading-relaxed">
          {subtitle}
        </p>
      )}
    </div>
  )
}

function InfoRow({ label, value, highlight = false, alert = false }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-neutral-100 dark:border-[#171717] text-xs">
      <span className="font-mono text-neutral-500">{label}</span>
      <strong className={`font-mono ${
        alert
          ? 'text-rose-500 dark:text-rose-400 font-bold'
          : highlight
          ? 'text-neutral-900 dark:text-white font-bold'
          : 'text-neutral-800 dark:text-neutral-200'
      }`}>
        {value}
      </strong>
    </div>
  )
}

function StepList({ route }) {
  if (!route?.needed || !route.steps?.length) return null
  return (
    <div className="mt-4 pt-3 border-t border-neutral-200 dark:border-[#1e1e1e] space-y-2">
      <div className="flex items-center gap-1.5 font-mono text-[11px] uppercase font-bold text-emerald-600 dark:text-emerald-400">
        <Navigation size={13} />
        <span>Turn-by-Turn Evacuation Steps</span>
      </div>
      <div className="max-h-48 overflow-y-auto space-y-1 pr-1 font-mono text-xs">
        {route.steps.map((step, index) => (
          <div
            key={`${step.instruction}-${index}`}
            className="flex items-center justify-between p-2 bg-neutral-50 dark:bg-[#141414] border border-neutral-200 dark:border-[#222222] text-[11px]"
          >
            <span className="text-neutral-700 dark:text-neutral-300 pr-2">
              <span className="font-bold mr-1.5">{index + 1}.</span>
              {step.instruction}
            </span>
            <span className="text-neutral-500 flex-shrink-0 font-semibold">
              {step.distance_m}m
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function InfoPanel({ kind, result, route }) {
  if (!result) {
    return (
      <div className="p-5 bg-white dark:bg-[#0c0c0c] border border-neutral-200 dark:border-[#1e1e1e] space-y-3">
        <InfoHeader
          title="Telemetry Feed"
          subtitle="Click Re-analyze to run the model pipeline."
        />
        <div className="py-8 text-center font-mono text-xs text-neutral-400">
          Awaiting coordinate analysis...
        </div>
      </div>
    )
  }

  if (kind === 'flood') {
    return (
      <div className="p-5 bg-white dark:bg-[#0c0c0c] border border-neutral-200 dark:border-[#1e1e1e] space-y-3">
        <InfoHeader
          title="Flood Hydrological Telemetry"
          subtitle={result.advice}
        />
        <div className="space-y-0.5">
          <InfoRow label="Precipitation & Basin Score" value={`${result.risk_percent}% (${result.risk_level})`} alert={result.risk_level === 'High'} />
          <InfoRow label="Precipitation Now" value={`${result.weather.rain_now_mm} mm/hr`} highlight />
          <InfoRow label="24h Accumulated Rain" value={`${result.weather.rain_24h_mm} mm`} />
          <InfoRow label="72h Forecast Rain" value={`${result.weather.rain_72h_mm} mm`} />
          <InfoRow label="Nearest Sensitive Basin" value={result.nearest_sensitive_region} />
          <InfoRow label="Offline SAR Model Checkpoint" value={result.model_status.checkpoint_exists ? 'Available (services/flood/model/best_unet.pt)' : 'Missing'} />
          <InfoRow label="Trained SAR Best IoU" value={result.model_status.trained_best_iou?.toFixed(3) ?? '--'} />
          <InfoRow label="Evacuation Path" value={route?.needed ? route.end_risk_level : 'Safe (Not needed)'} />
        </div>
        <div className="p-2.5 bg-neutral-50 dark:bg-[#141414] border border-neutral-200 dark:border-[#222222] font-mono text-[10px] text-neutral-500 leading-normal">
          <strong>Academic Note:</strong> Real-time coordinate risk is driven by Open-Meteo precipitation telemetry and drainage basin vulnerability. The PyTorch U-Net checkpoint is an offline model for Sentinel-1 SAR satellite imagery chips.
        </div>
        <StepList route={route} />
      </div>
    )
  }

  if (kind === 'wildfire') {
    return (
      <div className="p-5 bg-white dark:bg-[#0c0c0c] border border-neutral-200 dark:border-[#1e1e1e] space-y-3">
        <InfoHeader
          title="Wildfire Thermal Telemetry"
          subtitle={result.advice}
        />
        <div className="space-y-0.5">
          <InfoRow label="Next-Day Fire Risk" value={`${result.risk_percent}% (${result.risk_level})`} alert={result.risk_level === 'High'} />
          <InfoRow label="0.1° Grid Bounding Box" value={`${result.lat_bin}°N, ${result.lon_bin}°E`} />
          <InfoRow label="Recent Fire Detections" value={`${result.recent_fire_days} days`} />
          <InfoRow label="Mean FRP" value={`${result.mean_frp} MW`} highlight />
          <InfoRow label="Seasonal Vulnerability" value={`${result.seasonal_factor}`} />
          <InfoRow label="Forest Belt Proximity" value={result.nearest_fire_region} />
          <InfoRow label="XGBoost Pipeline" value={String(result.model_status).startsWith('loaded') ? 'Active (v1.0)' : 'Fallback'} />
          <InfoRow label="Evacuation Path" value={route?.needed ? route.end_risk_level : 'Safe (Not needed)'} />
        </div>
        <div className="p-2.5 bg-neutral-50 dark:bg-[#141414] border border-neutral-200 dark:border-[#222222] font-mono text-[10px] text-neutral-500 leading-normal">
          <strong>Academic Note:</strong> Thermal probability is evaluated by XGBoost using recent NASA VIIRS thermal anomaly passes, cell history, and seasonal climatology.
        </div>
        <StepList route={route} />
      </div>
    )
  }

  return (
    <div className="p-5 bg-white dark:bg-[#0c0c0c] border border-neutral-200 dark:border-[#1e1e1e] space-y-3">
      <InfoHeader
        title="Seismic Sequence Telemetry"
        subtitle={result.note}
      />
      <div className="space-y-0.5">
        <InfoRow label="Sequence Magnitude Baseline" value={`M ${result.predicted_magnitude}`} alert={Number(result.predicted_magnitude) >= 5.0} highlight />
        <InfoRow label="Seismic Risk Score" value={`${result.risk_percent}% (${result.risk_level})`} />
        <InfoRow label="Hypocenter Depth" value={`${result.depth_km} km`} />
        <InfoRow label="Seismic Tectonic Zone" value={result.seismic_zone ?? 'Himalayan Arc / General'} />
        <InfoRow label="Telemetry Data Source" value={result.data_source ?? 'USGS Live Stream'} />
        <InfoRow label="LSTM Model Status" value={result.model_status === 'loaded' ? 'Active (Keras H5)' : 'Fallback'} />
        <InfoRow label="Processed Sequence Events" value={`${result.data_points} tremors`} />
        <InfoRow label="Evacuation Path" value={route?.needed ? route.end_risk_level : 'Safe (Not needed)'} />
      </div>
      <div className="p-2.5 bg-neutral-50 dark:bg-[#141414] border border-neutral-200 dark:border-[#222222] font-mono text-[10px] text-neutral-500 leading-normal">
        <strong>Academic Note:</strong> Seismic risk is calculated from empirical tectonic fault zone vulnerability and hypocenter depth. The magnitude baseline reflects recent sequence patterns rather than a deterministic earthquake forecast.
      </div>
      <StepList route={route} />
    </div>
  )
}

function RecenterMap({ center }) {
  const map = useMap()
  useEffect(() => {
    map.invalidateSize()
    map.setView(center, map.getZoom(), { animate: true })
  }, [center, map])
  return null
}

function RiskMap({ location, level, route, radiusKm = 8.5 }) {
  const latitude = Number(location.latitude)
  const longitude = Number(location.longitude)
  const center = useMemo(() => [latitude, longitude], [latitude, longitude])
  const color = riskColor(level)

  return (
    <MapContainer
      center={center}
      zoom={11}
      minZoom={3}
      maxZoom={18}
      scrollWheelZoom
      className="leaflet-map w-full h-full"
    >
      <TileLayer
        attribution='&copy; <a href="https://carto.com/">CARTO</a> &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png?key=cb1_3wpb_1_62b99d51af1434ef9092c819"
      />
      <RecenterMap center={center} />
      <Circle
        center={center}
        radius={radiusKm * 1000}
        pathOptions={{
          color,
          fillColor: color,
          fillOpacity: 0.28,
          weight: 2,
        }}
      />
      <CircleMarker
        center={center}
        radius={8}
        pathOptions={{
          color: '#ffffff',
          fillColor: color,
          fillOpacity: 1,
          weight: 2,
        }}
      />
      {route?.needed && route.path?.length > 1 && (
        <Polyline
          positions={route.path}
          pathOptions={{
            color: '#2563eb',
            weight: 5,
            opacity: 0.95,
          }}
        />
      )}
    </MapContainer>
  )
}

function RadiusControl({ radiusKm, setRadiusKm }) {
  const presets = [3, 5, 8.5, 15, 25, 50]

  return (
    <div className="absolute top-3 right-3 z-[400] bg-black/85 backdrop-blur-md text-white border border-neutral-700/80 p-2.5 font-mono text-xs shadow-2xl space-y-2">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 font-bold uppercase text-[10px] tracking-wider text-neutral-300">
          <Sliders size={12} className="text-emerald-400" />
          <span>Zone Radius:</span>
          <span className="text-white text-xs font-mono font-bold bg-neutral-800 px-1.5 py-0.5 border border-neutral-600">
            {radiusKm} km
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setRadiusKm((r) => Math.max(1, Number((r - 1).toFixed(1))))}
            title="Decrease radius by 1 km"
            className="w-5 h-5 flex items-center justify-center bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-600 active:scale-95 transition-all text-xs font-bold"
          >
            <Minus size={11} />
          </button>
          <button
            type="button"
            onClick={() => setRadiusKm((r) => Math.min(100, Number((r + 1).toFixed(1))))}
            title="Increase radius by 1 km"
            className="w-5 h-5 flex items-center justify-center bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-600 active:scale-95 transition-all text-xs font-bold"
          >
            <Plus size={11} />
          </button>
        </div>
      </div>

      <div className="pt-1.5 border-t border-neutral-800 space-y-2">
        <div className="flex items-center gap-2">
          <input
            type="range"
            min="1"
            max="50"
            step="0.5"
            value={radiusKm}
            onChange={(e) => setRadiusKm(Number(e.target.value))}
            className="w-36 sm:w-44 accent-emerald-500 cursor-pointer h-1.5 bg-neutral-700 rounded-lg"
          />
        </div>

        {/* Quick Presets */}
        <div className="flex items-center gap-1 flex-wrap">
          <span className="text-[9px] uppercase text-neutral-400 mr-0.5">Presets:</span>
          {presets.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setRadiusKm(p)}
              className={`px-1.5 py-0.5 text-[10px] font-mono border transition-all ${
                radiusKm === p
                  ? 'bg-emerald-500 text-black border-emerald-400 font-bold'
                  : 'bg-neutral-800/80 text-neutral-300 border-neutral-700 hover:bg-neutral-700 hover:text-white'
              }`}
            >
              {p}k
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

export function AnalysisPage({
  kind,
  location,
  setLocation,
  result,
  route,
  loading,
  onBack,
  onAnalyze,
  onUseLocation,
}) {
  const title = titleFor(kind)
  const metric =
    kind === 'flood'
      ? `${result?.risk_percent ?? '--'}%`
      : kind === 'earthquake'
      ? result
        ? `M ${result.predicted_magnitude}`
        : '--'
      : `${result?.risk_percent ?? '--'}%`
  const level = result?.risk_level ?? 'Waiting'
  const [radiusKm, setRadiusKm] = useState(8.5)

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Breadcrumb & Heading Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 dark:border-[#1e1e1e] pb-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="px-3 py-1.5 border border-neutral-300 dark:border-[#2a2a2a] text-neutral-800 dark:text-neutral-200 font-mono text-xs uppercase hover:bg-neutral-100 dark:hover:bg-[#171717] transition-all flex items-center gap-1.5"
          >
            <ArrowLeft size={13} />
            <span>Dashboard</span>
          </button>
          <div>
            <span className="font-mono text-[10px] uppercase tracking-wider text-neutral-400 block">
              {title} // Regional Radar Map
            </span>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white leading-tight">
              {title} & Telemetry
            </h1>
          </div>
        </div>
      </div>

      {/* Top 2-Column Summary Strip */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-5 bg-white dark:bg-[#0c0c0c] p-5 border border-neutral-200 dark:border-[#1e1e1e]">
          <LocationPanel
            location={location}
            setLocation={setLocation}
            onSelectLocation={(next) => onAnalyze(next)}
            onAnalyze={(next) => onAnalyze(next ?? location)}
            onUseLocation={onUseLocation}
            loading={loading}
            compact
          />
        </div>

        <div className="lg:col-span-7 p-6 bg-white dark:bg-[#0c0c0c] border border-neutral-200 dark:border-[#1e1e1e] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
          <div className="space-y-1">
            <span className="font-mono text-[11px] uppercase tracking-wider text-neutral-500 font-bold block">
              {title} Output Score
            </span>
            <div className="font-serif text-4xl sm:text-5xl font-bold text-neutral-900 dark:text-white">
              {metric}
            </div>
            <p className="font-mono text-xs text-neutral-500">
              {kind === 'flood' ? 'Open-Meteo Telemetry + Drainage Basin Model' : kind === 'earthquake' ? 'Tectonic Fault Prior + USGS Sequence Baseline' : 'NASA VIIRS 375m + XGBoost Classifier'}
            </p>
          </div>

          <div className="flex flex-col items-start sm:items-end gap-2">
            <span className={`font-mono text-xs px-3 py-1 font-bold ${riskBadgeClasses(level)}`}>
              {level} Risk Zone
            </span>
            {route?.needed && (
              <span className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400">
                ● Safest Evacuation Exit Active
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Map and Telemetry Info Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Map Card */}
        <div className="lg:col-span-7 h-[460px] sm:h-[520px] border border-neutral-200 dark:border-[#1e1e1e] relative overflow-hidden bg-neutral-900">
          <RiskMap location={location} level={level} route={route} radiusKm={radiusKm} />
          <RadiusControl radiusKm={radiusKm} setRadiusKm={setRadiusKm} />
          <div className="absolute bottom-3 left-3 right-3 z-[400] flex items-center justify-between p-2.5 bg-black/90 text-white font-mono text-xs border border-neutral-700">
            <div className="flex items-center gap-1.5">
              <Compass size={13} />
              <span>{Number(location.latitude).toFixed(4)}°N, {Number(location.longitude).toFixed(4)}°E</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="uppercase text-[11px] font-bold">
                {level} Risk Radius ({radiusKm} km)
              </span>
            </div>
          </div>
        </div>

        {/* Right Intelligence Panel */}
        <div className="lg:col-span-5 space-y-4">
          <InfoPanel kind={kind} result={result} route={route} />
        </div>
      </div>
    </div>
  )
}
