import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  MapPin,
  Phone,
  PhoneCall,
  Activity,
  Building2,
  Calendar,
  Clock,
  CheckCircle2,
  AlertCircle,
  Filter,
  ShieldCheck,
  LogOut,
  HeartPulse,
  Navigation,
  User,
  X,
  ChevronRight,
  Sparkles,
  Ticket,
  ArrowRight,
  Stethoscope,
  Ambulance,
  Bed,
  Wind,
  Check,
  Share2,
  Eye,
  ArrowLeft
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { HOSPITALS } from '../../data/mockData';
import { Hospital } from '../../types';
import { PatientDashboard } from '../dashboards/PatientDashboard';
import { Sidebar } from '../layout/Sidebar';
import { Header } from '../layout/Header';

// Reusable Capsule Logo
const CapsuleLogo: React.FC<{ className?: string }> = ({ className = "w-11 h-6" }) => (
  <svg
    viewBox="0 0 64 32"
    className={`${className} shrink-0 drop-shadow-xs`}
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <defs>
      <clipPath id="patient-capsule-clip">
        <rect x="2" y="2" width="60" height="28" rx="14" />
      </clipPath>
    </defs>
    <rect x="2" y="2" width="60" height="28" rx="14" fill="#0f172a" />
    <g clipPath="url(#patient-capsule-clip)">
      <rect x="2" y="2" width="30" height="28" fill="#F87171" />
      <path d="M2 10 Q14 4 24 12 Q30 18 32 14" stroke="#FBBF24" strokeWidth="2.2" fill="none" />
      <path d="M4 18 Q16 12 28 22" stroke="#FEF08A" strokeWidth="2" fill="none" />
      <path d="M8 24 Q18 20 28 28" stroke="#EA580C" strokeWidth="2.2" fill="none" />
      <rect x="32" y="2" width="30" height="28" fill="#38BDF8" />
      <path d="M32 8 Q44 2 56 12" stroke="#0284C7" strokeWidth="2.2" fill="none" />
      <path d="M32 18 Q44 14 60 20" stroke="#BAE6FD" strokeWidth="2" fill="none" />
      <path d="M34 26 Q46 22 58 26" stroke="#0369A1" strokeWidth="2.2" fill="none" />
      <line x1="32" y1="2" x2="32" y2="30" stroke="#0F172A" strokeWidth="2.2" />
    </g>
    <rect x="2" y="2" width="60" height="28" rx="14" stroke="#FFFFFF" strokeWidth="2.2" fill="none" />
  </svg>
);

interface PatientPortalDashboardProps {
  onLogout: () => void;
  onBackHome?: () => void;
}

interface OPDToken {
  id: string;
  tokenNumber: string;
  hospitalName: string;
  department: string;
  doctorName: string;
  date: string;
  timeSlot: string;
  counterNumber: string;
  patientName: string;
  status: 'Confirmed' | 'Serving' | 'Completed';
  createdAt: string;
}

export type HospitalCategory = 'government' | 'multispeciality' | 'superspeciality' | 'private';

export interface CategorizedHospital extends Hospital {
  category: HospitalCategory;
  categoryLabel: string;
}

