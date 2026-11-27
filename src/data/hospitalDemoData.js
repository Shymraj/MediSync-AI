// Centralized Demo Data for MediSync AI Hospital Admin Dashboard
// Step 1: Hospital Overview Only (Realistic Synthetic Data)

export const HOSPITAL_DEMO_DATA = {
  // Hospital Information Header (Requirement 3)
  hospitalInfo: {
    name: 'Rajiv Gandhi Government General Hospital (RGGGH)',
    shortName: 'RGGGH Chennai',
    category: 'Government Super Speciality Hospital',
    registrationId: 'TN-MED-REG-2026-8941',
    location: 'Park Town, Chennai – 600003',
    address: 'EVR Periyar Salai, Park Town, Chennai, Tamil Nadu 600003',
    established: 1664,
    emergencyContact: '044-25305112',
    verificationStatus: 'Verified Institutional Facility',
    isVerified: true,
    demoNotice: 'Synthetic demo content for MediSync AI prototype',
    affiliation: 'Madras Medical College (MMC) & Govt. of Tamil Nadu',
    district: 'Chennai',
    state: 'Tamil Nadu'
  },

  // Hospital KPI Cards (Requirement 4)
  kpis: [
    {
      id: 'total-beds',
      label: 'Total Bed Capacity',
      value: 250,
      supportingInfo: '48 Ready for Intake',
      iconName: 'Bed',
      statusVariant: 'primary',
      badgeText: 'Active Census',
      trend: '+12% intake capacity'
    },
    {
      id: 'critical-icu',
      label: 'Critical ICU Beds',
      value: 35,
      supportingInfo: '7 Immediate Bays Available',
      iconName: 'Activity',
      statusVariant: 'critical',
      badgeText: 'High Priority',
      trend: 'Telemetry live'
    },
    {
      id: 'ventilators',
      label: 'Mechanical Ventilators',
      value: 12,
      supportingInfo: '10 Calibrated & Online',
      iconName: 'Wind',
      statusVariant: 'success',
      badgeText: 'Calibrated',
      trend: 'Diagnostics passed'
    },
    {
      id: 'staff-duty',
      label: 'Staff on Duty',
      value: 60,
      supportingInfo: '18 Doctors · 42 Nurses',
      iconName: 'Users',
      statusVariant: 'secondary',
      badgeText: 'Shift Active',
      trend: 'Ward coverage 100%'
    }
  ],

  // Hospital Role Portals (Requirement 5)
  rolePortals: [
    {
      id: 'doctor-portal',
      title: 'Doctor Portal',
      role: 'doctor',
      description: 'Clinical workspace for emergency patient intake, assigned ward monitoring, and urgent ICU bed requests.',
      buttonText: 'Launch Doctor Portal',
      route: '/dashboard/doctor',
      iconName: 'Stethoscope',
      badge: 'Clinical Care',
      badgeVariant: 'success'
    },
    {
      id: 'nurse-portal',
      title: 'Nurse Portal',
      role: 'nurse',
      description: 'Ward operations for bed turnaround tracking, sanitization checklist, and shift handover.',
      buttonText: 'Launch Nurse Portal',
      route: '/dashboard/nurse',
      iconName: 'HeartHandshake',
      badge: 'Ward Operations',
      badgeVariant: 'warning'
    },
    {
      id: 'admin-portal',
      title: 'Hospital Admin Portal',
      role: 'admin',
      description: 'Hospital command center for bed control, staff verification, resource approval, and operational monitoring.',
      buttonText: 'Open Admin Command Center',
      route: '/dashboard/admin',
      iconName: 'Shield',
      badge: 'Command Center',
      badgeVariant: 'primary'
    }
  ],

  // Facility Information Section (Requirement 6)
  facilityInformation: [
    { label: 'Hospital Name', value: 'Rajiv Gandhi Government General Hospital (RGGGH)' },
    { label: 'Hospital Registration ID', value: 'TN-MED-REG-2026-8941', badge: 'Active Clearance', badgeVariant: 'success' },
    { label: 'Hospital Category', value: 'Government Super Speciality Hospital' },
    { label: 'Institutional Affiliation', value: 'Madras Medical College / National Health Mission' },
    { label: 'Hospital Location', value: 'Park Town, Chennai – 600003, Tamil Nadu' },
    { label: 'Year Established', value: '1664 (Pioneer Healthcare Institution)' },
    { label: 'Emergency Contact Number', value: '044-25305112 (24x7 Institutional Command)' },
    { label: 'Verification Status', value: 'Verified Institutional Facility', badge: 'Verified Facility', badgeVariant: 'success' },
    { label: 'Prototype Notice', value: 'Synthetic demo content for MediSync AI prototype', badge: 'Demo Environment', badgeVariant: 'secondary' }
  ]
};

export default HOSPITAL_DEMO_DATA;
