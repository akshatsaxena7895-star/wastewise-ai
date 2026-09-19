import React from 'react';
import { X, Navigation, Fuel, Clock, MapPin, AlertCircle } from 'lucide-react';
import { SimpleRoute } from '../types';
import { RiskBadge } from './RiskBadge';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  route: SimpleRoute | null;
}

export const RouteModal: React.FC<Props> = ({ isOpen, onClose, route }) => {
  if (!isOpen || !route) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <Navigation className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-white">Simple Priority-Based Route</h3>
              <p className="text-xs text-slate-400">Illustrative Nearest-Neighbor Heuristic</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Disclaimer Banner */}
        <div className="px-5 py-3 bg-amber-500/10 border-b border-amber-500/20 flex items-center gap-2.5 text-xs text-amber-300">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>
            {route.disclaimer} Calculations use straight-line Haversine coordinates and standard municipal estimates.
          </span>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-5 border-b border-slate-800 bg-slate-950/40">
          <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mb-1">
              <MapPin className="w-3.5 h-3.5 text-emerald-400" />
              <span>Stops</span>
            </div>
            <div className="text-lg font-bold text-white">{route.total_bins} Bins</div>
          </div>

          <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mb-1">
              <Navigation className="w-3.5 h-3.5 text-blue-400" />
              <span>Est. Distance</span>
            </div>
            <div className="text-lg font-bold text-white">{route.total_estimated_distance_km} km</div>
          </div>

          <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mb-1">
              <Clock className="w-3.5 h-3.5 text-amber-400" />
              <span>Est. Time</span>
            </div>
            <div className="text-lg font-bold text-white">{route.estimated_travel_time_min} mins</div>
          </div>

          <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
            <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mb-1">
              <Fuel className="w-3.5 h-3.5 text-rose-400" />
              <span>Est. Fuel</span>
            </div>
            <div className="text-lg font-bold text-white">{route.estimated_fuel_liters} L</div>
          </div>
        </div>

        {/* Stops Timeline List */}
        <div className="p-5 flex-1 overflow-y-auto space-y-3">
          {/* Start: Depot */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs">
            <div className="w-6 h-6 rounded-full bg-blue-500/20 border border-blue-500/40 text-blue-400 flex items-center justify-center font-bold">
              0
            </div>
            <div className="flex-1">
              <div className="font-semibold text-slate-200">{route.depot_coordinates.name}</div>
              <div className="text-[11px] text-slate-500">Departure Base & Fleet Dispatch Hub</div>
            </div>
            <span className="text-[11px] font-mono text-slate-400">0.0 km</span>
          </div>

          {route.stops.map((stop) => (
            <div
              key={stop.sequence}
              className="flex items-center gap-3 p-3 rounded-xl bg-slate-900 border border-slate-800/80 text-xs hover:border-slate-700 transition"
            >
              <div className="w-6 h-6 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold">
                {stop.sequence}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-slate-200 font-mono">{stop.bin_id}</span>
                  <span className="text-slate-400 font-normal">({stop.zone})</span>
                  <RiskBadge level={stop.risk_level} size="sm" />
                </div>
                <div className="text-[11px] text-slate-500">
                  Priority Score: <span className="text-slate-300 font-semibold">{stop.priority_score}</span>
                </div>
              </div>
              <span className="text-[11px] font-mono text-slate-400">+{stop.leg_distance_km} km</span>
            </div>
          ))}

          {/* End: Return to Depot */}
          <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800 text-xs opacity-75">
            <div className="w-6 h-6 rounded-full bg-blue-500/20 border border-blue-500/40 text-blue-400 flex items-center justify-center font-bold">
              R
            </div>
            <div className="flex-1">
              <div className="font-semibold text-slate-200">Return to Depot</div>
              <div className="text-[11px] text-slate-500">Route cycle complete</div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition"
          >
            Close Preview
          </button>
        </div>
      </div>
    </div>
  );
};
