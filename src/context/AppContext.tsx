import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { api, setAuthToken } from '../services/api';
import { 
  UserProfile, 
  UserRole, 
  TemporaryOnboardingState,
  HospitalRegistrationDetails,
  HospitalLocationContactDetails,
  HospitalBed, 
  Equipment, 
  ResourceRequest, 
  PatientAppointment, 
  NotificationItem, 
  BedStatus,
  Hospital,
  District
} from '../types';

interface AppContextType {
  user: UserProfile | null;
  // Temporary In-Memory Onboarding State
  tempOnboarding: TemporaryOnboardingState;
  resetTempOnboarding: () => void;
  updateTempProfile: (name: string, username: string) => Promise<void>;
  updateHospitalRegistrationDetails: (details: Partial<HospitalRegistrationDetails>) => void;
  updateHospitalLocationContact: (details: Partial<HospitalLocationContactDetails>) => void;
  updateTempDistrict: (districtId: string, districtName: string) => void;
  updateTempHospital: (hospitalId: string, hospitalName: string) => void;
  updateTempRole: (role: UserRole) => void;
  clearTempRole: () => void;
  clearTempHospital: () => void;
  clearTempDistrict: () => void;
  // Finalizing Onboarding via Backend API
  completeVerificationApproval: (targetRole?: UserRole) => Promise<void>;
  simulateAdminDecision: (decision: 'approved' | 'rejected', reason?: string) => Promise<void>;
  requestRoleApproval: () => Promise<void>;
  // Global hospital resources & session
  selectedHospitalId: string;
  districts: District[];
  hospitals: Hospital[];
  beds: HospitalBed[];
  equipment: Equipment[];
  resourceRequests: ResourceRequest[];
  appointments: PatientAppointment[];
  notifications: NotificationItem[];
  loginWithGoogle: (email?: string, name?: string, portal?: 'hospital' | 'patient') => Promise<UserProfile>;
  logout: () => void;
  setUser: React.Dispatch<React.SetStateAction<UserProfile | null>>;
  // Resource lifecycle interactions
  updateBedStatus: (bedId: string, newStatus: BedStatus, notes?: string) => Promise<void>;
  createResourceRequest: (req: Omit<ResourceRequest, 'id' | 'createdAt' | 'status' | 'hospitalId'>) => Promise<void>;
  updateRequestStatus: (requestId: string, status: ResourceRequest['status'], allocatedId?: string) => Promise<void>;
  bookAppointment: (department: string, doctorName: string, date: string, time: string) => Promise<void>;
  markNotificationAsRead: (id: string) => void;
  resetDemoToScenario: () => void;
}

const STORAGE_KEY_USER = 'medisync_authenticated_account_v2';

