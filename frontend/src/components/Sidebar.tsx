import React from 'react';
import {
  LayoutDashboard,
  Trash2,
  ListOrdered,
  MapPin,
  Sparkles,
  BarChart3,
  Database,
  LineChart,
  Bell,
  Settings,
  Presentation,
  CheckCircle2
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  alertCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, setCurrentTab, alertCount = 0 }) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'bin-analytics', label: 'Bin Analytics', icon: Trash2 },
    { id: 'priority-list', label: 'Priority List', icon: ListOrdered },
    { id: 'map-view', label: 'Map View', icon: MapPin },
    { id: 'predictions', label: 'Predictions', icon: Sparkles },
    { id: 'model-performance', label: 'Model Performance', icon: BarChart3 },
    { id: 'data-management', label: 'Data Management', icon: Database },
    { id: 'eda', label: 'EDA Analytics', icon: LineChart },
    { id: 'alerts', label: 'Alerts', icon: Bell, badge: alertCount },
    { id: 'presentation', label: 'Hackathon Overview', icon: Presentation },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-screen select-none shrink-0">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-lime-400 via-emerald-500 to-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-500/25 text-slate-950">
          <Trash2 className="w-6 h-6 stroke-[2.2]" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-lg tracking-tight text-white">WasteWise</span>
            <span className="text-xs bg-emerald-500/20 text-emerald-400 font-semibold px-1.5 py-0.5 rounded border border-emerald-500/30">AI</span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium">Smart City Collection</p>
        </div>
      </div>

      {/* Nav List */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setCurrentTab(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                isActive
                  ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && item.badge > 0 ? (
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-rose-500 text-white">
                  {item.badge}
                </span>
              ) : null}
            </button>
          );
        })}
      </nav>

      {/* Footer System Status */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/40">
        <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            Engine Online
          </span>
          <span className="text-[11px] font-mono text-slate-500">v1.2.0</span>
        </div>
        <div className="text-[11px] text-slate-500 flex items-center gap-1 mt-1">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
          <span>ML Core Active</span>
        </div>
      </div>
    </aside>
  );
};
