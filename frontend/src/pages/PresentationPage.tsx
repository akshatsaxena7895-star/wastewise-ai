import React from 'react';
import {
  Presentation,
  CheckCircle2,
  TrendingUp,
  Cpu,
  ShieldCheck,
  Fuel,
  ArrowRight,
  Layers,
  MapPin,
  AlertCircle
} from 'lucide-react';

export const PresentationPage: React.FC = () => {
  return (
    <div className="p-6 md:p-8 space-y-10 max-w-6xl mx-auto">
      {/* Title & Banner */}
      <div className="p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-900 to-emerald-950/40 border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
            <Presentation className="w-3.5 h-3.5" />
            <span>Hackathon Prototype Presentation Mode</span>
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
            WasteWise AI
          </h1>
          <p className="text-base text-slate-300 font-light leading-relaxed">
            AI-powered Smart Waste Collection Priority Predictor transforming municipal sanitation from rigid static routes to demand-driven operational intelligence.
          </p>
        </div>
      </div>

      {/* End-to-End Pipeline Diagram */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Layers className="w-5 h-5 text-emerald-400" />
          <span>Core AI & Prioritization Pipeline Architecture</span>
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {[
            { step: '1', title: 'Data Ingestion', desc: 'Continuous sensor telemetry & synthetic temporal generator' },
            { step: '2', title: 'Feature Eng.', desc: 'Temporal cycles, lag fills (t-1, t-2), rolling stats, zone encoding' },
            { step: '3', title: 'ML Prediction', desc: 'Random Forest Regressor & Binary Classifier for 4h horizon' },
            { step: '4', title: 'Risk Detection', desc: 'Overflow probability & threshold classification (≥90% Critical)' },
            { step: '5', title: 'Priority Engine', desc: 'Transparent formula weighing fill, risk, days, and current state' },
            { step: '6', title: 'Dispatch Action', desc: 'Ranked collection list with illustrative Nearest-Neighbor path' },
          ].map((item, idx) => (
            <div
              key={item.step}
              className="p-4 bg-slate-950 rounded-2xl border border-slate-800/90 relative flex flex-col justify-between"
            >
              <div>
                <span className="text-xs font-mono font-bold text-emerald-400">Step {item.step}</span>
                <h4 className="text-sm font-bold text-white mt-1">{item.title}</h4>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{item.desc}</p>
              </div>
              {idx < 5 && (
                <div className="hidden lg:block absolute -right-2 top-1/2 -translate-y-1/2 text-slate-600 z-10">
                  →
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* 4 Pillars: Problem, Solution, AI Methodology, Impact */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* The Problem */}
        <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-rose-400">The Problem</div>
          <h3 className="text-base font-bold text-white">Inefficiency in Static Route Scheduling</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Conventional municipal waste trucks follow fixed schedules regardless of bin states. This leads to wasted fuel and labor visiting half-empty bins, while high-density commercial and market locations overflow, causing environmental and public health hazards.
          </p>
        </div>

        {/* The Solution */}
        <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-emerald-400">The Solution</div>
          <h3 className="text-base font-bold text-white">Dynamic Urgency-Driven Collection</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            WasteWise AI forecasts next-cycle fill levels and overflow probabilities, converting multi-factor telemetry into a ranked priority dispatch queue. Crews focus exclusively on bins with imminent overflow urgency.
          </p>
        </div>

        {/* ML Methodology */}
        <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-blue-400">Machine Learning</div>
          <h3 className="text-base font-bold text-white">Random Forest Dual Pipeline</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Linear regression provides a baseline (MAE ~12.6%), while our tuned Random Forest Regressor achieves MAE ~7.8% and R² ~0.53 using temporal lags, rolling averages, and zone multipliers with zero future data leakage.
          </p>
        </div>

        {/* Operational Impact */}
        <div className="p-6 bg-slate-900/80 border border-slate-800 rounded-2xl space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-amber-400">Projected Impact</div>
          <h3 className="text-base font-bold text-white">Measurable Resource Savings</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Up to 30% fuel savings, reduced carbon emissions, elimination of chronic street overflows, and complete operational transparency for municipal command centers.
          </p>
        </div>
      </div>

      {/* Stretch Goal & Guardrail Disclaimer */}
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl flex items-center gap-3 text-xs text-slate-400">
        <AlertCircle className="w-4 h-4 text-emerald-400 shrink-0" />
        <span>
          <strong>Hackathon Guardrail:</strong> This prototype uses simulated and validated synthetic telemetry to demonstrate predictive prioritization. Simple route ordering is an illustrative nearest-neighbor heuristic and not municipal turn-by-turn road network routing.
        </span>
      </div>
    </div>
  );
};
