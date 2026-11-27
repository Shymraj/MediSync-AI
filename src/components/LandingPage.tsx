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
  Check
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
    // Demo submission confirmation
  };

  // Search Results
  const searchableSections = [
    { title: 'How It Works — Resource Workflow', category: 'Workflow', href: '#how-it-works', desc: '4-stage lifecycle: Request, Identify, Prepare, and Confirm.' },
    { title: 'Real-Time Resource Availability', category: 'Features', href: '#features', desc: 'Live bed and ventilator telemetry across Tamil Nadu hospitals.' },
    { title: 'Hospital Bed Readiness Tracking', category: 'Features', href: '#features', desc: '6-stage bed turnover from occupancy to nurse confirmation.' },
    { title: 'Equipment Availability Management', category: 'Features', href: '#features', desc: 'Mechanical ventilator and defibrillator telemetry monitoring.' },
    { title: 'Role-Based Dashboards', category: 'Platform', href: '#roles', desc: 'Dedicated views for Hospital Admin, Doctor, Nurse, and Patient.' },
    { title: 'About MediSync AI', category: 'About', href: '#about', desc: 'Bringing hospital resources, clinical teams, and patients into sync.' },
    { title: 'Contact Support & Hospital Integration', category: 'Contact', href: '#contact', desc: 'Inquire about institutional medical center coordination.' },
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
        TOP NAVIGATION
        - Fixed sticky navbar with smooth scroll destinations
        - High-width max-w-7xl balanced container
        ============================================================
      */}
      <header className="sticky top-0 z-40 bg-[#F4F7FC]/90 backdrop-blur-md border-b border-[#E2E8F0]/80">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
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
        HERO SECTION
        - Balanced responsive width eliminating excess side margins
        - Left: Headline with serif typography, description, action buttons
        - Right: Hospital building backdrop with floating live operations dashboard
        ============================================================
      */}
      <section id="hero" className="relative w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-10 scroll-mt-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-10 items-center">
          {/* Left Column (5 cols) */}
          <div className="lg:col-span-5 z-10 text-left">
            <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#64748B] mb-3">
              SMARTER HOSPITALS &bull; STRONGER HEALTHCARE
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-[3.35rem] font-serif-headline text-[#0F172A] leading-[1.12] tracking-tight">
              Every Hospital.<br />
              Every Resource.<br />
              Every Minute. <span className="text-[#1A56DB] italic font-normal">In Sync.</span>
            </h1>

            <p className="mt-5 text-sm sm:text-base text-[#475569] leading-relaxed max-w-lg">
              Coordinate hospital beds, equipment, patient requests, and clinical teams through one intelligent platform.
            </p>

            <div className="mt-8 flex items-center gap-4 flex-wrap">
              <button
                onClick={onGetStarted}
                className="px-6 py-3 rounded-full bg-[#1A56DB] hover:bg-[#1547B3] text-white text-xs font-bold flex items-center gap-2 shadow-md transition-all cursor-pointer"
              >
                <span>Get Started</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => setIsDemoModalOpen(true)}
                className="px-5 py-3 rounded-full bg-white hover:bg-slate-50 border border-[#CBD5E1] text-[#0F172A] text-xs font-semibold flex items-center gap-2 shadow-2xs transition-all cursor-pointer"
              >
                <div className="w-4 h-4 rounded-full bg-[#1A56DB] text-white flex items-center justify-center">
                  <Play className="w-2.5 h-2.5 fill-white stroke-none ml-0.5" />
                </div>
                <span>Watch Demo</span>
              </button>
            </div>
          </div>

          {/* Right Column (7 cols): Hospital Building Background + Floating Dashboard */}
          <div className="lg:col-span-7 relative flex items-center justify-end">
            <div className="relative w-full rounded-3xl overflow-hidden shadow-2xl border border-white/60 bg-[#E2E8F0] min-h-[460px] flex items-center justify-center">
              {/* High-res hospital building architecture background photo */}
              <img
                src="https://images.unsplash.com/photo-1586773860418-d37222d8fce3?auto=format&fit=crop&w=1400&q=80"
                alt="Modern Hospital Architecture"
                className="absolute inset-0 w-full h-full object-cover brightness-[0.98] contrast-[1.02]"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-blue-900/10 via-transparent to-blue-500/10" />

              {/* Floating Real Hospital Operations Dashboard Overlay */}
              <div className="relative z-10 w-[95%] sm:w-[94%] my-4 bg-white/95 backdrop-blur-md rounded-2xl shadow-[0_20px_50px_rgba(15,23,42,0.18)] border border-[#E2E8F0]/90 p-4 sm:p-5 text-[#0F172A]">
                {/* Dashboard Top Header */}
                <div className="flex items-center justify-between pb-3 border-b border-[#F1F5F9]">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-[#1A56DB] flex items-center justify-center text-white">
                      <Activity className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs font-bold text-[#0F172A]">MediSync <span className="text-[#1A56DB]">AI</span></span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-semibold text-[#475569]">City General Hospital</span>
                    <button className="relative text-slate-400 hover:text-slate-600">
                      <Bell className="w-3.5 h-3.5" />
                      <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-red-500" />
                    </button>
                    <img
                      src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=120&q=80"
                      alt="Doctor Profile"
                      className="w-6 h-6 rounded-full object-cover border border-slate-200"
                    />
                  </div>
                </div>

                {/* Dashboard Inner Body: Left mini-sidebar + Right metrics & chart */}
                <div className="grid grid-cols-12 gap-3 pt-3">
                  {/* Mini Sidebar */}
                  <div className="col-span-3 space-y-1 text-[10px] font-medium border-r border-[#F1F5F9] pr-2">
                    <div className="px-2 py-1.5 rounded-lg bg-[#1A56DB] text-white font-bold flex items-center gap-1.5">
                      <LayoutDashboard className="w-3 h-3" /> Dashboard
                    </div>
                    <div className="px-2 py-1.5 rounded-lg text-slate-600 hover:bg-slate-50 flex items-center gap-1.5">
                      <Activity className="w-3 h-3" /> Resources
                    </div>
                    <div className="px-2 py-1.5 rounded-lg text-slate-600 hover:bg-slate-50 flex items-center gap-1.5">
                      <Building2 className="w-3 h-3" /> Departments
                    </div>
                    <div className="px-2 py-1.5 rounded-lg text-slate-600 hover:bg-slate-50 flex items-center gap-1.5">
                      <Clock className="w-3 h-3" /> Requests
                    </div>
                    <div className="px-2 py-1.5 rounded-lg text-slate-600 hover:bg-slate-50 flex items-center gap-1.5">
                      <Users className="w-3 h-3" /> Patients
                    </div>
                    <div className="px-2 py-1.5 rounded-lg text-slate-600 hover:bg-slate-50 flex items-center gap-1.5">
                      <FileText className="w-3 h-3" /> Reports
                    </div>
                  </div>

                  {/* Main Preview Area */}
                  <div className="col-span-9 pl-1">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <h4 className="text-xs font-bold text-[#0F172A]">Hospital Overview</h4>
                        <p className="text-[10px] text-slate-400">Real-time resource status across your hospital</p>
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-slate-500 font-semibold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Live &bull; 10:42 AM
                      </div>
                    </div>

                    {/* 4 Stat Cards */}
                    <div className="grid grid-cols-4 gap-2 mb-3">
                      <div className="bg-[#F8FAFC] p-2 rounded-xl border border-slate-100">
                        <div className="w-5 h-5 rounded-md bg-blue-50 text-[#1A56DB] flex items-center justify-center mb-1">
                          <Bed className="w-3 h-3" />
                        </div>
                        <div className="text-sm font-extrabold text-[#0F172A]">128</div>
                        <div className="text-[9px] text-slate-500 font-medium">Total Beds</div>
                      </div>

                      <div className="bg-[#F8FAFC] p-2 rounded-xl border border-slate-100">
                        <div className="w-5 h-5 rounded-md bg-emerald-50 text-emerald-600 flex items-center justify-center mb-1">
                          <CheckCircle2 className="w-3 h-3" />
                        </div>
                        <div className="text-sm font-extrabold text-emerald-600">24</div>
                        <div className="text-[9px] text-slate-500 font-medium">Ready</div>
                      </div>

                      <div className="bg-[#F8FAFC] p-2 rounded-xl border border-slate-100">
                        <div className="w-5 h-5 rounded-md bg-amber-50 text-amber-600 flex items-center justify-center mb-1">
                          <Bed className="w-3 h-3" />
                        </div>
                        <div className="text-sm font-extrabold text-amber-600">86</div>
                        <div className="text-[9px] text-slate-500 font-medium">Occupied</div>
                      </div>

                      <div className="bg-[#F8FAFC] p-2 rounded-xl border border-slate-100">
                        <div className="w-5 h-5 rounded-md bg-sky-50 text-sky-600 flex items-center justify-center mb-1">
                          <Clock className="w-3 h-3" />
                        </div>
                        <div className="text-sm font-extrabold text-sky-600">18</div>
                        <div className="text-[9px] text-slate-500 font-medium leading-tight">In Preparation</div>
                      </div>
                    </div>

                    {/* Bed Status Trend Chart & Recent Activity */}
                    <div className="grid grid-cols-12 gap-2">
                      {/* Trend mini chart */}
                      <div className="col-span-7 bg-[#F8FAFC] p-2 rounded-xl border border-slate-100">
                        <div className="flex items-center justify-between text-[10px] mb-1">
                          <span className="font-bold text-slate-700">Bed Status Trend</span>
                          <span className="text-[8px] text-slate-400">Last 24 Hours &or;</span>
                        </div>
                        <div className="h-14 w-full flex items-end">
                          <svg className="w-full h-full overflow-visible" viewBox="0 0 160 50">
                            <defs>
                              <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#1A56DB" stopOpacity="0.25" />
                                <stop offset="100%" stopColor="#1A56DB" stopOpacity="0" />
                              </linearGradient>
                            </defs>
                            <path
                              d="M0,35 Q20,20 40,28 T80,18 T120,22 T160,12 L160,50 L0,50 Z"
                              fill="url(#chartGrad)"
                            />
                            <path
                              d="M0,35 Q20,20 40,28 T80,18 T120,22 T160,12"
                              fill="none"
                              stroke="#1A56DB"
                              strokeWidth="2"
                            />
                            <circle cx="40" cy="28" r="2.5" fill="#1A56DB" />
                            <circle cx="80" cy="18" r="2.5" fill="#1A56DB" />
                            <circle cx="120" cy="22" r="2.5" fill="#1A56DB" />
                            <circle cx="160" cy="12" r="2.5" fill="#1A56DB" />
                          </svg>
                        </div>
                        <div className="flex justify-between text-[8px] text-slate-400 mt-1">
                          <span>12AM</span>
                          <span>6AM</span>
                          <span>12PM</span>
                          <span>6PM</span>
                          <span>12AM</span>
                        </div>
                      </div>

                      {/* Recent Activity list */}
                      <div className="col-span-5 bg-[#F8FAFC] p-2 rounded-xl border border-slate-100 flex flex-col justify-between">
                        <span className="text-[10px] font-bold text-slate-700">Recent Activity</span>
                        <div className="space-y-1.5 my-1 text-[8px]">
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1 text-slate-600 truncate">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Bed B-102 marked Ready
                            </span>
                            <span className="text-slate-400">2m ago</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1 text-slate-600 truncate">
                              <span className="w-1.5 h-1.5 rounded-full bg-blue-500" /> Equipment O-14 allocated
                            </span>
                            <span className="text-slate-400">5m ago</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1 text-slate-600 truncate">
                              <span className="w-1.5 h-1.5 rounded-full bg-amber-500" /> Request from Doctor
                            </span>
                            <span className="text-slate-400">8m ago</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="flex items-center gap-1 text-slate-600 truncate">
                              <span className="w-1.5 h-1.5 rounded-full bg-rose-500" /> Bed B-105 under Cleaning
                            </span>
                            <span className="text-slate-400">12m ago</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 
          ============================================================
          TRUST / METRICS FLOATING BAR
          - 50+ Hospitals
          - 6,000+ Patients Served
          - 99.9% System Uptime
          - 100% Coordination
          ============================================================
        */}
        <div className="mt-8 bg-white/90 backdrop-blur-md border border-[#E2E8F0] rounded-2xl shadow-sm px-6 py-4 grid grid-cols-2 md:grid-cols-4 gap-4 divide-y md:divide-y-0 md:divide-x divide-slate-100 max-w-4xl">
          <div className="flex items-center gap-3 pt-2 md:pt-0">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#1A56DB] flex items-center justify-center shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <div className="text-lg font-bold text-[#0F172A]">50+</div>
              <div className="text-xs text-slate-500">Hospitals Connected</div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2 md:pt-0 md:pl-6">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#1A56DB] flex items-center justify-center shrink-0">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <div className="text-lg font-bold text-[#0F172A]">6,000+</div>
              <div className="text-xs text-slate-500">Patients Coordinated</div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2 md:pt-0 md:pl-6">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#1A56DB] flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <div className="text-lg font-bold text-[#0F172A]">99.9%</div>
              <div className="text-xs text-slate-500">System Uptime</div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2 md:pt-0 md:pl-6">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#1A56DB] flex items-center justify-center shrink-0">
              <Handshake className="w-4 h-4" />
            </div>
            <div>
              <div className="text-lg font-bold text-[#0F172A]">100%</div>
              <div className="text-xs text-slate-500">Resource Synchronization</div>
            </div>
          </div>
        </div>
      </section>

      {/* 
        ============================================================
        HOW IT WORKS — RESOURCE READINESS WORKFLOW STRIP & CARDS
        - Section Title: "From Request to Ready"
        - 1. Request, 2. Identify, 3. Prepare, 4. Confirm
        ============================================================
      */}
      <section id="how-it-works" className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 scroll-mt-20">
        <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-sm p-6 sm:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            {/* Title column (3 cols) */}
            <div className="lg:col-span-3 border-b lg:border-b-0 lg:border-r border-slate-100 pb-4 lg:pb-0 lg:pr-6">
              <h3 className="text-xl sm:text-2xl font-serif-headline text-[#0F172A] leading-tight">
                From Request<br />to Ready
              </h3>
              <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                A seamless workflow for better hospital operations.
              </p>
            </div>

            {/* Steps Workflow (7 cols) */}
            <div className="lg:col-span-7 flex flex-col sm:flex-row items-center justify-between gap-4">
              {/* Step 1: Request */}
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-blue-50 text-[#1A56DB] flex items-center justify-center mb-2 shadow-2xs">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="text-xs font-bold text-[#0F172A]">1. Request</div>
                <div className="text-[10px] text-slate-500 max-w-[120px] mt-0.5">Submit hospital resource request</div>
              </div>

              <div className="hidden sm:block text-slate-300">
                <ArrowRight className="w-4 h-4" />
              </div>

              {/* Step 2: Identify */}
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-sky-50 text-sky-600 flex items-center justify-center mb-2 shadow-2xs">
                  <Search className="w-5 h-5" />
                </div>
                <div className="text-xs font-bold text-[#0F172A]">2. Identify</div>
                <div className="text-[10px] text-slate-500 max-w-[120px] mt-0.5">Find suitable available resources</div>
              </div>

              <div className="hidden sm:block text-slate-300">
                <ArrowRight className="w-4 h-4" />
              </div>

              {/* Step 3: Prepare */}
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center mb-2 shadow-2xs">
                  <Activity className="w-5 h-5" />
                </div>
                <div className="text-xs font-bold text-[#0F172A]">3. Prepare</div>
                <div className="text-[10px] text-slate-500 max-w-[120px] mt-0.5">Complete required readiness tasks</div>
              </div>

              <div className="hidden sm:block text-slate-300">
                <ArrowRight className="w-4 h-4" />
              </div>

              {/* Step 4: Confirm */}
              <div className="flex flex-col items-center text-center">
                <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mb-2 shadow-2xs">
                  <CheckCircle className="w-5 h-5" />
                </div>
                <div className="text-xs font-bold text-[#0F172A]">4. Confirm</div>
                <div className="text-[10px] text-slate-500 max-w-[120px] mt-0.5">Confirm resource is ready</div>
              </div>
            </div>

            {/* Tagline right column (2 cols) */}
            <div className="lg:col-span-2 border-t lg:border-t-0 lg:border-l border-slate-100 pt-4 lg:pt-0 lg:pl-6 text-center lg:text-left">
              <p className="text-xs font-medium text-slate-600 italic">
                Smarter coordination.<br />Better care.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 
        ============================================================
        FEATURES SECTION (Dedicated section per specification)
        - Real-Time Resource Availability
        - Hospital Bed Readiness Tracking
        - Equipment Availability Management
        - Resource Request Coordination
        - Department-Level Resource Overview
        - Role-Based Hospital Dashboards
        ============================================================
      */}
      <section id="features" className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 scroll-mt-20">
        <div className="text-left mb-8">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
            CORE CAPABILITIES
          </div>
          <h2 className="text-2xl sm:text-3xl font-serif-headline text-[#0F172A]">
            Engineered for Real Hospital Coordination
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
            MediSync AI replaces fragmented telephone logs and disconnected spreadsheets with a unified operational source of truth.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-2xs hover:border-[#1A56DB]/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1A56DB] flex items-center justify-center mb-4">
              <Activity className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-[#0F172A]">Real-Time Resource Availability</h4>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Live census updates on emergency, ICU, and step-down capacity synchronized continuously with district health command.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-2xs hover:border-[#1A56DB]/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-4">
              <Bed className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-[#0F172A]">Hospital Bed Readiness Tracking</h4>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Enforce the 6-stage lifecycle from patient discharge, sanitization, and equipment check to primary nurse sign-off.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-2xs hover:border-[#1A56DB]/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center mb-4">
              <Shield className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-[#0F172A]">Equipment Availability Management</h4>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Track telemetry, routine inspection timestamps, and serial number verification for mechanical ventilators and monitors.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-2xs hover:border-[#1A56DB]/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mb-4">
              <Clock className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-[#0F172A]">Resource Request Coordination</h4>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Clinicians submit requisitions categorized by clinical urgency (Critical, Urgent, Routine) with auditable allocation logs.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-2xs hover:border-[#1A56DB]/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-4">
              <Building2 className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-[#0F172A]">Department-Level Resource Overview</h4>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Isolate and view ward-specific allocations across Critical Care, Pulmonology, Emergency Casualty, and Cardiology units.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-[#E2E8F0] shadow-2xs hover:border-[#1A56DB]/40 transition-colors">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center mb-4">
              <LayoutDashboard className="w-5 h-5" />
            </div>
            <h4 className="text-sm font-bold text-[#0F172A]">Role-Based Hospital Dashboards</h4>
            <p className="text-xs text-slate-500 mt-2 leading-relaxed">
              Distinct permission-isolated interfaces tailored specifically for Hospital Administrators, Doctors, Nurses, and Patients.
            </p>
          </div>
        </div>
      </section>

      {/* 
        ============================================================
        ROLE-BASED PLATFORM SECTION ("One Hospital. Four Perspectives.")
        ============================================================
      */}
      <section id="roles" className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 scroll-mt-20">
        <div className="mb-6 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">
              ONE HOSPITAL
            </div>
            <h2 className="text-2xl sm:text-3xl font-serif-headline text-[#0F172A]">
              Four Perspectives.
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              A unified platform for every role in hospital operations.
            </p>
          </div>
          <button
            onClick={onGetStarted}
            className="text-xs font-bold text-[#1A56DB] hover:underline flex items-center gap-1 cursor-pointer"
          >
            Explore All Roles &rarr;
          </button>
        </div>

        {/* 4 Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Hospital Admin */}
          <div 
            onClick={onGetStarted}
            className="group relative bg-white rounded-2xl overflow-hidden border border-[#E2E8F0] shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col"
          >
            <div className="h-44 w-full overflow-hidden bg-slate-100 relative">
              <img
                src="https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&w=600&q=80"
                alt="Hospital Admin"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute top-3 left-3 w-8 h-8 rounded-full bg-[#1A56DB] text-white flex items-center justify-center shadow-xs">
                <Building2 className="w-4 h-4" />
              </div>
            </div>
            <div className="p-4 flex-1 flex flex-col justify-between">
              <div>
                <h4 className="text-sm font-bold text-[#0F172A]">Hospital Admin</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Monitor hospital resources and operational readiness.
                </p>
              </div>
            </div>
          </div>

          {/* Card 2: Doctor */}
          <div 
            onClick={onGetStarted}
            className="group relative bg-white rounded-2xl overflow-hidden border border-[#E2E8F0] shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col"
          >
            <div className="h-44 w-full overflow-hidden bg-slate-100 relative">
              <img
                src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?auto=format&fit=crop&w=600&q=80"
                alt="Doctor"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute top-3 left-3 w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
                <Stethoscope className="w-4 h-4" />
              </div>
            </div>
            <div className="p-4 flex-1 flex flex-col justify-between">
              <div>
                <h4 className="text-sm font-bold text-[#0F172A]">Doctor</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Coordinate patient admissions and resource requests.
                </p>
              </div>
            </div>
          </div>

          {/* Card 3: Nurse */}
          <div 
            onClick={onGetStarted}
            className="group relative bg-white rounded-2xl overflow-hidden border border-[#E2E8F0] shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col"
          >
            <div className="h-44 w-full overflow-hidden bg-slate-100 relative">
              <img
                src="https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=600&q=80"
                alt="Nurse"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute top-3 left-3 w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center shadow-xs">
                <HeartHandshake className="w-4 h-4" />
              </div>
            </div>
            <div className="p-4 flex-1 flex flex-col justify-between">
              <div>
                <h4 className="text-sm font-bold text-[#0F172A]">Nurse</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Manage ward tasks, bed preparation, and equipment checks.
                </p>
              </div>
            </div>
          </div>

          {/* Card 4: Patient */}
          <div 
            onClick={onGetStarted}
            className="group relative bg-white rounded-2xl overflow-hidden border border-[#E2E8F0] shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col"
          >
            <div className="h-44 w-full overflow-hidden bg-slate-100 relative">
              <img
                src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=600&q=80"
                alt="Patient"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute top-3 left-3 w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                <UserIcon className="w-4 h-4" />
              </div>
            </div>
            <div className="p-4 flex-1 flex flex-col justify-between">
              <div>
                <h4 className="text-sm font-bold text-[#0F172A]">Patient</h4>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  Track appointments, queues, and request status.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 
        ============================================================
        ABOUT SECTION (Dedicated section per specification)
        - Heading: "Bringing Hospital Resources and Teams Into Sync."
        - Mission statement and resource readiness approach
        ============================================================
      */}
      <section id="about" className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 scroll-mt-20">
        <div className="bg-white rounded-3xl border border-[#E2E8F0] p-8 sm:p-10 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#1A56DB] mb-2">
                ABOUT MEDISYNC AI
              </div>
              <h2 className="text-2xl sm:text-3xl font-serif-headline text-[#0F172A] leading-tight">
                Bringing Hospital Resources and Teams Into Sync.
              </h2>
              <p className="mt-4 text-xs sm:text-sm text-slate-600 leading-relaxed">
                MediSync AI is a hospital resource coordination platform designed to help healthcare teams monitor resource availability, manage readiness workflows, and coordinate operational activities across hospital departments.
              </p>
              <p className="mt-3 text-xs text-slate-500 leading-relaxed">
                By formalizing the resource lifecycle into auditable milestones, MediSync AI bridges the gap between doctors requesting emergency support, nurses completing terminal sanitization, and administrative superintendents optimizing hospital census.
              </p>

              <div className="mt-6 grid grid-cols-2 gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#15803D] shrink-0" />
                  <span className="text-slate-700 font-medium">District-scoped isolation</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#15803D] shrink-0" />
                  <span className="text-slate-700 font-medium">Verified staff onboarding</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#15803D] shrink-0" />
                  <span className="text-slate-700 font-medium">Zero premature admissions</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#15803D] shrink-0" />
                  <span className="text-slate-700 font-medium">Patient OPD queue transparency</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 bg-[#F8FAFC] rounded-2xl p-6 border border-slate-100 flex flex-col justify-between">
              <div className="text-xs font-bold text-[#0F172A] mb-3 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-[#1A56DB]" />
                Institutional Readiness Standard
              </div>
              <p className="text-xs text-slate-500 leading-relaxed mb-4">
                "Resource availability numbers represent real-time beds calibrated and verified by hospital nursing staff. Patient admission safety is upheld through certified triage procedures."
              </p>
              <div className="pt-4 border-t border-slate-200/80 text-[11px] text-slate-400">
                Pilot Implementation &middot; Health Department Hackathon Demonstration
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 
        ============================================================
        CONTACT SECTION (Dedicated section per specification)
        - Contact form with validation and demo submission state
        ============================================================
      */}
      <section id="contact" className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 scroll-mt-20">
        <div className="bg-white rounded-3xl border border-[#E2E8F0] p-8 sm:p-10 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-5">
              <div className="text-[10px] font-bold uppercase tracking-wider text-[#1A56DB] mb-1">
                GET IN TOUCH
              </div>
              <h2 className="text-2xl sm:text-3xl font-serif-headline text-[#0F172A]">
                Contact Hospital Integration
              </h2>
              <p className="mt-2 text-xs text-slate-500 leading-relaxed">
                Connect with the MediSync AI healthcare coordination team for district node onboarding, technical inquiries, or clinical demonstration questions.
              </p>

              <div className="mt-6 space-y-3 text-xs text-slate-600">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1A56DB] flex items-center justify-center shrink-0">
                    <Mail className="w-4 h-4" />
                  </div>
                  <span>coordination@medisync.gov.in</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1A56DB] flex items-center justify-center shrink-0">
                    <Phone className="w-4 h-4" />
                  </div>
                  <span>+91 44 2530 5000 (Health Command Desk)</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#1A56DB] flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <span>Health & Family Welfare Dept, Chennai, Tamil Nadu</span>
                </div>
              </div>
            </div>

            {/* Form */}
            <div className="lg:col-span-7 bg-[#F8FAFC] p-6 rounded-2xl border border-slate-100">
              {contactSubmitted ? (
                <div className="text-center py-8 space-y-3">
                  <div className="w-12 h-12 bg-green-50 text-[#15803D] rounded-full flex items-center justify-center mx-auto">
                    <Check className="w-6 h-6 stroke-[3]" />
                  </div>
                  <h4 className="text-sm font-bold text-[#0F172A]">Demo Message Received</h4>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                    Thank you, <strong>{contactName}</strong>. For this hackathon evaluation, your demo inquiry has been logged in the coordination test harness.
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
                <form onSubmit={handleContactSubmit} className="space-y-4">
                  {contactError && (
                    <div className="p-3 bg-red-50 text-red-600 border border-red-200 rounded-lg text-xs">
                      {contactError}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                        Your Full Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        placeholder="Dr. Rajesh / Admin Officer"
                        required
                        className="w-full text-xs px-3 py-2.5 bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A56DB]"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                        Official Email <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="email"
                        value={contactEmail}
                        onChange={(e) => setContactEmail(e.target.value)}
                        placeholder="officer@hospital.gov.in"
                        required
                        className="w-full text-xs px-3 py-2.5 bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A56DB]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#0F172A] mb-1">Subject</label>
                    <input
                      type="text"
                      value={contactSubject}
                      onChange={(e) => setContactSubject(e.target.value)}
                      placeholder="Hospital onboarding inquiry or bed telemetry integration"
                      className="w-full text-xs px-3 py-2.5 bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A56DB]"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[#0F172A] mb-1">
                      Message <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      rows={3}
                      value={contactMessage}
                      onChange={(e) => setContactMessage(e.target.value)}
                      placeholder="Provide details about your medical center or resource queries..."
                      required
                      className="w-full text-xs px-3 py-2.5 bg-white border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1A56DB]"
                    />
                  </div>

                  <Button type="submit" variant="primary" size="md" icon={<Send className="w-3.5 h-3.5" />}>
                    Submit Inquiry
                  </Button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 
        ============================================================
        FINAL CTA SECTION
        - Blue gradient banner with curved elements
        - Headline: "Make Every Hospital Resource Count."
        - Description: "Join MediSync AI and be part of a smarter, more connected healthcare ecosystem."
        - Button: "Get Started"
        ============================================================
      */}
      <section className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 mt-auto mb-6">
        <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-[#1855C4] via-[#2A6CE2] to-[#4085F6] p-8 sm:p-12 shadow-xl text-white flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="absolute -right-8 -bottom-10 opacity-10 pointer-events-none">
            <svg className="w-64 h-64 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 10.5h-5.5V5c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v5.5H5c-.83 0-1.5.67-1.5 1.5s.67 1.5 1.5 1.5h5.5V19c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-5.5H19c.83 0 1.5-.67 1.5-1.5s-.67-1.5-1.5-1.5z" />
            </svg>
          </div>

          <div className="max-w-2xl z-10 text-center md:text-left">
            <h2 className="text-2xl sm:text-3xl font-serif-headline font-normal tracking-tight text-white">
              Make Every Hospital Resource Count.
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-blue-100 leading-relaxed font-sans">
              Join MediSync AI and be a part of a smarter, more connected healthcare ecosystem.
            </p>
          </div>

          <div className="z-10 shrink-0">
            <button
              onClick={onGetStarted}
              className="px-7 py-3 rounded-full bg-white hover:bg-blue-50 text-[#1855C4] text-xs font-bold flex items-center gap-2 shadow-lg transition-all cursor-pointer"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* 
        ============================================================
        FOOTER SECTION
        ============================================================
      */}
      <footer className="w-full border-t border-[#E2E8F0] bg-white py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#64748B]">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-[#1A56DB] flex items-center justify-center text-white">
              <Activity className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-[#0F172A]">MediSync AI</span>
            <span>&mdash; Enterprise Healthcare Resource Management</span>
          </div>

          <div className="flex items-center gap-6 text-[11px]">
            <a href="#how-it-works" onClick={(e) => { e.preventDefault(); handleNavClick('How It Works', '#how-it-works'); }} className="hover:text-[#1A56DB]">Workflow</a>
            <a href="#features" onClick={(e) => { e.preventDefault(); handleNavClick('Features', '#features'); }} className="hover:text-[#1A56DB]">Features</a>
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
            <div className="p-4 border-b border-slate-100 flex items-center gap-3">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search landing page sections, features, workflow, roles..."
                className="w-full text-xs text-[#0F172A] focus:outline-none"
              />
              <button
                onClick={() => setIsSearchOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 max-h-72 overflow-y-auto space-y-2 text-xs">
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
                  className="p-2.5 rounded-lg hover:bg-slate-50 cursor-pointer flex items-center justify-between border border-transparent hover:border-slate-100 transition-colors"
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
                  <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
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
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-md bg-[#1A56DB] text-white flex items-center justify-center">
                  <Play className="w-3 h-3 fill-white" />
                </div>
                <h4 className="text-xs font-bold text-[#0F172A]">MediSync AI &mdash; Live Hackathon Coordination Demo</h4>
              </div>
              <button
                onClick={() => setIsDemoModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-4 rounded-xl bg-blue-50/70 border border-blue-200 text-xs text-[#0F172A] leading-relaxed">
                <h5 className="font-bold text-[#1A56DB] mb-1">Interactive Walkthrough Scenario:</h5>
                <ol className="list-decimal list-inside space-y-1.5 text-slate-700">
                  <li><strong>Doctor Perspective:</strong> Submits an emergency requisition for an ICU bed and ventilator.</li>
                  <li><strong>Nurse Perspective:</strong> Advances Bed Turnaround through the 6-stage lifecycle (Occupied &rarr; Discharged &rarr; Cleaning &rarr; Equipment Check &rarr; Nurse Confirmation &rarr; Ready).</li>
                  <li><strong>Admin Perspective:</strong> Approves requisition and verifies operational bed allocation.</li>
                  <li><strong>Patient Perspective:</strong> Views verified operational readiness and live OPD queue token.</li>
                </ol>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <Button variant="outline" size="sm" onClick={() => setIsDemoModalOpen(false)}>
                  Close
                </Button>
                <Button 
                  variant="primary" 
                  size="sm" 
                  onClick={() => { setIsDemoModalOpen(false); handleOpenPortalSelection(); }}
                  icon={<ArrowRight className="w-4 h-4" />}
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
