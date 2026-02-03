import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8000';

// Types
export interface Hospital {
  id: string;
  name: string;
  address: string;
  city: string;
  area: string;
  state?: string;
  pincode?: string;
  phone: string;
  email: string;
  departments: string[];
  rating: number;
  image_url?: string;
}

export interface OSMHospital {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  locality?: string;
  street?: string;
  city?: string;
  district?: string;
  state?: string;
  postcode?: string;
}

export interface Doctor {
  id: string;
  user_id: string;
  name: string;
  email: string;
  phone?: string;
  specialization: string;
  experience: number;
  hospital_id?: string;
  hospital_name?: string;
  rating: number;
  consultation_fee: number;
  available_days: string[];
  available_slots: string[];
  image_url?: string;
}

export interface Appointment {
  id: string;
  user_id: string;
  user_name: string;
  doctor_id: string;
  doctor_name: string;
  hospital_id?: string;
  hospital_name?: string;
  date: string;
  time_slot: string;
  type: 'in-person' | 'video';
  reason?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  suggested_date?: string;
  suggested_time?: string;
  doctor_note?: string;
  patient_complaint?: string;
  diagnosis?: string;
  prescription?: { name: string; dosage?: string; instructions?: string; days?: number }[];
  record_notes?: string;
  created_at: string;
  updated_at?: string;
}

// Disease Categories (static, for UI only)
export const DISEASE_CATEGORIES = [
  { id: '1', name: 'General', icon: 'medkit', specializations: ['General Physician'] },
  { id: '2', name: 'Heart', icon: 'heart', specializations: ['Cardiologist'] },
  { id: '3', name: 'Brain', icon: 'fitness', specializations: ['Neurologist'] },
  { id: '4', name: 'Bones', icon: 'body', specializations: ['Orthopedic'] },
  { id: '5', name: 'Skin', icon: 'hand-left', specializations: ['Dermatologist'] },
  { id: '6', name: 'Eyes', icon: 'eye', specializations: ['Ophthalmologist'] },
  { id: '7', name: 'Teeth', icon: 'happy', specializations: ['Dentist'] },
  { id: '8', name: 'Kids', icon: 'people', specializations: ['Pediatrician'] },
];

interface DataContextType {
  hospitals: Hospital[];
  osmHospitals: OSMHospital[];
  doctorHospitals: Record<string, OSMHospital[]>;
  hospitalDoctors: Record<string, Doctor[]>;
  doctors: Doctor[];
  appointments: Appointment[];
  isLoading: boolean;
  refreshData: () => Promise<void>;
  // Hospital actions
  getHospitals: () => Promise<void>;
  getHospitalById: (id: string) => Hospital | undefined;
  getOsmHospitals: () => Promise<void>;
  getDoctorHospitals: (doctorId: string) => Promise<OSMHospital[]>;
  saveDoctorHospitals: (doctorId: string, hospitalIds: string[]) => Promise<boolean>;
  getDoctorsForHospital: (hospitalId: string) => Promise<Doctor[]>;
  // Doctor actions
  getDoctors: (specialization?: string) => Promise<void>;
  getDoctorById: (id: string) => Doctor | undefined;
  // Appointment actions
  createAppointment: (data: Omit<Appointment, 'id' | 'created_at' | 'status'>) => Promise<Appointment | null>;
  getUserAppointments: (userId: string) => Promise<void>;
  getDoctorAppointments: (doctorId: string) => Promise<void>;
  updateAppointmentStatus: (id: string, status: string, suggestion?: { date?: string; time?: string; note?: string }) => Promise<boolean>;
  updateAppointmentRecord: (id: string, data: {
    doctor_id: string;
    patient_complaint?: string;
    diagnosis?: string;
    prescription?: { name: string; dosage?: string; instructions?: string; days?: number }[];
    record_notes?: string;
  }) => Promise<Appointment | null>;
  getPatientTimeline: (doctorId: string, patientId: string) => Promise<Appointment[]>;
  // Search
  searchDoctors: (query: string) => Doctor[];
  getDoctorsBySpecialization: (specializations: string[]) => Doctor[];
  updateDoctor: (id: string, data: Partial<Doctor>) => Promise<boolean>;
  createReminder: (data: {
    user_id: string;
    medicine_name: string;
    before_after: string;
    times: string[];
    start_date: string;
    end_date: string;
    tz_offset_minutes: number;
  }) => Promise<boolean>;
  getUserReminders: (userId: string) => Promise<any[]>;
  deleteReminder: (reminderId: string) => Promise<boolean>;
  toggleReminder: (reminderId: string, active: boolean) => Promise<boolean>;
}

