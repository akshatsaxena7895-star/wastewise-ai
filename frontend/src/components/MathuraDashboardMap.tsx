import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { MapPin, Navigation, Maximize2, Layers, AlertCircle, Compass, Eye, EyeOff } from 'lucide-react';
import { MapBin, SimpleRoute } from '../types';

interface MathuraDashboardMapProps {
  bins: MapBin[];
  route?: SimpleRoute | null;
  onNavigateToFullMap: () => void;
}

const MATHURA_CENTER: [number, number] = [27.4924, 77.6737];

export const MATHURA_KEY_PLACES = [
  { name: 'Shri Krishna Janmabhoomi', tag: 'Janmabhoomi', icon: '🛕', lat: 27.5050, lng: 77.6690, color: '#f59e0b', desc: 'Birthplace of Lord Krishna & Sacred Temple Complex' },
  { name: 'Vishram Ghat Riverfront', tag: 'Vishram Ghat', icon: '🌊', lat: 27.5035, lng: 77.6845, color: '#06b6d4', desc: 'Central Yamuna Ghat & Evening Maha Aarti Plaza' },
  { name: 'Dwarkadhish Mandir', tag: 'Dwarkadhish', icon: '🛕', lat: 27.5042, lng: 77.6830, color: '#eab308', desc: 'Historic 1814 Vaishnava Heritage Shrine' },
  { name: 'Holi Gate Main Bazaar', tag: 'Holi Gate', icon: '⛩️', lat: 27.4975, lng: 77.6780, color: '#ec4899', desc: 'Historic Gateway & Commercial Marketplace' },
  { name: 'Krishna Nagar High Street', tag: 'Krishna Nagar', icon: '🛍️', lat: 27.5060, lng: 77.6580, color: '#10b981', desc: 'Prime Commercial District & Shopping Avenue' },
  { name: 'Mathura Junction Terminal', tag: 'Mathura Jn', icon: '🚉', lat: 27.4842, lng: 77.6740, color: '#8b5cf6', desc: 'Major North Central Railway Transit Hub' },
  { name: 'Dampier Nagar Civil Lines', tag: 'Dampier Nagar', icon: '🏛️', lat: 27.4950, lng: 77.6750, color: '#3b82f6', desc: 'Administrative & Municipal District' },
  { name: 'Mathura Oil Refinery (IOCL)', tag: 'IOCL Refinery', icon: '🛢️', lat: 27.4320, lng: 77.6950, color: '#f97316', desc: 'Indian Oil Corporation Industrial Township' },
  { name: 'Geeta Mandir / Birla Temple', tag: 'Birla Temple', icon: '🛕', lat: 27.5260, lng: 77.6750, color: '#14b8a6', desc: 'Vrindavan Road Sacred Marble Temple' },
  { name: 'Bhuteshwar Mahadev Chowk', tag: 'Bhuteshwar', icon: '🔱', lat: 27.5090, lng: 77.6650, color: '#a855f7', desc: 'Ancient Guardian Shiva Shrine & Junction' },
];

