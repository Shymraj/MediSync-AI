import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  UserProfile, 
  UserRole, 
  TemporaryOnboardingState,
  HospitalBed, 
  Equipment, 
  ResourceRequest, 
  PatientAppointment, 
  NotificationItem, 
  BedStatus 
} from '../types';
import { 
  INITIAL_BEDS, 
  INITIAL_EQUIPMENT, 
  INITIAL_RESOURCE_REQUESTS, 
  INITIAL_APPOINTMENTS, 
  INITIAL_NOTIFICATIONS 
} from '../data/mockData';

interface AppContextType {
  user: UserProfile | null;
  // Temporary In-Memory Onboarding State (RESET on page refresh or backward navigation)
  tempOnboarding: TemporaryOnboardingState;
  resetTempOnboarding: () => void;
  updateTempProfile: (name: string, username: string) => void;
  updateTempDistrict: (districtId: string, districtName: string) => void;
  updateTempHospital: (hospitalId: string, hospitalName: string) => void;
  updateTempRole: (role: UserRole) => void;
  clearTempRole: () => void;
  clearTempHospital: () => void;
  clearTempDistrict: () => void;
  // Finalizing Onboarding
  completeVerificationApproval: () => void;
  simulateAdminDecision: (decision: 'approved' | 'rejected', reason?: string) => void;
  requestRoleApproval: () => void;
  // Global hospital resources & session
  selectedHospitalId: string;
  beds: HospitalBed[];
  equipment: Equipment[];
  resourceRequests: ResourceRequest[];
  appointments: PatientAppointment[];
  notifications: NotificationItem[];
  loginWithGoogle: (email?: string, name?: string) => Promise<UserProfile>;
  logout: () => void;
  setUser: React.Dispatch<React.SetStateAction<UserProfile | null>>;
  // Resource lifecycle interactions
  updateBedStatus: (bedId: string, newStatus: BedStatus, notes?: string) => void;
  createResourceRequest: (req: Omit<ResourceRequest, 'id' | 'createdAt' | 'status' | 'hospitalId'>) => void;
  updateRequestStatus: (requestId: string, status: ResourceRequest['status'], allocatedId?: string) => void;
  updateEquipmentStatus: (equipmentId: string, status: Equipment['status']) => void;
  bookAppointment: (department: string, doctorName: string, date: string, time: string) => void;
  markNotificationAsRead: (id: string) => void;
  resetDemoToScenario: () => void;
}

