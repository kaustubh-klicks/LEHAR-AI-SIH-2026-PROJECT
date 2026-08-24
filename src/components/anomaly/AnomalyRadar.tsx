import React, { useState, useEffect } from 'react';
import { 
  Radio, 
  Flame, 
  Droplets, 
  MapPin, 
  RefreshCw, 
  CheckCircle2, 
  ArrowUpRight, 
  ShieldAlert, 
  Sparkles, 
  ChevronDown, 
  ChevronUp 
} from 'lucide-react';
import type { AnomalyAlert } from '../../types';

export interface AIAnomalyImpact {
  coral_bleaching_risk: 'Low' | 'Moderate' | 'High' | 'Severe';
  fish_migration_shift: string;
  yield_impact_pct: string;
  actionable_advisory: string;
}

interface AnomalyRadarProps {
  anomalies?: AnomalyAlert[];
  onSelectAnomaly?: (anomaly: AnomalyAlert) => void;
  onHoverAnomaly?: (anomaly: AnomalyAlert | null) => void;
  onTriggerScan?: () => void;
  isScanning?: boolean;
}

function parseNum(val: unknown, fallback: number = 0): number {
  if (typeof val === 'number') return isNaN(val) ? fallback : val;
  if (!val) return fallback;
  const parsed = parseFloat(String(val));
  return isNaN(parsed) ? fallback : parsed;
}

function getAIImpact(alert: AnomalyAlert): AIAnomalyImpact {
  const param = (alert.parameter || '').toLowerCase();
  const isTemp = param.includes('temp') || param.includes('heatwave');
  const val = parseNum(alert.value, 0);
  const thresh = parseNum(alert.threshold, 0);
  const diff = Math.abs(val - thresh);
  const sev = (alert.severity || '').toLowerCase();

  let risk: 'Low' | 'Moderate' | 'High' | 'Severe' = 'Low';

  if (isTemp && val >= thresh) {
    if (diff >= 2.0 || sev === 'critical') {
      risk = 'Severe';
      return {
        coral_bleaching_risk: risk,
        fish_migration_shift: 'Tuna & Mackerel shoals diving to 50m–75m cold thermocline layer to escape thermal shock.',
        yield_impact_pct: '-30% to -45% in surface purse-seine operations.',
        actionable_advisory: 'Avoid surface gillnets in this sector. Switch to deep hook-and-line (50m+) or navigate to coastal upwelling fronts.',
      };
    }
    if (diff >= 1.0 || sev === 'high') {
      risk = 'Moderate';
      return {
        coral_bleaching_risk: risk,
        fish_migration_shift: 'Pelagic sardine shoals scattering offshore into deeper shelf boundaries.',
        yield_impact_pct: '-15% to -25% localized catch drop.',
        actionable_advisory: 'Deploy troll lines at 30m depth. High feed activity expected at outer thermal boundary lines.',
      };
    }
    return {
      coral_bleaching_risk: 'Low',
      fish_migration_shift: 'Minor localized vertical movement; pelagic schools stable.',
      yield_impact_pct: 'Nominal (±5%).',
      actionable_advisory: 'Standard fishing operations safe. Monitor for sudden mixed layer depth drops.',
    };
  }

  return {
    coral_bleaching_risk: 'Low',
    fish_migration_shift: 'Estuarine species (Hilsa, Bhetki, White Prawns) congregating along freshwater plume boundary.',
    yield_impact_pct: '+20% higher yield for estuarine gillnetters near river mouths.',
    actionable_advisory: 'Set bottom gillnets along salinity front edge for premium Hilsa and tiger prawn catch.',
  };
}

