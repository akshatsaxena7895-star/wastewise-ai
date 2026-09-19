import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { MapPin, Navigation, Info, Layers, RefreshCw, Compass, Eye, EyeOff } from 'lucide-react';
import { SimpleRoute } from '../types';
import { MATHURA_KEY_PLACES } from '../components/MathuraDashboardMap';

interface MapBin {
  bin_id: string;
  latitude: number;
  longitude: number;
  zone: string;
  address?: string;
  current_fill: number;
  predicted_fill: number;
  overflow_probability: number;
  risk_level: string;
  priority_score: number;
  explanation: string;
}

interface Props {
  bins: MapBin[];
  route?: SimpleRoute | null;
  isLoading: boolean;
  onRefresh: () => void;
}

const MATHURA_CENTER: [number, number] = [27.4924, 77.6737];

export const MapViewPage: React.FC<Props> = ({ bins, route, isLoading, onRefresh }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const satelliteLabelsLayerRef = useRef<L.TileLayer | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const landmarksLayerRef = useRef<L.LayerGroup | null>(null);
  const routeLayerRef = useRef<L.LayerGroup | null>(null);

  const [filterRisk, setFilterRisk] = useState<string>('All');
  const [filterZone, setFilterZone] = useState<string>('All');
  const [mapStyle, setMapStyle] = useState<'streets' | 'satellite'>('streets');
  const [showLandmarks, setShowLandmarks] = useState<boolean>(true);
  const [showRoute, setShowRoute] = useState<boolean>(true);
  const [selectedBin, setSelectedBin] = useState<MapBin | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    // Default center Mathura, Uttar Pradesh, India
    const map = L.map(mapContainerRef.current, {
      center: MATHURA_CENTER,
      zoom: 13,
    });
    mapInstanceRef.current = map;

    // Standard OpenStreetMap - 100% Free, NO API KEY REQUIRED, displays all Mathura real roads & places
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

  // Update Map Tile Layer when style changes
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;

    mapInstanceRef.current.removeLayer(tileLayerRef.current);
    if (satelliteLabelsLayerRef.current) {
      mapInstanceRef.current.removeLayer(satelliteLabelsLayerRef.current);
      satelliteLabelsLayerRef.current = null;
    }

    if (mapStyle === 'streets') {
      tileLayerRef.current = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors',
        subdomains: ['a', 'b', 'c'],
        maxZoom: 19,
      }).addTo(mapInstanceRef.current);
    } else {
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
            background: rgba(15, 23, 42, 0.94);
            color: #ffffff;
            padding: 3px 8px;
            border-radius: 8px;
            border: 1.5px solid ${p.color};
            box-shadow: 0 4px 14px rgba(0,0,0,0.6);
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
        <div style="font-family: inherit; font-size: 12px; padding: 4px; max-width: 230px;">
          <div style="font-weight: bold; color: #f8fafc; font-size: 13px; margin-bottom: 3px;">
            ${p.icon} ${p.name}
          </div>
          <div style="color: #cbd5e1; font-size: 11px; margin-bottom: 6px;">${p.desc}</div>
          <div style="font-size: 10px; color: #94a3b8;">Mathura, Uttar Pradesh, India</div>
        </div>
      `);
      landmarksLayerRef.current?.addLayer(marker);
    });
  }, [showLandmarks]);

  // Update Markers & Route
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current || !routeLayerRef.current) return;

    markersLayerRef.current.clearLayers();
    routeLayerRef.current.clearLayers();

    // 1. Add Mathura Central Depot Marker
    const depotCoords = route?.depot_coordinates || {
      latitude: MATHURA_CENTER[0],
      longitude: MATHURA_CENTER[1],
      name: 'Mathura Nagar Nigam Central Depot',
    };

    const depotIcon = L.divIcon({
      className: 'custom-depot-marker',
      html: `
        <div style="
          background: #2563eb;
          color: #ffffff;
          width: 32px;
          height: 32px;
          border-radius: 8px;
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
        <div style="color: #cbd5e1; font-size: 11px;">Municipal Dispatch & Fleet Terminal • Nagar Nigam Mathura-Vrindavan</div>
        <div style="font-size: 10px; color: #94a3b8; margin-top: 4px;">Dampier Nagar, Mathura, Uttar Pradesh, India</div>
      </div>
    `);
    markersLayerRef.current.addLayer(depotMarker);

    // 2. Add Bin Markers
    const filtered = bins.filter((b) => {
      if (filterRisk !== 'All' && b.risk_level !== filterRisk) return false;
      if (filterZone !== 'All' && b.zone !== filterZone) return false;
      return true;
    });

    filtered.forEach((b) => {
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
        className: 'custom-bin-pin',
        html: markerHtml,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      });

      const marker = L.marker([b.latitude, b.longitude], { icon: customIcon });

      const popupContent = `
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

      marker.bindPopup(popupContent);
      marker.on('click', () => setSelectedBin(b));
      markersLayerRef.current?.addLayer(marker);
    });

    // 3. Add Route Polyline if enabled
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
  }, [bins, route, filterRisk, filterZone, showRoute]);

  const zones = ['All', 'Market', 'Commercial', 'Residential', 'IT Park', 'Industrial', 'Mixed'];
  const risks = ['All', 'Critical', 'High', 'Medium', 'Low'];

  const handleLandmarkJump = (lat: number, lng: number, zoom: number = 15) => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo([lat, lng], zoom, { duration: 1.2 });
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-4 max-w-7xl mx-auto flex flex-col h-[calc(100vh-4rem)]">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 shrink-0">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-bold text-white tracking-tight">Mathura Smart City — Real Places & Waste Map</h1>
            <span className="text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full">
              Uttar Pradesh, India 🇮🇳
            </span>
          </div>
          <p className="text-xs md:text-sm text-slate-400 mt-0.5">
            Real OpenStreetMap displaying Krishna Janmasthan, Yamuna Ghats, Holi Gate & IoT dispatch routes
          </p>
        </div>

        {/* Map Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Tile Style Switcher */}
          <div className="bg-slate-900 p-0.5 rounded-xl flex items-center border border-slate-800 text-xs">
            <button
              onClick={() => setMapStyle('streets')}
              className={`px-2.5 py-1.5 rounded-lg font-medium transition ${
                mapStyle === 'streets'
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              Street Map
            </button>
            <button
              onClick={() => setMapStyle('satellite')}
              className={`px-2.5 py-1.5 rounded-lg font-medium transition ${
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
          >
            {showLandmarks ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            <span>Landmarks</span>
          </button>

          {/* Route Overlay Toggle */}
          <button
            onClick={() => setShowRoute(!showRoute)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
              showRoute
                ? 'bg-blue-500/15 border-blue-500/40 text-blue-400'
                : 'bg-slate-800 border-slate-700 text-slate-400'
            }`}
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Path</span>
          </button>

          {/* Zone Filter */}
          <select
            value={filterZone}
            onChange={(e) => setFilterZone(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-slate-300 rounded-xl px-3 py-1.5 text-xs focus:outline-none"
          >
            {zones.map((z) => (
              <option key={z} value={z}>
                Zone: {z}
              </option>
            ))}
          </select>

          {/* Risk Filter */}
          <select
            value={filterRisk}
            onChange={(e) => setFilterRisk(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-slate-300 rounded-xl px-3 py-1.5 text-xs focus:outline-none"
          >
            {risks.map((r) => (
              <option key={r} value={r}>
                Risk: {r}
              </option>
            ))}
          </select>

          <button
            onClick={onRefresh}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
            title="Refresh Map Markers"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Landmark Quick Jump Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs shrink-0">
        <span className="text-slate-400 flex items-center gap-1 text-[11px] font-medium pr-1 shrink-0">
          <Compass className="w-3.5 h-3.5 text-emerald-400" /> Focus Place:
        </span>
        <button
          onClick={() => handleLandmarkJump(MATHURA_CENTER[0], MATHURA_CENTER[1], 13)}
          className="px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700/60 font-medium text-xs whitespace-nowrap transition"
        >
          All Mathura
        </button>
        {MATHURA_KEY_PLACES.map((lm) => (
          <button
            key={lm.tag}
            onClick={() => handleLandmarkJump(lm.lat, lm.lng, 15)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800/80 hover:bg-emerald-500/20 hover:text-emerald-400 text-slate-300 border border-slate-700/60 font-medium text-xs whitespace-nowrap transition"
          >
            <span>{lm.icon}</span>
            <span>{lm.tag}</span>
          </button>
        ))}
      </div>

      {/* Map Container Area */}
      <div className="relative flex-1 rounded-2xl overflow-hidden border border-slate-800 shadow-xl bg-slate-950">
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* Legend Overlay */}
        <div className="absolute top-4 right-4 z-[1000] bg-slate-950/90 backdrop-blur-md border border-slate-800 p-3.5 rounded-xl shadow-xl text-xs space-y-2">
          <div className="font-bold text-white text-[11px] mb-1 flex items-center gap-1.5">
            <Layers className="w-3.5 h-3.5 text-slate-400" />
            <span>Map Indicators</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
            <span className="text-slate-200">Critical (≥ 90% Fill)</span>
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
            <span className="text-slate-200">Low Risk (&lt; 50%)</span>
          </div>
          <div className="pt-1 border-t border-slate-800 flex items-center gap-2 text-blue-400 font-medium">
            <span>🏭</span>
            <span>Mathura Nagar Nigam Depot</span>
          </div>
        </div>

        {/* Route Disclaimer Banner */}
        {showRoute && (
          <div className="absolute bottom-4 left-4 z-[1000] bg-slate-950/90 backdrop-blur-md border border-blue-500/30 px-3.5 py-2 rounded-xl text-xs text-blue-300 shadow-xl flex items-center gap-2">
            <Info className="w-3.5 h-3.5 shrink-0" />
            <span>
              Simple Priority-Based Route — Illustrative ordering heuristic connecting urgent Mathura bins.
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
