import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';
import {
  Hospital,
  Doctor,
  Appointment,
  Query,
  INITIAL_HOSPITALS,
  INITIAL_DOCTORS,
} from '../data/mockData';

interface DataContextType {
  hospitals: Hospital[];
  doctors: Doctor[];
  appointments: Appointment[];
  queries: Query[];
  isLoading: boolean;
  // Hospital actions
  addHospital: (hospital: Omit<Hospital, 'id'>) => Promise<Hospital>;
  updateHospital: (id: string, data: Partial<Hospital>) => Promise<void>;
  // Doctor actions
  addDoctor: (doctor: Omit<Doctor, 'id'>) => Promise<Doctor>;
  updateDoctor: (id: string, data: Partial<Doctor>) => Promise<void>;
  addDoctorToHospital: (doctorId: string, hospitalId: string) => Promise<void>;
  removeDoctorFromHospital: (doctorId: string, hospitalId: string) => Promise<void>;
  // Appointment actions
  createAppointment: (appointment: Omit<Appointment, 'id' | 'createdAt'>) => Promise<Appointment>;
  updateAppointmentStatus: (id: string, status: Appointment['status']) => Promise<void>;
  // Query actions
  createQuery: (query: Omit<Query, 'id' | 'createdAt'>) => Promise<Query>;
  replyToQuery: (id: string, reply: string) => Promise<void>;
  // Getters
  getHospitalById: (id: string) => Hospital | undefined;
  getDoctorById: (id: string) => Doctor | undefined;
  getDoctorsByHospital: (hospitalId: string) => Doctor[];
  getDoctorsBySpecialization: (specializations: string[]) => Doctor[];
  getHospitalsByLocation: (city: string, area?: string) => Hospital[];
  getAppointmentsByUser: (userId: string) => Appointment[];
  getAppointmentsByDoctor: (doctorId: string) => Appointment[];
  getQueriesByUser: (userId: string) => Query[];
  getQueriesByDoctor: (doctorId: string) => Query[];
  searchDoctors: (query: string) => Doctor[];
}

const DataContext = createContext<DataContextType | undefined>(undefined);

const HOSPITALS_KEY = '@medbook_hospitals';
const DOCTORS_KEY = '@medbook_doctors';
const APPOINTMENTS_KEY = '@medbook_appointments';
const QUERIES_KEY = '@medbook_queries';
const INIT_KEY = '@medbook_initialized';

