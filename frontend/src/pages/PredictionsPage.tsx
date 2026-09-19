import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Cpu,
  RefreshCw
} from 'lucide-react';
import { SinglePredictResult, BinItem } from '../types';
import { RiskBadge } from '../components/RiskBadge';
import { api } from '../services/api';

interface Props {
  bins: BinItem[];
  onBatchPredicted: () => void;
}

export const PredictionsPage: React.FC<Props> = ({ bins, onBatchPredicted }) => {
  const [selectedBinId, setSelectedBinId] = useState<string>(bins[0]?.bin_id || 'BIN_001');
  const [currentFill, setCurrentFill] = useState<number>(68);
  const [zone, setZone] = useState<string>('Market');
  const [daysSince, setDaysSince] = useState<number>(2.5);
  const [weather, setWeather] = useState<string>('Clear');
  const [eventFlag, setEventFlag] = useState<boolean>(false);
  const [dayType, setDayType] = useState<string>('Weekday');
  const [horizon, setHorizon] = useState<string>('Next Collection Window (+4 hrs)');

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isBatchLoading, setIsBatchLoading] = useState<boolean>(false);
  const [result, setResult] = useState<SinglePredictResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePredict = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.predictSingle({
        bin_id: selectedBinId,
        current_fill_level: currentFill,
        location_zone: zone,
        days_since_collection: daysSince,
        weather,
        event_flag: eventFlag,
        day_type: dayType
      });
      setResult(res);
    } catch (err: any) {
      setError(err.message || 'Prediction failed');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBatchPredict = async () => {
    setIsBatchLoading(true);
    try {
      await api.predictAll();
      onBatchPredicted();
    } catch (err: any) {
      setError(err.message || 'Batch prediction failed');
    } finally {
      setIsBatchLoading(false);
    }
  };

  const handleBinSelectChange = (id: string) => {
    setSelectedBinId(id);
    const match = bins.find((b) => b.bin_id === id);
    if (match) {
      setZone(match.location_zone);
      if (match.current_fill !== undefined) setCurrentFill(match.current_fill);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">AI Prediction Engine</h1>
          <p className="text-xs md:text-sm text-slate-400 mt-0.5">
            Real-time inference calculating future fill progression, overflow risks, and feature explanations
          </p>
        </div>

        <button
          onClick={handleBatchPredict}
          disabled={isBatchLoading}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-slate-950 text-xs font-semibold shadow-md transition disabled:opacity-50"
        >
          {isBatchLoading ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Cpu className="w-4 h-4" />
          )}
          <span>{isBatchLoading ? 'Predicting Fleet...' : 'Run Fleet Batch Inference'}</span>
        </button>
      </div>

      {/* Main Grid: Form + Result Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Input Parameters Form */}
        <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-sm">
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <h2 className="text-sm font-semibold text-white">Inference Parameters</h2>
          </div>

          <form onSubmit={handlePredict} className="space-y-4 text-xs">
            {/* Bin Selector */}
            <div>
              <label className="block text-slate-400 font-medium mb-1">Target Bin</label>
              <select
                value={selectedBinId}
                onChange={(e) => handleBinSelectChange(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500/50"
              >
                {bins.map((b) => (
                  <option key={b.bin_id} value={b.bin_id}>
                    {b.bin_id} — {b.location_zone}
                  </option>
                ))}
              </select>
            </div>

            {/* Current Fill Level Slider */}
            <div>
              <div className="flex justify-between text-slate-400 font-medium mb-1">
                <span>Current Fill Level</span>
                <span className="text-white font-mono font-bold">{currentFill}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={currentFill}
                onChange={(e) => setCurrentFill(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer bg-slate-800"
              />
            </div>

            {/* Location Zone */}
            <div>
              <label className="block text-slate-400 font-medium mb-1">Location Zone</label>
              <select
                value={zone}
                onChange={(e) => setZone(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500/50"
              >
                {['Market', 'Commercial', 'Residential', 'IT Park', 'Industrial', 'Mixed'].map((z) => (
                  <option key={z} value={z}>
                    {z}
                  </option>
                ))}
              </select>
            </div>

            {/* Days Since Last Collection */}
            <div>
              <div className="flex justify-between text-slate-400 font-medium mb-1">
                <span>Days Since Last Collection</span>
                <span className="text-white font-mono font-bold">{daysSince} days</span>
              </div>
              <input
                type="range"
                min="0"
                max="7"
                step="0.5"
                value={daysSince}
                onChange={(e) => setDaysSince(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer bg-slate-800"
              />
            </div>

            {/* Weather & Day Type Grid */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 font-medium mb-1">Weather Condition</label>
                <select
                  value={weather}
                  onChange={(e) => setWeather(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500/50"
                >
                  {['Clear', 'Overcast', 'Rain', 'Storm'].map((w) => (
                    <option key={w} value={w}>
                      {w}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 font-medium mb-1">Day Type</label>
                <select
                  value={dayType}
                  onChange={(e) => setDayType(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none focus:border-emerald-500/50"
                >
                  {['Weekday', 'Weekend'].map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Event Flag Toggle */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
              <span className="text-slate-300 font-medium">Nearby Special Event / Festival</span>
              <input
                type="checkbox"
                checked={eventFlag}
                onChange={(e) => setEventFlag(e.target.checked)}
                className="w-4 h-4 accent-emerald-500 rounded cursor-pointer"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition shadow-lg shadow-emerald-500/20 active:scale-98 disabled:opacity-50"
            >
              {isLoading ? 'Computing Prediction...' : 'Generate Prediction'}
            </button>
          </form>
        </div>

        {/* Prediction Results Display */}
        <div className="lg:col-span-7 space-y-6">
          {error && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
              {error}
            </div>
          )}

          {result ? (
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 shadow-sm space-y-6">
              <div className="flex items-center justify-between border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>Inference Output for {result.bin_id}</span>
                  </h3>
                  <p className="text-xs text-slate-400">Horizon: {horizon}</p>
                </div>
                <RiskBadge level={result.risk_level} size="lg" />
              </div>

              {/* 4 Score Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="text-[11px] text-slate-400 mb-1">Current Fill</div>
                  <div className="text-xl font-mono font-bold text-slate-200">
                    {result.current_fill_level}%
                  </div>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-emerald-500/30 bg-emerald-500/[0.03]">
                  <div className="text-[11px] text-emerald-400 mb-1">Predicted Next Fill</div>
                  <div className="text-xl font-mono font-bold text-emerald-400">
                    {result.predicted_fill_level}%
                  </div>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="text-[11px] text-slate-400 mb-1">Overflow Probability</div>
                  <div className="text-xl font-mono font-bold text-white">
                    {Math.round(result.overflow_probability * 100)}%
                  </div>
                </div>

                <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                  <div className="text-[11px] text-slate-400 mb-1">Priority Urgency</div>
                  <div className="text-xl font-mono font-bold text-white">
                    {result.priority_score}
                  </div>
                </div>
              </div>

              {/* Feature Explanation Breakdown */}
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="text-xs font-semibold text-slate-300 flex items-center gap-2">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Model Decision Grounding & Explanation</span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  "{result.explanation}"
                </p>
                <div className="pt-2 flex flex-wrap gap-2 text-[11px]">
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    Zone: {zone}
                  </span>
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    Weather: {weather}
                  </span>
                  {eventFlag && (
                    <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                      Special Event Boost (+50%)
                    </span>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full min-h-[320px] rounded-2xl border border-dashed border-slate-800 flex flex-col items-center justify-center p-8 text-center text-slate-500 text-xs">
              <Sparkles className="w-8 h-8 text-slate-600 mb-3" />
              <p className="text-slate-400 font-medium">No active inference output</p>
              <p className="mt-1">Adjust parameters on the left and click "Generate Prediction".</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
