import React, { useState } from 'react';
import {
  LineChart as LineChartIcon,
  BarChart3,
  Calendar,
  CloudRain,
  Sparkles,
  Filter,
  RefreshCw,
  Info
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Cell
} from 'recharts';
import { EDAStats } from '../types';

interface Props {
  data: EDAStats | null;
  isLoading: boolean;
  selectedZone: string;
  onZoneChange: (zone: string) => void;
  onRefresh: () => void;
}

export const EDAPage: React.FC<Props> = ({
  data,
  isLoading,
  selectedZone,
  onZoneChange,
  onRefresh
}) => {
  if (isLoading && !data) {
    return <div className="p-8 text-center text-slate-500 animate-pulse">Loading Exploratory Data Analysis...</div>;
  }

  if (!data || data.total_records === 0) {
    return (
      <div className="p-12 text-center text-slate-400">
        <LineChartIcon className="w-12 h-12 mx-auto mb-3 text-slate-600" />
        <h2 className="text-lg font-bold text-white mb-1">No Data Available for EDA</h2>
        <p className="text-xs text-slate-500">Please generate or import data from the Data Management tab first.</p>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Exploratory Data Analysis (EDA)</h1>
          <p className="text-xs md:text-sm text-slate-400 mt-0.5">
            Statistical diagnostics, temporal patterns, and waste generation correlations across municipal zones
          </p>
        </div>

        <button
          onClick={onRefresh}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition self-start sm:self-auto"
          title="Refresh EDA Metrics"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
        </button>
      </div>

      {/* Dataset Summary KPI Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="text-[10px] text-slate-500 font-medium">Total Records</div>
          <div className="text-lg font-bold text-white mt-0.5">{data.total_records.toLocaleString()}</div>
        </div>

        <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="text-[10px] text-slate-500 font-medium">Unique Bins</div>
          <div className="text-lg font-bold text-white mt-0.5">{data.total_bins}</div>
        </div>

        <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="text-[10px] text-slate-500 font-medium">Missing Values</div>
          <div className="text-lg font-bold text-emerald-400 mt-0.5">{data.missing_values}</div>
        </div>

        <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="text-[10px] text-slate-500 font-medium">Duplicates</div>
          <div className="text-lg font-bold text-emerald-400 mt-0.5">{data.duplicate_rows}</div>
        </div>

        <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="text-[10px] text-slate-500 font-medium">Average Fill</div>
          <div className="text-lg font-bold text-blue-400 mt-0.5">{data.avg_fill}%</div>
        </div>

        <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="text-[10px] text-slate-500 font-medium">Min / Max Fill</div>
          <div className="text-lg font-bold text-slate-200 mt-0.5">
            {data.min_fill}% / {data.max_fill}%
          </div>
        </div>

        <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="text-[10px] text-slate-500 font-medium">Overflow Records</div>
          <div className="text-lg font-bold text-rose-400 mt-0.5">{data.overflow_count}</div>
        </div>

        <div className="p-3 bg-slate-900 border border-slate-800 rounded-xl">
          <div className="text-[10px] text-slate-500 font-medium">Overflow Rate</div>
          <div className="text-lg font-bold text-rose-400 mt-0.5">{data.overflow_percentage}%</div>
        </div>
      </div>

      {/* Grid 1: Fill Distribution & Zone Averages */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. Fill Level Distribution Histogram */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white mb-1">1. Fill Level Distribution Histogram</h3>
          <p className="text-xs text-slate-400 mb-4">Observation count across 10% fill buckets</p>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.fill_distribution} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="range" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem', color: '#fff', fontSize: '11px' }}
                />
                <Bar dataKey="count" fill="#84cc16" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Average Fill by Zone */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white mb-1">2. Average Fill Level by Zone</h3>
          <p className="text-xs text-slate-400 mb-4">Market & Commercial areas show heightened baseline waste</p>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.zone_stats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="zone" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem', color: '#fff', fontSize: '11px' }}
                />
                <Bar dataKey="avg_fill" fill="#38bdf8" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Grid 2: Day of Week & Time Series Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 3. Day of Week Pattern */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white mb-1">3. Fill Level by Day of Week</h3>
          <p className="text-xs text-slate-400 mb-4">Weekend surges in residential and market zones</p>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.day_of_week_stats} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="day" stroke="#64748b" fontSize={10} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem', color: '#fff', fontSize: '11px' }}
                />
                <Bar dataKey="avg_fill" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 4. Fill Level Over Time (30 Day Trend) */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white mb-1">4. Longitudinal Daily Fill Trend</h3>
          <p className="text-xs text-slate-400 mb-4">Average municipal fill levels over historical dates</p>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.time_series_trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="date" stroke="#64748b" fontSize={9} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} domain={[20, 80]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '0.5rem', color: '#fff', fontSize: '11px' }}
                />
                <Line type="monotone" dataKey="avg_fill" stroke="#a855f7" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Grid 3: Days Since Collection, Weather Impact, and Event Impact */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 5. Fill Level vs Days Since Collection */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white mb-1">5. Days Since Collection Impact</h3>
          <p className="text-xs text-slate-400 mb-4">Steep fill increase after 48 hours without dispatch</p>
          <div className="space-y-2.5 text-xs">
            {data.fill_vs_days_collection.map((item) => (
              <div key={item.days} className="p-2.5 bg-slate-950 rounded-xl border border-slate-800">
                <div className="flex justify-between font-medium text-slate-300">
                  <span>{item.days}</span>
                  <span className="font-mono text-emerald-400 font-bold">{item.avg_fill}% avg</span>
                </div>
                <div className="text-[10px] text-rose-400 mt-0.5">
                  Overflow Risk: {item.overflow_rate}%
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 6. Weather Impact */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white mb-1">6. Weather Condition Impact</h3>
          <p className="text-xs text-slate-400 mb-4">Rain and storm events elevate bin density</p>
          <div className="space-y-2.5 text-xs">
            {data.weather_stats.map((item) => (
              <div key={item.weather} className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <CloudRain className="w-3.5 h-3.5 text-blue-400" />
                  <span className="text-slate-300 font-medium">{item.weather}</span>
                </div>
                <div className="font-mono text-blue-400 font-bold">{item.avg_fill}%</div>
              </div>
            ))}
          </div>
        </div>

        {/* 7. Special Event vs Normal Day */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5">
          <h3 className="text-sm font-semibold text-white mb-1">7. Special Events Spike</h3>
          <p className="text-xs text-slate-400 mb-4">Public gatherings produce ~35% waste spike</p>
          <div className="space-y-2.5 text-xs">
            {data.event_stats.map((item) => (
              <div key={item.event} className="p-2.5 bg-slate-950 rounded-xl border border-slate-800 flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <span className="text-slate-300 font-medium">{item.event}</span>
                </div>
                <div className="font-mono text-purple-400 font-bold">{item.avg_fill}%</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
