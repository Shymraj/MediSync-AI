import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  ShieldCheck, 
  Search, 
  Filter, 
  MapPin, 
  Phone, 
  Mail, 
  PhoneCall, 
  Globe, 
  Calendar, 
  Layers, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  LogOut, 
  Home, 
  RefreshCw, 
  Download, 
  FileText, 
  X,
  Sparkles,
  Activity,
  Bed,
  Users,
  Eye,
  ExternalLink
} from 'lucide-react';
import { RegisteredHospitalRecord } from './types';

interface MediSyncAdminDashboardProps {
  onLogout: () => void;
}

// Initial fallback seed data (Tamil Nadu Healthcare Network)
const SEED_HOSPITALS: RegisteredHospitalRecord[] = [
  {
    id: 'reg-001',
    hospitalName: 'Rajiv Gandhi Government General Hospital (RGGGH)',
    hospitalType: 'Government Teaching Hospital',
    registrationNumber: 'TN-MED-REG-2026-8941',
    ownership: 'Government',
    category: 'Super speciality',
    yearEstablished: '1664',
    hospitalLogo: null,
    description: 'Premier tertiary care government general hospital serving as state critical trauma and clinical research node.',
    website: 'https://rgggh.tn.gov.in',
    districtId: 'chennai',
    districtName: 'Chennai',
    hospitalAddress: 'EVR Periyar Salai, Park Town',
    areaLocality: 'Park Town',
    pincode: '600003',
    hospitalPhone: '+91 44 2530 5000',
    hospitalEmail: 'contact.rgggh@medisync.tn.gov.in',
    emergencyContact: '044-25305112',
    status: 'Verified',
    totalBeds: 1750,
    icuBeds: 180,
    createdAt: '2026-11-20T08:30:00Z'
  },
  {
    id: 'reg-002',
    hospitalName: 'Madurai Medical College & Government Rajaji Hospital',
    hospitalType: 'District Headquarter Hospital',
    registrationNumber: 'TN-MED-REG-2026-4412',
    ownership: 'Government',
    category: 'Multispeciality',
    yearEstablished: '1854',
    hospitalLogo: null,
    description: 'South Tamil Nadu referral hospital and emergency clinical research institution with multi-ward trauma support.',
    website: 'https://grh.madurai.tn.gov.in',
    districtId: 'madurai',
    districtName: 'Madurai',
    hospitalAddress: 'Panagal Road, Goripalayam',
    areaLocality: 'Goripalayam',
    pincode: '625020',
    hospitalPhone: '+91 452 253 2535',
    hospitalEmail: 'grh.madurai@medisync.tn.gov.in',
    emergencyContact: '0452-2532536',
    status: 'Verified',
    totalBeds: 1200,
    icuBeds: 110,
    createdAt: '2026-11-22T10:15:00Z'
  },
  {
    id: 'reg-003',
    hospitalName: 'Coimbatore Medical College Hospital (CMCH)',
    hospitalType: 'Government Teaching Hospital',
    registrationNumber: 'TN-MED-REG-2026-7721',
    ownership: 'Government',
    category: 'Super speciality',
    yearEstablished: '1966',
    hospitalLogo: null,
    description: 'Western zone hub hospital with trauma, cardiovascular, neuro-critical care and pediatric ICU capabilities.',
    website: 'https://cmch.coimbatore.tn.gov.in',
    districtId: 'coimbatore',
    districtName: 'Coimbatore',
    hospitalAddress: 'Trichy Road, Gopalapuram',
    areaLocality: 'Gopalapuram',
    pincode: '641018',
    hospitalPhone: '+91 422 230 1393',
    hospitalEmail: 'cmch.coimbatore@medisync.tn.gov.in',
    emergencyContact: '0422-2301394',
    status: 'Verified',
    totalBeds: 1050,
    icuBeds: 95,
    createdAt: '2026-11-23T14:40:00Z'
  },
  {
    id: 'reg-004',
    hospitalName: 'Apollo Speciality Hospital (Greams Road)',
    hospitalType: 'Private Super Speciality Hospital',
    registrationNumber: 'TN-PVT-REG-2026-1029',
    ownership: 'Private',
    category: 'Super speciality',
    yearEstablished: '1983',
    hospitalLogo: null,
    description: 'NABH accredited tertiary hospital affiliated for emergency regional overflow balancing and specialized care.',
    website: 'https://apollohospitals.com',
    districtId: 'chennai',
    districtName: 'Chennai',
    hospitalAddress: '21 Greams Lane, Thousand Lights',
    areaLocality: 'Thousand Lights',
    pincode: '600006',
    hospitalPhone: '+91 44 2829 0200',
    hospitalEmail: 'info@apollohospitals.com',
    emergencyContact: '1066',
    status: 'Verified',
    totalBeds: 600,
    icuBeds: 85,
    createdAt: '2026-11-24T16:00:00Z'
  }
];

