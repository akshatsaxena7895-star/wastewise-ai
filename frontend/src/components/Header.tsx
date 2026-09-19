import React from 'react';
import { RefreshCw, Play, Building2, Calendar, User, Sparkles } from 'lucide-react';

interface HeaderProps {
  selectedZone: string;
  setSelectedZone: (zone: string) => void;
  onRefresh: () => void;
  onDemoSetup: () => void;
  isLoading: boolean;
  isDemoLoading: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  selectedZone,
  setSelectedZone,
  onRefresh,
  onDemoSetup,
  isLoading,
  isDemoLoading
}) => {
  const zones = ['All Zones', 'Market', 'Commercial', 'Residential', 'IT Park', 'Industrial', 'Mixed'];
  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  return (
    <header className="h-16 border-b border-slate-800 bg-slate-900/70 backdrop-blur px-6 flex items-center justify-between z-10 shrink-0">
      {/* Left: Zone & Date context */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 bg-slate-800/70 border border-slate-700/60 rounded-lg px-3 py-1.5 text-xs text-slate-300">
          <Building2 className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-slate-400 font-medium">Zone:</span>
          <select
            value={selectedZone}
            onChange={(e) => setSelectedZone(e.target.value)}
            className="bg-transparent text-slate-100 font-medium focus:outline-none cursor-pointer"
          >
            {zones.map((z) => (
              <option key={z} value={z === 'All Zones' ? '' : z} className="bg-slate-900 text-slate-100">
                {z}
              </option>
            ))}
          </select>
        </div>

        <div className="hidden md:flex items-center gap-2 text-xs text-slate-400 bg-slate-800/40 px-3 py-1.5 rounded-lg border border-slate-800">
          <Calendar className="w-3.5 h-3.5 text-slate-400" />
          <span>{today}</span>
          <span className="text-slate-600">|</span>
          <span className="text-emerald-400 font-medium">Next Horizon: +4h</span>
        </div>
      </div>

      {/* Right: Actions & User */}
      <div className="flex items-center gap-3">
        {/* 1-Click Demo Setup */}
        <button
          onClick={onDemoSetup}
          disabled={isDemoLoading}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-slate-950 shadow-md shadow-emerald-500/20 transition-all active:scale-95 disabled:opacity-50"
          title="Run 1-click demo: loads data, trains models, predicts fill levels, ranks priorities"
        >
          {isDemoLoading ? (
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <Sparkles className="w-3.5 h-3.5 fill-slate-950" />
          )}
          <span>{isDemoLoading ? 'Seeding Demo...' : '1-Click Demo Mode'}</span>
        </button>

        {/* Refresh */}
        <button
          onClick={onRefresh}
          disabled={isLoading}
          className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition active:scale-95 disabled:opacity-50"
          title="Refresh Data"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
        </button>

        {/* User Pill */}
        <div className="flex items-center gap-2.5 pl-3 border-l border-slate-800">
          <div className="w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300">
            <User className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="hidden lg:block text-left">
            <div className="text-xs font-medium text-slate-200">Dispatch Officer</div>
            <div className="text-[10px] text-slate-500">Municipal Control</div>
          </div>
        </div>
      </div>
    </header>
  );
};
