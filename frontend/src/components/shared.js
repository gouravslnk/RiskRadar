export function titleFor(kind) {
  if (kind === 'flood') return 'Flood Analysis'
  if (kind === 'earthquake') return 'Earthquake Analysis'
  return 'Wildfire Analysis'
}

export function riskClass(level) {
  const value = String(level).toLowerCase()
  if (value.includes('high')) return 'high'
  if (value.includes('moderate')) return 'moderate'
  if (value.includes('low')) return 'low'
  return 'waiting'
}

export function riskColor(level) {
  const norm = riskClass(level)
  if (norm === 'high') return '#ef4444' // Rose / Red
  if (norm === 'moderate') return '#f59e0b' // Amber
  if (norm === 'low') return '#10b981' // Emerald
  return '#94a3b8' // Slate
}

export function riskBadgeClasses(level) {
  const norm = riskClass(level)
  if (norm === 'high') {
    return 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/30'
  }
  if (norm === 'moderate') {
    return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30'
  }
  if (norm === 'low') {
    return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30'
  }
  return 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border border-slate-500/30'
}

export const INDIAN_STATES_AND_REGIONS = [
  { name: 'Assam', type: 'State', capital: 'Dispur / Guwahati', lat: 26.2006, lon: 92.9376, depth: 18, aliases: ['asom'] },
  { name: 'Odisha', type: 'State', capital: 'Bhubaneswar', lat: 20.9517, lon: 85.0985, depth: 18, aliases: ['orissa'] },
  { name: 'Maharashtra', type: 'State', capital: 'Mumbai / Pune', lat: 19.7515, lon: 75.7139, depth: 18, aliases: ['mh'] },
  { name: 'Kerala', type: 'State', capital: 'Thiruvananthapuram / Kochi', lat: 10.8505, lon: 76.2711, depth: 18, aliases: ['kl'] },
  { name: 'Bihar', type: 'State', capital: 'Patna', lat: 25.0961, lon: 85.3131, depth: 18, aliases: ['br'] },
  { name: 'Gujarat', type: 'State', capital: 'Gandhinagar / Ahmedabad', lat: 22.2587, lon: 71.1924, depth: 16, aliases: ['gj'] },
  { name: 'Uttarakhand', type: 'State', capital: 'Dehradun', lat: 30.0668, lon: 79.0193, depth: 18, aliases: ['uttaranchal', 'uk'] },
  { name: 'Himachal Pradesh', type: 'State', capital: 'Shimla', lat: 31.1048, lon: 77.1734, depth: 18, aliases: ['himachal', 'hp'] },
  { name: 'Jammu and Kashmir', type: 'UT', capital: 'Srinagar / Jammu', lat: 33.7782, lon: 76.5762, depth: 15, aliases: ['j&k', 'jk', 'kashmir'] },
  { name: 'Ladakh', type: 'UT', capital: 'Leh', lat: 34.1526, lon: 77.5771, depth: 15, aliases: [] },
  { name: 'West Bengal', type: 'State', capital: 'Kolkata', lat: 22.9868, lon: 87.8550, depth: 18, aliases: ['bengal', 'wb'] },
  { name: 'Punjab', type: 'State', capital: 'Chandigarh / Amritsar', lat: 31.1471, lon: 75.3412, depth: 18, aliases: ['pb'] },
  { name: 'Haryana', type: 'State', capital: 'Chandigarh / Gurugram', lat: 29.0588, lon: 76.0856, depth: 18, aliases: ['hr'] },
  { name: 'Delhi / NCR', type: 'UT', capital: 'New Delhi', lat: 28.6139, lon: 77.2090, depth: 18, aliases: ['delhi', 'ncr'] },
  { name: 'Rajasthan', type: 'State', capital: 'Jaipur', lat: 27.0238, lon: 74.2179, depth: 18, aliases: ['rj'] },
  { name: 'Uttar Pradesh', type: 'State', capital: 'Lucknow', lat: 26.8467, lon: 80.9462, depth: 18, aliases: ['up'] },
  { name: 'Madhya Pradesh', type: 'State', capital: 'Bhopal / Indore', lat: 22.9734, lon: 78.6569, depth: 18, aliases: ['mp'] },
  { name: 'Karnataka', type: 'State', capital: 'Bengaluru', lat: 15.3173, lon: 75.7139, depth: 18, aliases: ['ka'] },
  { name: 'Tamil Nadu', type: 'State', capital: 'Chennai', lat: 11.1271, lon: 78.6569, depth: 18, aliases: ['tn'] },
  { name: 'Telangana', type: 'State', capital: 'Hyderabad', lat: 18.1124, lon: 79.0193, depth: 18, aliases: ['ts', 'tg'] },
  { name: 'Andhra Pradesh', type: 'State', capital: 'Amaravati / Visakhapatnam', lat: 15.9129, lon: 79.7400, depth: 18, aliases: ['ap'] },
  { name: 'Chhattisgarh', type: 'State', capital: 'Raipur', lat: 21.2787, lon: 81.8661, depth: 18, aliases: ['cg'] },
  { name: 'Jharkhand', type: 'State', capital: 'Ranchi', lat: 23.6102, lon: 85.2799, depth: 18, aliases: ['jh'] },
  { name: 'Goa', type: 'State', capital: 'Panaji', lat: 15.2993, lon: 74.1240, depth: 18, aliases: [] },
  { name: 'Sikkim', type: 'State', capital: 'Gangtok', lat: 27.5330, lon: 88.5122, depth: 18, aliases: ['sk'] },
  { name: 'Arunachal Pradesh', type: 'State', capital: 'Itanagar', lat: 27.0844, lon: 93.6053, depth: 18, aliases: ['arunachal'] },
  { name: 'Manipur', type: 'State', capital: 'Imphal', lat: 24.6637, lon: 93.9063, depth: 18, aliases: ['mn'] },
  { name: 'Meghalaya', type: 'State', capital: 'Shillong', lat: 25.4670, lon: 91.3662, depth: 18, aliases: ['ml'] },
  { name: 'Mizoram', type: 'State', capital: 'Aizawl', lat: 23.1645, lon: 92.9376, depth: 18, aliases: ['mz'] },
  { name: 'Nagaland', type: 'State', capital: 'Kohima', lat: 26.1584, lon: 94.5624, depth: 18, aliases: ['nl'] },
  { name: 'Tripura', type: 'State', capital: 'Agartala', lat: 23.9408, lon: 91.9882, depth: 18, aliases: ['tr'] },
  { name: 'Chandigarh', type: 'UT', capital: 'Chandigarh', lat: 30.7333, lon: 76.7794, depth: 18, aliases: [] },
  { name: 'Puducherry', type: 'UT', capital: 'Puducherry', lat: 11.9416, lon: 79.8083, depth: 18, aliases: ['pondicherry'] },
  { name: 'Andaman and Nicobar Islands', type: 'UT', capital: 'Port Blair', lat: 11.7401, lon: 92.6586, depth: 18, aliases: ['andaman', 'nicobar'] },
  { name: 'Dadra and Nagar Haveli and Daman and Diu', type: 'UT', capital: 'Daman', lat: 20.4283, lon: 72.8397, depth: 18, aliases: ['daman', 'diu'] },
  { name: 'Lakshadweep', type: 'UT', capital: 'Kavaratti', lat: 10.5667, lon: 72.6417, depth: 18, aliases: [] },
]

