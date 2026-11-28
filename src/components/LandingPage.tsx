import React, { useState } from 'react';
import { 
  Search, 
  ArrowRight, 
  Play, 
  Building2, 
  Users, 
  ShieldCheck, 
  Handshake, 
  FileText, 
  CheckCircle, 
  CheckCircle2, 
  Bell, 
  Bed, 
  Clock, 
  Activity, 
  LayoutDashboard, 
  ChevronRight,
  X,
  Stethoscope,
  HeartHandshake,
  User as UserIcon,
  Shield,
  Send,
  Mail,
  Phone,
  MapPin,
  Check,
  AlertCircle,
  RefreshCw,
  BarChart3,
  Layers,
  Sparkles,
  Zap,
  Sliders,
  ExternalLink,
  HeartPulse,
  Radio,
  Siren,
  CheckSquare
} from 'lucide-react';
import { Button } from './common/Button';
import { PortalSelectionModal } from './PortalSelectionModal';

export interface LandingPageProps {
  onGetStarted: () => void;
  onSelectPortal?: (portal: 'hospital' | 'patient') => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted, onSelectPortal }) => {
  const [activeNav, setActiveNav] = useState('Home');
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isDemoModalOpen, setIsDemoModalOpen] = useState(false);
  const [isPortalModalOpen, setIsPortalModalOpen] = useState(false);

  // Interactive Hero Preview state
  const [heroActiveTab, setHeroActiveTab] = useState<'census' | 'wards' | 'telemetry' | 'emergency'>('census');

  // Interactive Workflow state
  const [workflowActiveStep, setWorkflowActiveStep] = useState<number>(1);

  const handleOpenPortalSelection = () => {
    setIsPortalModalOpen(true);
  };

  const handlePortalSelected = (portal: 'hospital' | 'patient') => {
    setIsPortalModalOpen(false);
    if (onSelectPortal) {
      onSelectPortal(portal);
    } else {
      onGetStarted();
    }
  };

  // Contact Form State
  const [contactName, setContactName] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [contactHospital, setContactHospital] = useState('');
  const [contactSubject, setContactSubject] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactSubmitted, setContactSubmitted] = useState(false);
  const [contactError, setContactError] = useState<string | null>(null);

  const handleNavClick = (nav: string, href?: string) => {
    setActiveNav(nav);
    if (href) {
      const el = document.querySelector(href);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName.trim() || !contactEmail.trim() || !contactMessage.trim()) {
      setContactError('Please fill out all required fields.');
      return;
    }
    setContactError(null);
    setContactSubmitted(true);
  };

  // Search Results
  const searchableSections = [
    { title: 'How It Works — Resource Workflow', category: 'Workflow', href: '#how-it-works', desc: '4-stage lifecycle: Requisition, Matching, Turnaround, and Sign-Off.' },
    { title: 'Hospital Admin & Resource Governance', category: 'Admin', href: '#features', desc: 'Bed readiness, equipment telemetry, resource requisitions, and census analytics.' },
    { title: 'Doctor Clinical Intelligence', category: 'Doctor', href: '#features', desc: 'Patient digital twin, deterioration radar, AI diagnosis, and drug safety.' },
    { title: 'NurseFlow & Ward Management', category: 'Nurse', href: '#features', desc: 'Workload balancing, shift preparation, task checklist, and handover logs.' },
    { title: 'Emergency Command Center', category: 'Emergency', href: '#features', desc: 'Trauma triage, MCI incident simulation, and emergency resource pre-locking.' },
    { title: 'Workflow Automation Center', category: 'Automation', href: '#features', desc: 'Visual workflow rules, automated event triggers, and approval gates.' },
    { title: 'About MediSync AI', category: 'About', href: '#about', desc: 'Bridging hospital operational gaps with synchronized telemetry.' },
    { title: 'Contact Support & Onboarding', category: 'Contact', href: '#contact', desc: 'Inquire about institutional medical center coordination.' },
  ];

  const filteredSearch = searchQuery.trim() 
    ? searchableSections.filter(s => 
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        s.desc.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.category.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : searchableSections;

  return (
    <div className="min-h-screen bg-[#F4F7FC] text-[#0F172A] flex flex-col font-sans selection:bg-[#1A56DB] selection:text-white">
      {/* 
        ============================================================
        TOP NAVIGATION (STRICT PRESERVATION — DO NOT MODIFY)
        - Preserved character-for-character as requested
        ============================================================
      */}
      <header className="sticky top-0 z-40 bg-[#F4F7FC]/90 backdrop-blur-md border-b border-[#E2E8F0]/80">
        <div className="w-[94%] max-w-[1680px] mx-auto h-18 flex items-center justify-between">
          {/* Brand Logo */}
          <div 
            className="flex items-center gap-2.5 cursor-pointer select-none" 
            onClick={() => handleNavClick('Home', '#hero')}
          >
            <div className="w-9 h-9 rounded-xl bg-[#1A56DB] flex items-center justify-center text-white shadow-xs">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 2v4a1 1 0 0 0 1 1h4" />
                <path d="M3 12h4l2-4 3 8 2-4h7" />
                <path d="M12 17v5" />
              </svg>
            </div>
            <span className="text-xl font-bold tracking-tight text-[#0F172A] flex items-center">
              MediSync <span className="text-[#1A56DB] ml-1 font-semibold">AI</span>
            </span>
          </div>

          {/* Centered Navigation Pill */}
          <nav className="hidden md:flex items-center bg-[#EBF1FA] px-2 py-1.5 rounded-full border border-[#DCE5F5] shadow-2xs">
            {[
              { label: 'Home', href: '#hero' },
              { label: 'How It Works', href: '#how-it-works' },
              { label: 'Features', href: '#features' },
              { label: 'About', href: '#about' },
              { label: 'Contact', href: '#contact' }
            ].map(item => {
              const isActive = activeNav === item.label;
              return (
                <button
                  key={item.label}
                  onClick={() => handleNavClick(item.label, item.href)}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#1A56DB] text-white shadow-xs font-semibold'
                      : 'text-[#475569] hover:text-[#0F172A]'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Right Actions: Search Icon + Admin Login + Get Started Button */}
          <div className="flex items-center gap-2.5">
            <a
              href="#/admin-login"
              className="px-3.5 py-1.5 rounded-full text-xs font-semibold text-slate-700 hover:text-[#1A56DB] hover:bg-blue-50 border border-slate-300 transition-colors hidden sm:inline-flex items-center gap-1.5 cursor-pointer shadow-2xs"
              title="MediSync Super Admin Platform Login"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-[#1A56DB]" />
              <span>Admin Login</span>
            </a>

            <button
              onClick={() => setIsSearchOpen(true)}
              className="w-9 h-9 rounded-full bg-white border border-[#CBD5E1] text-[#64748B] hover:text-[#0F172A] hover:border-slate-400 flex items-center justify-center transition-colors shadow-2xs cursor-pointer"
              title="Search landing page content"
            >
              <Search className="w-4 h-4" />
            </button>

            <Button
              variant="primary"
              size="md"
              onClick={onGetStarted}
              className="rounded-full px-5 py-2 text-xs font-semibold bg-[#1A56DB] hover:bg-[#1648B8] shadow-xs gap-1.5"
              icon={<ArrowRight className="w-3.5 h-3.5" />}
            >
              Get Started
            </Button>
          </div>
        </div>
      </header>

      {/* 
        ============================================================
        HERO SECTION (COMPACT ENTERPRISE LAYOUT)
        - Tightened vertical spacing (pt-3 pb-4)
        - Left: Headline, value proposition, action buttons, trust metrics
        - Right: Interactive Live Hospital Operations Visualizer
        ============================================================
      */}
      <section id="hero" className="w-[94%] max-w-[1680px] mx-auto pt-3 pb-3 scroll-mt-20">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 lg:gap-8 items-center">
          
          {/* Left Column (5 Cols) */}
          <div className="xl:col-span-5 z-10 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-[10px] font-bold uppercase tracking-wider mb-2.5 shadow-2xs">
              <span className="w-1.5 h-1.5 rounded-full bg-[#1A56DB] animate-pulse" />
              <span>Smarter Hospitals &bull; Stronger Healthcare</span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-[3.15rem] font-serif-headline text-[#0F172A] leading-[1.10] tracking-tight">
              Every Hospital.<br />
              Every Resource.<br />
              Every Minute. <span className="text-[#1A56DB] italic font-normal">In Sync.</span>
            </h1>

            <p className="mt-3 text-xs sm:text-sm text-[#475569] leading-relaxed max-w-xl">
              MediSync AI coordinates hospital beds, emergency ventilators, medical supplies, ward turnaround, and clinical teams through one synchronized operational platform.
            </p>

            {/* CTA Buttons */}
            <div className="mt-5 flex items-center gap-3.5 flex-wrap">
              <button
                onClick={onGetStarted}
                className="px-6 py-3 rounded-full bg-[#1A56DB] hover:bg-[#1547B3] text-white text-xs font-bold flex items-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer group"
              >
                <span>Explore the Platform</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </button>

              <button
                onClick={() => setIsDemoModalOpen(true)}
                className="px-5 py-3 rounded-full bg-white hover:bg-slate-50 border border-[#CBD5E1] text-[#0F172A] text-xs font-semibold flex items-center gap-2 shadow-2xs hover:shadow-xs transition-all cursor-pointer"
              >
                <div className="w-4 h-4 rounded-full bg-[#1A56DB] text-white flex items-center justify-center">
                  <Play className="w-2.5 h-2.5 fill-white stroke-none ml-0.5" />
                </div>
                <span>Watch Product Demo</span>
              </button>
            </div>

            {/* Trust Pill Highlights */}
            <div className="mt-5 pt-4 border-t border-slate-200/80 grid grid-cols-3 gap-2.5 text-left">
              <div>
                <div className="text-xs font-bold text-[#0F172A] flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Sub-Minute</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">Real-time socket sync</div>
              </div>

              <div>
                <div className="text-xs font-bold text-[#0F172A] flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>6-Stage Flow</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">Bed turnaround protocol</div>
              </div>

              <div>
                <div className="text-xs font-bold text-[#0F172A] flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Role Isolated</span>
                </div>
                <div className="text-[10px] text-slate-500 mt-0.5">RBAC clinical security</div>
              </div>
            </div>
          </div>

          {/* Right Column (7 Cols) — High-Fidelity Enterprise Dashboard Visualizer */}
          <div className="xl:col-span-7 relative">
            <div className="relative w-full rounded-2xl overflow-hidden shadow-xl border border-slate-200/90 bg-white">
              
              {/* Dashboard Window Header Bar */}
              <div className="px-4 py-2.5 bg-slate-50/90 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 mr-1.5">
                    <span className="w-2 h-2 rounded-full bg-rose-400" />
                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  </div>
                  <div className="w-5 h-5 rounded-md bg-[#1A56DB] flex items-center justify-center text-white text-xs font-bold">
                    <Activity className="w-3 h-3" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#0F172A]">City General Hospital</span>
                    <span className="text-[10px] text-slate-400 ml-1.5 hidden sm:inline">&bull; District Command Node 01</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 text-[10px] font-semibold bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span>Live Telemetry &bull; Demo Mode</span>
                  </div>
                  <button className="relative p-0.5 text-slate-400 hover:text-slate-600">
                    <Bell className="w-3.5 h-3.5" />
                    <span className="absolute top-0 right-0 w-1.5 h-1.5 rounded-full bg-rose-500" />
                  </button>
                </div>
              </div>

              {/* Interactive Dashboard Tabs */}
              <div className="px-4 pt-2.5 pb-2 bg-white border-b border-slate-100 flex items-center justify-between overflow-x-auto gap-1.5">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setHeroActiveTab('census')}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                      heroActiveTab === 'census'
                        ? 'bg-[#1A56DB] text-white shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Bed Census
                  </button>
                  <button
                    onClick={() => setHeroActiveTab('wards')}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                      heroActiveTab === 'wards'
                        ? 'bg-[#1A56DB] text-white shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Ward Readiness
                  </button>
                  <button
                    onClick={() => setHeroActiveTab('telemetry')}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                      heroActiveTab === 'telemetry'
                        ? 'bg-[#1A56DB] text-white shadow-2xs'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    Equipment Telemetry
                  </button>
                  <button
                    onClick={() => setHeroActiveTab('emergency')}
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold transition-colors cursor-pointer ${
                      heroActiveTab === 'emergency'
                        ? 'bg-rose-600 text-white shadow-2xs'
                        : 'text-rose-700 bg-rose-50 hover:bg-rose-100'
                    }`}
                  >
                    Emergency Casualty
                  </button>
                </div>
                <span className="text-[10px] text-slate-400 hidden md:inline">Click tabs to inspect</span>
              </div>

              {/* Main Dashboard Canvas */}
              <div className="p-4 bg-[#F8FAFC]/50">
                
                {/* 4 Core Stat Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-3">
                  <div className="bg-white p-2.5 rounded-lg border border-slate-200/80 shadow-2xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-medium text-slate-500">Total Beds</span>
                      <div className="w-4 h-4 rounded-md bg-blue-50 text-[#1A56DB] flex items-center justify-center">
                        <Bed className="w-2.5 h-2.5" />
                      </div>
                    </div>
                    <div className="text-lg font-extrabold text-[#0F172A]">128</div>
                    <div className="text-[9px] text-slate-400">Baseline census</div>
                  </div>

                  <div className="bg-white p-2.5 rounded-lg border border-slate-200/80 shadow-2xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-medium text-slate-500">Ready & Verified</span>
                      <div className="w-4 h-4 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center">
                        <CheckCircle2 className="w-2.5 h-2.5" />
                      </div>
                    </div>
                    <div className="text-lg font-extrabold text-emerald-600">24</div>
                    <div className="text-[9px] text-emerald-600/80 font-medium">Ready for intake</div>
                  </div>

                  <div className="bg-white p-2.5 rounded-lg border border-slate-200/80 shadow-2xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-medium text-slate-500">Occupied Beds</span>
                      <div className="w-4 h-4 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center">
                        <Users className="w-2.5 h-2.5" />
                      </div>
                    </div>
                    <div className="text-lg font-extrabold text-amber-600">86</div>
                    <div className="text-[9px] text-amber-600/80 font-medium">67.2% capacity</div>
                  </div>

                  <div className="bg-white p-2.5 rounded-lg border border-slate-200/80 shadow-2xs">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-medium text-slate-500">In Turnover</span>
                      <div className="w-4 h-4 rounded-md bg-sky-50 text-sky-600 flex items-center justify-center">
                        <Clock className="w-2.5 h-2.5" />
                      </div>
                    </div>
                    <div className="text-lg font-extrabold text-sky-600">18</div>
                    <div className="text-[9px] text-sky-600/80 font-medium">Sanitization SOP</div>
                  </div>
                </div>

                {/* Dynamic Tab Body */}
                {heroActiveTab === 'census' && (
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5">
                    {/* Ward Capacity Breakdown */}
                    <div className="md:col-span-7 bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-2">
                        <span>Ward Capacity Breakdown</span>
                        <span className="text-[10px] font-semibold text-[#1A56DB]">Live Census</span>
                      </div>
                      
                      <div className="space-y-2">
                        <div>
                          <div className="flex justify-between text-[10px] font-semibold text-slate-700 mb-0.5">
                            <span>ICU Block A (Critical Care)</span>
                            <span>18 / 20 Beds (90%)</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden flex">
                            <div className="bg-rose-500 h-full" style={{ width: '90%' }} />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-[10px] font-semibold text-slate-700 mb-0.5">
                            <span>Emergency Casualty Bay</span>
                            <span>12 / 16 Beds (75%)</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden flex">
                            <div className="bg-amber-500 h-full" style={{ width: '75%' }} />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-[10px] font-semibold text-slate-700 mb-0.5">
                            <span>Pulmonology & Respiratory</span>
                            <span>22 / 30 Beds (73%)</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden flex">
                            <div className="bg-blue-500 h-full" style={{ width: '73%' }} />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-[10px] font-semibold text-slate-700 mb-0.5">
                            <span>Surgical Step-Down Unit</span>
                            <span>34 / 62 Beds (54%)</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden flex">
                            <div className="bg-emerald-500 h-full" style={{ width: '54%' }} />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Bed Turnover Live Status */}
                    <div className="md:col-span-5 bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs flex flex-col justify-between">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-800 mb-1.5">
                        <span>Turnover Radar</span>
                        <span className="text-[9px] bg-slate-100 text-slate-600 px-1 py-0.5 rounded">6-Stage</span>
                      </div>

                      <div className="space-y-1.5 text-[10px]">
                        <div className="p-1.5 rounded-lg bg-emerald-50/70 border border-emerald-100 flex items-center justify-between">
                          <span className="font-semibold text-emerald-900">Bed B-102 &bull; ICU A</span>
                          <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-1.5 py-0.5 rounded">Ready</span>
                        </div>

                        <div className="p-1.5 rounded-lg bg-sky-50/70 border border-sky-100 flex items-center justify-between">
                          <span className="font-semibold text-sky-900">Bed B-105 &bull; Casualty</span>
                          <span className="text-[9px] font-bold text-sky-700 bg-sky-100 px-1.5 py-0.5 rounded">Sanitizing</span>
                        </div>

                        <div className="p-1.5 rounded-lg bg-indigo-50/70 border border-indigo-100 flex items-center justify-between">
                          <span className="font-semibold text-indigo-900">Bed B-114 &bull; Step-Down</span>
                          <span className="text-[9px] font-bold text-indigo-700 bg-indigo-100 px-1.5 py-0.5 rounded">Equip Check</span>
                        </div>

                        <div className="p-1.5 rounded-lg bg-amber-50/70 border border-amber-100 flex items-center justify-between">
                          <span className="font-semibold text-amber-900">Bed B-109 &bull; Pulmo</span>
                          <span className="text-[9px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded">Nurse Sign-Off</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {heroActiveTab === 'wards' && (
                  <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
                    <div className="text-xs font-bold text-slate-800 mb-2 flex items-center justify-between">
                      <span>Multi-Ward Preparation Status</span>
                      <span className="text-[10px] text-emerald-600 font-semibold">&bull; 4 Wards Operational</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="font-bold text-[#0F172A] flex justify-between text-[11px]">
                          <span>ICU Block A (Ventilator Bay)</span>
                          <span className="text-emerald-600 font-bold">92% Ready</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5">2 Beds in rapid turnaround &bull; 8 Nurses on duty &bull; Oxygen line verified</p>
                      </div>
                      <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="font-bold text-[#0F172A] flex justify-between text-[11px]">
                          <span>Trauma Emergency Casualty</span>
                          <span className="text-emerald-600 font-bold">100% Ready</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5">4 Triage bays ready &bull; Defibrillator checked &bull; Blood bank stock matched</p>
                      </div>
                      <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="font-bold text-[#0F172A] flex justify-between text-[11px]">
                          <span>Respiratory & Pulmonology</span>
                          <span className="text-blue-600 font-bold">85% Ready</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5">6 Beds available &bull; 2 BiPAP ventilators recalibrated &bull; Negative pressure</p>
                      </div>
                      <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="font-bold text-[#0F172A] flex justify-between text-[11px]">
                          <span>Cardiac Step-Down Unit</span>
                          <span className="text-emerald-600 font-bold">96% Ready</span>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-0.5">12 Beds ready &bull; Telemetry transmitters battery tested &bull; Handover verified</p>
                      </div>
                    </div>
                  </div>
                )}

                {heroActiveTab === 'telemetry' && (
                  <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs">
                    <div className="text-xs font-bold text-slate-800 mb-2 flex items-center justify-between">
                      <span>Critical Equipment Telemetry & Maintenance</span>
                      <span className="text-[10px] text-blue-600 font-semibold">Live Socket Polling</span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                      <div className="p-2.5 bg-blue-50/50 rounded-lg border border-blue-100">
                        <div className="font-bold text-slate-800 text-[11px]">Mechanical Ventilators</div>
                        <div className="text-base font-extrabold text-[#1A56DB] mt-0.5">24 Active / 8 Ready</div>
                        <div className="text-[9px] text-slate-500 mt-0.5">Hamilton-C6 &bull; 100% battery &bull; Calibrated</div>
                      </div>
                      <div className="p-2.5 bg-emerald-50/50 rounded-lg border border-emerald-100">
                        <div className="font-bold text-slate-800 text-[11px]">Multiparameter Monitors</div>
                        <div className="text-base font-extrabold text-emerald-700 mt-0.5">48 Active / 12 Ready</div>
                        <div className="text-[9px] text-slate-500 mt-0.5">Philips IntelliVue &bull; Realtime SpO2 & ECG</div>
                      </div>
                      <div className="p-2.5 bg-purple-50/50 rounded-lg border border-purple-100">
                        <div className="font-bold text-slate-800 text-[11px]">Defibrillators & Crash Carts</div>
                        <div className="text-base font-extrabold text-purple-700 mt-0.5">16 Certified Ready</div>
                        <div className="text-[9px] text-slate-500 mt-0.5">Daily self-test passed &bull; Medication sealed</div>
                      </div>
                    </div>
                  </div>
                )}

                {heroActiveTab === 'emergency' && (
                  <div className="bg-white p-3 rounded-xl border border-rose-200 shadow-2xs">
                    <div className="text-xs font-bold text-rose-800 mb-2 flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <Siren className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
                        Active Emergency Command Incident
                      </span>
                      <span className="text-[9px] bg-rose-100 text-rose-800 font-bold px-1.5 py-0.5 rounded">INCIDENT #EM-2026-44</span>
                    </div>
                    <div className="p-2.5 bg-rose-50/60 rounded-lg border border-rose-200 text-xs">
                      <div className="flex items-center justify-between font-bold text-rose-900 text-[11px]">
                        <span>Trauma Code Red &bull; Inbound Ambulance AMB-04</span>
                        <span className="text-rose-700">ETA: 3 Minutes</span>
                      </div>
                      <p className="text-[10px] text-slate-600 mt-1">
                        Pre-allocated: Bed B-102 (ICU A) & Ventilator V-08 locked &bull; Triage Team Dr. Arvind & Nurse Anitha alerted.
                      </p>
                      <div className="mt-1.5 flex items-center gap-2">
                        <span className="text-[9px] font-semibold bg-white border border-rose-300 text-rose-800 px-1.5 py-0.5 rounded">
                          Resource Pre-Lock Active
                        </span>
                        <span className="text-[9px] text-slate-500">Dual clinician sign-off complete</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Bottom Telemetry Ticker */}
                <div className="mt-2.5 pt-2 border-t border-slate-200/80 flex items-center justify-between text-[10px] text-slate-500">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                    <span className="truncate">
                      <strong>Recent Action:</strong> Nurse Kavitha verified Bed B-102 sanitization and marked status to Ready.
                    </span>
                  </div>
                  <span className="text-slate-400 shrink-0 ml-2">2 mins ago</span>
                </div>

              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 
        ============================================================
        TRUST & OPERATIONAL METRICS BAR (COMPACT 1-ROW VIEW)
        - Compact vertical margins (my-3)
        ============================================================
      */}
      <section className="w-[94%] max-w-[1680px] mx-auto my-3">
        <div className="bg-white border border-slate-200/90 rounded-xl shadow-2xs px-5 py-3 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
          
          <div className="flex items-center gap-3 pt-1 lg:pt-0">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1A56DB] flex items-center justify-center shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-base font-extrabold text-[#0F172A]">50+</div>
              <div className="text-[11px] text-slate-500">Connected Facilities</div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-1 lg:pt-0 lg:pl-5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1A56DB] flex items-center justify-center shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <div className="text-base font-extrabold text-[#0F172A]">6,000+</div>
              <div className="text-[11px] text-slate-500">Patient Journeys Synced</div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-1 lg:pt-0 lg:pl-5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1A56DB] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-base font-extrabold text-[#0F172A]">99.98%</div>
              <div className="text-[11px] text-slate-500">Telemetry Uptime</div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-1 lg:pt-0 lg:pl-5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1A56DB] flex items-center justify-center shrink-0">
              <Zap className="w-4 h-4" />
            </div>
            <div>
              <div className="text-base font-extrabold text-[#0F172A]">&lt; 3.2 min</div>
              <div className="text-[11px] text-slate-500">Requisition Match</div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-1 lg:pt-0 lg:pl-5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1A56DB] flex items-center justify-center shrink-0">
              <CheckSquare className="w-4 h-4" />
            </div>
            <div>
              <div className="text-base font-extrabold text-[#0F172A]">100%</div>
              <div className="text-[11px] text-slate-500">Clinical Sign-Off Audit</div>
            </div>
          </div>

        </div>
      </section>

      {/* 
        ============================================================
        HOW IT WORKS — 4-STAGE RESOURCE WORKFLOW
        - Compact padding (py-4)
        - 1. Request -> 2. Identify -> 3. Prepare -> 4. Confirm
        ============================================================
      */}
      <section id="how-it-works" className="w-[94%] max-w-[1680px] mx-auto py-4 scroll-mt-20">
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-5 sm:p-6">
          
          <div className="max-w-3xl mb-4">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-[#1A56DB] text-[10px] font-bold uppercase tracking-wider mb-1">
              <Activity className="w-3 h-3" />
              <span>Standard Operational Procedure</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-serif-headline text-[#0F172A]">
              From Request to Ready — The Clinical Resource Lifecycle
            </h2>
            <p className="mt-1 text-xs text-slate-600 leading-relaxed">
              MediSync AI formalizes resource coordination into four auditable milestones, eliminating phone tag between emergency doctors, nurses, and administrative superintendents.
            </p>
          </div>

          {/* 4 Interactive Stages Pipeline */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 relative">
            
            {/* Step 1: Request */}
            <div 
              onClick={() => setWorkflowActiveStep(1)}
              className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                workflowActiveStep === 1 
                  ? 'bg-blue-50/60 border-[#1A56DB] shadow-xs ring-1 ring-[#1A56DB]' 
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 text-[#1A56DB] flex items-center justify-center font-bold text-xs">
                    <FileText className="w-4 h-4" />
                  </div>
                  <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded bg-blue-100 text-blue-800">
                    Stage 01
                  </span>
                </div>
                <h3 className="text-sm font-bold text-[#0F172A]">1. Clinical Requisition</h3>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  Doctor or triage team initiates an urgent request with clinical urgency tier (Critical, Urgent, Routine), patient acuity score, and required equipment.
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-100 text-[10px] font-semibold text-blue-700 flex items-center gap-1">
                <span>Immediate Socket Broadcast</span>
                <ChevronRight className="w-3 h-3" />
              </div>
            </div>

            {/* Step 2: Identify */}
            <div 
              onClick={() => setWorkflowActiveStep(2)}
              className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                workflowActiveStep === 2 
                  ? 'bg-sky-50/60 border-sky-600 shadow-xs ring-1 ring-sky-600' 
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-700 flex items-center justify-center font-bold text-xs">
                    <Search className="w-4 h-4" />
                  </div>
                  <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded bg-sky-100 text-sky-800">
                    Stage 02
                  </span>
                </div>
                <h3 className="text-sm font-bold text-[#0F172A]">2. Automated Matching</h3>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  Intelligent allocation engine scans district inventory, identifies compatible available or fast-turnaround units, and locks candidate beds.
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-100 text-[10px] font-semibold text-sky-700 flex items-center gap-1">
                <span>Zero Double-Allocation</span>
                <ChevronRight className="w-3 h-3" />
              </div>
            </div>

            {/* Step 3: Prepare */}
            <div 
              onClick={() => setWorkflowActiveStep(3)}
              className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                workflowActiveStep === 3 
                  ? 'bg-indigo-50/60 border-indigo-600 shadow-xs ring-1 ring-indigo-600' 
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold text-xs">
                    <Activity className="w-4 h-4" />
                  </div>
                  <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded bg-indigo-100 text-indigo-800">
                    Stage 03
                  </span>
                </div>
                <h3 className="text-sm font-bold text-[#0F172A]">3. Ward Turnaround</h3>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  Dispatched nursing and housekeeping teams advance bed through terminal sanitization, biomedical checklist, and sterile consumable setup.
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-100 text-[10px] font-semibold text-indigo-700 flex items-center gap-1">
                <span>6-Stage Sanitation SOP</span>
                <ChevronRight className="w-3 h-3" />
              </div>
            </div>

            {/* Step 4: Confirm */}
            <div 
              onClick={() => setWorkflowActiveStep(4)}
              className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                workflowActiveStep === 4 
                  ? 'bg-emerald-50/60 border-emerald-600 shadow-xs ring-1 ring-emerald-600' 
                  : 'bg-white border-slate-200 hover:border-slate-300'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                    <CheckCircle className="w-4 h-4" />
                  </div>
                  <span className="text-[9px] font-bold uppercase px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800">
                    Stage 04
                  </span>
                </div>
                <h3 className="text-sm font-bold text-[#0F172A]">4. Verified Readiness</h3>
                <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                  Primary nurse and administrative officer complete digital sign-off. Resource is marked "Ready" on live dashboards; patient admission occurs safely.
                </p>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-100 text-[10px] font-semibold text-emerald-700 flex items-center gap-1">
                <span>Audited Clinical Intake</span>
                <ChevronRight className="w-3 h-3" />
              </div>
            </div>

          </div>

          {/* Compact Selected Stage Info Strip */}
          <div className="mt-3.5 p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-full bg-[#1A56DB] text-white flex items-center justify-center text-[11px] font-bold shrink-0">
                {workflowActiveStep}
              </div>
              <div className="text-xs text-slate-700">
                <strong>Current Stage Preview:</strong>{' '}
                {workflowActiveStep === 1 && 'Clinicians submit digital requisition tags directly from Doctor Dashboard or Emergency Triage.'}
                {workflowActiveStep === 2 && 'Resource engine cross-references district-wide beds, eliminating phone calls and manual spreadsheets.'}
                {workflowActiveStep === 3 && 'Housekeeping updates sanitization state with real-time audit timestamps on Nurse Dashboard.'}
                {workflowActiveStep === 4 && 'Certified clinical sign-off prevents premature admissions and guarantees patient safety.'}
              </div>
            </div>
            <button
              onClick={onGetStarted}
              className="text-xs font-bold text-[#1A56DB] hover:underline flex items-center gap-1 shrink-0 cursor-pointer"
            >
              Test Live Workflow &rarr;
            </button>
          </div>

        </div>
      </section>

      {/* 
        ============================================================
        CORE CAPABILITIES — 5 REAL IMPLEMENTED PROJECT MODULES
        - Directly maps to user requirements:
          1. Hospital Admin
          2. Doctor Clinical Intelligence
          3. NurseFlow & Ward Management
          4. Emergency Command Center
          5. Workflow Automation Center
        - Compact, non-repetitive layout with existing visual card style
        ============================================================
      */}
      <section id="features" className="w-[94%] max-w-[1680px] mx-auto py-5 scroll-mt-20">
        <div className="max-w-3xl mb-5 text-left">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-[#1A56DB] text-[10px] font-bold uppercase tracking-wider mb-1">
            <Layers className="w-3 h-3" />
            <span>Implemented System Modules</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-serif-headline text-[#0F172A]">
            Core Platform Capabilities
          </h2>
          <p className="mt-1 text-xs text-slate-600 leading-relaxed">
            Engineered specifically to solve fragmented hospital communications through five dedicated, role-isolated operational modules.
          </p>
        </div>

        {/* 5 Focused Module Cards: 3 on Top Row, 2 on Bottom Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          
          {/* Module 1: Hospital Admin */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#1A56DB] flex items-center justify-center">
                  <Building2 className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold bg-blue-50 text-[#1A56DB] px-2 py-0.5 rounded-full border border-blue-200">
                  Hospital Admin
                </span>
              </div>
              <h3 className="text-sm font-bold text-[#0F172A]">Hospital Resource Management & Governance</h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Centralized oversight of hospital-wide operational capacity with real-time audit logging and district multi-tenancy.
              </p>

              <div className="mt-3.5 space-y-1.5 text-xs text-slate-700">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span><strong>Bed Management & Readiness:</strong> 6-stage turnaround lifecycle</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span><strong>Equipment Telemetry:</strong> Ventilator, monitor & defibrillator tracking</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span><strong>Resource Requisitions:</strong> Urgency-tiered clinician request approval</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] text-slate-400">Multi-tenant isolation</span>
              <button 
                onClick={onGetStarted}
                className="text-xs font-bold text-[#1A56DB] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Launch Admin</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Module 2: Doctor Dashboard */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <Stethoscope className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                  Doctor Clinical
                </span>
              </div>
              <h3 className="text-sm font-bold text-[#0F172A]">Clinical Intelligence & Inpatient Monitoring</h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Empowers attending clinicians with comprehensive digital patient twins and AI-driven clinical decision support.
              </p>

              <div className="mt-3.5 space-y-1.5 text-xs text-slate-700">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span><strong>Patient Digital Twin:</strong> Longitudinal vital telemetry & labs</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span><strong>Early Warning Radar:</strong> Clinical deterioration risk scoring</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span><strong>Medication Safety:</strong> AI drug-drug adverse interaction screening</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] text-slate-400">Clinical decision support</span>
              <button 
                onClick={onGetStarted}
                className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Launch Doctor</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Module 3: Nurse Dashboard & NurseFlow */}
          <div className="bg-white p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
                  <HeartHandshake className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold bg-amber-50 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200">
                  NurseFlow Intelligence
                </span>
              </div>
              <h3 className="text-sm font-bold text-[#0F172A]">Ward Workload & Handover Management</h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Streamlines frontline nursing workflows with automated task queues and structured shift handover logs.
              </p>

              <div className="mt-3.5 space-y-1.5 text-xs text-slate-700">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span><strong>Ward Workload Analysis:</strong> Acuity-based patient nurse ratios</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span><strong>Shift Readiness & Prep:</strong> Bed sanitization & checklist SOPs</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span><strong>Digital Shift Handover:</strong> Synthesized handover log with RN sign-off</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] text-slate-400">Human-in-the-loop safety</span>
              <button 
                onClick={onGetStarted}
                className="text-xs font-bold text-amber-700 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Launch Nurse</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Module 4: Emergency Command Center (Spans half on large screens) */}
          <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-rose-200/90 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-9 h-9 rounded-xl bg-rose-50 text-rose-700 flex items-center justify-center">
                    <Siren className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[#0F172A]">Emergency Command Center</h3>
                    <div className="text-[10px] text-rose-600 font-medium">Disaster Readiness & MCI Trauma Coordination</div>
                  </div>
                </div>
                <span className="text-[10px] font-bold bg-rose-100 text-rose-800 px-2 py-0.5 rounded-full">
                  High-Acuity Triage
                </span>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Coordinates rapid triage for mass casualty incidents (MCI), real-time resource matching, ambulance telemetry routing, and trauma bed pre-reservation with clinician confirmation gates.
              </p>

              <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs text-slate-700">
                <div className="p-2.5 bg-rose-50/50 rounded-lg border border-rose-100">
                  <div className="font-bold text-rose-900 text-[11px]">Emergency Matching</div>
                  <div className="text-[10px] text-slate-600 mt-0.5">Automated locking of compatible ICU bays & ventilators</div>
                </div>
                <div className="p-2.5 bg-rose-50/50 rounded-lg border border-rose-100">
                  <div className="font-bold text-rose-900 text-[11px]">Simulation Sandbox</div>
                  <div className="text-[10px] text-slate-600 mt-0.5">MCI scenario testing without affecting live hospital census</div>
                </div>
                <div className="p-2.5 bg-rose-50/50 rounded-lg border border-rose-100">
                  <div className="font-bold text-rose-900 text-[11px]">Ambulance Triage</div>
                  <div className="text-[10px] text-slate-600 mt-0.5">Pre-arrival casualty notification with ETA tracking</div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] text-slate-400">Zero cross-hospital data leakage</span>
              <button 
                onClick={onGetStarted}
                className="text-xs font-bold text-rose-700 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Launch Emergency Command</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Module 5: Workflow Automation Center */}
          <div className="bg-white p-5 rounded-2xl border border-purple-200/90 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-700 flex items-center justify-center">
                  <Zap className="w-5 h-5" />
                </div>
                <span className="text-[10px] font-bold bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full">
                  Automation Center
                </span>
              </div>
              <h3 className="text-sm font-bold text-[#0F172A]">Intelligent Workflow Automation</h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                Visual automation rules that automatically trigger bed turnover on discharge, monitor telemetry thresholds, and enforce administrative approval gates.
              </p>

              <div className="mt-3.5 space-y-1.5 text-xs text-slate-700">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span><strong>Visual Workflow Rules:</strong> Trigger, Condition & Action engine</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span><strong>Safety Approval Gates:</strong> Human verification on critical actions</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span><strong>Execution History:</strong> Immutable audit trail of automated actions</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] text-slate-400">Rule-based event engine</span>
              <button 
                onClick={onGetStarted}
                className="text-xs font-bold text-purple-700 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Launch Workflows</span>
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>

        </div>
      </section>

      {/* 
        ============================================================
        ABOUT SECTION (COMPACT ARCHITECTURAL OVERVIEW)
        - Compact padding (py-4)
        - Explains operational divide vs. unified ledger
        - Preserves navbar anchor #about
        ============================================================
      */}
      <section id="about" className="w-[94%] max-w-[1680px] mx-auto py-4 scroll-mt-20">
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            
            <div className="lg:col-span-8">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-[#1A56DB] text-[10px] font-bold uppercase tracking-wider mb-1.5">
                <ShieldCheck className="w-3 h-3" />
                <span>The Operational Imperative</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-serif-headline text-[#0F172A] leading-tight">
                Bringing Hospital Resources and Clinical Teams Into Sync.
              </h2>
              <p className="mt-2 text-xs text-slate-600 leading-relaxed">
                Hospital resource coordination often relies on whiteboards, physical binders, and fragmented telephone calls. This operational disconnect causes delayed emergency admissions and premature transfers.
              </p>
              <p className="mt-1.5 text-xs text-slate-600 leading-relaxed">
                MediSync AI establishes an immutable operational ledger that connects bed turnover, nursing stations, clinical order sets, and emergency casualty into a single real-time source of truth.
              </p>

              <div className="mt-3.5 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="font-semibold text-slate-800 text-[11px]">Multi-Tenant Isolation</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="font-semibold text-slate-800 text-[11px]">Verified Nurse Sign-Off</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="font-semibold text-slate-800 text-[11px]">HL7 FHIR & ABDM Ready</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="font-semibold text-slate-800 text-[11px]">Zero Double-Booking</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-4 bg-[#F8FAFC] rounded-xl p-4 border border-slate-200">
              <div className="text-xs font-bold text-[#0F172A] mb-1.5 flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-[#1A56DB]" />
                <span>Clinical Governance Standard</span>
              </div>
              <blockquote className="text-[11px] text-slate-600 italic leading-relaxed border-l-2 border-[#1A56DB] pl-2.5 py-0.5 my-1.5">
                "Resource metrics on MediSync AI represent calibrated beds verified by registered nursing staff before clinical admission."
              </blockquote>
              <div className="mt-3 pt-2 border-t border-slate-200 text-[10px] text-slate-400 flex items-center justify-between">
                <span>HealthTech Hackathon Evaluation</span>
                <span className="font-bold text-[#1A56DB]">MediSync AI &bull; 2026</span>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 
        ============================================================
        CONTACT SECTION — HOSPITAL ONBOARDING & INTEGRATION
        - Compact padding (py-4)
        - Clean 2-column layout preserving contact form & test harness
        ============================================================
      */}
      <section id="contact" className="w-[94%] max-w-[1680px] mx-auto py-4 scroll-mt-20">
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Left Column: Official Contact Channels */}
            <div className="lg:col-span-5">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-[#1A56DB] text-[10px] font-bold uppercase tracking-wider mb-1">
                <Mail className="w-3 h-3" />
                <span>Institutional Onboarding</span>
              </div>
              <h2 className="text-xl sm:text-2xl font-serif-headline text-[#0F172A]">
                Contact Hospital Integration
              </h2>
              <p className="mt-1.5 text-xs text-slate-500 leading-relaxed">
                Connect with the MediSync AI healthcare coordination team for district node onboarding, telemetry integration, or clinical demonstration questions.
              </p>

              <div className="mt-4 space-y-2.5 text-xs text-slate-600">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#1A56DB] flex items-center justify-center shrink-0">
                    <Mail className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-[9px] text-slate-400 font-medium">Official Dispatch Email</div>
                    <div className="font-bold text-[#0F172A] text-xs">coordination@medisync.gov.in</div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#1A56DB] flex items-center justify-center shrink-0">
                    <Phone className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-[9px] text-slate-400 font-medium">State Health Command Desk</div>
                    <div className="font-bold text-[#0F172A] text-xs">+91 44 2530 5000 (Toll Free 24/7)</div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#1A56DB] flex items-center justify-center shrink-0">
                    <MapPin className="w-3.5 h-3.5" />
                  </div>
                  <div>
                    <div className="text-[9px] text-slate-400 font-medium">Headquarters</div>
                    <div className="font-bold text-[#0F172A] text-xs">Health & Family Welfare Dept, Chennai, Tamil Nadu</div>
                  </div>
                </div>
              </div>

              <div className="mt-4 p-2.5 bg-slate-50 rounded-xl border border-slate-200 text-[10px] text-slate-500">
                <span className="font-bold text-slate-700">Demonstration Notice:</span> This contact form functions as an interactive demonstration of institutional inquiry logging within the test harness.
              </div>
            </div>

            {/* Right Column: Compact Form */}
            <div className="lg:col-span-7 bg-[#F8FAFC] p-4 sm:p-5 rounded-xl border border-slate-200">
              {contactSubmitted ? (
                <div className="text-center py-6 space-y-3">
                  <div className="w-10 h-10 bg-emerald-50 text-emerald-700 rounded-full flex items-center justify-center mx-auto border border-emerald-200">
                    <Check className="w-5 h-5 stroke-[3]" />
                  </div>
                  <h4 className="text-sm font-bold text-[#0F172A]">Demonstration Inquiry Logged</h4>
                  <p className="text-xs text-slate-600 max-w-md mx-auto leading-relaxed">
                    Thank you, <strong>{contactName}</strong>. Your inquiry regarding <em>"{contactSubject || 'Hospital Coordination'}"</em> has been logged successfully into the test harness.
                  </p>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => { setContactSubmitted(false); setContactMessage(''); }}
                  >
                    Send Another Demo Inquiry
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleContactSubmit} className="space-y-3">
                  {contactError && (
                    <div className="p-2.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs flex items-center gap-2">
                      <AlertCircle className="w-3.5 h-3.5 shrink-0 text-rose-600" />
                      <span>{contactError}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-[#0F172A] mb-1">
                        Your Full Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        placeholder="Dr. Rajesh Kumar / Medical Supt."
                        required
                        className="w-full text-xs px-3 py-2 bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A56DB]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-[#0F172A] mb-1">
                        Official Email <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="email"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        placeholder="officer@hospital.gov.in"
                        required
                        className="w-full text-xs px-3 py-2 bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A56DB]"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-[#0F172A] mb-1">Hospital / Facility Name</label>
                      <input
                        type="text"
                        value={contactHospital}
                        onChange={(e) => setContactHospital(e.target.value)}
                        placeholder="Govt. General Hospital, Chennai"
                        className="w-full text-xs px-3 py-2 bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A56DB]"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-[#0F172A] mb-1">Inquiry Subject</label>
                      <input
                        type="text"
                        value={contactSubject}
                        onChange={(e) => setContactSubject(e.target.value)}
                        placeholder="Bed Telemetry / ICU Requisitions"
                        className="w-full text-xs px-3 py-2 bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A56DB]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-[#0F172A] mb-1">
                      Message & Technical Requirements <span className="text-rose-500">*</span>
                    </label>
                    <textarea
                      rows={2}
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      placeholder="Specify your facility bed capacity, ventilator inventory, or questions..."
                      required
                      className="w-full text-xs px-3 py-2 bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A56DB]"
                    />
                  </div>

                  <div className="pt-1">
                    <Button type="submit" variant="primary" size="sm" icon={<Send className="w-3 h-3" />}>
                      Submit Institutional Inquiry
                    </Button>
                  </div>
                </form>
              )}
            </div>

          </div>
        </div>
      </section>

      {/* 
        ============================================================
        FOOTER SECTION (COMPACT VIEW)
        - Compact padding (py-4)
        ============================================================
      */}
      <footer className="w-full border-t border-[#E2E8F0] bg-white py-4 mt-auto">
        <div className="w-[94%] max-w-[1680px] mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#64748B]">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-[#1A56DB] flex items-center justify-center text-white">
              <Activity className="w-3 h-3" />
            </div>
            <span className="font-bold text-[#0F172A]">MediSync AI</span>
            <span>&mdash; Hospital Resource Management & Coordination Platform</span>
          </div>

          <div className="flex items-center gap-5 text-[11px] flex-wrap justify-center">
            <a href="#how-it-works" onClick={(e) => { e.preventDefault(); handleNavClick('How It Works', '#how-it-works'); }} className="hover:text-[#1A56DB]">Workflow</a>
            <a href="#features" onClick={(e) => { e.preventDefault(); handleNavClick('Features', '#features'); }} className="hover:text-[#1A56DB]">Modules</a>
            <a href="#about" onClick={(e) => { e.preventDefault(); handleNavClick('About', '#about'); }} className="hover:text-[#1A56DB]">About</a>
            <a href="#contact" onClick={(e) => { e.preventDefault(); handleNavClick('Contact', '#contact'); }} className="hover:text-[#1A56DB]">Contact</a>
            <span>&copy; 2026 MediSync AI. All rights reserved.</span>
          </div>
        </div>
      </footer>

      {/* 
        ============================================================
        FUNCTIONAL SEARCH MODAL (Full Section Index)
        ============================================================
      */}
      {isSearchOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-lg bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-3.5 border-b border-slate-100 flex items-center gap-2.5">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search landing page sections, modules, workflows..."
                className="w-full text-xs text-[#0F172A] focus:outline-none"
              />
              <button
                onClick={() => setIsSearchOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-3.5 max-h-72 overflow-y-auto space-y-1.5 text-xs">
              <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Matching Sections ({filteredSearch.length}):
              </div>
              {filteredSearch.map((item, idx) => (
                <div 
                  key={idx}
                  onClick={() => {
                    setIsSearchOpen(false);
                    const el = document.querySelector(item.href);
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="p-2 rounded-lg hover:bg-slate-50 cursor-pointer flex items-center justify-between border border-transparent hover:border-slate-100 transition-colors"
                >
                  <div>
                    <div className="font-bold text-[#0F172A] flex items-center gap-2">
                      {item.title}
                      <span className="text-[9px] px-1.5 py-0.2 bg-blue-50 text-[#1A56DB] rounded border border-blue-100 font-semibold">
                        {item.category}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{item.desc}</div>
                  </div>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Watch Demo Modal */}
      {isDemoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-3.5 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-md bg-[#1A56DB] text-white flex items-center justify-center">
                  <Play className="w-3 h-3 fill-white" />
                </div>
                <h4 className="text-xs font-bold text-[#0F172A]">MediSync AI &mdash; Live Hackathon Coordination Demo</h4>
              </div>
              <button
                onClick={() => setIsDemoModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-3.5">
              <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-200 text-xs text-[#0F172A] leading-relaxed">
                <h5 className="font-bold text-[#1A56DB] mb-1">Interactive Walkthrough Scenario:</h5>
                <ol className="list-decimal list-inside space-y-1 text-slate-700">
                  <li><strong>Doctor Perspective:</strong> Submits an emergency requisition for an ICU bed and ventilator.</li>
                  <li><strong>Nurse Perspective:</strong> Advances Bed Turnaround through the 6-stage lifecycle (Occupied &rarr; Discharged &rarr; Cleaning &rarr; Equipment Check &rarr; Nurse Confirmation &rarr; Ready).</li>
                  <li><strong>Admin Perspective:</strong> Approves requisition and verifies operational bed allocation.</li>
                  <li><strong>Emergency Command:</strong> Dispatches and locks trauma resources with real-time telemetry.</li>
                </ol>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-1">
                <Button variant="outline" size="sm" onClick={() => setIsDemoModalOpen(false)}>
                  Close
                </Button>
                <Button 
                  variant="primary" 
                  size="sm" 
                  onClick={() => { setIsDemoModalOpen(false); handleOpenPortalSelection(); }}
                  icon={<ArrowRight className="w-3.5 h-3.5" />}
                >
                  Start Live Demonstration Flow
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Portal Selection Modal */}
      <PortalSelectionModal
        isOpen={isPortalModalOpen}
        onClose={() => setIsPortalModalOpen(false)}
        onSelectPortal={handlePortalSelected}
      />
    </div>
  );
};
