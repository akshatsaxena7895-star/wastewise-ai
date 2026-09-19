import React, { useState, useEffect } from 'react';
import {
  Upload,
  Database,
  PlusCircle,
  Table,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Sliders,
  Download,
  RefreshCw
} from 'lucide-react';
import { api } from '../services/api';
import { SensorRecord } from '../types';

interface Props {
  onDataChanged: () => void;
}

export const DataManagementPage: React.FC<Props> = ({ onDataChanged }) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'synthetic' | 'manual' | 'table'>('upload');

  // Tab A: Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [isValidating, setIsValidating] = useState<boolean>(false);
  const [isImporting, setIsImporting] = useState<boolean>(false);
  const [uploadMessage, setUploadMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Tab B: Synthetic Generator State
  const [numBins, setNumBins] = useState<number>(50);
  const [numDays, setNumDays] = useState<number>(30);
  const [readingsPerDay, setReadingsPerDay] = useState<number>(4);
  const [incWeather, setIncWeather] = useState<boolean>(true);
  const [incEvents, setIncEvents] = useState<boolean>(true);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [genMessage, setGenMessage] = useState<string | null>(null);

  // Tab C: Manual Entry State
  const [manualBinId, setManualBinId] = useState<string>('BIN_001');
  const [manualFill, setManualFill] = useState<number>(50);
  const [manualZone, setManualZone] = useState<string>('Commercial');
  const [manualWeather, setManualWeather] = useState<string>('Clear');
  const [manualDayType, setManualDayType] = useState<string>('Weekday');
  const [manualEvent, setManualEvent] = useState<boolean>(false);
  const [isAddingRecord, setIsAddingRecord] = useState<boolean>(false);
  const [manualSuccess, setManualSuccess] = useState<string | null>(null);

  // Tab D: Data Table State
  const [tableData, setTableData] = useState<SensorRecord[]>([]);
  const [page, setPage] = useState<number>(1);
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [zoneFilter, setZoneFilter] = useState<string>('');
  const [isTableLoading, setIsTableLoading] = useState<boolean>(false);

  // Load Table records when Tab D is active
  useEffect(() => {
    if (activeTab === 'table') {
      loadRecords();
    }
  }, [activeTab, page, zoneFilter]);

  const loadRecords = async () => {
    setIsTableLoading(true);
    try {
      const res = await api.getReadings(page, 25, zoneFilter);
      setTableData(res.records);
      setTotalRecords(res.total);
    } catch (err) {
      console.error(err);
    } finally {
      setIsTableLoading(false);
    }
  };

  // Upload Handlers
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
      setValidationResult(null);
      setUploadMessage(null);
    }
  };

  const handleValidate = async () => {
    if (!selectedFile) return;
    setIsValidating(true);
    setUploadMessage(null);
    try {
      const res = await api.uploadValidate(selectedFile);
      setValidationResult(res);
    } catch (err: any) {
      setUploadMessage({ type: 'error', text: err.message || 'Validation failed' });
    } finally {
      setIsValidating(false);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;
    setIsImporting(true);
    try {
      const res = await api.importDataset(selectedFile);
      setUploadMessage({
        type: 'success',
        text: `Successfully imported ${res.readings_imported} readings and updated ${res.bins_created} bins!`,
      });
      onDataChanged();
    } catch (err: any) {
      setUploadMessage({ type: 'error', text: err.message || 'Import failed' });
    } finally {
      setIsImporting(false);
    }
  };

  // Synthetic Generator Handler
  const handleGenerate = async () => {
    setIsGenerating(true);
    setGenMessage(null);
    try {
      const res = await api.generateSynthetic({
        num_bins: numBins,
        num_days: numDays,
        readings_per_day: readingsPerDay,
        include_weather: incWeather,
        include_events: incEvents,
        add_noise: true,
      });
      setGenMessage(`Generated and ingested ${res.readings_generated} realistic records for ${res.bins_created} bins!`);
      onDataChanged();
    } catch (err: any) {
      setGenMessage(`Error generating data: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Manual Entry Handler
  const handleAddRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAddingRecord(true);
    setManualSuccess(null);
    try {
      await api.addReading({
        bin_id: manualBinId,
        timestamp: new Date().toISOString(),
        fill_level: manualFill,
        weather: manualWeather,
        day_type: manualDayType,
        event_flag: manualEvent,
      });
      setManualSuccess(`Record successfully added for ${manualBinId}!`);
      onDataChanged();
    } catch (err: any) {
      setManualSuccess(`Failed to add record: ${err.message}`);
    } finally {
      setIsAddingRecord(false);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Data Management Center</h1>
        <p className="text-xs md:text-sm text-slate-400 mt-0.5">
          Upload municipal datasets, generate calibrated synthetic environments, or manage sensor telemetry
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-800 space-x-2">
        <button
          onClick={() => setActiveTab('upload')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition ${
            activeTab === 'upload'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Upload className="w-4 h-4" />
          <span>Upload Dataset</span>
        </button>

        <button
          onClick={() => setActiveTab('synthetic')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition ${
            activeTab === 'synthetic'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Database className="w-4 h-4" />
          <span>Synthetic Generator</span>
        </button>

        <button
          onClick={() => setActiveTab('manual')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition ${
            activeTab === 'manual'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <PlusCircle className="w-4 h-4" />
          <span>Manual Entry</span>
        </button>

        <button
          onClick={() => setActiveTab('table')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition ${
            activeTab === 'table'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Table className="w-4 h-4" />
          <span>View Dataset Table</span>
        </button>
      </div>

      {/* Tab A: Upload Dataset */}
      {activeTab === 'upload' && (
        <div className="space-y-6 max-w-3xl">
          <div className="p-8 border-2 border-dashed border-slate-800 rounded-2xl bg-slate-900/40 text-center hover:border-slate-700 transition">
            <input
              type="file"
              id="file-upload"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
            />
            <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
              <Upload className="w-10 h-10 text-slate-500 mb-3" />
              <span className="text-sm font-semibold text-slate-200">
                {selectedFile ? selectedFile.name : 'Click to select or drag CSV / XLSX file'}
              </span>
              <span className="text-xs text-slate-500 mt-1">
                Expected columns: bin_id, timestamp, fill_level, location_zone, last_collection...
              </span>
            </label>
          </div>

          {selectedFile && (
            <div className="flex items-center gap-3">
              <button
                onClick={handleValidate}
                disabled={isValidating}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition disabled:opacity-50"
              >
                {isValidating ? 'Validating...' : 'Validate Dataset'}
              </button>

              <button
                onClick={handleImport}
                disabled={isImporting || !validationResult?.is_valid}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 text-xs font-bold transition shadow-md shadow-emerald-500/20 disabled:opacity-50"
              >
                {isImporting ? 'Importing...' : 'Import Dataset'}
              </button>
            </div>
          )}

          {uploadMessage && (
            <div
              className={`p-4 rounded-xl text-xs flex items-center gap-2.5 ${
                uploadMessage.type === 'success'
                  ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
              }`}
            >
              {uploadMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertTriangle className="w-4 h-4 shrink-0" />
              )}
              <span>{uploadMessage.text}</span>
            </div>
          )}

          {validationResult && (
            <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4 text-xs">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <span className="font-semibold text-white">Validation Report: {validationResult.filename}</span>
                <span
                  className={`px-2.5 py-1 rounded-full font-bold ${
                    validationResult.is_valid
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                  }`}
                >
                  {validationResult.is_valid ? 'Valid Schema' : 'Validation Failed'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-300">
                <div className="p-2.5 bg-slate-950 rounded-lg">
                  <div className="text-slate-500 text-[10px]">Total Rows</div>
                  <div className="font-bold text-sm text-white">{validationResult.total_rows}</div>
                </div>
                <div className="p-2.5 bg-slate-950 rounded-lg">
                  <div className="text-slate-500 text-[10px]">Missing Values</div>
                  <div className="font-bold text-sm text-white">{validationResult.missing_values_count}</div>
                </div>
                <div className="p-2.5 bg-slate-950 rounded-lg">
                  <div className="text-slate-500 text-[10px]">Duplicates</div>
                  <div className="font-bold text-sm text-white">{validationResult.duplicate_rows_count}</div>
                </div>
                <div className="p-2.5 bg-slate-950 rounded-lg">
                  <div className="text-slate-500 text-[10px]">Invalid Fills (&lt;0 or &gt;100)</div>
                  <div className="font-bold text-sm text-white">{validationResult.invalid_fill_values_count}</div>
                </div>
              </div>

              {validationResult.errors.length > 0 && (
                <div className="space-y-1 text-rose-400 bg-rose-500/10 p-3 rounded-lg">
                  {validationResult.errors.map((err: string, idx: number) => (
                    <div key={idx}>• {err}</div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab B: Synthetic Data Generator */}
      {activeTab === 'synthetic' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 max-w-2xl space-y-6 text-xs">
          <div>
            <h3 className="text-sm font-semibold text-white">Synthetic Environment Calibration</h3>
            <p className="text-slate-400 mt-0.5">
              Generates realistic temporal patterns with zone multipliers, weekend peaks, weather saturation, and collection resets.
            </p>
          </div>

          <div className="space-y-4">
            {/* Number of Bins */}
            <div>
              <div className="flex justify-between text-slate-400 font-medium mb-1">
                <span>Number of Bins</span>
                <span className="text-white font-mono font-bold">{numBins}</span>
              </div>
              <input
                type="range"
                min="10"
                max="250"
                value={numBins}
                onChange={(e) => setNumBins(Number(e.target.value))}
                className="w-full accent-emerald-500"
              />
            </div>

            {/* Number of Days */}
            <div>
              <div className="flex justify-between text-slate-400 font-medium mb-1">
                <span>Historical Days</span>
                <span className="text-white font-mono font-bold">{numDays} days</span>
              </div>
              <input
                type="range"
                min="7"
                max="90"
                value={numDays}
                onChange={(e) => setNumDays(Number(e.target.value))}
                className="w-full accent-emerald-500"
              />
            </div>

            {/* Readings Per Day */}
            <div>
              <label className="block text-slate-400 font-medium mb-1">Readings per Day</label>
              <select
                value={readingsPerDay}
                onChange={(e) => setReadingsPerDay(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none"
              >
                <option value={1}>1 reading / day (24-hour)</option>
                <option value={2}>2 readings / day (12-hour)</option>
                <option value={4}>4 readings / day (6-hour standard)</option>
                <option value={8}>8 readings / day (3-hour)</option>
              </select>
            </div>

            {/* Toggles */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-300">Weather & Rain Impact</span>
                <input
                  type="checkbox"
                  checked={incWeather}
                  onChange={(e) => setIncWeather(e.target.checked)}
                  className="w-4 h-4 accent-emerald-500"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800">
                <span className="text-slate-300">Festivals & Events</span>
                <input
                  type="checkbox"
                  checked={incEvents}
                  onChange={(e) => setIncEvents(e.target.checked)}
                  className="w-4 h-4 accent-emerald-500"
                />
              </div>
            </div>

            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] text-slate-400">
              Estimated Total Records:{' '}
              <span className="font-mono text-emerald-400 font-bold">
                {(numBins * numDays * readingsPerDay).toLocaleString()} rows
              </span>
            </div>

            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition shadow-lg shadow-emerald-500/20 disabled:opacity-50"
            >
              {isGenerating ? 'Simulating Environment...' : 'Generate and Ingest Dataset'}
            </button>

            {genMessage && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">
                {genMessage}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab C: Manual Entry */}
      {activeTab === 'manual' && (
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 max-w-xl space-y-4 text-xs">
          <h3 className="text-sm font-semibold text-white">Manual Sensor Reading Entry</h3>

          <form onSubmit={handleAddRecord} className="space-y-4">
            <div>
              <label className="block text-slate-400 mb-1">Bin Identifier</label>
              <input
                type="text"
                value={manualBinId}
                onChange={(e) => setManualBinId(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-400 mb-1">
                <span>Fill Level (%)</span>
                <span className="font-mono font-bold text-white">{manualFill}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={manualFill}
                onChange={(e) => setManualFill(Number(e.target.value))}
                className="w-full accent-emerald-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-400 mb-1">Zone</label>
                <select
                  value={manualZone}
                  onChange={(e) => setManualZone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200"
                >
                  {['Market', 'Commercial', 'Residential', 'IT Park', 'Industrial', 'Mixed'].map((z) => (
                    <option key={z} value={z}>
                      {z}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Weather</label>
                <select
                  value={manualWeather}
                  onChange={(e) => setManualWeather(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200"
                >
                  {['Clear', 'Overcast', 'Rain', 'Storm'].map((w) => (
                    <option key={w} value={w}>
                      {w}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              disabled={isAddingRecord}
              className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition disabled:opacity-50"
            >
              {isAddingRecord ? 'Saving...' : 'Add Record to Database'}
            </button>

            {manualSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs">
                {manualSuccess}
              </div>
            )}
          </form>
        </div>
      )}

      {/* Tab D: Data Table */}
      {activeTab === 'table' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <select
                value={zoneFilter}
                onChange={(e) => {
                  setZoneFilter(e.target.value);
                  setPage(1);
                }}
                className="bg-slate-900 border border-slate-800 text-slate-300 rounded-xl px-3 py-1.5 text-xs"
              >
                <option value="">All Zones</option>
                {['Market', 'Commercial', 'Residential', 'IT Park', 'Industrial', 'Mixed'].map((z) => (
                  <option key={z} value={z}>
                    {z}
                  </option>
                ))}
              </select>

              <button
                onClick={loadRecords}
                className="p-1.5 bg-slate-800 rounded-lg text-slate-400 hover:text-white"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTableLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            <div className="text-xs text-slate-400">
              Total Database Records: <span className="text-white font-mono font-bold">{totalRecords}</span>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-slate-400 bg-slate-950/60 border-b border-slate-800 font-medium">
                  <tr>
                    <th className="py-3 px-4">Bin ID</th>
                    <th className="py-3 px-4">Timestamp</th>
                    <th className="py-3 px-4">Fill Level</th>
                    <th className="py-3 px-4">Zone</th>
                    <th className="py-3 px-4">Weather</th>
                    <th className="py-3 px-4">Day Type</th>
                    <th className="py-3 px-4">Event</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {tableData.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-800/30">
                      <td className="py-2.5 px-4 font-mono font-medium text-white">{r.bin_id}</td>
                      <td className="py-2.5 px-4 text-slate-400">
                        {new Date(r.timestamp).toLocaleString()}
                      </td>
                      <td className="py-2.5 px-4 font-mono font-bold text-slate-200">{r.fill_level}%</td>
                      <td className="py-2.5 px-4 text-slate-300">{r.zone}</td>
                      <td className="py-2.5 px-4 text-slate-400">{r.weather}</td>
                      <td className="py-2.5 px-4 text-slate-400">{r.day_type}</td>
                      <td className="py-2.5 px-4 text-slate-400">{r.event_flag ? 'Yes' : 'No'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Page {page} of {Math.ceil(totalRecords / 25) || 1}</span>
            <div className="flex gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                disabled={page * 25 >= totalRecords}
                onClick={() => setPage(page + 1)}
                className="px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