const STORAGE_KEY_USER = 'medisync_authenticated_account_v2';
const STORAGE_KEY_BEDS = 'medisync_enterprise_beds_v2';
const STORAGE_KEY_REQUESTS = 'medisync_enterprise_requests_v2';
const STORAGE_KEY_NOTIFS = 'medisync_enterprise_notifs_v2';

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
  // Only persist fully completed user profiles or registered Google accounts
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      // Clear out any old legacy keys that contained broken onboarding steps
      localStorage.removeItem('medisync_enterprise_user_v1');
      const saved = localStorage.getItem(STORAGE_KEY_USER);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Only keep if valid account object
        if (parsed && parsed.email) {
          return parsed;
        }
      }
    } catch {
      // fallback
    }
    return null;
  });

  // Temporary In-Memory Onboarding State (NEVER persisted to localStorage!)
  // Refreshes naturally reset this state to empty.
  const [tempOnboarding, setTempOnboarding] = useState<TemporaryOnboardingState>(() => ({
    ...initialEmptyOnboarding,
    name: user?.name || '',
    username: user?.username || '',
  }));

  const resetTempOnboarding = () => {
    setTempOnboarding({
      ...initialEmptyOnboarding,
      name: user?.name || '',
      username: user?.username || '',
    });
  };

  const updateTempProfile = (name: string, username: string) => {
    setTempOnboarding(prev => ({
      ...prev,
      name,
      username
    }));
  };

  const updateTempDistrict = (districtId: string, districtName: string) => {
    setTempOnboarding(prev => ({
      ...prev,
      districtId,
      districtName
    }));
  };

  const updateTempHospital = (hospitalId: string, hospitalName: string) => {
    setTempOnboarding(prev => ({
      ...prev,
      hospitalId,
      hospitalName
    }));
  };

  const updateTempRole = (role: UserRole) => {
    setTempOnboarding(prev => ({
      ...prev,
      role,
      requestedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }));
  };

  const clearTempRole = () => {
    setTempOnboarding(prev => ({
      ...prev,
      role: null,
      requestedAt: undefined
    }));
  };

  const clearTempHospital = () => {
    setTempOnboarding(prev => ({
      ...prev,
      hospitalId: '',
      hospitalName: '',
      role: null,
      requestedAt: undefined
    }));
  };

  const clearTempDistrict = () => {
    setTempOnboarding(prev => ({
      ...prev,
      districtId: '',
      districtName: '',
      hospitalId: '',
      hospitalName: '',
      role: null,
      requestedAt: undefined
    }));
  };

  const selectedHospitalId = user?.hospitalId || tempOnboarding.hospitalId || 'hosp-chn-01';

  const [beds, setBeds] = useState<HospitalBed[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_BEDS);
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_BEDS;
  });

  const [equipment, setEquipment] = useState<Equipment[]>(INITIAL_EQUIPMENT);

  const [resourceRequests, setResourceRequests] = useState<ResourceRequest[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_REQUESTS);
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_RESOURCE_REQUESTS;
  });

  const [appointments, setAppointments] = useState<PatientAppointment[]>(INITIAL_APPOINTMENTS);

  const [notifications, setNotifications] = useState<NotificationItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_NOTIFS);
      if (saved) return JSON.parse(saved);
    } catch {}
    return INITIAL_NOTIFICATIONS;
  });

  // Only persist verified user profile
  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEY_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY_USER);
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_BEDS, JSON.stringify(beds));
  }, [beds]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_REQUESTS, JSON.stringify(resourceRequests));
  }, [resourceRequests]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY_NOTIFS, JSON.stringify(notifications));
  }, [notifications]);

  // Google OAuth sign-in
  const loginWithGoogle = async (customEmail?: string, customName?: string): Promise<UserProfile> => {
    const email = customEmail || 'dr.sundar@medisync.gov.in';
    const name = customName || 'Dr. Sundaramoorthy M.';
    const username = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '_');

    // Check if this account was previously onboarded and stored
    let existingAccount: UserProfile | null = null;
    try {
      const saved = localStorage.getItem(STORAGE_KEY_USER);
      if (saved) {
        const parsed: UserProfile = JSON.parse(saved);
        if (parsed.email === email && parsed.isOnboarded) {
          existingAccount = parsed;
        }
      }
    } catch {}

    if (existingAccount) {
      setUser(existingAccount);
      return existingAccount;
    }

    // New or uncompleted user: create baseline identity WITHOUT completed onboarding!
    const newUser: UserProfile = {
      id: 'usr_' + Math.random().toString(36).substring(2, 9),
      name,
      username,
      email,
      avatarUrl: `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(name)}&backgroundColor=2563a6&textColor=ffffff`,
      roleVerificationStatus: 'none',
      isOnboarded: false
    };

    setUser(newUser);
    // Reset any temporary onboarding selections for fresh start
    setTempOnboarding({
      ...initialEmptyOnboarding,
      name,
      username
    });

    return newUser;
  };

  const logout = () => {
    setUser(null);
    resetTempOnboarding();
    localStorage.removeItem(STORAGE_KEY_USER);
  };

  // Called when role verification is formally approved and onboarding is finalized
  const completeVerificationApproval = () => {
    if (!user) return;
    const completedUser: UserProfile = {
      ...user,
      name: tempOnboarding.name || user.name,
      username: tempOnboarding.username || user.username,
      districtId: tempOnboarding.districtId,
      districtName: tempOnboarding.districtName,
      hospitalId: tempOnboarding.hospitalId,
      hospitalName: tempOnboarding.hospitalName,
      role: tempOnboarding.role || user.role || 'doctor',
      roleVerificationStatus: 'approved',
      approvedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      isOnboarded: true
    };
    setUser(completedUser);
  };

  const simulateAdminDecision = (decision: 'approved' | 'rejected', reason?: string) => {
    if (!user) return;
    if (decision === 'approved') {
      completeVerificationApproval();
    } else {
      setUser({
        ...user,
        role: tempOnboarding.role || user.role,
        roleVerificationStatus: 'rejected',
        rejectionReason: reason || 'Medical council registration ID verification failed or hospital affiliation could not be established.',
        isOnboarded: false
      });
    }
  };

  const requestRoleApproval = () => {
    if (!user) return;
    setUser({
      ...user,
      role: tempOnboarding.role || user.role,
      roleVerificationStatus: 'pending',
      requestedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      rejectionReason: undefined,
      isOnboarded: false
    });
  };

  // Resource & bed updates
  const updateBedStatus = (bedId: string, newStatus: BedStatus, notes?: string) => {
    setBeds(prev => prev.map(b => b.id === bedId ? { ...b, status: newStatus, lastUpdated: 'Just now', notes: notes ?? b.notes } : b));
  };

  const createResourceRequest = (req: Omit<ResourceRequest, 'id' | 'createdAt' | 'status' | 'hospitalId'>) => {
    const currentHospId = user?.hospitalId || selectedHospitalId;
    const newReq: ResourceRequest = {
      ...req,
      id: 'req-' + Math.floor(100 + Math.random() * 900),
      hospitalId: currentHospId,
      status: 'pending',
      createdAt: 'Just now'
    };
    setResourceRequests(prev => [newReq, ...prev]);
  };

  const updateRequestStatus = (requestId: string, status: ResourceRequest['status'], allocatedId?: string) => {
    setResourceRequests(prev => prev.map(r => r.id === requestId ? { ...r, status, allocatedResourceId: allocatedId || r.allocatedResourceId, reviewedAt: 'Just now' } : r));
  };

  const updateEquipmentStatus = (equipmentId: string, status: Equipment['status']) => {
    setEquipment(prev => prev.map(eq => eq.id === equipmentId ? { ...eq, status, lastInspection: 'Just now' } : eq));
  };

  const bookAppointment = (department: string, doctorName: string, date: string, time: string) => {
    if (!user) return;
    const newApt: PatientAppointment = {
      id: 'apt-' + Math.floor(100 + Math.random() * 900),
      patientId: user.id,
      patientName: user.name,
      hospitalId: selectedHospitalId,
      hospitalName: user.hospitalName || 'Rajiv Gandhi Government General Hospital (RGGGH)',
      department,
      doctorName,
      date,
      time,
      tokenNumber: Math.floor(15 + Math.random() * 20),
      status: 'In Queue',
      queuePosition: 4,
      estimatedWaitMinutes: 30
    };
    setAppointments(prev => [newApt, ...prev]);
  };

  const markNotificationAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const resetDemoToScenario = () => {
    setBeds(INITIAL_BEDS);
    setEquipment(INITIAL_EQUIPMENT);
    setResourceRequests(INITIAL_RESOURCE_REQUESTS);
    setNotifications(INITIAL_NOTIFICATIONS);
    setAppointments(INITIAL_APPOINTMENTS);
  };

  return (
    <AppContext.Provider
      value={{
        user,
        tempOnboarding,
        resetTempOnboarding,
        updateTempProfile,
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
        updateEquipmentStatus,
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