export const MathuraDashboardMap: React.FC<MathuraDashboardMapProps> = ({
  bins,
  route,
  onNavigateToFullMap,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const satelliteLabelsLayerRef = useRef<L.TileLayer | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const landmarksLayerRef = useRef<L.LayerGroup | null>(null);
  const routeLayerRef = useRef<L.LayerGroup | null>(null);

  const [activeLandmark, setActiveLandmark] = useState<string>('All Mathura');
  const [mapStyle, setMapStyle] = useState<'streets' | 'satellite'>('streets');
  const [showLandmarks, setShowLandmarks] = useState<boolean>(true);
  const [showRoute, setShowRoute] = useState<boolean>(true);

  // Initialize Leaflet Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: MATHURA_CENTER,
      zoom: 13,
      zoomControl: false,
    });
    mapInstanceRef.current = map;

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Default OpenStreetMap Standard - 100% Free, NO API KEY REQUIRED, displays all Mathura real roads & places
    tileLayerRef.current = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      subdomains: ['a', 'b', 'c'],
      maxZoom: 19,
    }).addTo(map);

    markersLayerRef.current = L.layerGroup().addTo(map);
    landmarksLayerRef.current = L.layerGroup().addTo(map);
    routeLayerRef.current = L.layerGroup().addTo(map);

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Handle Map Style (Streets vs Satellite)
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;

    mapInstanceRef.current.removeLayer(tileLayerRef.current);
    if (satelliteLabelsLayerRef.current) {
      mapInstanceRef.current.removeLayer(satelliteLabelsLayerRef.current);
      satelliteLabelsLayerRef.current = null;
    }

    if (mapStyle === 'streets') {
      // Clean OpenStreetMap with real Mathura place names, streets, temples and markets
      tileLayerRef.current = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        subdomains: ['a', 'b', 'c'],
        maxZoom: 19,
      }).addTo(mapInstanceRef.current);
    } else {
      // Esri World Imagery (satellite) + Boundaries and Places overlay (free, no API key)
      tileLayerRef.current = L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: '&copy; Esri World Imagery',
        maxZoom: 19,
      }).addTo(mapInstanceRef.current);

      satelliteLabelsLayerRef.current = L.tileLayer('https://services.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}', {
        attribution: '&copy; Esri Reference',
        maxZoom: 19,
      }).addTo(mapInstanceRef.current);
    }
  }, [mapStyle]);

  // Update Landmarks Layer
  useEffect(() => {
    if (!landmarksLayerRef.current) return;
    landmarksLayerRef.current.clearLayers();

    if (!showLandmarks) return;

    MATHURA_KEY_PLACES.forEach((p) => {
      const placeIcon = L.divIcon({
        className: 'custom-mathura-landmark',
        html: `
          <div style="
            display: inline-flex;
            align-items: center;
            gap: 4px;
            background: rgba(15, 23, 42, 0.92);
            color: #ffffff;
            padding: 3px 7px;
            border-radius: 8px;
            border: 1.5px solid ${p.color};
            box-shadow: 0 4px 12px rgba(0,0,0,0.5);
            font-family: inherit;
            font-size: 11px;
            font-weight: 700;
            white-space: nowrap;
            cursor: pointer;
            pointer-events: auto;
          ">
            <span style="font-size: 13px;">${p.icon}</span>
            <span style="color: #f8fafc;">${p.tag}</span>
          </div>
        `,
        iconSize: [110, 26],
        iconAnchor: [55, 13],
      });

      const marker = L.marker([p.lat, p.lng], { icon: placeIcon }).bindPopup(`
        <div style="font-family: inherit; font-size: 12px; padding: 4px; max-width: 220px;">
          <div style="font-weight: bold; color: #f8fafc; font-size: 13px; margin-bottom: 3px;">
            ${p.icon} ${p.name}
          </div>
          <div style="color: #94a3b8; font-size: 11px; margin-bottom: 6px;">${p.desc}</div>
          <div style="font-size: 10px; color: #64748b;">Mathura, Uttar Pradesh, India</div>
        </div>
      `);
      landmarksLayerRef.current?.addLayer(marker);
    });
  }, [showLandmarks]);

  // Update Bin Markers & Priority Route
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current || !routeLayerRef.current) return;

    markersLayerRef.current.clearLayers();
    routeLayerRef.current.clearLayers();

    // 1. Mathura Municipal Central Depot
    const depotCoords = route?.depot_coordinates || {
      latitude: MATHURA_CENTER[0],
      longitude: MATHURA_CENTER[1],
      name: 'Mathura Nagar Nigam Central Depot',
    };

    const depotIcon = L.divIcon({
      className: 'mathura-depot-marker',
      html: `
        <div style="
          background: #2563eb;
          color: #ffffff;
          width: 32px;
          height: 32px;
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 15px;
          font-weight: bold;
          border: 2px solid #ffffff;
          box-shadow: 0 4px 14px rgba(37, 99, 235, 0.7);
        ">🏭</div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16],
    });

    const depotMarker = L.marker([depotCoords.latitude, depotCoords.longitude], {
      icon: depotIcon,
    }).bindPopup(`
      <div style="font-family: inherit; font-size: 12px; padding: 4px;">
        <div style="font-weight: bold; color: #60a5fa; font-size: 13px; margin-bottom: 2px;">${depotCoords.name}</div>
        <div style="color: #cbd5e1; font-size: 11px;">Central Dispatch Base • Nagar Nigam Mathura-Vrindavan</div>
        <div style="font-size: 10px; color: #94a3b8; margin-top: 4px;">Dampier Nagar, Mathura, Uttar Pradesh</div>
      </div>
    `);
    markersLayerRef.current.addLayer(depotMarker);

    // 2. Add Bin Markers with fill % badge
    bins.forEach((b) => {
      const color =
        b.risk_level === 'Critical'
          ? '#ef4444'
          : b.risk_level === 'High'
          ? '#f97316'
          : b.risk_level === 'Medium'
          ? '#f59e0b'
          : '#84cc16';

      const pulseStyle = b.risk_level === 'Critical' ? 'box-shadow: 0 0 14px #ef4444; border: 2.5px solid #ffffff;' : 'border: 2px solid #ffffff;';

      const markerHtml = `
        <div style="
          background-color: ${color};
          width: 24px;
          height: 24px;
          border-radius: 50%;
          ${pulseStyle}
          box-shadow: 0 2px 10px rgba(0,0,0,0.6);
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          font-size: 9.5px;
          font-weight: 800;
        ">
          ${Math.round(b.predicted_fill)}
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'mathura-bin-pin',
        html: markerHtml,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const marker = L.marker([b.latitude, b.longitude], { icon: customIcon });

      const popupHtml = `
        <div style="font-family: inherit; font-size: 12px; padding: 4px; min-width: 200px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 4px;">
            <strong style="color: #f8fafc; font-size: 13px;">${b.bin_id}</strong>
            <span style="background: ${color}25; color: ${color}; border: 1px solid ${color}60; padding: 1px 7px; border-radius: 9999px; font-weight: 700; font-size: 10px;">
              ${b.risk_level}
            </span>
          </div>
          <div style="color: #cbd5e1; font-size: 11px; margin-bottom: 6px; font-weight: 500;">
            📍 ${b.address || `${b.zone} Zone, Mathura`}
          </div>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; background: #0f172a; padding: 6px; border-radius: 6px; margin-bottom: 6px;">
            <div>
              <div style="color: #94a3b8; font-size: 9px; text-transform: uppercase;">Current Fill</div>
              <strong style="color: #f1f5f9; font-size: 13px;">${Math.round(b.current_fill)}%</strong>
            </div>
            <div>
              <div style="color: #94a3b8; font-size: 9px; text-transform: uppercase;">Next Cycle</div>
              <strong style="color: #34d399; font-size: 13px;">${Math.round(b.predicted_fill)}%</strong>
            </div>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 11px; color: #94a3b8;">
            <span>AI Priority Score:</span>
            <strong style="color: #38bdf8; font-size: 12px;">${b.priority_score}</strong>
          </div>
        </div>
      `;

      marker.bindPopup(popupHtml);
      markersLayerRef.current?.addLayer(marker);
    });

    // 3. Priority Dispatch Route Path
    if (showRoute && route && route.stops && route.stops.length > 0) {
      const latlngs: [number, number][] = [
        [depotCoords.latitude, depotCoords.longitude],
        ...route.stops.map((s) => [s.latitude, s.longitude] as [number, number]),
        [depotCoords.latitude, depotCoords.longitude],
      ];

      const polyline = L.polyline(latlngs, {
        color: '#0284c7',
        weight: 3.5,
        opacity: 0.9,
        dashArray: '6, 6',
      });
      routeLayerRef.current.addLayer(polyline);
    }
  }, [bins, route, showRoute]);

  const handleLandmarkJump = (name: string, lat: number, lng: number, zoom: number = 15) => {
    setActiveLandmark(name);
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([lat, lng], zoom, { duration: 1.2 });
    }
  };

  const criticalCount = bins.filter((b) => b.risk_level === 'Critical').length;
  const highCount = bins.filter((b) => b.risk_level === 'High').length;

  return (
    <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 overflow-hidden flex flex-col space-y-4">
      {/* Top Controls Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
            <MapPin className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-base font-bold text-white tracking-tight">
                Mathura Smart City — Real Places & Waste Analytics Map
              </h3>
              <span className="text-[10px] font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                Mathura, Uttar Pradesh 🇮🇳
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Authentic OpenStreetMap showing Krishna Janmasthan, Yamuna Ghats, Holi Gate & IoT smart bins
            </p>
          </div>
        </div>

        {/* Map Layer Switcher & Actions */}
        <div className="flex items-center gap-2 flex-wrap">
          {/* Map Tile Style Toggle */}
          <div className="bg-slate-800 p-0.5 rounded-xl flex items-center border border-slate-700/80 text-xs">
            <button
              onClick={() => setMapStyle('streets')}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                mapStyle === 'streets'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Street Map
            </button>
            <button
              onClick={() => setMapStyle('satellite')}
              className={`px-2.5 py-1 rounded-lg font-medium transition ${
                mapStyle === 'satellite'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Satellite
            </button>
          </div>

          {/* Landmarks Toggle */}
          <button
            onClick={() => setShowLandmarks(!showLandmarks)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
              showLandmarks
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-400'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
            title="Toggle landmark labels on map"
          >
            {showLandmarks ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>Landmarks</span>
          </button>

          {/* Route Path Toggle */}
          <button
            onClick={() => setShowRoute(!showRoute)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
              showRoute
                ? 'bg-blue-500/15 border-blue-500/40 text-blue-400'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Path</span>
          </button>

          <button
            onClick={onNavigateToFullMap}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 text-xs font-semibold transition"
          >
            <Maximize2 className="w-3.5 h-3.5" />
            <span>Full Map</span>
          </button>
        </div>
      </div>

      {/* Real Mathura Places Focus Bar */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <span className="text-slate-400 flex items-center gap-1 text-[11px] font-medium pr-1 shrink-0">
          <Compass className="w-3.5 h-3.5 text-emerald-400" /> Focus Place:
        </span>
        <button
          onClick={() => handleLandmarkJump('All Mathura', MATHURA_CENTER[0], MATHURA_CENTER[1], 13)}
          className={`px-2.5 py-1 rounded-lg font-medium text-xs whitespace-nowrap transition ${
            activeLandmark === 'All Mathura'
              ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
              : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60'
          }`}
        >
          All Mathura
        </button>
        {MATHURA_KEY_PLACES.map((p) => {
          const isActive = activeLandmark === p.tag;
          return (
            <button
              key={p.tag}
              onClick={() => handleLandmarkJump(p.tag, p.lat, p.lng, 15)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-medium text-xs whitespace-nowrap transition ${
                isActive
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                  : 'bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60'
              }`}
            >
              <span>{p.icon}</span>
              <span>{p.tag}</span>
            </button>
          );
        })}
      </div>

      {/* Map Viewport Area */}
      <div className="relative h-80 sm:h-96 w-full rounded-xl overflow-hidden border border-slate-800 bg-slate-950 shadow-inner">
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* Legend Overlay */}
        <div className="absolute top-3 right-3 z-[1000] bg-slate-950/90 backdrop-blur-md border border-slate-800 px-3 py-2.5 rounded-xl shadow-xl text-[11px] space-y-1.5 pointer-events-none sm:pointer-events-auto">
          <div className="font-bold text-white text-[11px] flex items-center gap-1.5 mb-1">
            <Layers className="w-3 h-3 text-slate-400" />
            <span>Map Key</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
            <span className="text-slate-200">Critical Risk (≥90%)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-orange-500" />
            <span className="text-slate-200">High Risk (75-89%)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span className="text-slate-200">Medium Risk (50-74%)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-slate-200">Low Risk (&lt;50%)</span>
          </div>
          <div className="pt-1 border-t border-slate-800/80 flex items-center gap-2 text-blue-400 font-medium">
            <span>🏭</span>
            <span>Nagar Nigam Depot</span>
          </div>
        </div>

        {/* Live Metrics Overlay Pill */}
        <div className="absolute bottom-3 left-3 z-[1000] bg-slate-950/90 backdrop-blur-md border border-slate-800 px-3 py-2 rounded-xl text-xs text-slate-300 shadow-xl flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span><strong>{bins.length}</strong> Bins in Mathura</span>
          </div>
          <div className="flex items-center gap-1.5 text-rose-400">
            <AlertCircle className="w-3.5 h-3.5" />
            <span><strong>{criticalCount + highCount}</strong> Urgent Pickups</span>
          </div>
          {route && (
            <div className="hidden md:flex items-center gap-1.5 text-blue-400 border-l border-slate-700 pl-3">
              <Navigation className="w-3 h-3" />
              <span>Est. Loop: <strong>{route.total_estimated_distance_km} km</strong></span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
