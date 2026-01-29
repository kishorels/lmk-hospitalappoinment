import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://localhost:8000';

// Types
export interface Hospital {
  id: string;
  name: string;
  address: string;
  city: string;
  area: string;
  phone: string;
  email: string;
  departments: string[];
  rating: number;
  image_url?: string;
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
  created_at: string;
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
  doctors: Doctor[];
  appointments: Appointment[];
  isLoading: boolean;
  refreshData: () => Promise<void>;
  // Hospital actions
  getHospitals: () => Promise<void>;
  getHospitalById: (id: string) => Hospital | undefined;
  // Doctor actions
  getDoctors: (specialization?: string) => Promise<void>;
  getDoctorById: (id: string) => Doctor | undefined;
  // Appointment actions
  createAppointment: (data: Omit<Appointment, 'id' | 'created_at' | 'status'>) => Promise<Appointment | null>;
  getUserAppointments: (userId: string) => Promise<void>;
  getDoctorAppointments: (doctorId: string) => Promise<void>;
  updateAppointmentStatus: (id: string, status: string) => Promise<boolean>;
  // Search
  searchDoctors: (query: string) => Doctor[];
  getDoctorsBySpecialization: (specializations: string[]) => Doctor[];
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([getHospitals(), getDoctors()]);
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

  const updateAppointmentStatus = async (id: string, status: string): Promise<boolean> => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/appointments/${id}/status?status=${status}`, {
        method: 'PUT',
      });
      if (response.ok) {
        setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: status as any } : a));
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
      d.name.toLowerCase().includes(lowerQuery) ||
      d.specialization.toLowerCase().includes(lowerQuery)
    );
  };

  const getDoctorsBySpecialization = (specializations: string[]) => {
    return doctors.filter(d =>
      specializations.some(s => d.specialization.toLowerCase().includes(s.toLowerCase()))
    );
  };

  return (
    <DataContext.Provider value={{
      hospitals,
      doctors,
      appointments,
      isLoading,
      refreshData,
      getHospitals,
      getHospitalById,
      getDoctors,
      getDoctorById,
      createAppointment,
      getUserAppointments,
      getDoctorAppointments,
      updateAppointmentStatus,
      searchDoctors,
      getDoctorsBySpecialization,
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