const initialEmptyOnboarding: TemporaryOnboardingState = {
  name: '',
  username: '',
  districtId: '',
  districtName: '',
  hospitalId: '',
  hospitalName: '',
  role: null,
};

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_USER);
      if (saved) return JSON.parse(saved);
    } catch {}
    return null;
  });

  const [tempOnboarding, setTempOnboarding] = useState<TemporaryOnboardingState>(() => ({
    ...initialEmptyOnboarding,
    name: user?.name || '',
    username: user?.username || '',
  }));

  const [districts, setDistricts] = useState<District[]>([]);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [beds, setBeds] = useState<HospitalBed[]>([]);
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [resourceRequests, setResourceRequests] = useState<ResourceRequest[]>([]);
  const [appointments, setAppointments] = useState<PatientAppointment[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const selectedHospitalId = user?.hospitalId || tempOnboarding.hospitalId || 'hosp-chn-01';
  const socketRef = useRef<any>(null);

  // Sync session
  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY_USER);
      setAuthToken(null);
    }
  }, [user]);

  // Initial fetch of districts & hospitals from backend
  useEffect(() => {
    async function fetchMetadata() {
      try {
        const d = await api.getDistricts();
        if (d) setDistricts(d);

        const h = await api.getHospitals();
        if (h) setHospitals(h);
      } catch (err) {
        console.warn('Backend connecting...', err);
      }
    }
    fetchMetadata();
  }, []);

  // Fetch live dashboard data from Backend whenever user logs in or switches hospital
  const fetchDashboardData = async () => {
    if (!selectedHospitalId) return;
    try {
      const data = await api.getHospitalDashboard(selectedHospitalId);
      if (data) {
        if (data.beds) setBeds(data.beds);
        if (data.equipment) setEquipment(data.equipment);
        if (data.requests) setResourceRequests(data.requests);
        if (data.appointments) setAppointments(data.appointments);
        if (data.notifications) setNotifications(data.notifications);
      }
    } catch (err) {
      console.warn('Dashboard fetch error:', err);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [selectedHospitalId, user?.role, user?.isOnboarded]);

  // Connect Socket.IO Realtime synchronization
  useEffect(() => {
    if (!selectedHospitalId) return;

    socketRef.current = io('http://localhost:5000');
    socketRef.current.emit('join_hospital', selectedHospitalId);

    socketRef.current.on('bed_updated', (payload: any) => {
      setBeds(prev => prev.map(b => b.id === payload.bedId ? { ...b, status: payload.newStatus, lastUpdated: payload.lastUpdated, notes: payload.notes } : b));
      if (payload.notification) {
        setNotifications(prev => [payload.notification, ...prev]);
      }
    });

    socketRef.current.on('request_created', (payload: any) => {
      if (payload.request) {
        setResourceRequests(prev => [payload.request, ...prev]);
      }
      if (payload.notification) {
        setNotifications(prev => [payload.notification, ...prev]);
      }
    });

    socketRef.current.on('request_updated', (payload: any) => {
      setResourceRequests(prev => prev.map(r => r.id === payload.requestId ? { ...r, status: payload.status, allocatedResourceId: payload.allocatedResourceId } : r));
      if (payload.notification) {
        setNotifications(prev => [payload.notification, ...prev]);
      }
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [selectedHospitalId]);

  // Temporary Onboarding Handlers
  const resetTempOnboarding = () => {
    setTempOnboarding({
      ...initialEmptyOnboarding,
      name: user?.name || '',
      username: user?.username || '',
    });
  };

  const updateTempProfile = async (name: string, username: string) => {
    setTempOnboarding(prev => ({ ...prev, name, username }));
    if (user) {
      try {
        const res = await api.updateProfile(name, username);
        if (res && res.user) {
          setUser(prev => prev ? { ...prev, name, username } : null);
        }
      } catch (err) {
        console.warn('API updateProfile error:', err);
      }
    }
  };

  const updateTempDistrict = (districtId: string, districtName: string) => {
    setTempOnboarding(prev => ({ ...prev, districtId, districtName }));
  };

  const updateHospitalRegistrationDetails = (details: Partial<HospitalRegistrationDetails>) => {
    setTempOnboarding(prev => ({
      ...prev,
      hospitalName: details.hospitalName !== undefined ? details.hospitalName : prev.hospitalName,
      hospitalType: details.hospitalType !== undefined ? details.hospitalType : prev.hospitalType,
      registrationNumber: details.registrationNumber !== undefined ? details.registrationNumber : prev.registrationNumber,
      ownership: details.ownership !== undefined ? details.ownership : prev.ownership,
      category: details.category !== undefined ? details.category : prev.category,
      yearEstablished: details.yearEstablished !== undefined ? details.yearEstablished : prev.yearEstablished,
      hospitalLogo: details.hospitalLogo !== undefined ? details.hospitalLogo : prev.hospitalLogo,
      hospitalDescription: details.description !== undefined ? details.description : prev.hospitalDescription,
      website: details.website !== undefined ? details.website : prev.website,
    }));
  };

  const updateHospitalLocationContact = (details: Partial<HospitalLocationContactDetails>) => {
    setTempOnboarding(prev => ({
      ...prev,
      hospitalAddress: details.hospitalAddress !== undefined ? details.hospitalAddress : prev.hospitalAddress,
      areaLocality: details.areaLocality !== undefined ? details.areaLocality : prev.areaLocality,
      pincode: details.pincode !== undefined ? details.pincode : prev.pincode,
      hospitalPhone: details.hospitalPhone !== undefined ? details.hospitalPhone : prev.hospitalPhone,
      hospitalEmail: details.hospitalEmail !== undefined ? details.hospitalEmail : prev.hospitalEmail,
      emergencyContact: details.emergencyContact !== undefined ? details.emergencyContact : prev.emergencyContact,
    }));
  };

  const updateTempHospital = (hospitalId: string, hospitalName: string) => {
    setTempOnboarding(prev => ({ ...prev, hospitalId, hospitalName }));
  };

  const updateTempRole = (role: UserRole) => {
    setTempOnboarding(prev => ({
      ...prev,
      role,
      requestedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }));
  };

  const clearTempRole = () => setTempOnboarding(prev => ({ ...prev, role: null }));
  const clearTempHospital = () => setTempOnboarding(prev => ({ ...prev, hospitalId: '', hospitalName: '', role: null }));
  const clearTempDistrict = () => setTempOnboarding(prev => ({ ...prev, districtId: '', districtName: '', hospitalId: '', hospitalName: '', role: null }));

  // Google Login backed by backend verification
  const loginWithGoogle = async (customEmail?: string, customName?: string, portal?: 'hospital' | 'patient'): Promise<UserProfile> => {
    const isPatient = portal === 'patient' || customEmail === 'karthik.subramanian@gmail.com';
    const email = customEmail || (isPatient ? 'karthik.subramanian@gmail.com' : 'dr.sundar@medisync.gov.in');
    const name = customName || (isPatient ? 'Karthik Subramanian' : 'Dr. Sundaramoorthy M.');

    try {
      const res = await api.loginWithGoogle(email, name, undefined, portal);
      if (res && res.token && res.user) {
        setAuthToken(res.token);
        setUser(res.user);
        resetTempOnboarding();
        return res.user;
      }
    } catch (err) {
      console.warn('Backend login fallback:', err);
    }

    // Baseline fallback
    const fallbackUser: UserProfile = {
      id: 'usr_' + Date.now(),
      name,
      username: email.split('@')[0],
      email,
      avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=2563a6&textColor=ffffff`,
      role: isPatient ? 'patient' : undefined,
      hospitalId: isPatient ? 'hosp-chn-01' : undefined,
      hospitalName: isPatient ? 'Rajiv Gandhi Government General Hospital (RGGGH)' : undefined,
      districtId: isPatient ? 'chennai' : undefined,
      districtName: isPatient ? 'Chennai' : undefined,
      roleVerificationStatus: isPatient ? 'approved' : 'none',
      isOnboarded: isPatient ? true : false
    };
    setUser(fallbackUser);
    return fallbackUser;
  };

  const logout = () => {
    setUser(null);
    setAuthToken(null);
    resetTempOnboarding();
    localStorage.removeItem(STORAGE_KEY_USER);
  };

  // Complete Role Verification via Backend API
  const completeVerificationApproval = async (targetRole?: UserRole) => {
    if (!user) return;
    const finalRole: UserRole = targetRole || tempOnboarding.role || user.role || 'admin';
    const finalDistrictId = tempOnboarding.districtId || user.districtId || 'chennai';
    const finalDistrictName = tempOnboarding.districtName || user.districtName || 'Chennai';
    const finalHospitalId = tempOnboarding.hospitalId || user.hospitalId || 'hosp-chn-01';
    const finalHospitalName = tempOnboarding.hospitalName || user.hospitalName || 'Rajiv Gandhi Government General Hospital';

    // Synchronously commit to local state & storage first to eliminate navigation race conditions
    const updatedUser: UserProfile = {
      ...user,
      districtId: finalDistrictId,
      districtName: finalDistrictName,
      hospitalId: finalHospitalId,
      hospitalName: finalHospitalName,
      role: finalRole,
      roleVerificationStatus: 'approved',
      isOnboarded: true
    };
    setUser(updatedUser);
    localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(updatedUser));

    try {
      const res = await api.requestRole(finalDistrictId, finalHospitalId, finalRole);
      if (res && res.user) {
        if (res.token) setAuthToken(res.token);
        if (finalRole !== 'patient') {
          await api.verifyStaffDecision(res.user.id, 'approved');
        }
        setUser({
          ...res.user,
          districtName: finalDistrictName,
          hospitalName: finalHospitalName,
          role: finalRole,
          roleVerificationStatus: 'approved',
          isOnboarded: true
        });
      }
    } catch (err) {
      console.warn('API completeVerificationApproval error:', err);
    }
    fetchDashboardData();
  };

  const simulateAdminDecision = async (decision: 'approved' | 'rejected', reason?: string) => {
    if (!user) return;
    if (decision === 'approved') {
      await completeVerificationApproval();
    } else {
      try {
        await api.verifyStaffDecision(user.id, 'rejected', reason);
      } catch {}
      const updatedUser: UserProfile = {
        ...user,
        roleVerificationStatus: 'rejected',
        rejectionReason: reason || 'Medical credentials could not be established',
        isOnboarded: false
      };
      setUser(updatedUser);
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(updatedUser));
    }
  };

  const requestRoleApproval = async () => {
    if (!user) return;
    try {
      const res = await api.requestRole(
        tempOnboarding.districtId || 'chennai',
        tempOnboarding.hospitalId || 'hosp-chn-01',
        tempOnboarding.role || 'doctor'
      );
      if (res && res.user) {
        setUser(res.user);
      }
    } catch {}
  };

  // Live Resource Updates via REST API & Socket.IO
  const updateBedStatus = async (bedId: string, newStatus: BedStatus, notes?: string) => {
    try {
      await api.updateBedStatus(bedId, newStatus, notes);
    } catch (err) {
      console.warn('API updateBedStatus error:', err);
    }
  };

  const createResourceRequest = async (req: Omit<ResourceRequest, 'id' | 'createdAt' | 'status' | 'hospitalId'>) => {
    try {
      await api.createRequest({
        ...req,
        hospitalId: selectedHospitalId
      });
    } catch (err) {
      console.warn('API createResourceRequest error:', err);
    }
  };

  const updateRequestStatus = async (requestId: string, status: ResourceRequest['status'], allocatedId?: string) => {
    try {
      await api.updateRequestStatus(requestId, status, allocatedId);
    } catch (err) {
      console.warn('API updateRequestStatus error:', err);
    }
  };

  const bookAppointment = async (department: string, doctorName: string, date: string, time: string) => {
    try {
      const res = await api.bookAppointment({
        hospitalId: selectedHospitalId,
        department,
        doctorName,
        date,
        time
      });
      if (res && res.appointment) {
        setAppointments(prev => [res.appointment, ...prev]);
      }
    } catch (err) {
      console.warn('API bookAppointment error:', err);
    }
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const resetDemoToScenario = () => {
    fetchDashboardData();
  };

  return (
    <AppContext.Provider
      value={{
        user,
        tempOnboarding,
        resetTempOnboarding,
        updateTempProfile,
        updateHospitalRegistrationDetails,
        updateHospitalLocationContact,
        updateTempDistrict,
        updateTempHospital,
        updateTempRole,
        clearTempRole,
        clearTempHospital,
        clearTempDistrict,
        completeVerificationApproval,
        simulateAdminDecision,
        requestRoleApproval,
        selectedHospitalId,
        districts,
        hospitals,
        beds,
        equipment,
        resourceRequests,
        appointments,
        notifications,
        loginWithGoogle,
        logout,
        setUser,
        updateBedStatus,
        createResourceRequest,
        updateRequestStatus,
        bookAppointment,
        markNotificationAsRead,
        resetDemoToScenario,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