export const DataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [queries, setQueries] = useState<Query[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    initializeData();
  }, []);

  const initializeData = async () => {
    try {
      const initialized = await AsyncStorage.getItem(INIT_KEY);
      
      if (!initialized) {
        // First time: load initial mock data
        await AsyncStorage.setItem(HOSPITALS_KEY, JSON.stringify(INITIAL_HOSPITALS));
        await AsyncStorage.setItem(DOCTORS_KEY, JSON.stringify(INITIAL_DOCTORS));
        await AsyncStorage.setItem(APPOINTMENTS_KEY, JSON.stringify([]));
        await AsyncStorage.setItem(QUERIES_KEY, JSON.stringify([]));
        await AsyncStorage.setItem(INIT_KEY, 'true');
        
        setHospitals(INITIAL_HOSPITALS);
        setDoctors(INITIAL_DOCTORS);
        setAppointments([]);
        setQueries([]);
      } else {
        // Load existing data
        const [storedHospitals, storedDoctors, storedAppointments, storedQueries] = await Promise.all([
          AsyncStorage.getItem(HOSPITALS_KEY),
          AsyncStorage.getItem(DOCTORS_KEY),
          AsyncStorage.getItem(APPOINTMENTS_KEY),
          AsyncStorage.getItem(QUERIES_KEY),
        ]);

        setHospitals(storedHospitals ? JSON.parse(storedHospitals) : INITIAL_HOSPITALS);
        setDoctors(storedDoctors ? JSON.parse(storedDoctors) : INITIAL_DOCTORS);
        setAppointments(storedAppointments ? JSON.parse(storedAppointments) : []);
        setQueries(storedQueries ? JSON.parse(storedQueries) : []);
      }
    } catch (error) {
      console.error('Error initializing data:', error);
      // Fallback to initial data
      setHospitals(INITIAL_HOSPITALS);
      setDoctors(INITIAL_DOCTORS);
    } finally {
      setIsLoading(false);
    }
  };

  // Hospital actions
  const addHospital = async (hospitalData: Omit<Hospital, 'id'>): Promise<Hospital> => {
    const newHospital: Hospital = {
      ...hospitalData,
      id: uuidv4(),
    };
    const updatedHospitals = [...hospitals, newHospital];
    setHospitals(updatedHospitals);
    await AsyncStorage.setItem(HOSPITALS_KEY, JSON.stringify(updatedHospitals));
    return newHospital;
  };

  const updateHospital = async (id: string, data: Partial<Hospital>) => {
    const updatedHospitals = hospitals.map(h => h.id === id ? { ...h, ...data } : h);
    setHospitals(updatedHospitals);
    await AsyncStorage.setItem(HOSPITALS_KEY, JSON.stringify(updatedHospitals));
  };

  // Doctor actions
  const addDoctor = async (doctorData: Omit<Doctor, 'id'>): Promise<Doctor> => {
    const newDoctor: Doctor = {
      ...doctorData,
      id: uuidv4(),
    };
    const updatedDoctors = [...doctors, newDoctor];
    setDoctors(updatedDoctors);
    await AsyncStorage.setItem(DOCTORS_KEY, JSON.stringify(updatedDoctors));
    return newDoctor;
  };

  const updateDoctor = async (id: string, data: Partial<Doctor>) => {
    const updatedDoctors = doctors.map(d => d.id === id ? { ...d, ...data } : d);
    setDoctors(updatedDoctors);
    await AsyncStorage.setItem(DOCTORS_KEY, JSON.stringify(updatedDoctors));
  };

  const addDoctorToHospital = async (doctorId: string, hospitalId: string) => {
    const doctor = doctors.find(d => d.id === doctorId);
    if (doctor && !doctor.hospitalIds.includes(hospitalId)) {
      await updateDoctor(doctorId, {
        hospitalIds: [...doctor.hospitalIds, hospitalId],
      });
    }
  };

  const removeDoctorFromHospital = async (doctorId: string, hospitalId: string) => {
    const doctor = doctors.find(d => d.id === doctorId);
    if (doctor) {
      await updateDoctor(doctorId, {
        hospitalIds: doctor.hospitalIds.filter(id => id !== hospitalId),
      });
    }
  };

  // Appointment actions
  const createAppointment = async (appointmentData: Omit<Appointment, 'id' | 'createdAt'>): Promise<Appointment> => {
    const newAppointment: Appointment = {
      ...appointmentData,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    };
    const updatedAppointments = [...appointments, newAppointment];
    setAppointments(updatedAppointments);
    await AsyncStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(updatedAppointments));
    return newAppointment;
  };

  const updateAppointmentStatus = async (id: string, status: Appointment['status']) => {
    const updatedAppointments = appointments.map(a => a.id === id ? { ...a, status } : a);
    setAppointments(updatedAppointments);
    await AsyncStorage.setItem(APPOINTMENTS_KEY, JSON.stringify(updatedAppointments));
  };

  // Query actions
  const createQuery = async (queryData: Omit<Query, 'id' | 'createdAt'>): Promise<Query> => {
    const newQuery: Query = {
      ...queryData,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    };
    const updatedQueries = [...queries, newQuery];
    setQueries(updatedQueries);
    await AsyncStorage.setItem(QUERIES_KEY, JSON.stringify(updatedQueries));
    return newQuery;
  };

  const replyToQuery = async (id: string, reply: string) => {
    const updatedQueries = queries.map(q => 
      q.id === id ? { ...q, reply, repliedAt: new Date().toISOString() } : q
    );
    setQueries(updatedQueries);
    await AsyncStorage.setItem(QUERIES_KEY, JSON.stringify(updatedQueries));
  };

  // Getters
  const getHospitalById = (id: string) => hospitals.find(h => h.id === id);
  const getDoctorById = (id: string) => doctors.find(d => d.id === id);
  
  const getDoctorsByHospital = (hospitalId: string) => 
    doctors.filter(d => d.hospitalIds.includes(hospitalId));
  
  const getDoctorsBySpecialization = (specializations: string[]) =>
    doctors.filter(d => specializations.includes(d.specialization));
  
  const getHospitalsByLocation = (city: string, area?: string) =>
    hospitals.filter(h => h.city === city && (!area || h.area === area));
  
  const getAppointmentsByUser = (userId: string) =>
    appointments.filter(a => a.userId === userId);
  
  const getAppointmentsByDoctor = (doctorId: string) =>
    appointments.filter(a => a.doctorId === doctorId);
  
  const getQueriesByUser = (userId: string) =>
    queries.filter(q => q.userId === userId);
  
  const getQueriesByDoctor = (doctorId: string) =>
    queries.filter(q => q.doctorId === doctorId);

  const searchDoctors = (query: string) => {
    const lowerQuery = query.toLowerCase();
    return doctors.filter(d => 
      d.name.toLowerCase().includes(lowerQuery) ||
      d.specialization.toLowerCase().includes(lowerQuery)
    );
  };

  return (
    <DataContext.Provider value={{
      hospitals,
      doctors,
      appointments,
      queries,
      isLoading,
      addHospital,
      updateHospital,
      addDoctor,
      updateDoctor,
      addDoctorToHospital,
      removeDoctorFromHospital,
      createAppointment,
      updateAppointmentStatus,
      createQuery,
      replyToQuery,
      getHospitalById,
      getDoctorById,
      getDoctorsByHospital,
      getDoctorsBySpecialization,
      getHospitalsByLocation,
      getAppointmentsByUser,
      getAppointmentsByDoctor,
      getQueriesByUser,
      getQueriesByDoctor,
      searchDoctors,
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