// 4 Hospital Categories as requested:
// 1. Government Hospital
// 2. Multi-Speciality Hospital
// 3. Super-Speciality Hospital
// 4. Private Hospital / Clinic
const EXTRA_HOSPITALS: CategorizedHospital[] = [
  // 1. Government Hospitals
  {
    id: 'hosp-gov-01',
    districtId: 'chennai',
    districtName: 'Chennai',
    name: 'Rajiv Gandhi Government General Hospital (RGGGH)',
    type: 'Government Medical College Hospital' as any,
    category: 'government',
    categoryLabel: '1. Government Hospital',
    location: 'EVR Periyar Salai, Park Town, Chennai',
    availableDepartments: ['Critical Care ICU', 'Cardiology', 'Neurology', 'Trauma & Emergency', 'Nephrology', 'Pediatrics'],
    status: 'Operational',
    totalBeds: 520,
    occupiedBeds: 410,
    readyBeds: 82,
    prepBeds: 28,
    icuAvailable: 18,
    ventilatorsAvailable: 12,
    phone: '+91 44 2530 5000',
    emergencyContact: '044-25305112'
  },
  {
    id: 'hosp-gov-02',
    districtId: 'chennai',
    districtName: 'Chennai',
    name: 'Government Kilpauk Medical College Hospital',
    type: 'Government Medical College Hospital' as any,
    category: 'government',
    categoryLabel: '1. Government Hospital',
    location: 'Poonamallee High Road, Kilpauk, Chennai',
    availableDepartments: ['Burns & Plastic Surgery', 'Critical Care', 'General Medicine', 'Orthopedics', 'Emergency Care'],
    status: 'Operational',
    totalBeds: 340,
    occupiedBeds: 285,
    readyBeds: 42,
    prepBeds: 13,
    icuAvailable: 9,
    ventilatorsAvailable: 7,
    phone: '+91 44 2836 4951',
    emergencyContact: '044-28364955'
  },
  {
    id: 'hosp-gov-03',
    districtId: 'coimbatore',
    districtName: 'Coimbatore',
    name: 'Coimbatore Medical College Hospital (CMCH)',
    type: 'Government Medical College Hospital' as any,
    category: 'government',
    categoryLabel: '1. Government Hospital',
    location: 'Trichy Road, Coimbatore',
    availableDepartments: ['Emergency & Trauma', 'Cardiology', 'Neurology', 'Pulmonology', 'Critical Care'],
    status: 'Operational',
    totalBeds: 380,
    occupiedBeds: 295,
    readyBeds: 62,
    prepBeds: 23,
    icuAvailable: 15,
    ventilatorsAvailable: 11,
    phone: '+91 422 230 1393',
    emergencyContact: '0422-2301399'
  },
  {
    id: 'hosp-gov-04',
    districtId: 'madurai',
    districtName: 'Madurai',
    name: 'Government Rajaji Hospital (GRH)',
    type: 'Government Medical College Hospital' as any,
    category: 'government',
    categoryLabel: '1. Government Hospital',
    location: 'Panagal Road, Alwarpuram, Madurai',
    availableDepartments: ['Trauma Center', 'Cardiology', 'Neurosurgery', 'Pediatrics', 'Critical Care'],
    status: 'Operational',
    totalBeds: 440,
    occupiedBeds: 360,
    readyBeds: 58,
    prepBeds: 22,
    icuAvailable: 16,
    ventilatorsAvailable: 10,
    phone: '+91 452 253 2535',
    emergencyContact: '0452-2532540'
  },
  {
    id: 'hosp-gov-05',
    districtId: 'salem',
    districtName: 'Salem',
    name: 'Government Mohan Kumaramangalam Medical College Hospital',
    type: 'Government Medical College Hospital' as any,
    category: 'government',
    categoryLabel: '1. Government Hospital',
    location: 'Fort Main Road, Salem',
    availableDepartments: ['Emergency & Trauma', 'Pediatrics', 'Neurology', 'Pulmonology', 'Critical Care'],
    status: 'Operational',
    totalBeds: 290,
    occupiedBeds: 228,
    readyBeds: 45,
    prepBeds: 17,
    icuAvailable: 11,
    ventilatorsAvailable: 7,
    phone: '+91 427 221 1205',
    emergencyContact: '0427-2211210'
  },

  // 2. Multi-Speciality Hospitals
  {
    id: 'hosp-multi-01',
    districtId: 'chennai',
    districtName: 'Chennai',
    name: 'Apollo Hospitals (Main Campus)',
    type: 'Multispecialty Healthcare' as any,
    category: 'multispeciality',
    categoryLabel: '2. Multi-Speciality Hospital',
    location: '21 Greams Lane, Thousand Lights, Chennai',
    availableDepartments: ['Cardiology', 'Oncology', 'Organ Transplant', 'Critical Care', 'Robotic Surgery', 'Orthopaedics'],
    status: 'Operational',
    totalBeds: 600,
    occupiedBeds: 490,
    readyBeds: 78,
    prepBeds: 32,
    icuAvailable: 22,
    ventilatorsAvailable: 16,
    phone: '+91 44 2829 0200',
    emergencyContact: '044-28293333'
  },
  {
    id: 'hosp-multi-02',
    districtId: 'chennai',
    districtName: 'Chennai',
    name: 'MIOT International Hospital',
    type: 'Multispecialty Healthcare' as any,
    category: 'multispeciality',
    categoryLabel: '2. Multi-Speciality Hospital',
    location: '4/112 Mount Poonamallee Road, Manapakkam, Chennai',
    availableDepartments: ['Joint Replacements', 'Trauma & Polytrauma', 'Cardiology', 'Neurology', 'Critical Care'],
    status: 'Operational',
    totalBeds: 500,
    occupiedBeds: 395,
    readyBeds: 68,
    prepBeds: 25,
    icuAvailable: 19,
    ventilatorsAvailable: 14,
    phone: '+91 44 4200 2288',
    emergencyContact: '044-42002222'
  },
  {
    id: 'hosp-multi-03',
    districtId: 'tiruchirappalli',
    districtName: 'Tiruchirappalli',
    name: 'Kauvery Hospital',
    type: 'Multispecialty Healthcare' as any,
    category: 'multispeciality',
    categoryLabel: '2. Multi-Speciality Hospital',
    location: 'No. 1 K.C. Road, Cantonment, Tiruchirappalli',
    availableDepartments: ['Cardiology', 'Gastroenterology', 'Critical Care ICU', 'Emergency Services', 'Pediatrics'],
    status: 'Operational',
    totalBeds: 350,
    occupiedBeds: 270,
    readyBeds: 54,
    prepBeds: 18,
    icuAvailable: 14,
    ventilatorsAvailable: 9,
    phone: '+91 431 407 7777',
    emergencyContact: '0431-4077700'
  },
  {
    id: 'hosp-multi-04',
    districtId: 'coimbatore',
    districtName: 'Coimbatore',
    name: 'PSG Hospitals',
    type: 'Multispecialty Healthcare' as any,
    category: 'multispeciality',
    categoryLabel: '2. Multi-Speciality Hospital',
    location: 'Avinashi Road, Peelamedu, Coimbatore',
    availableDepartments: ['Cardio Thoracic', 'Neurology', 'Emergency Medicine', 'Nephrology', 'Medical Oncology'],
    status: 'Operational',
    totalBeds: 450,
    occupiedBeds: 360,
    readyBeds: 62,
    prepBeds: 20,
    icuAvailable: 16,
    ventilatorsAvailable: 11,
    phone: '+91 422 257 0170',
    emergencyContact: '0422-2570177'
  },
  {
    id: 'hosp-multi-05',
    districtId: 'chennai',
    districtName: 'Chennai',
    name: 'SIMS Hospital (SRM Institutes of Medical Science)',
    type: 'Multispecialty Healthcare' as any,
    category: 'multispeciality',
    categoryLabel: '2. Multi-Speciality Hospital',
    location: '1 Jawaharlal Nehru Salai, Vadapalani, Chennai',
    availableDepartments: ['Critical Care', 'Cardiac Sciences', 'Neuro Sciences', 'Orthopaedics', 'Multi-Organ Transplant'],
    status: 'Operational',
    totalBeds: 380,
    occupiedBeds: 298,
    readyBeds: 52,
    prepBeds: 18,
    icuAvailable: 15,
    ventilatorsAvailable: 10,
    phone: '+91 44 2000 2001',
    emergencyContact: '044-20002020'
  },

  // 3. Super-Speciality Hospitals
  {
    id: 'hosp-super-01',
    districtId: 'vellore',
    districtName: 'Vellore',
    name: 'Christian Medical College (CMC Super Specialty)',
    type: 'Apex Super Specialty' as any,
    category: 'superspeciality',
    categoryLabel: '3. Super-Speciality Hospital',
    location: 'Ida Scudder Road, Vellore',
    availableDepartments: ['Haematology & BMT', 'Advanced Cardiology', 'Neurosurgery', 'Endocrinology', 'Apex Critical Care'],
    status: 'Operational',
    totalBeds: 750,
    occupiedBeds: 620,
    readyBeds: 92,
    prepBeds: 38,
    icuAvailable: 28,
    ventilatorsAvailable: 20,
    phone: '+91 416 228 1000',
    emergencyContact: '0416-2282288'
  },
  {
    id: 'hosp-super-02',
    districtId: 'chennai',
    districtName: 'Chennai',
    name: 'Government Multi Super Speciality Hospital (Omandurar)',
    type: 'Apex Super Specialty' as any,
    category: 'superspeciality',
    categoryLabel: '3. Super-Speciality Hospital',
    location: 'Omandurar Government Estate, Anna Salai, Chennai',
    availableDepartments: ['Apex Cardiology', 'Advanced Neurology', 'Medical Oncology', 'Nephrology', 'Super Critical Care'],
    status: 'Operational',
    totalBeds: 400,
    occupiedBeds: 310,
    readyBeds: 64,
    prepBeds: 22,
    icuAvailable: 20,
    ventilatorsAvailable: 15,
    phone: '+91 44 2566 6000',
    emergencyContact: '044-25666112'
  },
  {
    id: 'hosp-super-03',
    districtId: 'chennai',
    districtName: 'Chennai',
    name: 'Dr. Kamakshi Memorial Super Speciality Hospital',
    type: 'Apex Super Specialty' as any,
    category: 'superspeciality',
    categoryLabel: '3. Super-Speciality Hospital',
    location: '1 Radial Road, Pallikaranai, Chennai',
    availableDepartments: ['Comprehensive Cancer Care', 'Cardiovascular Surgery', 'Neuro Trauma', 'Critical Care HDU'],
    status: 'Operational',
    totalBeds: 350,
    occupiedBeds: 275,
    readyBeds: 48,
    prepBeds: 18,
    icuAvailable: 14,
    ventilatorsAvailable: 10,
    phone: '+91 44 6630 0300',
    emergencyContact: '044-66300108'
  },
  {
    id: 'hosp-super-04',
    districtId: 'chennai',
    districtName: 'Chennai',
    name: 'Gleneagles Global Health City',
    type: 'Apex Super Specialty' as any,
    category: 'superspeciality',
    categoryLabel: '3. Super-Speciality Hospital',
    location: '439 Cheran Nagar, Perumbakkam, Chennai',
    availableDepartments: ['Liver & Multi-Organ Transplant', 'Interventional Pulmonology', 'Cardiology', 'Critical Care'],
    status: 'Operational',
    totalBeds: 480,
    occupiedBeds: 385,
    readyBeds: 60,
    prepBeds: 24,
    icuAvailable: 18,
    ventilatorsAvailable: 13,
    phone: '+91 44 4477 7000',
    emergencyContact: '044-44777108'
  },

  // 4. Private Hospitals & Clinics
  {
    id: 'hosp-pvt-01',
    districtId: 'chennai',
    districtName: 'Chennai',
    name: 'Vijaya Hospital & Medical Clinic',
    type: 'District Headquarters Hospital' as any,
    category: 'private',
    categoryLabel: '4. Private Hospital / Clinic',
    location: 'No. 434 N.S.K. Salai, Vadapalani, Chennai',
    availableDepartments: ['General Outpatient Clinic', 'Cardiology', 'Obstetrics & Gynaecology', 'Emergency Triage'],
    status: 'Operational',
    totalBeds: 280,
    occupiedBeds: 210,
    readyBeds: 45,
    prepBeds: 15,
    icuAvailable: 10,
    ventilatorsAvailable: 6,
    phone: '+91 44 6664 6664',
    emergencyContact: '044-66646600'
  },
  {
    id: 'hosp-pvt-02',
    districtId: 'coimbatore',
    districtName: 'Coimbatore',
    name: 'Ganga Hospital & Trauma Care Centre',
    type: 'District Headquarters Hospital' as any,
    category: 'private',
    categoryLabel: '4. Private Hospital / Clinic',
    location: '313 Mettupalayam Road, Coimbatore',
    availableDepartments: ['Orthopaedics & Spine Clinic', 'Plastic & Reconstructive Surgery', 'Trauma Bay', 'Day Care Clinic'],
    status: 'Operational',
    totalBeds: 320,
    occupiedBeds: 245,
    readyBeds: 50,
    prepBeds: 16,
    icuAvailable: 12,
    ventilatorsAvailable: 8,
    phone: '+91 422 248 5000',
    emergencyContact: '0422-2485108'
  },
  {
    id: 'hosp-pvt-03',
    districtId: 'chennai',
    districtName: 'Chennai',
    name: 'Sundaram Medical Foundation (SMF Clinic)',
    type: 'District Headquarters Hospital' as any,
    category: 'private',
    categoryLabel: '4. Private Hospital / Clinic',
    location: '9C 4th Avenue, Shanthi Colony, Anna Nagar, Chennai',
    availableDepartments: ['Family Medicine Clinic', 'General Surgery', 'Pediatric Care', 'Emergency Room', 'Day Care'],
    status: 'Operational',
    totalBeds: 200,
    occupiedBeds: 150,
    readyBeds: 36,
    prepBeds: 10,
    icuAvailable: 8,
    ventilatorsAvailable: 5,
    phone: '+91 44 2626 8844',
    emergencyContact: '044-26268800'
  },
  {
    id: 'hosp-pvt-04',
    districtId: 'tiruchirappalli',
    districtName: 'Tiruchirappalli',
    name: 'Vasan Healthcare Family Clinic',
    type: 'District Headquarters Hospital' as any,
    category: 'private',
    categoryLabel: '4. Private Hospital / Clinic',
    location: 'Salai Road, Thillai Nagar, Tiruchirappalli',
    availableDepartments: ['General Practice Clinic', 'Internal Medicine', 'ENT Clinic', 'Emergency Day Care'],
    status: 'Operational',
    totalBeds: 140,
    occupiedBeds: 95,
    readyBeds: 32,
    prepBeds: 8,
    icuAvailable: 6,
    ventilatorsAvailable: 4,
    phone: '+91 431 276 0000',
    emergencyContact: '0431-2760108'
  }
];

