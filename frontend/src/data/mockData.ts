// Core Types and Shared Constants for MedBook App

export interface Hospital {
  id: string;
  name: string;
  address: string;
  city: string;
  area: string;
  departments: string[];
  rating: number;
  image: string;
  contact: string;
  email: string;
}

export interface Doctor {
  id: string;
  name: string;
  email: string;
  specialization: string;
  hospitalIds: string[];
  availableDays: string[];
  videoConsultation: boolean;
  image: string;
  experience: number;
  rating: number;
  consultationFee: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string;
  selectedCity: string;
  selectedArea: string;
}

export interface Appointment {
  id: string;
  userId: string;
  doctorId: string;
  hospitalId: string;
  type: 'hospital' | 'video';
  date: string;
  timeSlot: string;
  status: 'pending' | 'accepted' | 'rejected' | 'completed';
  createdAt: string;
}

export const TIME_SLOTS = [
  '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM',
  '11:00 AM', '11:30 AM', '12:00 PM', '02:00 PM',
  '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM',
  '04:30 PM', '05:00 PM', '05:30 PM', '06:00 PM',
];

export const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export const SPECIALIZATIONS = [
  'General Physician',
  'Cardiologist',
  'Dermatologist',
  'Ophthalmologist',
  'Endocrinologist',
  'Orthopedic',
  'Neurologist',
  'Pediatrician',
  'Gynecologist',
  'ENT Specialist',
];
