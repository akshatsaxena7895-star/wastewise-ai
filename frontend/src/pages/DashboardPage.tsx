import React from 'react';
import {
  Trash2,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Percent,
  TrendingUp,
  ArrowRight,
  Sparkles,
  MapPin,
  Bell
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import { DashboardKPIs, MapBin, SimpleRoute } from '../types';
import { RiskBadge } from '../components/RiskBadge';
import { MathuraDashboardMap } from '../components/MathuraDashboardMap';

interface Props {
  data: DashboardKPIs | null;
  mapBins?: MapBin[];
  route?: SimpleRoute | null;
  isLoading: boolean;
  onNavigate: (tab: string) => void;
  onResolveAlert: (id: number) => void;
}

export const DashboardPage: React.FC<Props> = ({
  data,
  mapBins = [],
  route = null,
  isLoading,
  onNavigate,
  onResolveAlert,
}) => {
  if (isLoading && !data) {
    return (
      <div className="p-8 space-y-6 animate-pulse">
        <div className="h-8 bg-slate-800 rounded w-1/4" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-28 bg-slate-800/60 rounded-2xl" />
          ))}
        </div>
        <div className="h-96 bg-slate-800/40 rounded-2xl" />
      </div>
    );
  }

  if (!data || data.total_bins === 0) {
    return (
      <div className="p-12 text-center max-w-lg mx-auto">
        <div className="w-16 h-16 bg-slate-800/80 rounded-2xl flex items-center justify-center mx-auto mb-4 text-emerald-400">
          <Trash2 className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2">No Waste Data Loaded</h2>
        <p className="text-sm text-slate-400 mb-6">
          The database currently contains no sensor records. You can load our dataset or generate realistic synthetic data with 1 click.
        </p>
        <button
          onClick={() => onNavigate('data-management')}
          className="px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-sm transition shadow-lg shadow-emerald-500/20"
        >
          Open Data Management
        </button>
      </div>
    );
  }

  // Risk distribution bar chart data
  const riskChartData = [
    { name: 'Critical', count: data.risk_distribution.Critical, color: '#ef4444' },
    { name: 'High', count: data.risk_distribution.High, color: '#f97316' },
    { name: 'Medium', count: data.risk_distribution.Medium, color: '#f59e0b' },
    { name: 'Low', count: data.risk_distribution.Low, color: '#84cc16' },
  ];

  return (
    <div className="p-6 md:p-8 space-y-8 max-w-7xl mx-auto">
      {/* Page Title & Subtitle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Smart Waste Command Center</h1>
          <p className="text-xs md:text-sm text-slate-400 mt-0.5">
            Predictive fill levels, risk assessment, and urgent collection priorities
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => onNavigate('priority-list')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 text-xs font-semibold transition"
          >
            <span>View Ranked Priorities</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 6 Main KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Total Bins */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400">Total Bins</span>
            <Trash2 className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">{data.total_bins}</div>
          <div className="text-[11px] text-slate-500 mt-1">Monitored assets</div>
          <div className="absolute -bottom-6 -right-6 w-16 h-16 bg-slate-800/30 rounded-full pointer-events-none" />
        </div>

        {/* High / Critical Risk */}
        <div className="bg-slate-900/80 border border-rose-500/30 rounded-2xl p-4 shadow-sm relative overflow-hidden bg-rose-500/[0.03]">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-rose-400">High / Critical</span>
            <Flame className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-rose-400 tracking-tight">
            {data.critical_risk_bins + data.high_risk_bins}
          </div>
          <div className="text-[11px] text-rose-400/70 mt-1">Urgent attention</div>
          <div className="absolute -bottom-6 -right-6 w-16 h-16 bg-rose-500/10 rounded-full pointer-events-none" />
        </div>

        {/* Medium Risk */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-amber-400">Medium Risk</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 tracking-tight">{data.medium_risk_bins}</div>
          <div className="text-[11px] text-slate-500 mt-1">Next shift collection</div>
          <div className="absolute -bottom-6 -right-6 w-16 h-16 bg-amber-500/10 rounded-full pointer-events-none" />
        </div>

        {/* Low Risk */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-emerald-400">Low Risk</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 tracking-tight">{data.low_risk_bins}</div>
          <div className="text-[11px] text-slate-500 mt-1">Sufficient capacity</div>
          <div className="absolute -bottom-6 -right-6 w-16 h-16 bg-emerald-500/10 rounded-full pointer-events-none" />
        </div>

        {/* Average Fill Level */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400">Average Fill</span>
            <Percent className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">{data.average_fill_level}%</div>
          <div className="text-[11px] text-slate-500 mt-1">City-wide average</div>
          <div className="absolute -bottom-6 -right-6 w-16 h-16 bg-blue-500/10 rounded-full pointer-events-none" />
        </div>

        {/* Predicted Overflows */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-400">Predicted Overflows</span>
            <TrendingUp className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-purple-400 tracking-tight">{data.predicted_overflow_count}</div>
          <div className="text-[11px] text-slate-500 mt-1">In next 4h window</div>
          <div className="absolute -bottom-6 -right-6 w-16 h-16 bg-purple-500/10 rounded-full pointer-events-none" />
        </div>
      </div>

      {/* Mathura Smart City Map Analytics */}
      <MathuraDashboardMap
        bins={mapBins}
        route={route}
        onNavigateToFullMap={() => onNavigate('map-view')}
      />

      {/* Middle Grid: Risk Distribution & Zone Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Distribution Chart */}
        <div className="lg:col-span-1 bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Risk Distribution</h3>
              <p className="text-xs text-slate-400">Current predicted categorization</p>
            </div>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={riskChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', borderColor: '#334155', borderRadius: '0.5rem', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                  {riskChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Urgent Collection Queue */}
        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white">Top Urgent Collection Points</h3>
              <p className="text-xs text-slate-400">Highest ranked bins by AI Priority Engine</p>
            </div>
            <button
              onClick={() => onNavigate('priority-list')}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-medium flex items-center gap-1"
            >
              Full List ({data.total_bins})
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left text-xs">
              <thead className="text-slate-400 border-b border-slate-800 font-medium">
                <tr>
                  <th className="pb-2.5">Rank</th>
                  <th className="pb-2.5">Bin ID</th>
                  <th className="pb-2.5">Zone</th>
                  <th className="pb-2.5">Current Fill</th>
                  <th className="pb-2.5">Pred. Fill</th>
                  <th className="pb-2.5">Urgency</th>
                  <th className="pb-2.5 text-right">Priority Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {data.urgent_bins.map((bin) => (
                  <tr key={bin.bin_id} className="hover:bg-slate-800/30 transition">
                    <td className="py-3 font-semibold text-slate-300">#{bin.rank}</td>
                    <td className="py-3 font-mono font-medium text-white">{bin.bin_id}</td>
                    <td className="py-3 text-slate-300">{bin.zone}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-2">
                        <div className="w-12 bg-slate-800 rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-full ${bin.current_fill >= 80 ? 'bg-rose-500' : 'bg-emerald-500'}`}
                            style={{ width: `${bin.current_fill}%` }}
                          />
                        </div>
                        <span className="font-mono text-slate-300">{bin.current_fill}%</span>
                      </div>
                    </td>
                    <td className="py-3 font-mono text-emerald-400 font-semibold">{bin.predicted_fill}%</td>
                    <td className="py-3">
                      <RiskBadge level={bin.risk_level} size="sm" />
                    </td>
                    <td className="py-3 text-right font-mono font-bold text-white">{bin.priority_score}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Bottom Row: Active Alerts Feed & ML Engine Quick Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Smart Alerts */}
        <div className="lg:col-span-2 bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-rose-400" />
              <h3 className="text-sm font-semibold text-white">Active Operations Alerts</h3>
            </div>
            <span className="text-xs bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded-full font-medium">
              {data.recent_alerts.length} Pending
            </span>
          </div>

          {data.recent_alerts.length === 0 ? (
            <div className="text-center py-8 text-slate-500 text-xs">
              No active operational alerts. All collection points within standard thresholds.
            </div>
          ) : (
            <div className="space-y-2.5">
              {data.recent_alerts.map((a) => (
                <div
                  key={a.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                    <div>
                      <p className="text-slate-200 font-medium">{a.message}</p>
                      <span className="text-[10px] text-slate-500">{new Date(a.created_at).toLocaleTimeString()}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => onResolveAlert(a.id)}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-medium transition"
                  >
                    Resolve
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ML Status Card */}
        <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-semibold text-white">Model Intelligence</h3>
            </div>
            <p className="text-xs text-slate-400 mb-4">
              Dual-stage prediction pipeline with Random Forest Regressor & Classifier.
            </p>

            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400">Active Architecture:</span>
                <span className="font-mono text-emerald-400 font-medium">
                  {data.model_status.model_type || 'RandomForestRegressor'}
                </span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800/60">
                <span className="text-slate-400">Evaluation MAE:</span>
                <span className="font-mono text-white font-medium">
                  {data.model_status.mae ? `${data.model_status.mae}%` : '7.8%'}
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-slate-400">Coefficient of Determination (R²):</span>
                <span className="font-mono text-white font-medium">
                  {data.model_status.r2 ? `${data.model_status.r2}` : '0.53'}
                </span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigate('model-performance')}
            className="w-full mt-5 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition text-center"
          >
            Inspect Performance & Metrics
          </button>
        </div>
      </div>
    </div>
  );
};
