export interface RegisteredHospitalRecord {
  id: string;
  hospitalName: string;
  hospitalType: string;
  registrationNumber: string;
  ownership: 'Government' | 'Private' | 'Trust' | string;
  category: 'General' | 'Multispeciality' | 'Super speciality' | string;
  yearEstablished: string;
  hospitalLogo?: string | null;
  description: string;
  website?: string;
  districtId: string;
  districtName: string;
  hospitalAddress: string;
  areaLocality: string;
  pincode: string;
  hospitalPhone: string;
  hospitalEmail: string;
  emergencyContact: string;
  status: 'Verified' | 'Pending' | 'Flagged' | string;
  totalBeds?: number;
  icuBeds?: number;
  createdAt: string;
}