export const COMMISSION_RATE = 0.1; // 10%

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [osmHospitals, setOsmHospitals] = useState<OSMHospital[]>([]);
  const [doctorHospitals, setDoctorHospitals] = useState<Record<string, OSMHospital[]>>({});
  const [hospitalDoctors, setHospitalDoctors] = useState<Record<string, Doctor[]>>({});
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([getHospitals(), getDoctors(), getOsmHospitals()]);
    } catch (error) {
      console.error('Error refreshing data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getHospitals = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/hospitals`);
      if (response.ok) {
        const data = await response.json();
        setHospitals(data);
      }
    } catch (error) {
      console.error('Error fetching hospitals:', error);
    }
  };

  const getOsmHospitals = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/osm-hospitals`);
      if (response.ok) {
        const data = await response.json();
        setOsmHospitals(data);
      }
    } catch (error) {
      console.error('Error fetching OSM hospitals:', error);
    }
  };

  const getDoctorHospitals = async (doctorId: string) => {
    if (!doctorId) return [];
    try {
      const response = await fetch(`${BACKEND_URL}/api/doctor-hospitals/${doctorId}`);
      if (response.ok) {
        const data = await response.json();
        setDoctorHospitals(prev => ({ ...prev, [doctorId]: data }));
        return data;
      }
    } catch (error) {
      console.error('Error fetching doctor hospitals:', error);
    }
    return [];
  };

  const saveDoctorHospitals = async (doctorId: string, hospitalIds: string[]) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/doctor-hospitals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ doctor_id: doctorId, hospital_ids: hospitalIds }),
      });
      if (response.ok) {
        const data = await response.json();
        const selected = osmHospitals.filter(h => data.hospital_ids.includes(h.id));
        setDoctorHospitals(prev => ({ ...prev, [doctorId]: selected }));
        return true;
      }
    } catch (error) {
      console.error('Error saving doctor hospitals:', error);
    }
    return false;
  };

  const updateAppointmentRecord = async (id: string, data: {
    doctor_id: string;
    patient_complaint?: string;
    diagnosis?: string;
    prescription?: { name: string; dosage?: string; instructions?: string; days?: number }[];
    record_notes?: string;
  }) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/appointments/${id}/record`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (response.ok) {
        const updated = await response.json();
        setAppointments(prev => prev.map(a => a.id === id ? updated : a));
        return updated;
      }
    } catch (error) {
      console.error('Error updating appointment record:', error);
    }
    return null;
  };

  const getPatientTimeline = async (doctorId: string, patientId: string) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/patients/${doctorId}/${patientId}/timeline`);
      if (response.ok) {
        const data = await response.json();
        return data;
      }
    } catch (error) {
      console.error('Error fetching patient timeline:', error);
    }
    return [];
  };

  const createReminder = async (data: {
    user_id: string;
    medicine_name: string;
    before_after: string;
    times: string[];
    start_date: string;
    end_date: string;
    tz_offset_minutes: number;
  }) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/reminders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return response.ok;
    } catch (error) {
      console.error('Error creating reminder:', error);
      return false;
    }
  };

  const getUserReminders = async (userId: string) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/reminders/user/${userId}`);
      if (response.ok) {
        return await response.json();
      }
    } catch (error) {
      console.error('Error fetching reminders:', error);
    }
    return [];
  };

  const deleteReminder = async (reminderId: string) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/reminders/${reminderId}`, { method: 'DELETE' });
      return response.ok;
    } catch (error) {
      console.error('Error deleting reminder:', error);
      return false;
    }
  };

  const toggleReminder = async (reminderId: string, active: boolean) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/reminders/${reminderId}/toggle?active=${active}`, {
        method: 'PUT',
      });
      return response.ok;
    } catch (error) {
      console.error('Error toggling reminder:', error);
      return false;
    }
  };

  const getDoctorsForHospital = async (hospitalId: string) => {
    if (!hospitalId) return [];
    try {
      const response = await fetch(`${BACKEND_URL}/api/hospital-doctors/${hospitalId}`);
      if (response.ok) {
        const data = await response.json();
        setHospitalDoctors(prev => ({ ...prev, [hospitalId]: data }));
        return data;
      }
    } catch (error) {
      console.error('Error fetching hospital doctors:', error);
    }
    return [];
  };

  const getHospitalById = (id: string) => hospitals.find(h => h.id === id);

  const getDoctors = async (specialization?: string) => {
    try {
      const url = specialization
        ? `${BACKEND_URL}/api/doctors?specialization=${encodeURIComponent(specialization)}`
        : `${BACKEND_URL}/api/doctors`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setDoctors(data);
      }
    } catch (error) {
      console.error('Error fetching doctors:', error);
    }
  };

  const getDoctorById = (id: string) => doctors.find(d => d.id === id);

  const createAppointment = async (data: Omit<Appointment, 'id' | 'created_at' | 'status'>): Promise<Appointment | null> => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (response.ok) {
        const newAppointment = await response.json();
        setAppointments(prev => [...prev, newAppointment]);
        return newAppointment;
      }
    } catch (error) {
      console.error('Error creating appointment:', error);
    }
    return null;
  };

  const getUserAppointments = async (userId: string) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/appointments/user/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setAppointments(data);
      }
    } catch (error) {
      console.error('Error fetching user appointments:', error);
    }
  };

  const getDoctorAppointments = async (doctorId: string) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/appointments/doctor/${doctorId}`);
      if (response.ok) {
        const data = await response.json();
        setAppointments(data);
      }
    } catch (error) {
      console.error('Error fetching doctor appointments:', error);
    }
  };

  const updateAppointmentStatus = async (id: string, status: string, suggestion?: { date?: string; time?: string; note?: string }): Promise<boolean> => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/appointments/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          suggested_date: suggestion?.date,
          suggested_time: suggestion?.time,
          doctor_note: suggestion?.note
        }),
      });
      if (response.ok) {
        // Update local state immediately to reflect in all components
        setAppointments(prev => prev.map(a =>
          a.id === id ? {
            ...a,
            status: status as any,
            suggested_date: suggestion?.date || a.suggested_date,
            suggested_time: suggestion?.time || a.suggested_time,
            doctor_note: suggestion?.note || a.doctor_note
          } : a
        ));
        return true;
      }
    } catch (error) {
      console.error('Error updating appointment status:', error);
    }
    return false;
  };

  const searchDoctors = (query: string) => {
    const lowerQuery = query.toLowerCase();
    return doctors.filter(d =>
      (d.name?.toLowerCase() || '').includes(lowerQuery) ||
      (d.specialization?.toLowerCase() || '').includes(lowerQuery)
    );
  };

  const getDoctorsBySpecialization = (specializations: string[]) => {
    return doctors.filter(d =>
      specializations.some(s => (d.specialization?.toLowerCase() || '').includes(s?.toLowerCase() || ''))
    );
  };

  const updateDoctor = async (id: string, data: Partial<Doctor>): Promise<boolean> => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/user/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (response.ok) {
        const updatedDoctor = await response.json();
        setDoctors(prev => prev.map(d => d.id === id ? { ...d, ...updatedDoctor } : d));
        return true;
      }
    } catch (error) {
      console.error('Error updating doctor:', error);
    }
    return false;
  };

  return (
    <DataContext.Provider value={{
      hospitals,
      osmHospitals,
      doctorHospitals,
      hospitalDoctors,
      doctors,
      appointments,
      isLoading,
      refreshData,
      getHospitals,
      getHospitalById,
      getOsmHospitals,
      getDoctorHospitals,
      saveDoctorHospitals,
      getDoctorsForHospital,
      getDoctors,
      getDoctorById,
      createAppointment,
      getUserAppointments,
      getDoctorAppointments,
      updateAppointmentStatus,
      searchDoctors,
      getDoctorsBySpecialization,
      updateDoctor,
      updateAppointmentRecord,
      getPatientTimeline,
      createReminder,
      getUserReminders,
      deleteReminder,
      toggleReminder,
    }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within DataProvider');
  }
  return context;
};
