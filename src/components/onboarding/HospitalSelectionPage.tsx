import React, { useState } from 'react';
import { Search, Building2, MapPin, ArrowRight, Check, ArrowLeft } from 'lucide-react';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import { HOSPITALS } from '../../data/mockData';
import { useApp } from '../../context/AppContext';
import { OnboardingProgressBar } from './OnboardingProgressBar';

interface HospitalSelectionProps {
  onComplete: () => void;
  onBack: () => void;
}

export const HospitalSelectionPage: React.FC<HospitalSelectionProps> = ({ onComplete, onBack }) => {
  const { tempOnboarding, updateTempHospital, clearTempHospital } = useApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedHospitalId, setSelectedHospitalId] = useState<string>(tempOnboarding.hospitalId || '');
  const [error, setError] = useState<string | null>(null);

  // Filter hospitals strictly by selected district in temporary state!
  const districtHospitals = HOSPITALS.filter(h => 
    !tempOnboarding.districtId || h.districtId === tempOnboarding.districtId
  );

  const filteredHospitals = districtHospitals.filter(h =>
    h.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    h.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
    h.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleContinue = () => {
    if (!selectedHospitalId) {
      setError('Please select an affiliated hospital to continue.');
      return;
    }
    const hosp = HOSPITALS.find(h => h.id === selectedHospitalId);
    if (hosp) {
      setError(null);
      updateTempHospital(hosp.id, hosp.name);
      onComplete();
    }
  };

  const handleBackClick = () => {
    // When going back, clear previous hospital selection as required!
    clearTempHospital();
    onBack();
  };

  return (
    <div className="min-h-screen bg-[#F5F7FA] py-10 px-4 sm:px-6 lg:px-8">
      {/* Onboarding Step Indicator */}
      <OnboardingProgressBar currentStep="hospital" />

      <div className="max-w-4xl mx-auto">
        <button
          type="button"
          onClick={handleBackClick}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#64748B] hover:text-[#2563A6] mb-4 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" /> Back to District Selection ({tempOnboarding.districtName || 'Tamil Nadu'})
        </button>

        <div className="text-center mb-8">
          <Badge variant="primary" size="md" className="mb-2">Institutional Node</Badge>
          <h2 className="text-2xl font-bold text-[#1E293B]">Select Your Affiliated Hospital</h2>
          <p className="mt-1 text-xs text-[#64748B] max-w-lg mx-auto">
            Available medical centers in <span className="font-semibold text-[#1E293B]">{tempOnboarding.districtName || 'Selected District'}</span>. Select the facility you coordinate or receive treatment from.
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
            placeholder="Search hospital by name, department, or location..."
            className="w-full text-xs pl-9 pr-4 py-2.5 bg-white border border-[#CBD5E1] rounded-lg shadow-2xs focus:outline-none focus:ring-2 focus:ring-[#2563A6]"
          />
        </div>

        {/* List of Hospitals */}
        <div className="space-y-3 mb-8">
          {filteredHospitals.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-xl border border-slate-200 text-xs text-slate-500">
              No hospitals found matching your search in {tempOnboarding.districtName || 'this district'}.
            </div>
          ) : (
            filteredHospitals.map(hosp => {
              const isSelected = selectedHospitalId === hosp.id;
              return (
                <div
                  key={hosp.id}
                  onClick={() => {
                    setSelectedHospitalId(hosp.id);
                    setError(null);
                  }}
                  className={`p-5 rounded-xl border bg-white cursor-pointer transition-all ${
                    isSelected
                      ? 'border-[#2563A6] ring-2 ring-[#2563A6]/20 shadow-xs'
                      : 'border-[#E2E8F0] hover:border-slate-300'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                        isSelected ? 'bg-[#2563A6] text-white' : 'bg-slate-100 text-[#64748B]'
                      }`}>
                        <Building2 className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-bold text-[#1E293B]">{hosp.name}</h4>
                          <Badge 
                            variant={hosp.status === 'Operational' ? 'success' : 'warning'} 
                            size="sm"
                            dot
                          >
                            {hosp.status}
                          </Badge>
                        </div>
                        <p className="text-xs text-[#64748B] flex items-center gap-1 mt-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          {hosp.location}
                        </p>
                        <div className="text-[11px] text-[#475569] mt-2 flex flex-wrap gap-1.5">
                          <span className="font-semibold text-slate-500">Departments:</span>
                          {hosp.availableDepartments.map(dept => (
                            <span key={dept} className="px-1.5 py-0.5 bg-slate-100 text-slate-700 rounded text-[10px]">
                              {dept}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100">
                      <div className="text-right">
                        <div className="text-xs font-bold text-[#1E293B]">{hosp.readyBeds} Ready Beds</div>
                        <div className="text-[10px] text-[#64748B]">{hosp.icuAvailable} ICU Available</div>
                      </div>
                      {isSelected && (
                        <div className="w-6 h-6 rounded-full bg-[#2563A6] text-white flex items-center justify-center sm:mt-2">
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Bottom Bar with Back & Continue */}
        <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-[#E2E8F0] shadow-xs">
          <div className="flex items-center gap-4">
            <Button variant="outline" size="md" onClick={handleBackClick} icon={<ArrowLeft className="w-4 h-4" />}>
              Back
            </Button>
            <div className="text-xs">
              <span className="text-[#64748B]">Selected Facility: </span>
              <span className="font-bold text-[#1E293B]">
                {HOSPITALS.find(h => h.id === selectedHospitalId)?.name || 'None selected'}
              </span>
            </div>
          </div>
          <Button variant="primary" size="md" onClick={handleContinue} icon={<ArrowRight className="w-4 h-4" />}>
            Proceed to Role Assignment
          </Button>
        </div>
      </div>
    </div>
  );
};
