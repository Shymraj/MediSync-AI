import React, { useState, useRef } from 'react';
import { 
  Building2, 
  ArrowRight, 
  ArrowLeft, 
  Upload, 
  Globe, 
  FileText, 
  Calendar, 
  Hash, 
  CheckCircle2, 
  AlertCircle,
  X,
  Image as ImageIcon
} from 'lucide-react';
import { Button } from '../common/Button';
import { useApp } from '../../context/AppContext';
import { OnboardingProgressBar } from './OnboardingProgressBar';

interface HospitalRegistrationDetailsPageProps {
  onComplete: () => void;
  onBack: () => void;
}

const HOSPITAL_TYPES = [
  'Government Medical College Hospital',
  'Apex Super Specialty Hospital',
  'District Headquarters Hospital',
  'Multispecialty Healthcare Facility',
  'Sub-District / Taluk Hospital',
  'Community Healthcare Centre (CHC)',
  'Primary Health Centre (PHC)',
  'Private Specialty Hospital'
];

export const HospitalRegistrationDetailsPage: React.FC<HospitalRegistrationDetailsPageProps> = ({ 
  onComplete, 
  onBack 
}) => {
  const { tempOnboarding, updateHospitalRegistrationDetails, user } = useApp();

  // Form State matching the requested fields exactly
  const [hospitalName, setHospitalName] = useState(
    tempOnboarding.hospitalName || 'Rajiv Gandhi Government General Hospital (RGGGH)'
  );
  const [hospitalType, setHospitalType] = useState(
    tempOnboarding.hospitalType || 'Apex Super Specialty Hospital'
  );
  const [registrationNumber, setRegistrationNumber] = useState(
    tempOnboarding.registrationNumber || 'TN-MED-REG-2026-8941'
  );
  const [ownership, setOwnership] = useState<'Government' | 'Private' | 'Trust'>(
    tempOnboarding.ownership || 'Government'
  );
  const [category, setCategory] = useState<'General' | 'Multispeciality' | 'Super speciality'>(
    tempOnboarding.category || 'Super speciality'
  );
  const [yearEstablished, setYearEstablished] = useState(
    tempOnboarding.yearEstablished || '1965'
  );
  const [hospitalLogo, setHospitalLogo] = useState<string | null>(
    tempOnboarding.hospitalLogo || null
  );
  const [description, setDescription] = useState(
    tempOnboarding.hospitalDescription || 
    'Premier multi-ward tertiary healthcare and apex referral center with dedicated critical care, cardiology, trauma and emergency life-support facilities.'
  );
  const [website, setWebsite] = useState(
    tempOnboarding.website || 'https://www.rgggh.tn.gov.in'
  );

  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError('Hospital logo size must be under 5MB.');
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        setHospitalLogo(reader.result as string);
        setError(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveLogo = () => {
    setHospitalLogo(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!hospitalName.trim() || hospitalName.trim().length < 3) {
      setError('Please enter a valid Hospital Name (minimum 3 characters).');
      return;
    }

    if (!registrationNumber.trim()) {
      setError('Hospital Registration Number is required.');
      return;
    }

    if (!yearEstablished.trim() || isNaN(Number(yearEstablished)) || Number(yearEstablished) < 1800 || Number(yearEstablished) > 2026) {
      setError('Please enter a valid establishment year (between 1800 and 2026).');
      return;
    }

    if (!description.trim() || description.trim().length < 10) {
      setError('Please provide a brief Hospital Description (minimum 10 characters).');
      return;
    }

    setError(null);

    // Save to onboarding state
    updateHospitalRegistrationDetails({
      hospitalName: hospitalName.trim(),
      hospitalType,
      registrationNumber: registrationNumber.trim(),
      ownership,
      category,
      yearEstablished: yearEstablished.trim(),
      hospitalLogo: hospitalLogo || undefined,
      description: description.trim(),
      website: website.trim() || undefined
    });

    onComplete();
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] py-10 px-4 sm:px-6 lg:px-8 text-[#1E293B]">
      {/* Onboarding Step Progress */}
      <OnboardingProgressBar currentStep="profile" />

      <div className="max-w-2xl mx-auto">
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#64748B] hover:text-[#1A56DB] mb-4 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Authentication
        </button>

        <div className="bg-white rounded-3xl border border-[#E2E8F0] shadow-sm p-6 sm:p-8">
          {/* Header */}
          <div className="flex items-center gap-3.5 pb-6 border-b border-slate-100">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-[#1A56DB] flex items-center justify-center shrink-0 shadow-2xs">
              <Building2 className="w-6 h-6 stroke-[2]" />
            </div>
            <div>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-[#1A56DB]">
                Step 1 &bull; Hospital Details
              </span>
              <h2 className="text-xl sm:text-2xl font-bold text-[#1E293B] tracking-tight mt-0.5">
                Hospital Registration Details
              </h2>
              <p className="text-xs text-[#64748B] mt-0.5">
                Register institutional healthcare information for facility onboarding and telemetry access
              </p>
            </div>
          </div>

          {error && (
            <div className="mt-5 p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-[#DC2626]">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            {/* 1. Hospital Name (Text) */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Hospital Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={hospitalName}
                onChange={(e) => setHospitalName(e.target.value)}
                placeholder="e.g., Rajiv Gandhi Government General Hospital (RGGGH)"
                required
                className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#1A56DB] focus:border-transparent transition-all"
              />
            </div>

            {/* 2. Hospital Type (Dropdown) */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Hospital Type <span className="text-red-500">*</span>
              </label>
              <select
                value={hospitalType}
                onChange={(e) => setHospitalType(e.target.value)}
                className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#1A56DB] focus:border-transparent transition-all cursor-pointer"
              >
                {HOSPITAL_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>

            {/* Two-column layout for Reg Number and Year */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* 3. Hospital Registration Number (Text) */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Hospital Registration Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Hash className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="text"
                    value={registrationNumber}
                    onChange={(e) => setRegistrationNumber(e.target.value)}
                    placeholder="e.g., TN-MED-REG-2026-8941"
                    required
                    className="w-full text-xs pl-8 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#1A56DB] focus:border-transparent transition-all"
                  />
                </div>
              </div>

              {/* 6. Year Established (Year) */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1.5">
                  Year Established <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Calendar className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="number"
                    min="1800"
                    max="2026"
                    value={yearEstablished}
                    onChange={(e) => setYearEstablished(e.target.value)}
                    placeholder="e.g., 1965"
                    required
                    className="w-full text-xs pl-8 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#1A56DB] focus:border-transparent transition-all"
                  />
                </div>
              </div>
            </div>

            {/* 4. Hospital Ownership (Government / Private / Trust) */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Hospital Ownership <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {(['Government', 'Private', 'Trust'] as const).map((own) => (
                  <button
                    key={own}
                    type="button"
                    onClick={() => setOwnership(own)}
                    className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                      ownership === own
                        ? 'bg-blue-50 border-[#1A56DB] text-[#1A56DB] shadow-2xs font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {own}
                  </button>
                ))}
              </div>
            </div>

            {/* 5. Hospital Category (General / Multispeciality / Super speciality) */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Hospital Category <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-2.5">
                {(['General', 'Multispeciality', 'Super speciality'] as const).map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setCategory(cat)}
                    className={`py-2 px-3 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
                      category === cat
                        ? 'bg-blue-50 border-[#1A56DB] text-[#1A56DB] shadow-2xs font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* 7. Hospital Logo (Upload) */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Hospital Logo
              </label>
              <div className="flex items-center gap-4 p-3.5 bg-slate-50 border border-dashed border-slate-300 rounded-xl">
                {hospitalLogo ? (
                  <div className="relative w-14 h-14 rounded-xl border border-slate-200 overflow-hidden shrink-0 bg-white shadow-2xs">
                    <img
                      src={hospitalLogo}
                      alt="Hospital Logo"
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={handleRemoveLogo}
                      className="absolute top-0.5 right-0.5 bg-slate-900/70 text-white rounded-full p-0.5 hover:bg-red-600 transition-colors"
                      title="Remove Logo"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="w-14 h-14 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-400 shrink-0">
                    <ImageIcon className="w-6 h-6 stroke-[1.5]" />
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="hidden"
                    id="hospital-logo-upload"
                  />
                  <label
                    htmlFor="hospital-logo-upload"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer shadow-2xs transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5 text-blue-600" />
                    <span>{hospitalLogo ? 'Change Hospital Logo' : 'Upload Hospital Logo'}</span>
                  </label>
                  <p className="text-[10px] text-slate-400 mt-1 truncate">
                    PNG, JPG, or SVG up to 5MB (Institutional seal or crest)
                  </p>
                </div>
              </div>
            </div>

            {/* 8. Hospital Description (Text area) */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5">
                Hospital Description <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe hospital facilities, trauma ward capacity, specialized medical equipment, and healthcare specialties..."
                required
                className="w-full text-xs px-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#1A56DB] focus:border-transparent transition-all resize-y"
              />
            </div>

            {/* 9. Website (URL optional) */}
            <div>
              <label className="block text-xs font-bold text-slate-800 mb-1.5 flex items-center justify-between">
                <span>Website</span>
                <span className="text-[10px] text-slate-400 font-normal">Optional</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Globe className="w-3.5 h-3.5" />
                </div>
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://www.hospital.gov.in"
                  className="w-full text-xs pl-8 pr-3.5 py-2.5 bg-slate-50 border border-slate-300 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#1A56DB] focus:border-transparent transition-all"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-3">
              <Button
                type="submit"
                variant="primary"
                size="lg"
                className="w-full font-semibold shadow-xs"
                icon={<ArrowRight className="w-4 h-4" />}
              >
                Continue to District Selection
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