export const AnomalyRadar: React.FC<AnomalyRadarProps> = ({
  anomalies = [],
  onSelectAnomaly,
  onHoverAnomaly,
  onTriggerScan,
  isScanning = false,
}) => {
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [activeAlertId, setActiveAlertId] = useState<number | string | null>(null);
  const [hoveredAlertId, setHoveredAlertId] = useState<number | string | null>(null);
  const [expandedImpactId, setExpandedImpactId] = useState<number | string | null>(null);
  const [showPolarScope, setShowPolarScope] = useState<boolean>(true);
  const [sweepAngle, setSweepAngle] = useState<number>(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setSweepAngle((prev) => (prev + 2.5) % 360);
    }, 30);
    return () => clearInterval(interval);
  }, []);

  const alertList = Array.isArray(anomalies) ? anomalies : [];

  const filtered = alertList.filter((a) => {
    if (filterSeverity === 'all') return true;
    return (a.severity || '').toLowerCase() === filterSeverity.toLowerCase();
  });

  const sortedAlerts = [...filtered].sort((a, b) => {
    if (a.id === activeAlertId) return -1;
    if (b.id === activeAlertId) return 1;
    return 0;
  });

  const getSeverityColor = (severity?: string) => {
    switch ((severity || '').toLowerCase()) {
      case 'critical':
        return '#ef4444'; // Red
      case 'high':
        return '#f59e0b'; // Amber
      case 'medium':
        return '#06b6d4'; // Ocean Cyan
      default:
        return '#64748b'; // Slate
    }
  };

  const getSeverityBadge = (severity?: string) => {
    switch ((severity || '').toLowerCase()) {
      case 'critical':
        return 'bg-red-500/20 text-red-400 border-red-500/50 shadow-sm';
      case 'high':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm';
      case 'medium':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40 shadow-sm';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  const handleSelect = (alert: AnomalyAlert) => {
    setActiveAlertId(alert.id);
    if (onSelectAnomaly) {
      onSelectAnomaly(alert);
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#030d1a]/90 border border-slate-800/90 rounded-2xl p-4 md:p-5 shadow-2xl backdrop-blur-2xl space-y-4 overflow-y-auto">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80 shrink-0">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white font-heading">AnomalyRadar Watchdog</h3>
              <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded-md bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-mono">
                24/7 Ocean Alert
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Proactive marine heatwave (MHW) & deep CTD threshold deviation monitoring
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowPolarScope(!showPolarScope)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold backdrop-blur-md transition cursor-pointer flex items-center gap-1.5 ${
              showPolarScope
                ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Radio className="w-3.5 h-3.5" />
            <span>{showPolarScope ? 'Hide Polar Radar' : 'Show Polar Radar'}</span>
          </button>

          {onTriggerScan && (
            <button
              type="button"
              onClick={onTriggerScan}
              disabled={isScanning}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-400 to-teal-400 text-slate-950 font-bold text-xs shadow-md transition active:scale-95 disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
              <span>{isScanning ? 'Scanning...' : 'Run Live Scan'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Polar Scope without Red Ping */}
      {showPolarScope && (
        <div className="p-3 bg-[#010a14] rounded-xl border border-cyan-500/30 flex flex-col items-center justify-center relative select-none">
          <div className="relative w-48 h-48 sm:w-56 sm:h-56">
            <svg className="w-full h-full" viewBox="0 0 240 240">
              <defs>
                <radialGradient id="radarSweepGrad" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#10b981" stopOpacity="0.45" />
                  <stop offset="65%" stopColor="#059669" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#047857" stopOpacity="0" />
                </radialGradient>
              </defs>

              <circle cx="120" cy="120" r="105" fill="#011b18" stroke="#046c52" strokeWidth="1.2" strokeOpacity="0.85" />
              <circle cx="120" cy="120" r="78.75" fill="none" stroke="#058364" strokeWidth="0.8" strokeDasharray="3,3" strokeOpacity="0.55" />
              <circle cx="120" cy="120" r="52.5" fill="none" stroke="#058364" strokeWidth="0.8" strokeDasharray="3,3" strokeOpacity="0.55" />
              <circle cx="120" cy="120" r="26.25" fill="none" stroke="#058364" strokeWidth="0.8" strokeDasharray="2,2" strokeOpacity="0.55" />

              <line x1="15" y1="120" x2="225" y2="120" stroke="#047857" strokeWidth="0.8" strokeOpacity="0.7" />
              <line x1="120" y1="15" x2="120" y2="225" stroke="#047857" strokeWidth="0.8" strokeOpacity="0.7" />

              <g transform={`rotate(${sweepAngle} 120 120)`}>
                <path d="M 120 120 L 120 15 A 105 105 0 0 1 210 68 Z" fill="url(#radarSweepGrad)" />
                <line x1="120" y1="120" x2="120" y2="15" stroke="#34d399" strokeWidth="1.8" strokeOpacity="0.95" />
              </g>

              {alertList.map((alert, idx) => {
                const isSelected = activeAlertId === alert.id;
                const isHovered = hoveredAlertId === alert.id;
                const isTarget = isSelected || isHovered;

                const lat = parseNum(alert.latitude, 15);
                const lon = parseNum(alert.longitude, 75);
                const angleDeg = (Math.abs(lon * 19 + lat * 27 + idx * 55)) % 360;
                const angleRad = (angleDeg * Math.PI) / 180;
                const distPercent = 0.25 + ((Math.abs(lat * 5 + lon * 9 + idx * 11) % 65) / 100);
                const r = distPercent * 95;
                const x = 120 + r * Math.cos(angleRad);
                const y = 120 + r * Math.sin(angleRad);
                const color = getSeverityColor(alert.severity);

                return (
                  <g
                    key={alert.id || idx}
                    className="cursor-pointer"
                    onClick={() => handleSelect(alert)}
                    onMouseEnter={() => {
                      setHoveredAlertId(alert.id);
                      if (onHoverAnomaly) onHoverAnomaly(alert);
                    }}
                    onMouseLeave={() => {
                      setHoveredAlertId(null);
                      if (onHoverAnomaly) onHoverAnomaly(null);
                    }}
                  >
                    {/* Clean static halo indicator on hover/select */}
                    {isTarget && (
                      <circle cx={x} cy={y} r="8" fill="none" stroke={color} strokeWidth="1.8" strokeOpacity="0.7" />
                    )}
                    <circle
                      cx={x}
                      cy={y}
                      r={isTarget ? 5 : 3.5}
                      fill={color}
                      stroke="#ffffff"
                      strokeWidth={isTarget ? 1.5 : 0.8}
                    />
                  </g>
                );
              })}
            </svg>
          </div>
        </div>
      )}

      {/* Severity Filter Tabs */}
      <div className="flex items-center justify-between gap-2 text-xs pt-1 shrink-0">
        <div className="flex items-center gap-1.5">
          <span className="text-slate-400 font-semibold mr-1 font-heading">Severity:</span>
          {['all', 'critical', 'high', 'medium', 'low'].map((sev) => (
            <button
              key={sev}
              type="button"
              onClick={() => setFilterSeverity(sev)}
              className={`px-2.5 py-1 rounded-xl font-semibold capitalize transition active:scale-95 cursor-pointer text-xs ${
                filterSeverity === sev
                  ? 'bg-cyan-400 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {sev}
            </button>
          ))}
        </div>

        <span className="text-[11px] font-mono text-slate-400">
          Showing <strong>{filtered.length}</strong> active alerts
        </span>
      </div>

      {/* Alert Feed Stream */}
      <div className="space-y-3 pr-1">
        {sortedAlerts.length === 0 ? (
          <div className="p-8 bg-slate-900/40 rounded-xl border border-slate-800 text-center flex flex-col items-center justify-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-400 mb-2" />
            <p className="text-sm font-bold text-slate-200 font-heading">All Ocean Sectors Nominal</p>
            <p className="text-xs text-slate-400 max-w-xs mt-1">
              No anomalies exceeding climatological threshold detected in current filter view.
            </p>
          </div>
        ) : (
          sortedAlerts.map((alert, idx) => {
            const param = (alert.parameter || '').toLowerCase();
            const isTemp = param.includes('temp') || param.includes('heatwave');
            const isSal = param.includes('sal');
            const isSelected = activeAlertId === alert.id;
            const isHovered = hoveredAlertId === alert.id;
            const isImpactOpen = expandedImpactId === alert.id;
            const aiImpact = getAIImpact(alert);
            const numVal = parseNum(alert.value, 0);
            const lat = parseNum(alert.latitude, 0);
            const lon = parseNum(alert.longitude, 0);

            return (
              <div
                key={alert.id || idx}
                onMouseEnter={() => {
                  setHoveredAlertId(alert.id);
                  if (onHoverAnomaly) onHoverAnomaly(alert);
                }}
                onMouseLeave={() => {
                  setHoveredAlertId(null);
                  if (onHoverAnomaly) onHoverAnomaly(null);
                }}
                className={`p-3.5 rounded-xl border transition-all duration-200 shadow-sm space-y-2.5 ${
                  isSelected || isHovered
                    ? 'bg-slate-900 border-cyan-400/80 shadow-md ring-1 ring-cyan-400/50'
                    : 'bg-slate-900/80 hover:bg-slate-850 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div 
                  onClick={() => handleSelect(alert)}
                  className="flex items-start justify-between gap-2 cursor-pointer"
                >
                  <div className="flex items-center space-x-2.5">
                    <div
                      className={`p-2 rounded-lg shrink-0 ${
                        isTemp
                          ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                          : isSal
                          ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      {isTemp ? <Flame className="w-4 h-4" /> : <Droplets className="w-4 h-4" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-white font-heading">
                          {alert.parameter ? alert.parameter.toUpperCase() : 'Ocean Alert'}
                        </h4>
                        {alert.mhw_category && (
                          <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-red-950 border border-red-500/50 text-red-300 font-mono">
                            {alert.mhw_category}
                          </span>
                        )}
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.2 rounded uppercase border font-mono ${getSeverityBadge(
                            alert.severity
                          )}`}
                        >
                          {alert.severity || 'Alert'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">{alert.description}</p>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <div className="text-xs font-bold text-white font-mono">
                      {numVal.toFixed(2)}
                      <span className="text-[10px] text-slate-400 ml-0.5">
                        {isTemp ? '°C' : isSal ? 'PSU' : ''}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-500">
                      {alert.date ? new Date(alert.date).toLocaleDateString([], { month: 'short', day: 'numeric' }) : 'Live'}
                    </span>
                  </div>
                </div>

                {/* Guardian Badge */}
                {((alert.severity || '').toLowerCase() === 'critical' || (alert.severity || '').toLowerCase() === 'high') && (
                  <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-red-950/60 border border-red-500/30 text-[9px] font-mono text-red-300">
                    <ShieldAlert className="w-3 h-3 text-red-400 shrink-0" />
                    <span>🛡️ Pushed to Coastal Fishermen via Lehar Guardian</span>
                  </div>
                )}

                {/* AI Impact Assessment */}
                <div className="border border-slate-800 rounded-lg overflow-hidden bg-slate-950/70">
                  <button
                    type="button"
                    onClick={() => setExpandedImpactId(isImpactOpen ? null : alert.id)}
                    className="w-full px-3 py-1.5 flex items-center justify-between text-xs font-semibold text-emerald-300 hover:bg-slate-850 cursor-pointer transition"
                  >
                    <div className="flex items-center gap-1.5 font-heading text-[11px]">
                      <Sparkles className="w-3 h-3 text-emerald-400" />
                      <span>🤖 AI Ecological & Fish Catch Impact Assessment</span>
                    </div>
                    {isImpactOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>

                  {isImpactOpen && (
                    <div className="p-3 border-t border-slate-800 space-y-2 text-[11px] font-sans animate-in fade-in">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 font-mono">
                        <div className="p-2 rounded bg-slate-900 border border-slate-800">
                          <span className="text-slate-400 block text-[9px] uppercase">🪸 Coral Bleaching Risk</span>
                          <span className={`font-bold ${
                            aiImpact.coral_bleaching_risk === 'Severe' ? 'text-red-400' : aiImpact.coral_bleaching_risk === 'Moderate' ? 'text-amber-400' : 'text-emerald-400'
                          }`}>
                            {aiImpact.coral_bleaching_risk}
                          </span>
                        </div>
                        <div className="p-2 rounded bg-slate-900 border border-slate-800">
                          <span className="text-slate-400 block text-[9px] uppercase">📉 Projected Harvest Yield</span>
                          <span className="font-bold text-amber-300">{aiImpact.yield_impact_pct}</span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <div>
                          <strong className="text-slate-300">🐟 Pelagic Behavioral Shift:</strong>{' '}
                          <span className="text-slate-300">{aiImpact.fish_migration_shift}</span>
                        </div>
                        <div className="pt-1 border-t border-slate-800/80 text-emerald-200">
                          <strong className="text-emerald-400">💡 Actionable Fishermen Guidance:</strong>{' '}
                          {aiImpact.actionable_advisory}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="pt-1 border-t border-slate-800 flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <div className="flex items-center space-x-2">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-cyan-400" />
                      {lat.toFixed(2)}°N, {lon.toFixed(2)}°E
                    </span>
                    <span>•</span>
                    <span>Probe #{alert.float_id || 'Alert-Probe'}</span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSelect(alert)}
                    className="flex items-center gap-0.5 text-cyan-400 hover:underline cursor-pointer"
                  >
                    View on Map <ArrowUpRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

    </div>
  );
};