const LOCAL_STORAGE_KEY = 'medisync_registered_hospitals_cache';

export const MediSyncAdminDashboard: React.FC<MediSyncAdminDashboardProps> = ({
  onLogout
}) => {
  const [hospitals, setHospitals] = useState<RegisteredHospitalRecord[]>(() => {
    try {
      const cached = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return SEED_HOSPITALS;
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [filterOwnership, setFilterOwnership] = useState<string>('all');
  const [filterDistrict, setFilterDistrict] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [selectedHospital, setSelectedHospital] = useState<RegisteredHospitalRecord | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Load from backend API & sync with cache
  const fetchHospitals = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch('http://localhost:5000/api/registered-hospitals');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          // Merge local cache and server data
          const localCached = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
          const idMap = new Map<string, RegisteredHospitalRecord>();
          
          // Seed defaults first
          SEED_HOSPITALS.forEach(h => idMap.set(h.registrationNumber, h));
          // Server data next
          data.forEach((h: RegisteredHospitalRecord) => idMap.set(h.registrationNumber, h));
          // Local storage (newest user registrations)
          localCached.forEach((h: RegisteredHospitalRecord) => idMap.set(h.registrationNumber, h));

          const merged = Array.from(idMap.values()).sort((a, b) => 
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );

          setHospitals(merged);
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(merged));
        }
      }
    } catch (e) {
      // Fallback to local cache
      const localCached = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY) || '[]');
      if (localCached.length > 0) {
        setHospitals(localCached);
      }
    } finally {
      setTimeout(() => setIsRefreshing(false), 300);
    }
  };

  useEffect(() => {
    fetchHospitals();

    // Listen to storage events if new hospital is registered in another tab/window
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === LOCAL_STORAGE_KEY && e.newValue) {
        try {
          setHospitals(JSON.parse(e.newValue));
        } catch {}
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Filter calculations
  const filteredHospitals = hospitals.filter(h => {
    const matchesSearch = 
      h.hospitalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.districtName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.registrationNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      h.hospitalAddress.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesOwnership = filterOwnership === 'all' || h.ownership.toLowerCase() === filterOwnership.toLowerCase();
    const matchesDistrict = filterDistrict === 'all' || h.districtName.toLowerCase() === filterDistrict.toLowerCase();

    return matchesSearch && matchesOwnership && matchesDistrict;
  });

  // Unique districts for filter
  const uniqueDistricts = Array.from(new Set(hospitals.map(h => h.districtName))).sort();

  // Metrics
  const totalHospitals = hospitals.length;
  const govHospitals = hospitals.filter(h => h.ownership.toLowerCase() === 'government').length;
  const pvtHospitals = hospitals.filter(h => h.ownership.toLowerCase() === 'private').length;
  const trustHospitals = hospitals.filter(h => h.ownership.toLowerCase() === 'trust').length;
  const totalMonitoredBeds = hospitals.reduce((sum, h) => sum + (h.totalBeds || 250), 0);
  const totalIcuBeds = hospitals.reduce((sum, h) => sum + (h.icuBeds || 35), 0);

  const toggleHospitalStatus = async (id: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'Verified' ? 'Pending' : 'Verified';
    const updated = hospitals.map(h => h.id === id ? { ...h, status: nextStatus } : h);
    setHospitals(updated);
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));

    try {
      await fetch(`http://localhost:5000/api/registered-hospitals/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus })
      });
    } catch {}
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#1E293B] flex flex-col font-sans">
      
      {/* 
        ============================================================
        1. SUPER ADMIN GLOBAL HEADER BAR
        ============================================================
      */}
      <header className="sticky top-0 z-40 bg-[#0F172A] border-b border-slate-800 text-white shadow-md">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Left Brand Identity */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-linear-to-br from-[#1A56DB] to-[#1E40AF] flex items-center justify-center text-white shadow-xs ring-2 ring-blue-500/20">
              <ShieldCheck className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold tracking-tight text-white">
                  MediSync <span className="text-blue-400">Super Admin</span>
                </span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Platform Registry
                </span>
              </div>
              <p className="text-[10px] text-slate-400 flex items-center gap-1.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live Statewide Hospital Management Console
              </p>
            </div>
          </div>

          {/* Right Admin Profile & Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={fetchHospitals}
              disabled={isRefreshing}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Refresh Hospital Registry"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-400' : ''}`} />
            </button>

            <button
              onClick={() => { window.location.hash = '#/'; }}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              title="Return to Public Landing Page"
            >
              <Home className="w-4 h-4" />
            </button>

            {/* Admin Avatar */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-extrabold text-xs flex items-center justify-center border border-blue-400/30">
                MS
              </div>
              <div className="hidden sm:block text-left text-xs">
                <div className="font-bold text-white">MediSync Admin</div>
                <div className="text-[10px] text-slate-400 font-mono">@medisync</div>
              </div>
            </div>

            {/* Logout Button */}
            <button
              onClick={onLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 text-xs font-bold transition-colors cursor-pointer ml-1"
              title="Sign Out of Super Admin Console"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* 
        ============================================================
        2. HERO ANALYTICS METRIC BAR
        ============================================================
      */}
      <div className="bg-white border-b border-slate-200/80 shadow-2xs">
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                Statewide Hospital Registry & Directory
              </h1>
              <p className="text-xs text-slate-500 mt-1">
                தமிழ்நாடு சுகாதார உள்கட்டமைப்பு பதிவு • All registered institutional hospitals, facilities & clinical affiliations
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1.5 shadow-2xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>{totalHospitals} Facilities Registered</span>
              </span>
            </div>
          </div>

          {/* Metric Cards Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            {/* 1. Total Registered */}
            <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 shadow-2xs">
              <div className="flex items-center justify-between text-slate-500 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider">Total Hospitals</span>
                <Building2 className="w-4 h-4 text-[#1A56DB]" />
              </div>
              <div className="text-2xl font-black text-slate-900 font-mono">{totalHospitals}</div>
              <div className="text-[10px] text-slate-500 mt-0.5">Active facility network</div>
            </div>

            {/* 2. Government */}
            <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-200/80 shadow-2xs">
              <div className="flex items-center justify-between text-blue-700 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider">Government</span>
                <ShieldCheck className="w-4 h-4 text-[#1A56DB]" />
              </div>
              <div className="text-2xl font-black text-blue-900 font-mono">{govHospitals}</div>
              <div className="text-[10px] text-blue-600/80 mt-0.5">Teaching & HQ nodes</div>
            </div>

            {/* 3. Private */}
            <div className="p-4 rounded-2xl bg-indigo-50/50 border border-indigo-200/80 shadow-2xs">
              <div className="flex items-center justify-between text-indigo-700 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider">Private & Trust</span>
                <Layers className="w-4 h-4 text-indigo-600" />
              </div>
              <div className="text-2xl font-black text-indigo-900 font-mono">{pvtHospitals + trustHospitals}</div>
              <div className="text-[10px] text-indigo-600/80 mt-0.5">Corporate & Non-Profit</div>
            </div>

            {/* 4. Total Beds Monitored */}
            <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200/80 shadow-2xs">
              <div className="flex items-center justify-between text-emerald-700 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider">Monitored Beds</span>
                <Bed className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-emerald-900 font-mono">{totalMonitoredBeds.toLocaleString()}</div>
              <div className="text-[10px] text-emerald-600/80 mt-0.5">State bed capacity</div>
            </div>

            {/* 5. Total ICU Beds */}
            <div className="p-4 rounded-2xl bg-amber-50/50 border border-amber-200/80 shadow-2xs col-span-2 sm:col-span-1">
              <div className="flex items-center justify-between text-amber-700 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider">ICU & Critical</span>
                <Activity className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-2xl font-black text-amber-900 font-mono">{totalIcuBeds.toLocaleString()}</div>
              <div className="text-[10px] text-amber-600/80 mt-0.5">High-dependency beds</div>
            </div>
          </div>
        </div>
      </div>

      {/* 
        ============================================================
        3. MAIN REGISTRY WORKSPACE & FILTERS
        ============================================================
      */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Controls Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by hospital name, district, reg no, or location..."
              className="w-full text-xs pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#1A56DB] focus:border-transparent transition-all font-medium"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Ownership Filter */}
            <select
              value={filterOwnership}
              onChange={(e) => setFilterOwnership(e.target.value)}
              className="text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-[#1A56DB] cursor-pointer"
            >
              <option value="all">All Ownerships</option>
              <option value="government">Government Hospitals</option>
              <option value="private">Private Hospitals</option>
              <option value="trust">Trust / Non-Profit</option>
            </select>

            {/* District Filter */}
            <select
              value={filterDistrict}
              onChange={(e) => setFilterDistrict(e.target.value)}
              className="text-xs px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-[#1A56DB] cursor-pointer"
            >
              <option value="all">All Districts</option>
              {uniqueDistricts.map(d => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>

            {/* View Mode Toggle */}
            <div className="flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                onClick={() => setViewMode('table')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'table' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Table View
              </button>
              <button
                onClick={() => setViewMode('grid')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'grid' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Cards View
              </button>
            </div>
          </div>
        </div>

        {/* 
          ============================================================
          4. HOSPITALS DISPLAY (TABLE OR CARDS)
          ============================================================
        */}
        {filteredHospitals.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200/80 shadow-xs">
            <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <h3 className="text-base font-bold text-slate-800">No registered hospitals match criteria</h3>
            <p className="text-xs text-slate-500 mt-1">Try clearing your search term or changing the filters.</p>
            <button
              onClick={() => { setSearchTerm(''); setFilterOwnership('all'); setFilterDistrict('all'); }}
              className="mt-4 px-4 py-2 rounded-xl bg-blue-50 text-[#1A56DB] text-xs font-bold hover:bg-blue-100 transition-colors cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : viewMode === 'table' ? (
          /* TABLE VIEW */
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50/80 border-b border-slate-200 text-slate-500 text-[10px] font-extrabold uppercase tracking-wider">
                    <th className="py-3.5 px-4">Hospital Name & Reg ID</th>
                    <th className="py-3.5 px-4">District & Locality</th>
                    <th className="py-3.5 px-4">Classification</th>
                    <th className="py-3.5 px-4">Contact & Helplines</th>
                    <th className="py-3.5 px-4 text-center">Status</th>
                    <th className="py-3.5 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredHospitals.map(h => (
                    <tr key={h.id || h.registrationNumber} className="hover:bg-blue-50/30 transition-colors">
                      {/* Name & ID */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-xl bg-blue-50 text-[#1A56DB] flex items-center justify-center shrink-0 mt-0.5">
                            <Building2 className="w-4 h-4 stroke-[2.2]" />
                          </div>
                          <div className="min-w-0">
                            <span className="font-bold text-slate-900 block truncate max-w-xs">{h.hospitalName}</span>
                            <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded mt-0.5 inline-block">
                              {h.registrationNumber}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* District & Locality */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 font-bold text-slate-800">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span>{h.districtName}</span>
                        </div>
                        <div className="text-[11px] text-slate-500 truncate max-w-[180px] mt-0.5">
                          {h.areaLocality || h.hospitalAddress}
                        </div>
                      </td>

                      {/* Classification */}
                      <td className="py-3.5 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider inline-block ${
                          h.ownership.toLowerCase() === 'government'
                            ? 'bg-blue-100 text-blue-800'
                            : h.ownership.toLowerCase() === 'private'
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {h.ownership}
                        </span>
                        <div className="text-[11px] text-slate-600 mt-1 font-medium">{h.category}</div>
                      </td>

                      {/* Contact */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                          <Phone className="w-3 h-3 text-slate-400 shrink-0" />
                          <span>{h.hospitalPhone}</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-red-600 font-bold text-[11px] mt-0.5">
                          <PhoneCall className="w-3 h-3 shrink-0" />
                          <span>24x7: {h.emergencyContact}</span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => toggleHospitalStatus(h.id, h.status)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider inline-flex items-center gap-1 cursor-pointer transition-colors ${
                            h.status === 'Verified'
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                              : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                          }`}
                          title="Click to toggle status"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{h.status}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => setSelectedHospital(h)}
                          className="px-3 py-1.5 rounded-xl bg-[#1A56DB] hover:bg-blue-700 text-white text-[11px] font-bold shadow-2xs transition-colors cursor-pointer inline-flex items-center gap-1.5"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Dossier</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          /* GRID CARDS VIEW */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredHospitals.map(h => (
              <div 
                key={h.id || h.registrationNumber}
                className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#1A56DB] flex items-center justify-center shrink-0">
                      <Building2 className="w-5 h-5 stroke-[2.2]" />
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider ${
                      h.ownership.toLowerCase() === 'government'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-purple-100 text-purple-800'
                    }`}>
                      {h.ownership}
                    </span>
                  </div>

                  <h3 className="text-sm font-bold text-slate-900 leading-snug line-clamp-2">
                    {h.hospitalName}
                  </h3>

                  <div className="text-[11px] font-mono text-blue-700 font-bold mt-1">
                    {h.registrationNumber}
                  </div>

                  <div className="mt-3 space-y-1.5 text-xs text-slate-600 border-t border-slate-100 pt-3">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{h.areaLocality}, {h.districtName} - {h.pincode}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{h.hospitalPhone}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-red-600 font-bold text-[11px]">
                      <PhoneCall className="w-3.5 h-3.5 shrink-0" />
                      <span>Emergency: {h.emergencyContact}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[10px] text-emerald-700 font-extrabold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> {h.status}
                  </span>
                  <button
                    onClick={() => setSelectedHospital(h)}
                    className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-[#1A56DB] hover:text-white text-slate-700 text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                  >
                    <span>View Dossier</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

      </main>

      {/* 
        ============================================================
        5. FULL HOSPITAL DOSSIER MODAL
        Shows complete detailed information of registered hospital
        ============================================================
      */}
      {selectedHospital && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-slate-800 animate-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 bg-linear-to-r from-blue-50/60 to-white flex items-start justify-between gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-[#1A56DB] text-white flex items-center justify-center shadow-xs shrink-0">
                  <Building2 className="w-6 h-6 stroke-[2]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-blue-100 text-[#1A56DB]">
                      {selectedHospital.ownership}
                    </span>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                      {selectedHospital.status}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 mt-1">
                    {selectedHospital.hospitalName}
                  </h3>
                  <p className="text-xs font-mono font-bold text-blue-700 mt-0.5">
                    Official Reg: {selectedHospital.registrationNumber}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedHospital(null)}
                className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs">
              
              {/* Section 1 — Location & Address */}
              <div>
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-blue-600" /> Section 1 — Location & Address
                </h4>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Full Hospital Address</span>
                    <span className="font-semibold text-slate-800">{selectedHospital.hospitalAddress}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Area / Locality</span>
                    <span className="font-semibold text-slate-800">{selectedHospital.areaLocality || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">District Node</span>
                    <span className="font-semibold text-slate-800">{selectedHospital.districtName} District</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Postal PIN Code</span>
                    <span className="font-mono font-semibold text-slate-800">{selectedHospital.pincode}</span>
                  </div>
                </div>
              </div>

              {/* Section 2 — Contact Information */}
              <div>
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-blue-600" /> Section 2 — Contact Information
                </h4>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Official Phone</span>
                    <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3 text-slate-400" /> {selectedHospital.hospitalPhone}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Official Email</span>
                    <span className="font-semibold text-slate-800 flex items-center gap-1 mt-0.5 truncate">
                      <Mail className="w-3 h-3 text-slate-400" /> {selectedHospital.hospitalEmail}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-red-500 font-bold uppercase block">Emergency 24x7</span>
                    <span className="font-bold text-red-600 flex items-center gap-1 mt-0.5">
                      <PhoneCall className="w-3 h-3" /> {selectedHospital.emergencyContact}
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 3 — Facility Metadata */}
              <div>
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-400 mb-2.5 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-blue-600" /> Section 3 — Facility Classification & Details
                </h4>
                <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Hospital Type</span>
                    <span className="font-semibold text-slate-800">{selectedHospital.hospitalType || 'General Hospital'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Category</span>
                    <span className="font-semibold text-slate-800">{selectedHospital.category}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Year Established</span>
                    <span className="font-semibold text-slate-800">{selectedHospital.yearEstablished || 'N/A'}</span>
                  </div>
                  {selectedHospital.website && (
                    <div className="sm:col-span-3">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Official Website</span>
                      <a 
                        href={selectedHospital.website} 
                        target="_blank" 
                        rel="noreferrer"
                        className="text-blue-600 hover:underline flex items-center gap-1 font-semibold mt-0.5"
                      >
                        <Globe className="w-3 h-3" /> {selectedHospital.website}
                      </a>
                    </div>
                  )}
                  {selectedHospital.description && (
                    <div className="sm:col-span-3">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block">Description / Scope</span>
                      <p className="text-slate-600 leading-relaxed mt-0.5">{selectedHospital.description}</p>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between">
              <span className="text-[11px] text-slate-400">
                Registered on: {new Date(selectedHospital.createdAt).toLocaleDateString()}
              </span>
              <button
                onClick={() => setSelectedHospital(null)}
                className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Close Dossier
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
