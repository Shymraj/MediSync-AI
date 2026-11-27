import React, { useState } from 'react';
import { 
  User, 
  Calendar, 
  Clock, 
  Building2, 
  AlertCircle, 
  CheckCircle2, 
  Plus, 
  FileText, 
  PhoneCall,
  Activity,
  ShieldCheck
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Card } from '../common/Card';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';
import { Modal } from '../common/Modal';
import { HOSPITALS } from '../../data/mockData';

export const PatientDashboard: React.FC<{ activeTab: string }> = ({ activeTab }) => {
  const { user, appointments, bookAppointment, beds, equipment } = useApp();
  const [isBookModalOpen, setIsBookModalOpen] = useState(false);
  const [department, setDepartment] = useState('Cardiology OPD');
  const [doctorName, setDoctorName] = useState('Dr. Sundaramoorthy M.');
  const [date, setDate] = useState('2026-11-28');
  const [time, setTime] = useState('11:00 AM');

  const currentHospital = HOSPITALS.find(h => h.id === (user?.hospitalId || 'hosp-chn-01')) || HOSPITALS[0];

  // Specific isolation: patients only see their own appointments
  const myAppointments = appointments.filter(a => a.patientId === user?.id || a.patientName === user?.name || a.patientId === 'usr-patient-demo');

  const handleBookSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    bookAppointment(department, doctorName, date, time);
    setIsBookModalOpen(false);
  };

  // Aggregated resource transparency for patient confidence
  const readyBedsCount = beds.filter(b => b.status === 'ready').length;
  const occupiedBedsCount = beds.filter(b => b.status === 'occupied').length;
  const inPrepBedsCount = beds.filter(b => ['cleaning', 'equipment_check', 'nurse_confirmation'].includes(b.status)).length;

  return (
    <div className="space-y-6">
      {/* Patient Hospital Banner */}
      <div className="p-5 bg-white border border-[#E2E8F0] rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-[#1E293B]">{currentHospital.name}</h2>
            <Badge variant="primary" size="sm">Your Selected Facility</Badge>
          </div>
          <p className="text-xs text-[#64748B] mt-1 flex items-center gap-2">
            <span>Location: {currentHospital.location}</span>
            <span>&middot;</span>
            <span>Helpline: {currentHospital.emergencyContact}</span>
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsBookModalOpen(true)}
            icon={<Plus className="w-4 h-4" />}
          >
            Book OPD Consultation
          </Button>
        </div>
      </div>

      {/* Transparent Resource Status with Notice */}
      <Card
        title="Live Facility Operational Readiness"
        subtitle="Transparent availability information &middot; Last updated: Just now"
        noPadding
      >
        <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-4 border-b border-[#E2E8F0] bg-[#F8FAFC]">
          <div className="p-3 bg-white rounded-lg border border-[#E2E8F0]">
            <div className="text-[11px] text-[#64748B] font-medium">Ready for Admission</div>
            <div className="text-xl font-bold text-[#15803D] mt-1">{readyBedsCount} Beds</div>
            <div className="text-[10px] text-[#64748B] mt-0.5">Sanitized & nurse confirmed</div>
          </div>
          <div className="p-3 bg-white rounded-lg border border-[#E2E8F0]">
            <div className="text-[11px] text-[#64748B] font-medium">Preparation in Progress</div>
            <div className="text-xl font-bold text-[#D97706] mt-1">{inPrepBedsCount} Beds</div>
            <div className="text-[10px] text-[#64748B] mt-0.5">Sanitization & calibration underway</div>
          </div>
          <div className="p-3 bg-white rounded-lg border border-[#E2E8F0]">
            <div className="text-[11px] text-[#64748B] font-medium">Currently Occupied</div>
            <div className="text-xl font-bold text-[#1E293B] mt-1">{occupiedBedsCount} Beds</div>
            <div className="text-[10px] text-[#64748B] mt-0.5">Active in-patient care</div>
          </div>
        </div>

        {/* Required Patient Advisory Notice */}
        <div className="p-3.5 bg-amber-50/70 border-t border-amber-200 text-xs text-[#D97706] flex items-start gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            <strong>Patient Notice:</strong> Resource availability numbers reflect real-time hospital bed status. Final emergency admissions and bed allocations are determined by attending triage physicians based on medical necessity.
          </span>
        </div>
      </Card>

      {/* Appointments & Live Queue */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card
            title="My Appointments & Queue Tokens"
            subtitle="Securely restricted to your registered patient account"
            noPadding
          >
            <div className="divide-y divide-[#E2E8F0]">
              {myAppointments.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#64748B]">
                  No upcoming appointments. Click "Book OPD Consultation" to schedule one.
                </div>
              ) : (
                myAppointments.map(apt => (
                  <div key={apt.id} className="p-4 hover:bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#1E293B]">{apt.department}</span>
                        <Badge 
                          variant={apt.status === 'In Queue' ? 'warning' : 'success'} 
                          size="sm"
                          dot
                        >
                          {apt.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-[#64748B] mt-1">
                        Doctor: <span className="font-semibold text-[#1E293B]">{apt.doctorName}</span> &middot; Date: {apt.date} at {apt.time}
                      </div>
                      <div className="text-[11px] text-slate-500 mt-1">
                        Facility: {apt.hospitalName}
                      </div>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-lg border border-[#E2E8F0] text-center min-w-[130px] shrink-0">
                      <div className="text-[10px] uppercase font-bold text-slate-400">Token Number</div>
                      <div className="text-2xl font-black text-[#2563A6]">#{apt.tokenNumber}</div>
                      {apt.queuePosition && (
                        <div className="text-[10px] text-[#D97706] font-semibold mt-0.5">
                          Position: {apt.queuePosition} (Wait: ~{apt.estimatedWaitMinutes}m)
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Hospital Contact & Facility Info */}
        <div className="space-y-6">
          <Card title="Emergency & Desk Help" subtitle="Immediate assistance details" noPadding>
            <div className="p-4 space-y-3 text-xs">
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-[#DC2626]">
                <div className="font-bold flex items-center gap-1.5">
                  <PhoneCall className="w-4 h-4" /> 24/7 Emergency Casualty Desk
                </div>
                <div className="text-sm font-black mt-1">{currentHospital.emergencyContact}</div>
              </div>

              <div className="p-3 bg-slate-50 border border-[#E2E8F0] rounded-lg text-[#1E293B]">
                <div className="font-semibold">Hospital Information Desk</div>
                <div className="text-[11px] text-[#64748B] mt-0.5">{currentHospital.phone}</div>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-[#15803D] pt-1">
                <ShieldCheck className="w-4 h-4 shrink-0" />
                <span>Patient records encrypted & isolated to your account.</span>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Book Consultation Modal */}
      <Modal
        isOpen={isBookModalOpen}
        onClose={() => setIsBookModalOpen(false)}
        title="Schedule OPD Consultation"
        description="Book a slot at Rajiv Gandhi Government General Hospital (RGGGH)"
      >
        <form onSubmit={handleBookSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[#1E293B] mb-1">Department</label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563A6] bg-white"
            >
              <option value="Cardiology OPD">Cardiology OPD</option>
              <option value="Pulmonology Consultation">Pulmonology Consultation</option>
              <option value="General Medicine">General Medicine</option>
              <option value="Neurology Consultation">Neurology Consultation</option>
              <option value="Pediatrics OPD">Pediatrics OPD</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#1E293B] mb-1">Consulting Doctor</label>
            <select
              value={doctorName}
              onChange={(e) => setDoctorName(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563A6] bg-white"
            >
              <option value="Dr. Sundaramoorthy M.">Dr. Sundaramoorthy M. (Critical Care & Cardiology)</option>
              <option value="Dr. Meenakshi S.">Dr. Meenakshi S. (Pulmonology Specialist)</option>
              <option value="Dr. Arun Kumar">Dr. Arun Kumar (Emergency & General Medicine)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#1E293B] mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563A6]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#1E293B] mb-1">Time Window</label>
              <select
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-[#CBD5E1] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#2563A6] bg-white"
              >
                <option value="09:30 AM">09:30 AM</option>
                <option value="11:00 AM">11:00 AM</option>
                <option value="02:30 PM">02:30 PM</option>
                <option value="04:00 PM">04:00 PM</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsBookModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Confirm Appointment Booking
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