// Helper to determine category for any hospital
const categorizeHospital = (h: Hospital): CategorizedHospital => {
  const name = (h.name || '').toLowerCase();
  const typeStr = (h.type || '').toLowerCase();

  let category: HospitalCategory = 'government';
  let categoryLabel = '1. Government Hospital';

  if (typeStr.includes('private') || typeStr.includes('clinic') || name.includes('clinic')) {
    category = 'private';
    categoryLabel = '4. Private Hospital / Clinic';
  } else if (typeStr.includes('super') || typeStr.includes('apex') || name.includes('super') || name.includes('omandurar')) {
    category = 'superspeciality';
    categoryLabel = '3. Super-Speciality Hospital';
  } else if (
    typeStr.includes('multi') ||
    name.includes('apollo') ||
    name.includes('miot') ||
    name.includes('kauvery') ||
    name.includes('psg') ||
    name.includes('sims') ||
    name.includes('meenakshi')
  ) {
    category = 'multispeciality';
    categoryLabel = '2. Multi-Speciality Hospital';
  } else {
    category = 'government';
    categoryLabel = '1. Government Hospital';
  }

  return {
    ...h,
    category,
    categoryLabel
  };
};

export const PatientPortalDashboard: React.FC<PatientPortalDashboardProps> = ({
  onLogout,
  onBackHome
}) => {
  const { user, appointments, bookAppointment } = useApp();

  // Navigation tab state: 'find-hospital' | 'my-appointments' | 'emergency-sos'
  const [activeTab, setActiveTab] = useState<'find-hospital' | 'my-appointments' | 'emergency-sos'>('find-hospital');

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('all');
  const [selectedHospitalType, setSelectedHospitalType] = useState<
    'all' | 'government' | 'multispeciality' | 'superspeciality' | 'private'
  >('all');

  // Registered hospitals fetched dynamically (from backend / localStorage)
  const [registeredHospitals, setRegisteredHospitals] = useState<Hospital[]>([]);

  // Dedicated Original Patient Portal View State (when clicking View Hospital)
  const [isViewingPortal, setIsViewingPortal] = useState(true);
  const [portalTab, setPortalTab] = useState('dashboard');
  const [viewingHospital, setViewingHospital] = useState<CategorizedHospital | null>(null);

  // View Hospital Details Modal State
  const [selectedHospitalForView, setSelectedHospitalForView] = useState<CategorizedHospital | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  // Booking Modal State
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);
  const [selectedHospitalForBooking, setSelectedHospitalForBooking] = useState<CategorizedHospital | null>(null);
  const [selectedDepartment, setSelectedDepartment] = useState('Cardiology OPD');
  const [selectedDate, setSelectedDate] = useState('2026-11-28');
  const [selectedTimeSlot, setSelectedTimeSlot] = useState('10:00 AM - 11:30 AM');
  const [patientMobile, setPatientMobile] = useState('+91 98401 22345');
  const [chiefComplaint, setChiefComplaint] = useState('Routine checkup and blood pressure evaluation');

  // Active generated tokens list
  const [tokens, setTokens] = useState<OPDToken[]>([
    {
      id: 'tk-1',
      tokenNumber: 'TK-RGGGH-042',
      hospitalName: 'Rajiv Gandhi Government General Hospital (RGGGH)',
      department: 'Cardiology OPD',
      doctorName: 'Dr. Sundaramoorthy M.',
      date: '2026-11-28',
      timeSlot: '10:00 AM - 11:30 AM',
      counterNumber: 'Counter 4 (OPD Bay A)',
      patientName: user?.name || 'Karthik Subramanian',
      status: 'Confirmed',
      createdAt: 'Just now'
    }
  ]);

  // Newly booked token highlight modal
  const [newlyGeneratedToken, setNewlyGeneratedToken] = useState<OPDToken | null>(null);

  // Fetch registered hospitals on mount
  useEffect(() => {
    const fetchRegistered = async () => {
      try {
        const res = await fetch('http://localhost:5000/api/registered-hospitals');
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data) && data.length > 0) {
            const mapped: Hospital[] = data.map((h: any) => ({
              id: h.id || `reg-${Math.random()}`,
              districtId: h.districtId || 'chennai',
              districtName: h.districtName || 'Chennai',
              name: h.hospitalName,
              type: h.hospitalType || 'Government District Headquarters',
              location: h.hospitalAddress || h.areaLocality || 'Tamil Nadu',
              availableDepartments: ['General Medicine', 'Trauma & Emergency', 'ICU', 'Outpatient OPD'],
              status: 'Operational',
              totalBeds: h.totalBeds || 120,
              occupiedBeds: Math.round((h.totalBeds || 120) * 0.7),
              readyBeds: Math.round((h.totalBeds || 120) * 0.25),
              prepBeds: 5,
              icuAvailable: h.icuBeds || 12,
              ventilatorsAvailable: Math.round((h.icuBeds || 12) * 0.6),
              phone: h.hospitalPhone || '+91 44 2530 5000',
              emergencyContact: h.emergencyContact || '044-25305112'
            }));
            setRegisteredHospitals(mapped);
            return;
          }
        }
      } catch (err) {
        // Fallback to localStorage
      }

      try {
        const stored = localStorage.getItem('medisync_registered_hospitals');
        if (stored) {
          const list = JSON.parse(stored);
          if (Array.isArray(list) && list.length > 0) {
            const mapped: Hospital[] = list.map((h: any) => ({
              id: h.id || `reg-local-${Math.random()}`,
              districtId: h.districtId || 'chennai',
              districtName: h.districtName || 'Chennai',
              name: h.hospitalName,
              type: h.hospitalType || 'Registered Facility',
              location: h.hospitalAddress || h.areaLocality || 'Tamil Nadu',
              availableDepartments: ['General Medicine', 'Emergency', 'ICU'],
              status: 'Operational',
              totalBeds: h.totalBeds || 100,
              occupiedBeds: 60,
              readyBeds: 35,
              prepBeds: 5,
              icuAvailable: h.icuBeds || 10,
              ventilatorsAvailable: 6,
              phone: h.hospitalPhone || '+91 44 2530 5000',
              emergencyContact: h.emergencyContact || '044-25305112'
            }));
            setRegisteredHospitals(mapped);
          }
        }
      } catch (e) {
        // Silent fallback
      }
    };

    fetchRegistered();
  }, []);

  // Combined hospitals: Registered first, then Extra Curated 4-Types, then Mock data
  const allHospitals: CategorizedHospital[] = useMemo(() => {
    const existingNames = new Set<string>();

    // 1. Process registered hospitals from SQLite / localStorage
    const regMapped: CategorizedHospital[] = registeredHospitals.map(h => {
      existingNames.add(h.name.toLowerCase());
      return categorizeHospital(h);
    });

    // 2. Extra curated 4-category hospitals (Govt, Multi, Super, Private)
    const extraFiltered: CategorizedHospital[] = [];
    for (const h of EXTRA_HOSPITALS) {
      if (!existingNames.has(h.name.toLowerCase())) {
        existingNames.add(h.name.toLowerCase());
        extraFiltered.push(h);
      }
    }

    // 3. Any additional mock hospitals
    const mockCategorized: CategorizedHospital[] = [];
    for (const h of HOSPITALS) {
      if (!existingNames.has(h.name.toLowerCase())) {
        existingNames.add(h.name.toLowerCase());
        mockCategorized.push(categorizeHospital(h));
      }
    }

    return [...regMapped, ...extraFiltered, ...mockCategorized];
  }, [registeredHospitals]);

  // Filtered hospitals based on user input (Search query, District, and Type of Hospital)
  const filteredHospitals = useMemo(() => {
    return allHospitals.filter(h => {
      // 1. Text Search query (Name, Location, District, or Department)
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q ||
        h.name.toLowerCase().includes(q) ||
        h.location.toLowerCase().includes(q) ||
        h.districtName.toLowerCase().includes(q) ||
        (h.availableDepartments && h.availableDepartments.some((d: string) => d.toLowerCase().includes(q)));

      // 2. District filter
      const matchesDistrict = selectedDistrict === 'all' ||
        h.districtId?.toLowerCase() === selectedDistrict.toLowerCase() ||
        h.districtName?.toLowerCase() === selectedDistrict.toLowerCase();

      // 3. Type of Hospital filter:
      // (1. Government Hospital, 2. Multi-Speciality Hospital, 3. Super-Speciality Hospital, 4. Private Hospital / Clinic)
      let matchesType = true;
      if (selectedHospitalType === 'government') {
        matchesType = h.category === 'government';
      } else if (selectedHospitalType === 'multispeciality') {
        matchesType = h.category === 'multispeciality';
      } else if (selectedHospitalType === 'superspeciality') {
        matchesType = h.category === 'superspeciality';
      } else if (selectedHospitalType === 'private') {
        matchesType = h.category === 'private';
      }

      return matchesSearch && matchesDistrict && matchesType;
    });
  }, [allHospitals, searchQuery, selectedDistrict, selectedHospitalType]);

  // Aggregate Metrics
  const totalLiveICUBeds = useMemo(() => {
    return filteredHospitals.reduce((acc, h) => acc + (h.icuAvailable || 0), 0);
  }, [filteredHospitals]);

  const totalReadyBeds = useMemo(() => {
    return filteredHospitals.reduce((acc, h) => acc + (h.readyBeds || 0), 0);
  }, [filteredHospitals]);

  // Handle Token Generation
  const handleGenerateToken = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedHospitalForBooking) return;

    const randomNum = Math.floor(10 + Math.random() * 89);
    const hospAbbr = selectedHospitalForBooking.name
      .split(' ')
      .map((w: string) => w[0])
      .join('')
      .substring(0, 5)
      .toUpperCase();

    const newToken: OPDToken = {
      id: `tk-${Date.now()}`,
      tokenNumber: `TK-${hospAbbr}-${randomNum}`,
      hospitalName: selectedHospitalForBooking.name,
      department: selectedDepartment,
      doctorName: selectedDepartment.includes('Cardio') ? 'Dr. Sundaramoorthy M.' : 'Duty Chief Physician',
      date: selectedDate,
      timeSlot: selectedTimeSlot,
      counterNumber: `Counter ${Math.floor(1 + Math.random() * 6)} (OPD Bay)`,
      patientName: user?.name || 'Karthik Subramanian',
      status: 'Confirmed',
      createdAt: 'Just now'
    };

    setTokens(prev => [newToken, ...prev]);
    setNewlyGeneratedToken(newToken);
    setIsBookingModalOpen(false);
  };

  // ========================================================
  // FULL PATIENT PORTAL LAYOUT (Sidebar + Header + Patient Care)
  // Displayed when patient clicks "View Hospital"
  // ========================================================
  if (isViewingPortal) {
    return (
      <div className="min-h-screen bg-[#F5F7FA] text-[#1E293B] flex font-sans">
        {/* Fixed Left Sidebar for Patient */}
        <Sidebar 
          currentTab={portalTab}
          onSelectTab={(tab) => {
            if (tab === 'find_hospitals') {
              setIsViewingPortal(false);
            } else {
              setPortalTab(tab);
            }
          }}
          activeRole="patient"
        />

        {/* Main Layout Area */}
        <div className="flex-1 flex flex-col min-w-0">
          <Header 
            title={
              portalTab === 'dashboard' 
                ? 'PATIENT OVERVIEW' 
                : portalTab.toUpperCase()
            }
            subtitle="Patient portal — Verified hospital operational readiness, appointments, and token status"
            activeRole="patient"
            onNavigateHome={() => setIsViewingPortal(false)}
          />

          <main className="flex-1 p-6 overflow-y-auto">
            {/* Top Back Action Bar */}
            <div className="flex items-center justify-between pb-4">
              <button
                onClick={() => setIsViewingPortal(false)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-blue-50/70 hover:border-blue-300 text-slate-700 hover:text-[#1A56DB] text-xs font-bold transition-all shadow-2xs cursor-pointer group"
              >
                <ArrowLeft className="w-4 h-4 text-[#1A56DB] group-hover:-translate-x-1 transition-transform" />
                <span>&larr; Back to Hospital Search (மருத்துவமனை பட்டியல்)</span>
              </button>

              <div className="text-xs text-slate-500 font-medium hidden sm:block">
                Hospital Portal View &middot; <strong className="text-slate-800">MediSync Operational System</strong>
              </div>
            </div>

            <PatientDashboard 
              activeTab={portalTab} 
              selectedHospital={viewingHospital as any}
              onBack={() => setIsViewingPortal(false)}
              onSelectTab={(tab) => setPortalTab(tab)}
            />
          </main>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans flex flex-col">

      {/* ======================================================== */}
      {/* 1. TOP HEADER: PATIENT BRAND, NAVIGATION & USER PROFILE   */}
      {/* ======================================================== */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200/90 shadow-2xs">
        <div className="w-full max-w-[1520px] mx-auto px-4 sm:px-8 lg:px-10 h-20 flex items-center justify-between gap-6 sm:gap-8">

          {/* Left Brand */}
          <div 
            onClick={() => {
              setViewingHospital(null);
              setActiveTab('find-hospital');
            }}
            className="flex items-center gap-3.5 shrink-0 cursor-pointer"
            title="Hospital Readiness Network"
          >
            <div className="w-11 h-11 rounded-2xl bg-linear-to-br from-[#1b436c] to-[#2563eb] flex items-center justify-center shadow-xs">
              <CapsuleLogo className="w-8.5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base tracking-tight text-slate-900">
                  MEDISYNC
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-blue-100 text-[#1A56DB]">
                  Patient Portal
                </span>
              </div>
              <div className="text-[11px] text-slate-500 font-medium mt-0.5">
                குடிமக்கள் நலப் பிரிவு &middot; Hospital Readiness Network
              </div>
            </div>
          </div>

          {/* Center Navigation Tabs with Generous Spacing */}
          <div className="hidden md:flex items-center bg-slate-100 p-1.5 rounded-full border border-slate-200/90 text-xs font-bold gap-2">
            <button
              onClick={() => {
                setViewingHospital(null);
                setActiveTab('find-hospital');
              }}
              className={`px-5 py-2 rounded-full transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'find-hospital' && !viewingHospital
                  ? 'bg-white text-[#1A56DB] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Search className="w-3.5 h-3.5" />
              <span>Find Hospitals (தேடல்)</span>
            </button>
            <button
              onClick={() => {
                setViewingHospital(null);
                setActiveTab('emergency-sos');
              }}
              className={`px-5 py-2 rounded-full transition-all cursor-pointer flex items-center gap-2 ${
                activeTab === 'emergency-sos'
                  ? 'bg-red-50 text-red-600 shadow-xs'
                  : 'text-slate-600 hover:text-red-600'
              }`}
            >
              <HeartPulse className="w-3.5 h-3.5 text-red-500 animate-pulse" />
              <span>Emergency SOS (108)</span>
            </button>
          </div>

          {/* Right Profile & Logout with Generous Breathing Room */}
          <div className="flex items-center gap-4 sm:gap-6 shrink-0">
            {/* Quick 24x7 Helpline Pill */}
            <a
              href="tel:04425305112"
              className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold hover:bg-rose-100 transition-colors shadow-2xs"
            >
              <PhoneCall className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
              <span>24x7: 044-25305112</span>
            </a>

            {/* Patient Avatar & Name with Left Border & Spacing */}
            <div className="flex items-center gap-3.5 pl-4 sm:pl-6 border-l border-slate-200">
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-xs shrink-0">
                KS
              </div>
              <div className="hidden sm:block text-left mr-2 sm:mr-3">
                <div className="text-xs font-bold text-slate-800 leading-tight">
                  {user?.name || 'Karthik Subramanian'}
                </div>
                <div className="text-[10px] text-slate-400 mt-0.5">
                  PT-TN-9842 &middot; Citizen
                </div>
              </div>
            </div>

            {/* Dedicated Logout Button with Room to Breathe */}
            <button
              onClick={onLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-slate-200 bg-white hover:bg-rose-50 hover:border-rose-200 text-slate-700 hover:text-rose-600 text-xs font-bold transition-all cursor-pointer shadow-2xs shrink-0 ml-1 sm:ml-2"
              title="Sign Out / Logout"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Logout</span>
            </button>
          </div>

        </div>

        {/* Mobile Navigation Tabs */}
        <div className="flex md:hidden border-t border-slate-200 px-4 py-2.5 bg-slate-50 gap-3 overflow-x-auto text-xs font-bold">
          <button
            onClick={() => setActiveTab('find-hospital')}
            className={`px-4 py-1.5 rounded-full whitespace-nowrap ${
              activeTab === 'find-hospital' ? 'bg-[#1A56DB] text-white' : 'text-slate-600'
            }`}
          >
            Find Hospitals
          </button>
          <button
            onClick={() => setActiveTab('emergency-sos')}
            className={`px-4 py-1.5 rounded-full whitespace-nowrap ${
              activeTab === 'emergency-sos' ? 'bg-red-600 text-white' : 'text-red-600'
            }`}
          >
            Emergency 108
          </button>
        </div>
      </header>

      {/* ======================================================== */}
      {/* 2. EMERGENCY ADVISORY / SOS TOP RIBBON                    */}
      {/* ======================================================== */}
      <div className="bg-linear-to-r from-red-600 via-rose-600 to-red-700 text-white text-xs px-4 py-2.5 font-medium shadow-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-white animate-ping" />
            <span className="font-bold">EMERGENCY TRAUMA RESPONSE:</span>
            <span>Dial <strong>108</strong> for Free Ambulance Dispatch or <strong>104</strong> for 24x7 Medical Advice</span>
          </div>
          <div className="flex items-center gap-3 text-[11px] font-bold">
            <a href="tel:108" className="px-2.5 py-1 rounded-full bg-white text-red-700 hover:bg-red-50 transition-colors">
              Call 108 Ambulance
            </a>
            <a href="tel:04425305112" className="px-2.5 py-1 rounded-full bg-white/20 hover:bg-white/30 text-white transition-colors">
              Disaster Desk: 044-25305112
            </a>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. MAIN CONTENT BODY ACCORDING TO ACTIVE TAB             */}
      {/* ======================================================== */}
      <main className="flex-1 w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 max-w-[1520px]">

        {/* -------------------------------------------------------- */}
        {/* TAB 1: FIND HOSPITALS (மருத்துவமனை தேடல்)                 */}
        {/* -------------------------------------------------------- */}
        {activeTab === 'find-hospital' && (
          <div className="space-y-6">

            {/* Hero Search Section */}
            <div className="bg-linear-to-br from-[#1E40AF] via-[#1D4ED8] to-[#0A2568] rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-80 h-80 bg-blue-400/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 max-w-3xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-blue-200 text-[11px] font-bold mb-3 border border-white/10">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
                  <span>Real-Time Institutional Telemetry & Live Bed Registry</span>
                </div>

                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                  Find Hospitals & Emergency Readiness
                </h1>
                <p className="text-xs sm:text-sm text-blue-100/90 mt-1.5 leading-relaxed">
                  Search across verified government medical colleges, trauma apex centers, and multi-speciality network hospitals in Tamil Nadu.
                </p>

                {/* Big Search Input Bar */}
                <div className="mt-6 flex flex-col sm:flex-row gap-2.5 bg-white p-2 rounded-2xl shadow-lg text-slate-800">
                  <div className="flex-1 flex items-center gap-3 px-3 py-1">
                    <Search className="w-5 h-5 text-slate-400 shrink-0" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search hospital name, area, specialty (e.g. Apollo, RGGGH, Cardiology, ICU, Salem)..."
                      className="w-full text-xs sm:text-sm bg-transparent outline-hidden font-medium placeholder-slate-400"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="p-1 rounded-full text-slate-400 hover:text-slate-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* District Dropdown in Search */}
                  <div className="sm:border-l border-slate-200 sm:pl-3 flex items-center pr-2">
                    <MapPin className="w-4 h-4 text-[#1A56DB] shrink-0 mr-1.5" />
                    <select
                      value={selectedDistrict}
                      onChange={(e) => setSelectedDistrict(e.target.value)}
                      className="text-xs font-bold text-slate-700 bg-transparent outline-hidden cursor-pointer py-2"
                    >
                      <option value="all">All Tamil Nadu</option>
                      <option value="chennai">Chennai (சென்னை)</option>
                      <option value="coimbatore">Coimbatore (கோவை)</option>
                      <option value="madurai">Madurai (மதுரை)</option>
                      <option value="tiruchirappalli">Trichy (திருச்சி)</option>
                      <option value="salem">Salem (சேலம்)</option>
                      <option value="vellore">Vellore (வேலூர்)</option>
                      <option value="tirunelveli">Tirunelveli (நெல்லை)</option>
                      <option value="erode">Erode (ஈரோடு)</option>
                    </select>
                  </div>
                </div>

              </div>

              {/* Quick Metrics Bar inside hero */}
              <div className="mt-8 pt-6 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-4 text-white">
                <div>
                  <div className="text-xl sm:text-2xl font-black text-cyan-300">
                    {filteredHospitals.length}
                  </div>
                  <div className="text-[11px] text-blue-200 font-medium">Hospitals Found</div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-black text-emerald-300">
                    {totalLiveICUBeds}
                  </div>
                  <div className="text-[11px] text-blue-200 font-medium">Live ICU Beds Ready</div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-black text-amber-300">
                    {totalReadyBeds}
                  </div>
                  <div className="text-[11px] text-blue-200 font-medium">General Beds Available</div>
                </div>
                <div>
                  <div className="text-xl sm:text-2xl font-black text-white">
                    24/7
                  </div>
                  <div className="text-[11px] text-blue-200 font-medium">Trauma Helplines Active</div>
                </div>
              </div>
            </div>

            {/* ======================================================== */}
            {/* TYPE OF HOSPITAL SELECTOR SECTION (As requested by User)  */}
            {/* 1. Government Hospital                                   */}
            {/* 2. Multi-Speciality Hospital                              */}
            {/* 3. Super-Speciality Hospital                             */}
            {/* 4. Private Hospital / Clinic                              */}
            {/* ======================================================== */}
            <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3.5">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-[#1A56DB] flex items-center justify-center font-bold text-xs border border-blue-100 shadow-2xs">
                    <Building2 className="w-4 h-4 stroke-[2.2]" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                      <span>Type of Hospital</span>
                      <span className="text-slate-400 font-semibold normal-case text-[11px]">(மருத்துவமனை வகை)</span>
                    </h3>
                    <p className="text-[11px] text-slate-500 font-medium">
                      Select a category to filter hospitals instantly below
                    </p>
                  </div>
                </div>

                <div className="text-[11px] font-bold text-slate-500 bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200 shrink-0">
                  Showing: <span className="text-[#1A56DB] font-extrabold">{filteredHospitals.length} Facilities</span>
                </div>
              </div>

              {/* 4 Type Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setSelectedHospitalType('all')}
                  className={`px-4 py-2.5 rounded-xl cursor-pointer whitespace-nowrap transition-all flex items-center gap-2 ${selectedHospitalType === 'all'
                    ? 'bg-[#1A56DB] text-white shadow-xs ring-2 ring-blue-500/20'
                    : 'bg-slate-50 border border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                >
                  <span>All Hospitals ({allHospitals.length})</span>
                </button>

                {/* 1. Government Hospital */}
                <button
                  type="button"
                  onClick={() => setSelectedHospitalType('government')}
                  className={`px-4 py-2.5 rounded-xl cursor-pointer whitespace-nowrap transition-all flex items-center gap-2 ${selectedHospitalType === 'government'
                    ? 'bg-[#1A56DB] text-white shadow-xs ring-2 ring-blue-500/20'
                    : 'bg-blue-50/50 border border-blue-200/70 text-blue-900 hover:bg-blue-50'
                    }`}
                >
                  <span className="w-5 h-5 rounded-full bg-blue-100 text-[#1A56DB] flex items-center justify-center text-[10px] font-black">1</span>
                  <span>Government Hospital</span>
                </button>

                {/* 2. Multi-Speciality Hospital */}
                <button
                  type="button"
                  onClick={() => setSelectedHospitalType('multispeciality')}
                  className={`px-4 py-2.5 rounded-xl cursor-pointer whitespace-nowrap transition-all flex items-center gap-2 ${selectedHospitalType === 'multispeciality'
                    ? 'bg-purple-600 text-white shadow-xs ring-2 ring-purple-500/20'
                    : 'bg-purple-50/50 border border-purple-200/70 text-purple-900 hover:bg-purple-50'
                    }`}
                >
                  <span className="w-5 h-5 rounded-full bg-purple-100 text-purple-700 flex items-center justify-center text-[10px] font-black">2</span>
                  <span>Multi-Speciality Hospital</span>
                </button>

                {/* 3. Super-Speciality Hospital */}
                <button
                  type="button"
                  onClick={() => setSelectedHospitalType('superspeciality')}
                  className={`px-4 py-2.5 rounded-xl cursor-pointer whitespace-nowrap transition-all flex items-center gap-2 ${selectedHospitalType === 'superspeciality'
                    ? 'bg-amber-600 text-white shadow-xs ring-2 ring-amber-500/20'
                    : 'bg-amber-50/50 border border-amber-200/70 text-amber-900 hover:bg-amber-50'
                    }`}
                >
                  <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center text-[10px] font-black">3</span>
                  <span>Super-Speciality Hospital</span>
                </button>

                {/* 4. Private Hospital / Clinic */}
                <button
                  type="button"
                  onClick={() => setSelectedHospitalType('private')}
                  className={`px-4 py-2.5 rounded-xl cursor-pointer whitespace-nowrap transition-all flex items-center gap-2 ${selectedHospitalType === 'private'
                    ? 'bg-emerald-600 text-white shadow-xs ring-2 ring-emerald-500/20'
                    : 'bg-emerald-50/50 border border-emerald-200/70 text-emerald-900 hover:bg-emerald-50'
                    }`}
                >
                  <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-[10px] font-black">4</span>
                  <span>Private Hospital / Clinic</span>
                </button>
              </div>
            </div>

            {/* Hospital Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredHospitals.map((hospital) => {
                const hasICU = (hospital.icuAvailable || 0) > 0;
                const hasVentilators = (hospital.ventilatorsAvailable || 0) > 0;

                return (
                  <div
                    key={hospital.id}
                    className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition-all overflow-hidden flex flex-col justify-between group"
                  >
                    <div className="p-5">

                      {/* Top Header: Badge & Status */}
                      <div className="flex items-start justify-between gap-2 mb-2.5">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border shadow-2xs ${hospital.category === 'government'
                          ? 'bg-blue-100 text-blue-800 border-blue-200'
                          : hospital.category === 'multispeciality'
                            ? 'bg-purple-100 text-purple-800 border-purple-200'
                            : hospital.category === 'superspeciality'
                              ? 'bg-amber-100 text-amber-800 border-amber-200'
                              : 'bg-emerald-100 text-emerald-800 border-emerald-200'
                          }`}>
                          {hospital.categoryLabel}
                        </span>
                        <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-600">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          <span>Live Active</span>
                        </div>
                      </div>

                      {/* Hospital Name */}
                      <h3
                        onClick={() => {
                          setIsViewingPortal(true);
                          setViewingHospital(hospital);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="text-base font-bold text-slate-900 group-hover:text-[#1A56DB] transition-colors leading-snug cursor-pointer"
                        title="Click to view hospital dashboard"
                      >
                        {hospital.name}
                      </h3>

                      {/* Location & District */}
                      <div className="flex items-start gap-1.5 text-xs text-slate-500 mt-1.5 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                        <span>{hospital.location} &middot; <strong className="text-slate-700">{hospital.districtName}</strong></span>
                      </div>

                      {/* Live Resources Telemetry Row */}
                      <div className="mt-4 grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-center">
                        <div className="p-1.5 bg-white rounded-lg border border-slate-100 shadow-2xs">
                          <div className="text-[10px] text-slate-400 font-semibold">ICU Beds</div>
                          <div className={`text-sm font-extrabold mt-0.5 ${hasICU ? 'text-emerald-700' : 'text-amber-600'}`}>
                            {hospital.icuAvailable || 0} Ready
                          </div>
                        </div>
                        <div className="p-1.5 bg-white rounded-lg border border-slate-100 shadow-2xs">
                          <div className="text-[10px] text-slate-400 font-semibold">Ready Beds</div>
                          <div className="text-sm font-extrabold text-[#1A56DB] mt-0.5">
                            {hospital.readyBeds || 0} Ready
                          </div>
                        </div>
                        <div className="p-1.5 bg-white rounded-lg border border-slate-100 shadow-2xs">
                          <div className="text-[10px] text-slate-400 font-semibold">Ventilators</div>
                          <div className={`text-sm font-extrabold mt-0.5 ${hasVentilators ? 'text-cyan-700' : 'text-slate-500'}`}>
                            {hospital.ventilatorsAvailable || 0} Units
                          </div>
                        </div>
                      </div>

                      {/* Specialties Tags */}
                      {hospital.availableDepartments && hospital.availableDepartments.length > 0 && (
                        <div className="mt-3.5 flex items-center gap-1.5 flex-wrap">
                          {hospital.availableDepartments.slice(0, 3).map((dept: string, i: number) => (
                            <span
                              key={i}
                              className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[10px] font-semibold"
                            >
                              {dept}
                            </span>
                          ))}
                          {hospital.availableDepartments.length > 3 && (
                            <span className="text-[10px] text-slate-400 font-medium">
                              +{hospital.availableDepartments.length - 3} more
                            </span>
                          )}
                        </div>
                      )}

                      {/* Helpline Phone */}
                      <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                        <span className="text-slate-400 text-[11px] font-medium">Emergency Desk:</span>
                        <a
                          href={`tel:${hospital.emergencyContact || hospital.phone}`}
                          className="font-bold text-rose-600 hover:underline flex items-center gap-1"
                        >
                          <Phone className="w-3 h-3" />
                          <span>{hospital.emergencyContact || hospital.phone}</span>
                        </a>
                      </div>

                    </div>

                    {/* Bottom Action Buttons */}
                    <div className="p-3 bg-slate-50/80 border-t border-slate-100 flex items-center gap-2">
                      <button
                        onClick={() => {
                          setIsViewingPortal(true);
                          setViewingHospital(hospital);
                          window.scrollTo({ top: 0, behavior: 'smooth' });
                        }}
                        className="flex-1 py-2 px-3 rounded-xl bg-[#1A56DB] hover:bg-blue-700 text-white font-bold text-xs shadow-2xs hover:shadow-xs transition-all cursor-pointer flex items-center justify-center gap-1.5"
                      >
                        <Building2 className="w-3.5 h-3.5" />
                        <span>View Hospital</span>
                      </button>

                      <a
                        href={`tel:${hospital.emergencyContact || hospital.phone}`}
                        className="py-2 px-3 rounded-xl bg-white hover:bg-red-50 border border-slate-200 hover:border-red-300 text-rose-600 font-bold text-xs transition-colors flex items-center justify-center gap-1 shrink-0"
                        title="Call Emergency Hotline"
                      >
                        <PhoneCall className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Call</span>
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Empty state */}
            {filteredHospitals.length === 0 && (
              <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
                <Building2 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-lg font-bold text-slate-800">No Hospitals Found</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                  No medical facilities matched "{searchQuery}" in {selectedDistrict === 'all' ? 'Tamil Nadu' : selectedDistrict}. Try clearing search filters.
                </p>
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedDistrict('all');
                    setSelectedHospitalType('all');
                  }}
                  className="mt-4 px-4 py-2 rounded-full bg-[#1A56DB] text-white text-xs font-bold"
                >
                  Clear All Filters
                </button>
              </div>
            )}

          </div>
        )}

        {/* -------------------------------------------------------- */}
        {/* TAB 2: MY APPOINTMENTS & TOKENS                          */}
        {/* -------------------------------------------------------- */}
        {activeTab === 'my-appointments' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-slate-900">
                  My OPD Tokens & Consultations
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Live token queue status, counter assignment, and doctor consult slips.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('find-hospital')}
                className="px-4 py-2 rounded-full bg-[#1A56DB] text-white font-bold text-xs flex items-center gap-2 shadow-xs cursor-pointer"
              >
                <Search className="w-3.5 h-3.5" />
                <span>Find Another Hospital</span>
              </button>
            </div>

            <div className="space-y-4">
              {tokens.map((token) => (
                <div
                  key={token.id}
                  className="bg-white rounded-2xl border-2 border-blue-500/30 p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6"
                >
                  <div className="flex items-start gap-4">
                    {/* Token Number Box */}
                    <div className="w-20 h-20 rounded-2xl bg-linear-to-br from-[#1A56DB] to-[#1E40AF] text-white flex flex-col items-center justify-center p-2 text-center shadow-md shrink-0">
                      <span className="text-[10px] font-bold text-blue-200 uppercase">Token</span>
                      <span className="text-sm font-black tracking-tight">{token.tokenNumber.split('-')[2] || '#042'}</span>
                      <span className="text-[9px] text-cyan-200 font-semibold">{token.tokenNumber.split('-')[1]}</span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-100 text-emerald-800">
                          {token.status}
                        </span>
                        <span className="text-xs text-slate-400 font-medium">
                          Booked: {token.createdAt}
                        </span>
                      </div>

                      <h3 className="text-base font-bold text-slate-900 mt-1">
                        {token.hospitalName}
                      </h3>

                      <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs text-slate-600">
                        <div>
                          <div className="text-[10px] text-slate-400 font-medium">Department</div>
                          <div className="font-bold text-slate-800">{token.department}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-400 font-medium">Reporting Counter</div>
                          <div className="font-bold text-blue-700">{token.counterNumber}</div>
                        </div>
                        <div>
                          <div className="text-[10px] text-slate-400 font-medium">Assigned Physician</div>
                          <div className="font-bold text-slate-800">{token.doctorName}</div>
                        </div>
                      </div>

                      <div className="mt-3 flex items-center gap-4 text-xs font-semibold text-slate-500">
                        <span className="flex items-center gap-1 text-slate-700">
                          <Calendar className="w-3.5 h-3.5 text-[#1A56DB]" /> {token.date}
                        </span>
                        <span className="flex items-center gap-1 text-slate-700">
                          <Clock className="w-3.5 h-3.5 text-[#1A56DB]" /> {token.timeSlot}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right Queue Status */}
                  <div className="md:border-l border-slate-100 md:pl-6 flex flex-col items-start md:items-end justify-center shrink-0">
                    <div className="text-left md:text-right">
                      <div className="text-[11px] text-slate-400 font-medium">Estimated Queue Wait</div>
                      <div className="text-lg font-black text-emerald-600">~15 Minutes</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Counter is actively serving patients</div>
                    </div>

                    <div className="mt-3 flex items-center gap-2">
                      <button
                        onClick={() => alert(`Showing OPD slip for ${token.tokenNumber}. You may present this at the counter.`)}
                        className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                      >
                        View Slip
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Do you want to cancel this OPD token?')) {
                            setTokens(prev => prev.filter(t => t.id !== token.id));
                          }
                        }}
                        className="px-3.5 py-1.5 rounded-xl text-rose-600 hover:bg-rose-50 font-bold text-xs transition-colors cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {tokens.length === 0 && (
                <div className="bg-white rounded-3xl p-12 text-center border border-slate-200">
                  <Ticket className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                  <h3 className="text-base font-bold text-slate-800">No Active OPD Tokens</h3>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                    You have not booked any OPD tokens yet. Search hospitals and book a priority slot in seconds.
                  </p>
                  <button
                    onClick={() => setActiveTab('find-hospital')}
                    className="mt-4 px-6 py-2.5 rounded-full bg-[#1A56DB] text-white text-xs font-bold"
                  >
                    Find a Hospital Now
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* -------------------------------------------------------- */}
        {/* TAB 3: EMERGENCY SOS DIRECTORY                           */}
        {/* -------------------------------------------------------- */}
        {activeTab === 'emergency-sos' && (
          <div className="space-y-6">
            <div className="bg-red-50 border-2 border-red-200 rounded-3xl p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-2">
                <Ambulance className="w-8 h-8 text-red-600 animate-bounce" />
                <h2 className="text-2xl font-black text-red-700">
                  Tamil Nadu Emergency Response Directory
                </h2>
              </div>
              <p className="text-xs sm:text-sm text-red-900/80 leading-relaxed max-w-2xl">
                Immediate 24x7 hotlines for critical medical emergencies, ambulance dispatch, trauma transfers, and disaster control.
              </p>

              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

                {/* 108 Ambulance */}
                <div className="bg-white rounded-2xl p-5 border border-red-200 shadow-xs flex flex-col justify-between">
                  <div>
                    <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-black uppercase">
                      Toll Free 24x7
                    </span>
                    <h3 className="text-xl font-black text-slate-900 mt-2">108 Ambulance</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Emergency medical technicians & advance life support dispatch.
                    </p>
                  </div>
                  <a
                    href="tel:108"
                    className="mt-4 w-full py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs text-center flex items-center justify-center gap-2 shadow-xs"
                  >
                    <PhoneCall className="w-4 h-4" />
                    <span>Dial 108 Instantly</span>
                  </a>
                </div>

                {/* 104 Health Advice */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
                  <div>
                    <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-black uppercase">
                      Medical Helpline
                    </span>
                    <h3 className="text-xl font-black text-slate-900 mt-2">104 Health Advice</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      24/7 Physician advice, blood availability & hospital bed guidance.
                    </p>
                  </div>
                  <a
                    href="tel:104"
                    className="mt-4 w-full py-2.5 rounded-xl bg-[#1A56DB] hover:bg-blue-700 text-white font-extrabold text-xs text-center flex items-center justify-center gap-2 shadow-xs"
                  >
                    <PhoneCall className="w-4 h-4" />
                    <span>Dial 104 Helpline</span>
                  </a>
                </div>

                {/* State Disaster Trauma Desk */}
                <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col justify-between">
                  <div>
                    <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-black uppercase">
                      State Trauma Desk
                    </span>
                    <h3 className="text-xl font-black text-slate-900 mt-2">044-25305112</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Rajiv Gandhi Central Trauma & ICU critical triage direct line.
                    </p>
                  </div>
                  <a
                    href="tel:04425305112"
                    className="mt-4 w-full py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white font-extrabold text-xs text-center flex items-center justify-center gap-2 shadow-xs"
                  >
                    <PhoneCall className="w-4 h-4" />
                    <span>Call Trauma Desk</span>
                  </a>
                </div>

              </div>
            </div>
          </div>
        )}

      </main>

      {/* ======================================================== */}
      {/* 3B. MODAL: VIEW HOSPITAL DETAILS & FACILITY DOSSIER       */}
      {/* ======================================================== */}
      {isViewModalOpen && selectedHospitalForView && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-slate-800 animate-in zoom-in-95 duration-150 max-h-[90vh] flex flex-col">

            {/* Modal Header */}
            <div className="p-6 bg-linear-to-r from-blue-900 via-blue-800 to-indigo-900 text-white flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-white/20 backdrop-blur-md text-blue-200 border border-white/20">
                    {selectedHospitalForView.categoryLabel || selectedHospitalForView.type || 'Government Medical Facility'}
                  </span>
                  <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-300">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Verified Operational</span>
                  </div>
                </div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                  {selectedHospitalForView.name}
                </h2>
                <div className="flex items-center gap-2 text-xs text-blue-200/90 mt-1 font-medium">
                  <MapPin className="w-3.5 h-3.5 shrink-0 text-cyan-300" />
                  <span>{selectedHospitalForView.location} &middot; {selectedHospitalForView.districtName}</span>
                </div>
              </div>

              <button
                onClick={() => setIsViewModalOpen(false)}
                className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6">

              {/* Telemetry Matrix Grid */}
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2.5">
                  Live Operational Readiness Telemetry
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-center">
                    <div className="text-[10px] font-bold text-emerald-800 uppercase">ICU Beds</div>
                    <div className="text-xl font-black text-emerald-700 mt-0.5">
                      {selectedHospitalForView.icuAvailable || 0} Ready
                    </div>
                    <div className="text-[10px] text-emerald-600 mt-0.5">Critical care bays</div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-blue-50 border border-blue-200/80 text-center">
                    <div className="text-[10px] font-bold text-blue-800 uppercase">General Beds</div>
                    <div className="text-xl font-black text-[#1A56DB] mt-0.5">
                      {selectedHospitalForView.readyBeds || 0} Ready
                    </div>
                    <div className="text-[10px] text-blue-600 mt-0.5">Of {selectedHospitalForView.totalBeds || 120} Total</div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-cyan-50 border border-cyan-200/80 text-center">
                    <div className="text-[10px] font-bold text-cyan-800 uppercase">Ventilators</div>
                    <div className="text-xl font-black text-cyan-700 mt-0.5">
                      {selectedHospitalForView.ventilatorsAvailable || 0} Units
                    </div>
                    <div className="text-[10px] text-cyan-600 mt-0.5">Calibrated & ready</div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200/80 text-center">
                    <div className="text-[10px] font-bold text-rose-800 uppercase">Emergency</div>
                    <div className="text-xl font-black text-rose-600 mt-0.5">
                      24/7 Open
                    </div>
                    <div className="text-[10px] text-rose-500 mt-0.5">Zero triage wait</div>
                  </div>
                </div>
              </div>

              {/* Direct Emergency Contacts */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200">
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-3 flex items-center gap-1.5">
                  <PhoneCall className="w-3.5 h-3.5 text-rose-600" />
                  <span>Hospital Contact & Helplines</span>
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-slate-400 font-semibold">24x7 Emergency Desk</div>
                      <div className="text-sm font-bold text-rose-600 mt-0.5">
                        {selectedHospitalForView.emergencyContact || '044-25305112'}
                      </div>
                    </div>
                    <a
                      href={`tel:${selectedHospitalForView.emergencyContact || '04425305112'}`}
                      className="px-3 py-1.5 rounded-lg bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 transition-colors shadow-2xs"
                    >
                      Call Now
                    </a>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <div className="text-[10px] text-slate-400 font-semibold">Hospital Front Desk</div>
                      <div className="text-sm font-bold text-slate-800 mt-0.5">
                        {selectedHospitalForView.phone || '+91 44 2530 5000'}
                      </div>
                    </div>
                    <a
                      href={`tel:${selectedHospitalForView.phone || '04425305000'}`}
                      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
                    >
                      Call Desk
                    </a>
                  </div>
                </div>
              </div>

              {/* Available Clinical Departments */}
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1.5">
                  <Stethoscope className="w-3.5 h-3.5 text-[#1A56DB]" />
                  <span>Available Clinical Specialties & Departments</span>
                </h3>
                <div className="flex flex-wrap gap-2">
                  {(selectedHospitalForView.availableDepartments && selectedHospitalForView.availableDepartments.length > 0
                    ? selectedHospitalForView.availableDepartments
                    : ['Critical Care ICU', 'Cardiology', 'Trauma & Emergency', 'Pulmonology', 'Nephrology', 'Pediatrics', 'Neurology', 'Orthopaedics', 'General Medicine']
                  ).map((dept, i) => (
                    <span
                      key={i}
                      className="px-3 py-1.5 rounded-xl bg-blue-50/70 text-[#1A56DB] text-xs font-bold border border-blue-100 flex items-center gap-1.5"
                    >
                      <CheckCircle2 className="w-3 h-3 text-[#1A56DB]" />
                      <span>{dept}</span>
                    </span>
                  ))}
                </div>
              </div>

              {/* Patient Amenities & Protocol */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 space-y-2">
                <div className="font-bold text-slate-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  <span>Facility Certification & Amenities</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] pt-1">
                  <div className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>NABH & State Health Network Affiliated</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>108 Ambulance Direct Docking Bay</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>24x7 In-House Blood Bank & Pathology</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Digital OPD Queue & Token Counters</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between gap-3">
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="px-5 py-2.5 rounded-xl border border-slate-300 text-slate-700 font-bold text-xs hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Close
              </button>

              <div className="flex items-center gap-2">
                <a
                  href={`tel:${selectedHospitalForView.emergencyContact || selectedHospitalForView.phone}`}
                  className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors shadow-2xs"
                >
                  <PhoneCall className="w-3.5 h-3.5" />
                  <span>Emergency Call</span>
                </a>
                <button
                  onClick={() => {
                    setIsViewModalOpen(false);
                    setViewingHospital(selectedHospitalForView);
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="px-5 py-2.5 rounded-xl bg-[#1A56DB] hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-2 shadow-md transition-all cursor-pointer"
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>Open Hospital Portal</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 4. MODAL: BOOK OPD TOKEN / CONSULTATION                  */}
      {/* ======================================================== */}
      {isBookingModalOpen && selectedHospitalForBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden text-slate-800 animate-in zoom-in-95 duration-150 p-6 sm:p-8 max-h-[90vh] overflow-y-auto">

            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#1A56DB]">
                  OPD Registration & Token
                </span>
                <h2 className="text-lg font-bold text-slate-900">
                  Book Priority Consultation
                </h2>
              </div>
              <button
                onClick={() => setIsBookingModalOpen(false)}
                className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGenerateToken} className="mt-4 space-y-4">

              {/* Selected Hospital Display */}
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-2xl flex items-start gap-3">
                <Building2 className="w-5 h-5 text-[#1A56DB] shrink-0 mt-0.5" />
                <div>
                  <div className="text-xs font-bold text-slate-900">{selectedHospitalForBooking.name}</div>
                  <div className="text-[11px] text-slate-500">{selectedHospitalForBooking.location} &middot; {selectedHospitalForBooking.districtName}</div>
                </div>
              </div>

              {/* Patient Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Patient Name
                  </label>
                  <input
                    type="text"
                    readOnly
                    value={user?.name || 'Karthik Subramanian'}
                    className="w-full text-xs px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl font-semibold text-slate-700 outline-hidden"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Mobile Number *
                  </label>
                  <input
                    type="tel"
                    required
                    value={patientMobile}
                    onChange={(e) => setPatientMobile(e.target.value)}
                    placeholder="+91 98401 22345"
                    className="w-full text-xs px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl font-medium text-slate-800 outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* Department Select */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Select Department / Clinical Bay *
                </label>
                <select
                  value={selectedDepartment}
                  onChange={(e) => setSelectedDepartment(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl font-semibold text-slate-800 outline-hidden focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Cardiology OPD">Cardiology OPD (Heart & Vascular)</option>
                  <option value="General Medicine OPD">General Medicine (Physician Clinic)</option>
                  <option value="Emergency & Trauma Bay">Emergency & Trauma Bay (Priority)</option>
                  <option value="Pulmonology OPD">Pulmonology OPD (Chest & Respiratory)</option>
                  <option value="Orthopaedics OPD">Orthopaedics OPD (Bone & Joints)</option>
                  <option value="Neurology OPD">Neurology OPD (Neuro & Spine)</option>
                  <option value="Pediatrics OPD">Pediatrics OPD (Child Care)</option>
                </select>
              </div>

              {/* Date & Time Slot */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Date of Visit *
                  </label>
                  <input
                    type="date"
                    required
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl font-semibold text-slate-800 outline-hidden focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Preferred Time Slot *
                  </label>
                  <select
                    value={selectedTimeSlot}
                    onChange={(e) => setSelectedTimeSlot(e.target.value)}
                    className="w-full text-xs px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl font-semibold text-slate-800 outline-hidden focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="09:00 AM - 10:30 AM">Morning: 09:00 AM - 10:30 AM</option>
                    <option value="10:30 AM - 12:00 PM">Morning: 10:30 AM - 12:00 PM</option>
                    <option value="02:00 PM - 03:30 PM">Afternoon: 02:00 PM - 03:30 PM</option>
                    <option value="03:30 PM - 05:00 PM">Afternoon: 03:30 PM - 05:00 PM</option>
                  </select>
                </div>
              </div>

              {/* Chief Complaint */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Reason for Visit / Symptoms
                </label>
                <textarea
                  rows={2}
                  value={chiefComplaint}
                  onChange={(e) => setChiefComplaint(e.target.value)}
                  placeholder="Describe your health symptoms or consultation requirement..."
                  className="w-full text-xs px-3.5 py-2 bg-white border border-slate-300 rounded-xl font-medium text-slate-800 outline-hidden focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsBookingModalOpen(false)}
                  className="flex-1 py-3 px-4 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 px-4 rounded-xl bg-[#1A56DB] hover:bg-blue-700 text-white font-bold text-xs shadow-md hover:shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2"
                >
                  <Ticket className="w-4 h-4" />
                  <span>Generate OPD Token</span>
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. MODAL: TOKEN CONFIRMATION TICKET POPUP               */}
      {/* ======================================================== */}
      {newlyGeneratedToken && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden text-center p-6 sm:p-8 relative animate-in zoom-in-95 duration-150">

            {/* Green Tick Badge */}
            <div className="w-16 h-16 rounded-full bg-[#00C853] text-white flex items-center justify-center mx-auto mb-4 shadow-lg shadow-emerald-500/20">
              <Check className="w-9 h-9 stroke-[3]" />
            </div>

            <h2 className="text-xl font-black text-slate-900">
              OPD Token Generated!
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Your appointment is registered in MediSync hospital queue.
            </p>

            {/* Generated Ticket Card */}
            <div className="my-5 p-4 rounded-2xl bg-linear-to-br from-blue-50 to-indigo-50/50 border-2 border-dashed border-blue-200 text-left">
              <div className="flex items-center justify-between pb-3 border-b border-blue-100">
                <div>
                  <div className="text-[10px] text-blue-600 font-bold uppercase">Token Number</div>
                  <div className="text-xl font-black text-[#1A56DB]">{newlyGeneratedToken.tokenNumber}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-400 font-semibold">Reporting Counter</div>
                  <div className="text-xs font-bold text-slate-800">{newlyGeneratedToken.counterNumber}</div>
                </div>
              </div>

              <div className="pt-3 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Hospital:</span>
                  <span className="font-bold text-slate-800 text-right">{newlyGeneratedToken.hospitalName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Department:</span>
                  <span className="font-bold text-slate-800">{newlyGeneratedToken.department}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Scheduled:</span>
                  <span className="font-semibold text-slate-700">{newlyGeneratedToken.date} &middot; {newlyGeneratedToken.timeSlot}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setNewlyGeneratedToken(null);
                  setActiveTab('my-appointments');
                }}
                className="w-full py-3 rounded-full bg-[#1A56DB] hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
              >
                View in My Tokens
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
