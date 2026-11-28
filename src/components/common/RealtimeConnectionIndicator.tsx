import React, { useState } from 'react';
import { 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Volume2, 
  VolumeX, 
  Activity, 
  ShieldCheck,
  ChevronDown
} from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const RealtimeConnectionIndicator: React.FC = () => {
  const { 
    connectionStatus, 
    connectionLatencyMs, 
    isAudioMuted, 
    toggleAudioMuted, 
    reconnectSocket,
    selectedHospitalId,
    user
  } = useApp();

  const [showDetails, setShowDetails] = useState(false);

  return (
    <div className="relative">
      <div className="flex items-center gap-1.5">
        {/* Status Pill */}
        <button
          onClick={() => setShowDetails(!showDetails)}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-[11px] font-semibold transition-all cursor-pointer ${
            connectionStatus === 'connected'
              ? 'bg-emerald-50/90 text-emerald-800 border-emerald-200 hover:bg-emerald-100/80 shadow-xs'
              : connectionStatus === 'reconnecting'
              ? 'bg-amber-50/90 text-amber-800 border-amber-200 hover:bg-amber-100/80'
              : 'bg-red-50/90 text-red-800 border-red-200 hover:bg-red-100/80'
          }`}
          title="Click to view real-time synchronization telemetry"
        >
          {connectionStatus === 'connected' && (
            <>
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600"></span>
              </span>
              <span>Live &middot; {connectionLatencyMs}ms</span>
            </>
          )}

          {connectionStatus === 'reconnecting' && (
            <>
              <RefreshCw className="w-3 h-3 text-amber-600 animate-spin" />
              <span>Reconnecting...</span>
            </>
          )}

          {connectionStatus === 'disconnected' && (
            <>
              <WifiOff className="w-3 h-3 text-red-600" />
              <span>Offline</span>
            </>
          )}

          <ChevronDown className="w-3 h-3 opacity-60 ml-0.5" />
        </button>

        {/* Audio Alert Toggle */}
        <button
          onClick={toggleAudioMuted}
          className={`p-1.5 rounded-xl border transition-colors cursor-pointer ${
            isAudioMuted
              ? 'bg-slate-100 text-slate-400 border-slate-200 hover:text-slate-600'
              : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
          }`}
          title={isAudioMuted ? 'Critical alert chimes muted (Click to enable audio)' : 'Clinical audio alerts active (Click to mute)'}
        >
          {isAudioMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Telemetry Popover */}
      {showDetails && (
        <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl shadow-xl border border-slate-200 p-4 text-xs z-50 animate-in fade-in zoom-in-95 text-slate-800">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-2.5">
            <span className="font-bold flex items-center gap-1.5 text-slate-900">
              <Activity className="w-4 h-4 text-cyan-600" />
              Real-Time Telemetry
            </span>
            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded capitalize ${
              connectionStatus === 'connected' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
            }`}>
              {connectionStatus}
            </span>
          </div>

          <div className="space-y-2 text-[11px] text-slate-600">
            <div className="flex justify-between">
              <span>Transport Protocol:</span>
              <span className="font-mono font-semibold text-slate-800">WebSocket (Engine.IO)</span>
            </div>
            <div className="flex justify-between">
              <span>Round-Trip Latency:</span>
              <span className="font-mono font-semibold text-emerald-700">{connectionLatencyMs} ms</span>
            </div>
            <div className="flex justify-between">
              <span>Hospital Channel:</span>
              <span className="font-mono text-slate-800">{selectedHospitalId}</span>
            </div>
            <div className="flex justify-between">
              <span>Active Role Channel:</span>
              <span className="font-mono text-slate-800">{user?.role || 'staff'}</span>
            </div>
            <div className="flex justify-between">
              <span>Clinical Audio Chimes:</span>
              <span className="font-semibold text-slate-800">{isAudioMuted ? 'Muted' : 'Enabled (Web Audio API)'}</span>
            </div>
          </div>

          <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[10px] text-slate-400 flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-cyan-600" />
              Isolated Room Scope
            </span>
            <button
              onClick={() => {
                reconnectSocket();
                setShowDetails(false);
              }}
              className="text-[11px] font-bold text-cyan-700 hover:text-cyan-800 hover:underline cursor-pointer"
            >
              Force Reconnect
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
