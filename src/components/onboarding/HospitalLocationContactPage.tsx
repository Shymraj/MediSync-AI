import React, { useState } from 'react';
import { 
  Building2, 
  MapPin, 
  Navigation, 
  Phone, 
  Mail, 
  PhoneCall, 
  ArrowRight, 
  ArrowLeft, 
  AlertCircle,
  Hash,
  ShieldCheck,
  CheckCircle2
} from 'lucide-react';
import { Button } from '../common/Button';
import { useApp } from '../../context/AppContext';
import { OnboardingProgressBar } from './OnboardingProgressBar';
import { RegistrationSuccessScreen } from './RegistrationSuccessScreen';
import { setActiveHospitalScopeId, hospitalScopedKey } from '../../utils/hospitalSync';

interface HospitalLocationContactPageProps {
  onComplete: () => void;
  onBack: () => void;
}

export const HospitalLocationContactPage: React.FC<HospitalLocationContactPageProps> = ({ 
  onComplete, 
  onBack 
}) => {
  const { tempOnboarding, updateHospitalLocationContact, updateTempHospital } = useApp();

  const districtName = tempOnboarding.districtName || 'Tamil Nadu';
  const hospitalName = tempOnboarding.hospitalName || 'Institutional Hospital';

  // Section 1 — Location & Address State
  const [hospitalAddress, setHospitalAddress] = useState(
    tempOnboarding.hospitalAddress || 'EVR Periyar Salai, Park Town'
  );
  const [areaLocality, setAreaLocality] = useState(
    tempOnboarding.areaLocality || 'Park Town'
  );
  const [pincode, setPincode] = useState(
    tempOnboarding.pincode || '600003'
  );

  // Section 2 — Contact Information State
  const [hospitalPhone, setHospitalPhone] = useState(
    tempOnboarding.hospitalPhone || '+91 44 2530 5000'
  );
  const [hospitalEmail, setHospitalEmail] = useState(
    tempOnboarding.hospitalEmail || 'contact.rgggh@medisync.tn.gov.in'
  );
  const [emergencyContact, setEmergencyContact] = useState(
    tempOnboarding.emergencyContact || '044-25305112'
  );

  const [error, setError] = useState<string | null>(null);
  const [showSuccessScreen, setShowSuccessScreen] = useState(false);
  const [createdHospitalId, setCreatedHospitalId] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Section 1 Validations
    if (!hospitalAddress.trim() || hospitalAddress.trim().length < 5) {
      setError('Please provide a complete Full Hospital Address (minimum 5 characters).');
      return;
    }

    if (!areaLocality.trim() || areaLocality.trim().length < 2) {
      setError('Please specify the Area / Locality.');
      return;
    }

    const cleanPincode = pincode.trim().replace(/\D/g, '');
    if (cleanPincode.length !== 6) {
      setError('Please enter a valid 6-digit Indian Postal PIN Code.');
      return;
    }

    // Section 2 Validations
    if (!hospitalPhone.trim() || hospitalPhone.trim().length < 7) {
      setError('Official Hospital Phone Number is required.');
      return;
    }

    if (!hospitalEmail.trim() || !hospitalEmail.includes('@') || !hospitalEmail.includes('.')) {
      setError('Please enter a valid official Hospital Email Address.');
      return;
    }

    if (!emergencyContact.trim() || emergencyContact.trim().length < 3) {
      setError('Emergency Contact Number is required for 24x7 triage.');
      return;
    }

    setError(null);

    // Save Location & Contact details into onboarding state
    updateHospitalLocationContact({
      hospitalAddress: hospitalAddress.trim(),
      areaLocality: areaLocality.trim(),
      pincode: cleanPincode,
      hospitalPhone: hospitalPhone.trim(),
      hospitalEmail: hospitalEmail.trim().toLowerCase(),
      emergencyContact: emergencyContact.trim()
    });

    // Generate unique Hospital ID in exact format: Hos_Id-XXX (e.g. Hos_Id-345)
    let generatedHospitalId = `Hos_Id-${Math.floor(100 + Math.random() * 900)}`;
    try {
      const existingStr = localStorage.getItem('medisync_registered_hospitals_cache');
      const existingArr = existingStr ? JSON.parse(existingStr) : [];
      const existingIds = new Set(existingArr.map((h: any) => h.hospitalId).filter(Boolean));
      while (existingIds.has(generatedHospitalId)) {
        generatedHospitalId = `Hos_Id-${Math.floor(100 + Math.random() * 900)}`;
      }
    } catch {}

    updateTempHospital(generatedHospitalId, tempOnboarding.hospitalName || 'Institutional Hospital');

    // Persist active Hospital ID & profile strictly under this hospital's own isolated storage
    setActiveHospitalScopeId(generatedHospitalId);
    try {
      const settingsHospitalInfo = {
        hospitalName: tempOnboarding.hospitalName || 'Institutional Hospital',
        hospitalId: generatedHospitalId,
        hospitalType: tempOnboarding.hospitalType || 'General Hospital',
        address: `${hospitalAddress.trim()}, ${areaLocality.trim()}, ${tempOnboarding.districtName || districtName} - ${cleanPincode}`,
        contactNumber: emergencyContact.trim(),
        officialEmail: hospitalEmail.trim().toLowerCase(),
        hospitalAdministrator: tempOnboarding.name ? `${tempOnboarding.name} (Hospital Administrator)` : 'Hospital Chief Administrator'
      };
      localStorage.setItem(hospitalScopedKey('medisync_hospital_info', generatedHospitalId), JSON.stringify(settingsHospitalInfo));
      sessionStorage.setItem('medisync_generated_hospital_id', generatedHospitalId);
    } catch {}

    // Assemble complete hospital record for MediSync Platform Super Admin Registry
    const newHospitalRecord = {
      id: generatedHospitalId,
      hospitalId: generatedHospitalId,
      hospitalName: tempOnboarding.hospitalName || 'Institutional Hospital',
      hospitalType: tempOnboarding.hospitalType || 'General Hospital',
      registrationNumber: tempOnboarding.registrationNumber || ('TN-MED-REG-2026-' + Math.floor(1000 + Math.random() * 9000)),
      ownership: tempOnboarding.ownership || 'Government',
      category: tempOnboarding.category || 'General',
      yearEstablished: tempOnboarding.yearEstablished || '2026',
      hospitalLogo: tempOnboarding.hospitalLogo || null,
      description: tempOnboarding.hospitalDescription || '',
      website: tempOnboarding.website || '',
      districtId: tempOnboarding.districtId || 'chennai',
      districtName: tempOnboarding.districtName || districtName || 'Chennai',
      hospitalAddress: hospitalAddress.trim(),
      areaLocality: areaLocality.trim(),
      pincode: cleanPincode,
      hospitalPhone: hospitalPhone.trim(),
      hospitalEmail: hospitalEmail.trim().toLowerCase(),
      emergencyContact: emergencyContact.trim(),
      status: 'Verified',
      totalBeds: 250,
      icuBeds: 35,
      createdAt: new Date().toISOString()
    };

    // 1. Immediately cache in localStorage for instant MediSync Admin visibility
    try {
      const LOCAL_KEY = 'medisync_registered_hospitals_cache';
      const existingStr = localStorage.getItem(LOCAL_KEY);
      const existing = existingStr ? JSON.parse(existingStr) : [];
      const updated = [newHospitalRecord, ...existing.filter((h: any) => h.registrationNumber !== newHospitalRecord.registrationNumber)];
      localStorage.setItem(LOCAL_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('medisync_hospitals_updated'));
    } catch {}

    // 2. Persist to backend database via REST API
    try {
      fetch('http://localhost:5000/api/registered-hospitals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newHospitalRecord)
      }).catch(() => {});
    } catch {}

    // Store celebration flag and show GPay-style MediSync Success Tick with Hospital ID!
    try {
      sessionStorage.setItem('medisync_just_registered', 'true');
    } catch {}

    setCreatedHospitalId(generatedHospitalId);
    setShowSuccessScreen(true);
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] py-10 px-4 sm:px-6 lg:px-8 text-[#1E293B]">
      {/* Onboarding Step 3 Indicator */}
      <OnboardingProgressBar currentStep="hospital" />

      <div className="max-w-2xl mx-auto">
        {/* Back navigation */}
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#64748B] hover:text-[#1A56DB] mb-4 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to District Selection ({districtName})
        </button>

        <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-sm p-6 sm:p-8">
          {/* Header */}
          <div className="flex items-center justify-between pb-6 border-b border-slate-100 flex-wrap gap-3">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#1A56DB] flex items-center justify-center shrink-0 shadow-2xs">
                <Building2 className="w-6 h-6 stroke-[2]" />
              </div>
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-[#1A56DB]">
                  Step 3 &bull; Hospital Details
                </span>
                <h2 className="text-xl sm:text-2xl font-bold text-[#1E293B] tracking-tight mt-0.5">
                  Location & Contact Information
                </h2>
                <p className="text-xs text-[#64748B] mt-0.5">
                  Facility: <strong className="text-slate-800 font-semibold">{hospitalName}</strong> &bull; District: <strong className="text-slate-800 font-semibold">{districtName}</strong>
                </p>
              </div>
            </div>

            <div className="px-3 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-right">
              <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider block">District Node</span>
              <span className="text-xs font-bold text-[#1A56DB]">{districtName}</span>
            </div>
          </div>

          {error && (
            <div className="mt-5 p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-[#DC2626]">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-7">
            {/* 
              ============================================================
              SECTION 1 — LOCATION & ADDRESS
              ============================================================
            */}
            <div className="p-5 bg-slate-50/70 border border-slate-200 rounded-2xl space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200/80">
                <div className="w-7 h-7 rounded-lg bg-blue-100 text-[#1A56DB] flex items-center justify-center">
                  <MapPin className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Section 1 — Location & Address
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Geographic placement for ambulance telemetry and bed allocation routing
                  </p>
                </div>
              </div>

              {/* Full Hospital Address * */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                  <span>Full Hospital Address <span className="text-red-500">*</span></span>
                  <span className="text-[10px] text-slate-400 font-normal">Street, Door No, Campus Landmark</span>
                </label>
                <div className="relative">
                  <div className="absolute top-2.5 left-3 pointer-events-none text-slate-400">
                    <MapPin className="w-3.5 h-3.5" />
                  </div>
                  <textarea
                    rows={2}
                    value={hospitalAddress}
                    onChange={(e) => setHospitalAddress(e.target.value)}
                    placeholder="e.g., EVR Periyar Salai, Park Town"
                    required
                    className="w-full text-xs pl-8 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#1A56DB] focus:border-transparent transition-all resize-y"
                  />
                </div>
              </div>

              {/* Area / Locality * & PIN Code * */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Area / Locality * */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5">
                    Area / Locality <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Navigation className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="text"
                      value={areaLocality}
                      onChange={(e) => setAreaLocality(e.target.value)}
                      placeholder="e.g., Park Town / Central"
                      required
                      className="w-full text-xs pl-8 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#1A56DB] focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                {/* PIN Code * */}
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                    <span>PIN Code <span className="text-red-500">*</span></span>
                    <span className="text-[10px] text-slate-400 font-normal">6 Digits</span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                      <Hash className="w-3.5 h-3.5" />
                    </div>
                    <input
                      type="text"
                      maxLength={6}
                      value={pincode}
                      onChange={(e) => setPincode(e.target.value)}
                      placeholder="e.g., 600003"
                      required
                      className="w-full text-xs pl-8 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#1A56DB] focus:border-transparent transition-all tracking-wider font-mono"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 
              ============================================================
              SECTION 2 — CONTACT INFORMATION
              ============================================================
            */}
            <div className="p-5 bg-slate-50/70 border border-slate-200 rounded-2xl space-y-4">
              <div className="flex items-center gap-2 pb-2 border-b border-slate-200/80">
                <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900">
                    Section 2 — Contact Information
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Institutional communication channels for emergency transfers and staff authorization
                  </p>
                </div>
              </div>

              {/* Official Hospital Phone Number * */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                  <span>Official Hospital Phone Number <span className="text-red-500">*</span></span>
                  <span className="text-[10px] text-slate-400 font-normal">Reception & Administrative Lines</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Phone className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="tel"
                    value={hospitalPhone}
                    onChange={(e) => setHospitalPhone(e.target.value)}
                    placeholder="e.g., +91 44 2530 5000"
                    required
                    className="w-full text-xs pl-8 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#1A56DB] focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Hospital Email Address * */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                  <span>Hospital Email Address <span className="text-red-500">*</span></span>
                  <span className="text-[10px] text-slate-400 font-normal">Official Institutional Inbox</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="email"
                    value={hospitalEmail}
                    onChange={(e) => setHospitalEmail(e.target.value)}
                    placeholder="e.g., contact.rgggh@medisync.tn.gov.in"
                    required
                    className="w-full text-xs pl-8 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-[#1A56DB] focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* Emergency Contact Number * */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <span>Emergency Contact Number <span className="text-red-500">*</span></span>
                  </label>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold uppercase tracking-wider bg-red-100 text-red-700">
                    24x7 Casualty Hotline
                  </span>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-red-500">
                    <PhoneCall className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="tel"
                    value={emergencyContact}
                    onChange={(e) => setEmergencyContact(e.target.value)}
                    placeholder="e.g., 044-25305112 or 108"
                    required
                    className="w-full text-xs pl-8 pr-3.5 py-2.5 bg-red-50/40 border border-red-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all font-medium text-slate-900"
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  Direct helpline routed to trauma center dispatchers during critical resource shortages
                </p>
              </div>
            </div>

            {/* Submit and Continue button */}
            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full font-semibold shadow-md bg-emerald-600 hover:bg-emerald-700 text-white py-3.5 text-sm cursor-pointer"
                icon={<CheckCircle2 className="w-5 h-5" />}
              >
                Register Hospital
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* GPay-style Success Tick Modal Screen */}
      {showSuccessScreen && (
        <RegistrationSuccessScreen
          hospitalId={createdHospitalId}
          hospitalName={hospitalName}
          districtName={districtName}
          registrationNumber={tempOnboarding.registrationNumber || 'TN-MED-REG-2026-8941'}
          emergencyContact={emergencyContact}
          onProceed={onComplete}
        />
      )}
    </div>
  );
};
