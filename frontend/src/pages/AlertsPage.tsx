import React, { useState } from 'react';
import { Bell, CheckCircle2, AlertTriangle, Flame, ShieldAlert, RefreshCw } from 'lucide-react';
import { AlertItem } from '../types';
import { RiskBadge } from '../components/RiskBadge';

interface Props {
  alerts: AlertItem[];
  isLoading: boolean;
  onResolve: (id: number) => void;
  onRefresh: () => void;
}

export const AlertsPage: React.FC<Props> = ({ alerts, isLoading, onResolve, onRefresh }) => {
  const [filterSeverity, setFilterSeverity] = useState<string>('All');

  const filteredAlerts = alerts.filter((a) => {
    if (filterSeverity !== 'All' && a.severity !== filterSeverity) return false;
    return true;
  });

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Smart City Operations Alerts</h1>
          <p className="text-xs md:text-sm text-slate-400 mt-0.5">
            Real-time threshold breaches, overflow probability spikes, and zone congestion alerts
          </p>
        </div>

        <button
          onClick={onRefresh}
          className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
        </button>
      </div>

      {/* Filter Ribbon */}
      <div className="flex items-center justify-between bg-slate-900/60 p-4 rounded-2xl border border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-400">Filter Severity:</span>
          {['All', 'Critical', 'High', 'Medium'].map((sev) => (
            <button
              key={sev}
              onClick={() => setFilterSeverity(sev)}
              className={`px-3 py-1 rounded-lg font-medium transition ${
                filterSeverity === sev
                  ? 'bg-slate-800 text-white border border-slate-700'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>

        <span className="text-slate-400">
          Showing <strong className="text-white">{filteredAlerts.length}</strong> alerts
        </span>
      </div>

      {/* Alerts Feed */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="p-12 text-center text-slate-500 border border-dashed border-slate-800 rounded-2xl">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <p className="text-white font-medium text-sm">All Clear</p>
            <p className="text-xs mt-1">No active operational alerts matching your criteria.</p>
          </div>
        ) : (
          filteredAlerts.map((alert) => (
            <div
              key={alert.id}
              className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between gap-4 transition hover:border-slate-700"
            >
              <div className="flex items-start gap-3.5">
                <div className="mt-0.5">
                  <RiskBadge level={alert.severity} size="sm" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-200">{alert.message}</p>
                  <div className="flex items-center gap-3 text-[11px] text-slate-500 mt-1">
                    {alert.bin_id && <span className="font-mono text-slate-400">Asset: {alert.bin_id}</span>}
                    <span>•</span>
                    <span>Type: {alert.alert_type}</span>
                    <span>•</span>
                    <span>{new Date(alert.created_at).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => onResolve(alert.id)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700 transition shrink-0"
              >
                Resolve
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
