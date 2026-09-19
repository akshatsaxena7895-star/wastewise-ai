import React, { useState, useMemo } from 'react';
import {
  Download,
  Filter,
  ArrowUpDown,
  Navigation,
  Sparkles,
  Info,
  CheckCircle2,
  RefreshCw
} from 'lucide-react';
import { PriorityItem, SimpleRoute } from '../types';
import { RiskBadge } from '../components/RiskBadge';
import { RouteModal } from '../components/RouteModal';

interface Props {
  items: PriorityItem[];
  routePreview?: SimpleRoute;
  isLoading: boolean;
  onRefresh: () => void;
  onExportCsv: () => void;
}

export const PriorityListPage: React.FC<Props> = ({
  items,
  routePreview,
  isLoading,
  onRefresh,
  onExportCsv
}) => {
  const [filterZone, setFilterZone] = useState<string>('All');
  const [filterRisk, setFilterRisk] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'priority' | 'predicted_fill' | 'overflow_prob' | 'days'>('priority');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [isRouteOpen, setIsRouteOpen] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');

  const filteredAndSorted = useMemo(() => {
    return items
      .filter((item) => {
        if (filterZone !== 'All' && item.zone !== filterZone) return false;
        if (filterRisk !== 'All' && item.risk_level !== filterRisk) return false;
        if (searchTerm) {
          const s = searchTerm.toLowerCase();
          return item.bin_id.toLowerCase().includes(s) || item.location.toLowerCase().includes(s);
        }
        return true;
      })
      .sort((a, b) => {
        let valA = a.priority_score;
        let valB = b.priority_score;

        if (sortBy === 'predicted_fill') {
          valA = a.predicted_fill;
          valB = b.predicted_fill;
        } else if (sortBy === 'overflow_prob') {
          valA = a.overflow_probability;
          valB = b.overflow_probability;
        } else if (sortBy === 'days') {
          valA = a.days_since_collection;
          valB = b.days_since_collection;
        }

        return sortOrder === 'desc' ? valB - valA : valA - valB;
      });
  }, [items, filterZone, filterRisk, sortBy, sortOrder, searchTerm]);

  const toggleSort = (field: 'priority' | 'predicted_fill' | 'overflow_prob' | 'days') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const zones = ['All', 'Market', 'Commercial', 'Residential', 'IT Park', 'Industrial', 'Mixed'];
  const risks = ['All', 'Critical', 'High', 'Medium', 'Low'];

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Priority Collection List</h1>
          <p className="text-xs md:text-sm text-slate-400 mt-0.5">
            Real-time multi-factor prioritization engine ranking collection points by urgency
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsRouteOpen(true)}
            disabled={!routePreview}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-blue-500/15 hover:bg-blue-500/25 border border-blue-500/30 text-blue-400 text-xs font-semibold transition disabled:opacity-50"
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Illustrative Route</span>
          </button>

          <button
            onClick={onExportCsv}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={onRefresh}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
            title="Recalculate Priorities"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Transparent Formula Callout */}
      <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
        <div className="flex items-start gap-3">
          <Info className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <div className="font-semibold text-slate-200">Transparent Scoring Formulation:</div>
            <div className="font-mono text-emerald-400 mt-0.5">
              Priority = 0.50 × PredFill + 0.25 × OverflowProb + 0.15 × DaysSinceCollection + 0.10 × CurrentFill
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-slate-400">Classification:</span>
          <span className="text-rose-400 font-medium">90+ Critical</span>
          <span className="text-slate-600">•</span>
          <span className="text-orange-400 font-medium">75-89 High</span>
          <span className="text-slate-600">•</span>
          <span className="text-amber-400 font-medium">50-74 Medium</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800/80">
        <div className="flex flex-wrap items-center gap-3">
          {/* Search */}
          <input
            type="text"
            placeholder="Search Bin ID or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 w-52"
          />

          {/* Zone Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <Filter className="w-3.5 h-3.5" />
            <span>Zone:</span>
            <select
              value={filterZone}
              onChange={(e) => setFilterZone(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-200 rounded-lg px-2.5 py-1 text-xs focus:outline-none"
            >
              {zones.map((z) => (
                <option key={z} value={z}>
                  {z}
                </option>
              ))}
            </select>
          </div>

          {/* Risk Filter */}
          <div className="flex items-center gap-1.5 text-xs text-slate-400">
            <span>Urgency:</span>
            <select
              value={filterRisk}
              onChange={(e) => setFilterRisk(e.target.value)}
              className="bg-slate-950 border border-slate-800 text-slate-200 rounded-lg px-2.5 py-1 text-xs focus:outline-none"
            >
              {risks.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="text-xs text-slate-400">
          Showing <span className="text-white font-semibold">{filteredAndSorted.length}</span> of{' '}
          <span className="text-slate-300">{items.length}</span> bins
        </div>
      </div>

      {/* Priority Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-slate-400 bg-slate-950/60 border-b border-slate-800 font-medium select-none">
              <tr>
                <th className="py-3.5 px-4 w-16">Rank</th>
                <th className="py-3.5 px-4">Bin ID</th>
                <th className="py-3.5 px-4">Location</th>
                <th className="py-3.5 px-4">Zone</th>
                <th className="py-3.5 px-4">Current Fill</th>
                <th
                  className="py-3.5 px-4 cursor-pointer hover:text-white"
                  onClick={() => toggleSort('predicted_fill')}
                >
                  <div className="flex items-center gap-1">
                    <span>Pred. Fill</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th
                  className="py-3.5 px-4 cursor-pointer hover:text-white"
                  onClick={() => toggleSort('overflow_prob')}
                >
                  <div className="flex items-center gap-1">
                    <span>Overflow Risk</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th className="py-3.5 px-4">Urgency</th>
                <th
                  className="py-3.5 px-4 cursor-pointer hover:text-white"
                  onClick={() => toggleSort('days')}
                >
                  <div className="flex items-center gap-1">
                    <span>Last Emptied</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th
                  className="py-3.5 px-4 text-right cursor-pointer hover:text-white"
                  onClick={() => toggleSort('priority')}
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Priority Score</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-500" />
                  </div>
                </th>
                <th className="py-3.5 px-4">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredAndSorted.map((bin) => (
                <tr key={bin.bin_id} className="hover:bg-slate-800/30 transition group">
                  <td className="py-3 px-4 font-bold text-slate-400">#{bin.rank}</td>
                  <td className="py-3 px-4 font-mono font-semibold text-white">{bin.bin_id}</td>
                  <td className="py-3 px-4 text-slate-300 max-w-xs truncate">{bin.location}</td>
                  <td className="py-3 px-4 text-slate-300">{bin.zone}</td>
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <div className="w-10 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                        <div
                          className={`h-full ${bin.current_fill >= 80 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                          style={{ width: `${bin.current_fill}%` }}
                        />
                      </div>
                      <span className="font-mono text-slate-300">{bin.current_fill}%</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 font-mono font-semibold text-emerald-400">{bin.predicted_fill}%</td>
                  <td className="py-3 px-4 font-mono text-slate-300">
                    {Math.round(bin.overflow_probability * 100)}%
                  </td>
                  <td className="py-3 px-4">
                    <RiskBadge level={bin.risk_level} size="sm" />
                  </td>
                  <td className="py-3 px-4 text-slate-400">
                    {bin.days_since_collection} days ago
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-white text-sm">
                    {bin.priority_score}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-1 rounded text-[11px] font-medium ${
                        bin.action === 'Immediate Dispatch'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : bin.action === 'Next Shift'
                          ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {bin.action}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Route Modal */}
      <RouteModal
        isOpen={isRouteOpen}
        onClose={() => setIsRouteOpen(false)}
        route={routePreview || null}
      />
    </div>
  );
};
