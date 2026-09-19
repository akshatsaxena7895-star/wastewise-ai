import React, { useState, useEffect } from 'react';
import { Settings, Save, Sliders, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import { AppSettings } from '../types';
import { api } from '../services/api';

interface Props {
  settings: AppSettings | null;
  onSettingsSaved: () => void;
}

export const SettingsPage: React.FC<Props> = ({ settings, onSettingsSaved }) => {
  const [wPred, setWPred] = useState<number>(50);
  const [wOver, setWOver] = useState<number>(25);
  const [wDays, setWDays] = useState<number>(15);
  const [wCurr, setWCurr] = useState<number>(10);

  const [thCrit, setThCrit] = useState<number>(90);
  const [thHigh, setThHigh] = useState<number>(75);
  const [thMed, setThMed] = useState<number>(50);

  const [horizon, setHorizon] = useState<string>('Next collection window (4 hrs)');
  const [activeModel, setActiveModel] = useState<string>('RandomForestRegressor');

  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (settings) {
      setWPred(Math.round(settings.priority_weights.predicted_fill * 100));
      setWOver(Math.round(settings.priority_weights.overflow_prob * 100));
      setWDays(Math.round(settings.priority_weights.days_since_collection * 100));
      setWCurr(Math.round(settings.priority_weights.current_fill * 100));

      setThCrit(settings.risk_thresholds.critical);
      setThHigh(settings.risk_thresholds.high);
      setThMed(settings.risk_thresholds.medium);

      setHorizon(settings.prediction_horizon || 'Next collection window (4 hrs)');
      setActiveModel(settings.active_model || 'RandomForestRegressor');
    }
  }, [settings]);

  const totalWeight = wPred + wOver + wDays + wCurr;
  const isWeightValid = totalWeight === 100;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isWeightValid) {
      setSaveMessage({ type: 'error', text: `Priority weights must sum exactly to 100%. Current sum: ${totalWeight}%` });
      return;
    }

    setIsSaving(true);
    setSaveMessage(null);
    try {
      await api.updateSettings({
        priority_weights: {
          predicted_fill: wPred / 100.0,
          overflow_prob: wOver / 100.0,
          days_since_collection: wDays / 100.0,
          current_fill: wCurr / 100.0,
        },
        risk_thresholds: {
          critical: thCrit,
          high: thHigh,
          medium: thMed,
        },
        prediction_horizon: horizon,
        active_model: activeModel,
      });

      setSaveMessage({ type: 'success', text: 'Settings saved and fleet priorities recalculated successfully!' });
      onSettingsSaved();
    } catch (err: any) {
      setSaveMessage({ type: 'error', text: err.message || 'Failed to update settings' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">System & Algorithm Settings</h1>
        <p className="text-xs md:text-sm text-slate-400 mt-0.5">
          Configure transparent priority weights, urgency thresholds, and ML inference horizons
        </p>
      </div>

      <form onSubmit={handleSave} className="space-y-6 text-xs">
        {/* Priority Weights Section */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-semibold text-white">Priority Scoring Weights</h3>
              <p className="text-slate-400 text-[11px]">Weights must sum to exactly 100%</p>
            </div>
            <span
              className={`px-2.5 py-1 rounded-full font-mono font-bold ${
                isWeightValid
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
              }`}
            >
              Sum: {totalWeight}%
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex justify-between text-slate-400 font-medium mb-1">
                <span>Predicted Fill Level Weight</span>
                <span className="font-mono text-white font-bold">{wPred}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={wPred}
                onChange={(e) => setWPred(Number(e.target.value))}
                className="w-full accent-emerald-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-400 font-medium mb-1">
                <span>Overflow Probability Weight</span>
                <span className="font-mono text-white font-bold">{wOver}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={wOver}
                onChange={(e) => setWOver(Number(e.target.value))}
                className="w-full accent-emerald-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-400 font-medium mb-1">
                <span>Days Since Collection Weight</span>
                <span className="font-mono text-white font-bold">{wDays}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={wDays}
                onChange={(e) => setWDays(Number(e.target.value))}
                className="w-full accent-emerald-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-400 font-medium mb-1">
                <span>Current Fill Level Weight</span>
                <span className="font-mono text-white font-bold">{wCurr}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={wCurr}
                onChange={(e) => setWCurr(Number(e.target.value))}
                className="w-full accent-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Risk Thresholds Section */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 space-y-4">
          <h3 className="text-sm font-semibold text-white border-b border-slate-800 pb-3">
            Risk Classification Thresholds
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <div className="flex justify-between text-slate-400 font-medium mb-1">
                <span className="text-rose-400">Critical Risk Threshold</span>
                <span className="font-mono text-white font-bold">{thCrit}%</span>
              </div>
              <input
                type="range"
                min="70"
                max="98"
                value={thCrit}
                onChange={(e) => setThCrit(Number(e.target.value))}
                className="w-full accent-rose-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-400 font-medium mb-1">
                <span className="text-orange-400">High Risk Threshold</span>
                <span className="font-mono text-white font-bold">{thHigh}%</span>
              </div>
              <input
                type="range"
                min="50"
                max="89"
                value={thHigh}
                onChange={(e) => setThHigh(Number(e.target.value))}
                className="w-full accent-orange-500"
              />
            </div>

            <div>
              <div className="flex justify-between text-slate-400 font-medium mb-1">
                <span className="text-amber-400">Medium Risk Threshold</span>
                <span className="font-mono text-white font-bold">{thMed}%</span>
              </div>
              <input
                type="range"
                min="30"
                max="69"
                value={thMed}
                onChange={(e) => setThMed(Number(e.target.value))}
                className="w-full accent-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Horizon & Model Architecture */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-slate-400 font-medium mb-1">Prediction Horizon</label>
            <select
              value={horizon}
              onChange={(e) => setHorizon(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none"
            >
              <option value="1 hour">1 hour horizon</option>
              <option value="Next collection window (4 hrs)">Next collection window (4 hrs)</option>
              <option value="8 hours">8 hours horizon</option>
              <option value="24 hours">24 hours (Next Day)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-400 font-medium mb-1">Champion Architecture</label>
            <select
              value={activeModel}
              onChange={(e) => setActiveModel(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 focus:outline-none"
            >
              <option value="RandomForestRegressor">Random Forest Regressor (Recommended)</option>
              <option value="LinearRegression">Linear Regression Baseline</option>
            </select>
          </div>
        </div>

        {saveMessage && (
          <div
            className={`p-4 rounded-xl text-xs flex items-center gap-2.5 ${
              saveMessage.type === 'success'
                ? 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/15 border border-rose-500/30 text-rose-300'
            }`}
          >
            {saveMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            )}
            <span>{saveMessage.text}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={isSaving || !isWeightValid}
          className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold transition shadow-lg shadow-emerald-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isSaving ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Save className="w-4 h-4" />
          )}
          <span>{isSaving ? 'Updating...' : 'Save Configuration & Recalculate Priorities'}</span>
        </button>
      </form>
    </div>
  );
};
