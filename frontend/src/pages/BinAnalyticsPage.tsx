import React, { useState, useEffect } from 'react';
import {
  Trash2,
  Calendar,
  MapPin,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Plus
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid
} from 'recharts';
import { BinItem, SensorRecord } from '../types';
import { RiskBadge } from '../components/RiskBadge';
import { api } from '../services/api';

interface Props {
  bins: BinItem[];
}

export const BinAnalyticsPage: React.FC<Props> = ({ bins }) => {
  const [selectedBinId, setSelectedBinId] = useState<string>(bins[0]?.bin_id || 'BIN001');
  const [readings, setReadings] = useState<SensorRecord[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const selectedBin = bins.find((b) => b.bin_id === selectedBinId) || bins[0];

  useEffect(() => {
    if (selectedBinId) {
      loadBinHistory(selectedBinId);
    }
  }, [selectedBinId]);

  const loadBinHistory = async (id: string) => {
    setIsLoading(true);
    try {
      const res = await api.getReadings(1, 40, undefined, id);
      // Sort chronologically for chart
      const sorted = [...res.records].reverse();
      setReadings(sorted);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const chartData = readings.map((r) => ({
    time: new Date(r.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit' }),
    fill_level: r.fill_level,
    weather: r.weather,
  }));

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header & Bin Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Bin Diagnostics & Telemetry</h1>
          <p className="text-xs md:text-sm text-slate-400 mt-0.5">
            Individual sensor tracking, historical fill progression, and collection cycle resets
          </p>
        </div>

        {/* Bin Dropdown */}
        <div className="flex items-center gap-3">
          <label className="text-xs text-slate-400">Select Asset:</label>
          <select
            value={selectedBinId}
            onChange={(e) => setSelectedBinId(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none"
          >
            {bins.map((b) => (
              <option key={b.bin_id} value={b.bin_id}>
                {b.bin_id} ({b.location_zone})
              </option>
            ))}
          </select>
        </div>
      </div>

      {selectedBin && (
        <>
          {/* Metadata Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3.5">
            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
              <div className="text-[10px] text-slate-500 mb-1">Asset ID & Status</div>
              <div className="font-mono font-bold text-white text-base flex items-center gap-2">
                <span>{selectedBin.bin_id}</span>
                <RiskBadge level={selectedBin.risk_level || 'Low'} size="sm" />
              </div>
            </div>

            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
              <div className="text-[10px] text-slate-500 mb-1">Current Fill Level</div>
              <div className="font-mono font-bold text-lg text-emerald-400">
                {selectedBin.current_fill !== undefined ? `${selectedBin.current_fill}%` : '42%'}
              </div>
            </div>

            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
              <div className="text-[10px] text-slate-500 mb-1">Zone Classification</div>
              <div className="font-semibold text-white text-sm">{selectedBin.location_zone}</div>
            </div>

            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl">
              <div className="text-[10px] text-slate-500 mb-1">Location Coordinates</div>
              <div className="font-mono text-slate-300 text-xs mt-1">
                {selectedBin.latitude.toFixed(4)}, {selectedBin.longitude.toFixed(4)}
              </div>
            </div>

            <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl col-span-2 sm:col-span-1">
              <div className="text-[10px] text-slate-500 mb-1">Capacity</div>
              <div className="font-semibold text-white text-sm">
                {selectedBin.capacity || 100} L (Standard)
              </div>
            </div>
          </div>

          {/* Historical Telemetry Chart */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold text-white">Historical Fill Level Progression</h3>
                <p className="text-xs text-slate-400">
                  Sensor observations showing cyclic fill accumulation and collection drop-offs
                </p>
              </div>
              <button
                onClick={() => loadBinHistory(selectedBin.bin_id)}
                className="p-1.5 bg-slate-800 rounded-lg text-slate-400 hover:text-white"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="time" stroke="#64748b" fontSize={10} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={10} tickLine={false} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem', color: '#fff', fontSize: '11px' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="fill_level"
                    stroke="#84cc16"
                    strokeWidth={2.5}
                    name="Fill Level %"
                    dot={{ fill: '#84cc16', r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
