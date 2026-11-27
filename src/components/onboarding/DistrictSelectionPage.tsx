import React, { useState } from 'react';
import { Search, MapPin, Building2, Bed, ArrowRight, Check, ArrowLeft } from 'lucide-react';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { TAMIL_NADU_DISTRICTS } from '../../data/mockData';
import { useApp } from '../../context/AppContext';
import { OnboardingProgressBar } from './OnboardingProgressBar';

interface DistrictSelectionProps {
  onComplete: () => void;
  onBack: () => void;
}

export const DistrictSelectionPage: React.FC<DistrictSelectionProps> = ({ onComplete, onBack }) => {
  const { tempOnboarding, updateTempDistrict, clearTempDistrict } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  // Clean state: user must explicitly choose a district!
  const [selectedId, setSelectedId] = useState<string>(tempOnboarding.districtId || '');
  const [error, setError] = useState<string | null>(null);

  const filteredDistricts = TAMIL_NADU_DISTRICTS.filter(d => 
    d.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.headquarters.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.region.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleContinue = () => {
    if (!selectedId) {
      setError('Please select a healthcare district before proceeding.');
      return;
    }
    const dist = TAMIL_NADU_DISTRICTS.find(d => d.id === selectedId);
    if (dist) {
      setError(null);
      updateTempDistrict(dist.id, dist.name);
      onComplete();
    }
  };

  const handleBackClick = () => {
    // When going back, clear previous district selection as required by spec!
    clearTempDistrict();
    onBack();
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] py-10 px-4 sm:px-6 lg:px-8">
      {/* Onboarding Step Indicator */}
      <OnboardingProgressBar currentStep="district" />

      <div className="max-w-4xl mx-auto">
        <button
          type="button"
          onClick={handleBackClick}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#64748B] hover:text-[#2563A6] mb-4 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to User Profile
        </button>

        {/* Header */}
        <div className="text-center mb-8">
          <Badge variant="primary" size="md" className="mb-2">Operational Jurisdiction</Badge>
          <h2 className="text-2xl font-bold text-[#1E293B]">Select Your Healthcare District</h2>
          <p className="mt-1 text-xs text-[#64748B] max-w-lg mx-auto">
            MediSync AI scopes beds, mechanical ventilators, and ambulance coordination strictly to your authorized administrative district.
          </p>
        </div>

        {error && (
          <div className="mb-4 max-w-md mx-auto p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-[#DC2626] text-center">
            {error}
          </div>
        )}

        {/* Search */}
        <div className="mb-6 relative max-w-md mx-auto">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search Tamil Nadu district (e.g. Chennai, Coimbatore, Madurai)..."
            className="w-full text-xs pl-9 pr-4 py-2.5 bg-white border border-[#CBD5E1] rounded-lg shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#2563A6]"
          />
        </div>

        {/* Grid of districts */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {filteredDistricts.map(dist => {
            const isSelected = selectedId === dist.id;
            return (
              <div
                key={dist.id}
                onClick={() => {
                  setSelectedId(dist.id);
                  setError(null);
                }}
                className={`p-4 rounded-xl border bg-white cursor-pointer transition-all ${
                  isSelected
                    ? 'border-[#2563A6] ring-2 ring-[#2563A6]/20 shadow-xs'
                    : 'border-[#E2E8F0] hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${isSelected ? 'bg-[#2563A6] text-white' : 'bg-slate-100 text-[#64748B]'}`}>
                      <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-[#1E293B]">{dist.name}</h4>
                      <span className="text-[10px] text-[#64748B]">{dist.region} Region</span>
                    </div>
                  </div>
                  {isSelected && (
                    <div className="w-5 h-5 rounded-full bg-[#2563A6] text-white flex items-center justify-center">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </div>
                  )}
                </div>

                <div className="mt-3 pt-3 border-t border-[#E2E8F0] grid grid-cols-2 gap-2 text-[11px] text-[#64748B]">
                  <div className="flex items-center gap-1">
                    <Building2 className="w-3 h-3 text-slate-400" />
                    <span>{dist.totalHospitals} Hospitals</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Bed className="w-3 h-3 text-[#2563A6]" />
                    <span>{dist.criticalBedsTotal} ICU Beds</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Bar with Back & Continue */}
        <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-xs">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="md" onClick={handleBackClick} icon={<ArrowLeft className="w-4 h-4" />}>
              Back
            </Button>
            <div className="text-xs">
              <span className="text-[#64748B]">Selected District: </span>
              <span className="font-bold text-[#1E293B]">
                {TAMIL_NADU_DISTRICTS.find(d => d.id === selectedId)?.name || 'None selected'}
              </span>
            </div>
          </div>
          <Button variant="primary" size="md" onClick={handleContinue} icon={<ArrowRight className="w-4 h-4" />}>
            Continue to Hospital Selection
          </Button>
        </div>
      </div>
    </div>
  );
};