export const INDIAN_CITIES = [
  { name: 'Delhi / NCR', state: 'National Capital', lat: 28.6139, lon: 77.209, depth: 18 },
  { name: 'Guwahati', state: 'Assam (Brahmaputra)', lat: 26.1445, lon: 91.7362, depth: 18 },
  { name: 'Patna', state: 'Bihar (Ganga Basin)', lat: 25.5941, lon: 85.1376, depth: 18 },
  { name: 'Kolkata', state: 'West Bengal (Delta)', lat: 22.5726, lon: 88.3639, depth: 18 },
  { name: 'Mumbai', state: 'Maharashtra (Konkan)', lat: 19.076, lon: 72.8777, depth: 18 },
  { name: 'Srinagar', state: 'J&K (Seismic Zone V)', lat: 34.0837, lon: 74.7973, depth: 15 },
  { name: 'Shimla', state: 'Himachal (Forest Belt)', lat: 31.1048, lon: 77.1734, depth: 18 },
  { name: 'Dehradun', state: 'Uttarakhand (Foothills)', lat: 30.3165, lon: 78.0322, depth: 18 },
  { name: 'Kochi', state: 'Kerala (Coastal)', lat: 9.9312, lon: 76.2673, depth: 18 },
  { name: 'Bhuj', state: 'Gujarat (Seismic Zone V)', lat: 23.242, lon: 69.6669, depth: 16 },
  { name: 'Gangtok', state: 'Sikkim (Himalayan Arc)', lat: 27.3314, lon: 88.6138, depth: 18 },
  { name: 'Bengaluru', state: 'Karnataka', lat: 12.9716, lon: 77.5946, depth: 18 },
  { name: 'Chennai', state: 'Tamil Nadu (Coastal)', lat: 13.0827, lon: 80.2707, depth: 18 },
  { name: 'Hyderabad', state: 'Telangana', lat: 17.385, lon: 78.4867, depth: 18 },
  { name: 'Jaipur', state: 'Rajasthan', lat: 26.9124, lon: 75.7873, depth: 18 },
  { name: 'Lucknow', state: 'Uttar Pradesh', lat: 26.8467, lon: 80.9462, depth: 18 },
  { name: 'Bhubaneswar', state: 'Odisha (Coastal Belt)', lat: 20.2961, lon: 85.8245, depth: 18 },
  { name: 'Raipur', state: 'Chhattisgarh (Corridor)', lat: 21.2514, lon: 81.6296, depth: 18 },
  { name: 'Bhopal', state: 'Madhya Pradesh', lat: 23.2599, lon: 77.4126, depth: 18 },
  { name: 'Kathmandu', state: 'Nepal (Himalayan Arc)', lat: 27.7172, lon: 85.324, depth: 12 },
]

