import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardPage } from './pages/DashboardPage';
import { BinAnalyticsPage } from './pages/BinAnalyticsPage';
import { PriorityListPage } from './pages/PriorityListPage';
import { MapViewPage } from './pages/MapViewPage';
import { PredictionsPage } from './pages/PredictionsPage';
import { ModelPerformancePage } from './pages/ModelPerformancePage';
import { DataManagementPage } from './pages/DataManagementPage';
import { EDAPage } from './pages/EDAPage';
import { AlertsPage } from './pages/AlertsPage';
import { PresentationPage } from './pages/PresentationPage';
import { SettingsPage } from './pages/SettingsPage';

import { api } from './services/api';
import {
  DashboardKPIs,
  BinItem,
  PriorityListResponse,
  ModelPerformanceData,
  EDAStats,
  AppSettings,
  AlertItem
} from './types';

export function App() {
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [selectedZone, setSelectedZone] = useState<string>('');

  // Data states
  const [dashboardData, setDashboardData] = useState<DashboardKPIs | null>(null);
  const [bins, setBins] = useState<BinItem[]>([]);
  const [priorityData, setPriorityData] = useState<PriorityListResponse | null>(null);
  const [mapBins, setMapBins] = useState<any[]>([]);
  const [edaStats, setEdaStats] = useState<EDAStats | null>(null);
  const [modelPerformance, setModelPerformance] = useState<ModelPerformanceData | null>(null);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [settings, setSettings] = useState<AppSettings | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isDemoLoading, setIsDemoLoading] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Show temporary toast notification
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4500);
  };

  // Primary loader
  const loadAllData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [kpiRes, binsRes, prioRes, mapRes, alertsRes, settingsRes] = await Promise.all([
        api.getDashboard(selectedZone),
        api.getBins(selectedZone),
        api.getPriorities(selectedZone),
        api.getMapData(selectedZone),
        api.getAlerts(false),
        api.getSettings(),
      ]);

      setDashboardData(kpiRes);
      setBins(binsRes);
      setPriorityData(prioRes);
      setMapBins(mapRes.bins || []);
      setAlerts(alertsRes);
      setSettings(settingsRes);
    } catch (err) {
      console.error('Error fetching core telemetry:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedZone]);

  // Load EDA or Model metrics on demand
  useEffect(() => {
    if (currentTab === 'eda') {
      api.getEDA(selectedZone).then(setEdaStats).catch(console.error);
    } else if (currentTab === 'model-performance') {
      api.getModelPerformance().then(setModelPerformance).catch(console.error);
    }
  }, [currentTab, selectedZone]);

  // Initial load
  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // 1-Click Demo Setup
  const handleDemoSetup = async () => {
    setIsDemoLoading(true);
    try {
      const res = await api.setupDemo();
      await loadAllData();
      if (currentTab === 'eda') {
        api.getEDA(selectedZone).then(setEdaStats).catch(console.error);
      }
      if (currentTab === 'model-performance') {
        api.getModelPerformance().then(setModelPerformance).catch(console.error);
      }
      showToast(`Demo Environment Initialized: ${res.readings_loaded} readings loaded & ML models trained!`);
    } catch (err: any) {
      showToast(`Demo Setup Failed: ${err.message}`);
    } finally {
      setIsDemoLoading(false);
    }
  };

  const handleResolveAlert = async (id: number) => {
    try {
      await api.resolveAlert(id);
      setAlerts((prev) => prev.filter((a) => a.id !== id));
      showToast('Alert marked as resolved.');
    } catch (err) {
      console.error(err);
    }
  };

  const handleExportPriorityCsv = () => {
    window.open(api.getExportUrl('priority'), '_blank');
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-slate-950 font-sans text-slate-100">
      {/* Sidebar */}
      <Sidebar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        alertCount={alerts.length}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Top Header */}
        <Header
          selectedZone={selectedZone}
          setSelectedZone={setSelectedZone}
          onRefresh={loadAllData}
          onDemoSetup={handleDemoSetup}
          isLoading={isLoading}
          isDemoLoading={isDemoLoading}
        />

        {/* Dynamic Toast Feedback */}
        {toastMessage && (
          <div className="fixed top-20 right-6 z-50 bg-emerald-500 text-slate-950 font-semibold text-xs px-4 py-2.5 rounded-xl shadow-2xl animate-in slide-in-from-top-3 flex items-center gap-2">
            <span>✓</span>
            <span>{toastMessage}</span>
          </div>
        )}

        {/* Tab Viewport */}
        <main className="flex-1 overflow-y-auto bg-slate-950/60">
          {currentTab === 'dashboard' && (
            <DashboardPage
              data={dashboardData}
              mapBins={mapBins}
              route={priorityData?.route_preview}
              isLoading={isLoading}
              onNavigate={setCurrentTab}
              onResolveAlert={handleResolveAlert}
            />
          )}

          {currentTab === 'bin-analytics' && <BinAnalyticsPage bins={bins} />}

          {currentTab === 'priority-list' && (
            <PriorityListPage
              items={priorityData?.items || []}
              routePreview={priorityData?.route_preview}
              isLoading={isLoading}
              onRefresh={loadAllData}
              onExportCsv={handleExportPriorityCsv}
            />
          )}

          {currentTab === 'map-view' && (
            <MapViewPage
              bins={mapBins}
              route={priorityData?.route_preview}
              isLoading={isLoading}
              onRefresh={loadAllData}
            />
          )}

          {currentTab === 'predictions' && (
            <PredictionsPage
              bins={bins}
              onBatchPredicted={loadAllData}
            />
          )}

          {currentTab === 'model-performance' && (
            <ModelPerformancePage
              data={modelPerformance}
              isLoading={isLoading}
              onRetrained={() => {
                api.getModelPerformance().then(setModelPerformance);
                loadAllData();
                showToast('Models successfully retrained and evaluated on test split!');
              }}
            />
          )}

          {currentTab === 'data-management' && (
            <DataManagementPage
              onDataChanged={() => {
                loadAllData();
                showToast('Database updated with new records!');
              }}
            />
          )}

          {currentTab === 'eda' && (
            <EDAPage
              data={edaStats}
              isLoading={isLoading}
              selectedZone={selectedZone}
              onZoneChange={setSelectedZone}
              onRefresh={() => api.getEDA(selectedZone).then(setEdaStats)}
            />
          )}

          {currentTab === 'alerts' && (
            <AlertsPage
              alerts={alerts}
              isLoading={isLoading}
              onResolve={handleResolveAlert}
              onRefresh={loadAllData}
            />
          )}

          {currentTab === 'presentation' && <PresentationPage />}

          {currentTab === 'settings' && (
            <SettingsPage
              settings={settings}
              onSettingsSaved={() => {
                loadAllData();
                showToast('Settings saved and priorities updated.');
              }}
            />
          )}
        </main>
      </div>
    </div>
  );
}

export default App;
