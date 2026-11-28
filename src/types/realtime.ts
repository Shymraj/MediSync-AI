// MediSync AI - Real-Time Communication & Live Updates Types

export type SocketConnectionStatus = 'connected' | 'reconnecting' | 'disconnected';

export type AlertPriority = 'critical' | 'urgent' | 'warning' | 'info' | 'success';

export interface RealtimeEventPayload {
  eventId: string;
  eventType: 
    | 'bed_updated'
    | 'bed_status_changed'
    | 'request_created'
    | 'request_updated'
    | 'clinical_task_created'
    | 'clinical_task_updated'
    | 'patient_observation_recorded'
    | 'clinical_alert_created'
    | 'clinical_alert_updated'
    | 'emergency_incident_created'
    | 'emergency_incident_updated'
    | 'emergency_incident_resolved'
    | 'shortage_alert_updated'
    | 'shortage_alert_resolved'
    | 'workflow_execution_updated'
    | 'workflow_approval_requested'
    | 'notification_created'
    | 'admission_accepted'
    | 'transfer_created';
  hospitalId: string;
  sourceRole?: string;
  sourceUser?: string;
  timestamp: string;
  data: any;
  priority?: AlertPriority;
  requiresAck?: boolean;
}

export interface LiveConnectionMetrics {
  status: SocketConnectionStatus;
  latencyMs: number;
  lastHeartbeat: string;
  reconnectAttempts: number;
  activeRooms: string[];
  totalEventsReceived: number;
}

// Pure Web Audio API Clinical Sound Synthesizer (No external media files required)
export class ClinicalAudioSynthesizer {
  private static audioCtx: AudioContext | null = null;
  private static isMuted: boolean = false;

  public static setMuted(muted: boolean) {
    this.isMuted = muted;
    try {
      localStorage.setItem('medisync_realtime_audio_muted', muted ? 'true' : 'false');
    } catch {}
  }

  public static getMuted(): boolean {
    try {
      return localStorage.getItem('medisync_realtime_audio_muted') === 'true';
    } catch {
      return false;
    }
  }

  private static getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume().catch(() => {});
    }
    return this.audioCtx;
  }

  /**
   * Plays a high-acuity medical alert chime (two-tone urgent harmonic: 880Hz -> 1046Hz)
   */
  public static playCriticalAlert() {
    if (this.getMuted()) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      // Tone 1
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(880, now); // A5
      gain1.gain.setValueAtTime(0.15, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.25);

      // Tone 2 (higher urgency)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(1174.66, now + 0.15); // D6
      gain2.gain.setValueAtTime(0.18, now + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.15);
      osc2.stop(now + 0.45);
    } catch {}
  }

  /**
   * Plays a subtle notification bell (e.g. task completed, bed ready: 523Hz -> 659Hz)
   */
  public static playInfoChime() {
    if (this.getMuted()) return;
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.exponentialRampToValueAtTime(659.25, now + 0.15); // E5
      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.35);
    } catch {}
  }
}