export const fallbackHotspots = {
  flood: [
    { name: 'Guwahati', country: 'Assam, India', disaster: 'flood', latitude: 26.1445, longitude: 91.7362, depth: 18, risk_level: 'High', risk_score: 0.82, risk_percent: 82 },
    { name: 'Patna', country: 'Bihar, India', disaster: 'flood', latitude: 25.5941, longitude: 85.1376, depth: 18, risk_level: 'High', risk_score: 0.78, risk_percent: 78 },
    { name: 'Kolkata', country: 'West Bengal, India', disaster: 'flood', latitude: 22.5726, longitude: 88.3639, depth: 18, risk_level: 'Moderate', risk_score: 0.61, risk_percent: 61 },
    { name: 'Kochi', country: 'Kerala, India', disaster: 'flood', latitude: 9.9312, longitude: 76.2673, depth: 18, risk_level: 'Moderate', risk_score: 0.54, risk_percent: 54 },
  ],
  earthquake: [
    { name: 'Srinagar', country: 'J&K, India', disaster: 'earthquake', latitude: 34.0837, longitude: 74.7973, depth: 15, risk_level: 'High', risk_score: 0.78, risk_percent: 78 },
    { name: 'Gangtok', country: 'Sikkim, India', disaster: 'earthquake', latitude: 27.3314, longitude: 88.6138, depth: 18, risk_level: 'High', risk_score: 0.75, risk_percent: 75 },
    { name: 'Bhuj', country: 'Gujarat, India', disaster: 'earthquake', latitude: 23.242, longitude: 69.6669, depth: 16, risk_level: 'High', risk_score: 0.72, risk_percent: 72 },
    { name: 'Kathmandu', country: 'Nepal (Himalayan Belt)', disaster: 'earthquake', latitude: 27.7172, longitude: 85.324, depth: 12, risk_level: 'High', risk_score: 0.82, risk_percent: 82 },
  ],
  wildfire: [
    { name: 'Dehradun', country: 'Uttarakhand, India', disaster: 'wildfire', latitude: 30.3165, longitude: 78.0322, depth: 18, risk_level: 'Moderate', risk_score: 0.42, risk_percent: 42 },
    { name: 'Shimla', country: 'Himachal, India', disaster: 'wildfire', latitude: 31.1048, longitude: 77.1734, depth: 18, risk_level: 'Moderate', risk_score: 0.38, risk_percent: 38 },
    { name: 'Koraput', country: 'Odisha, India', disaster: 'wildfire', latitude: 18.8135, longitude: 82.7123, depth: 18, risk_level: 'Low', risk_score: 0.24, risk_percent: 24 },
  ],
}
