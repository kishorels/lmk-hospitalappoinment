// Mock Data for MedBook App

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

export interface Query {
  id: string;
  userId: string;
  doctorId: string;
  message: string;
  reply?: string;
  createdAt: string;
  repliedAt?: string;
}

export interface DiseaseCategory {
  id: string;
  name: string;
  icon: string;
  specializations: string[];
}

export const CITIES = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad'];

export const AREAS: Record<string, string[]> = {
  'Mumbai': ['Andheri', 'Bandra', 'Juhu', 'Dadar', 'Powai'],
  'Delhi': ['Connaught Place', 'Karol Bagh', 'Dwarka', 'Saket', 'Rohini'],
  'Bangalore': ['Koramangala', 'Indiranagar', 'Whitefield', 'HSR Layout', 'Jayanagar'],
  'Chennai': ['T Nagar', 'Anna Nagar', 'Adyar', 'Velachery', 'Mylapore'],
  'Kolkata': ['Salt Lake', 'Park Street', 'Ballygunge', 'Howrah', 'New Town'],
  'Hyderabad': ['Banjara Hills', 'Jubilee Hills', 'Madhapur', 'Gachibowli', 'Hitech City'],
};

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

export const DISEASE_CATEGORIES: DiseaseCategory[] = [
  { id: '1', name: 'Fever & Cold', icon: 'thermometer', specializations: ['General Physician', 'Pediatrician'] },
  { id: '2', name: 'Heart', icon: 'heart', specializations: ['Cardiologist'] },
  { id: '3', name: 'Skin', icon: 'bandage', specializations: ['Dermatologist'] },
  { id: '4', name: 'Eye', icon: 'eye', specializations: ['Ophthalmologist'] },
  { id: '5', name: 'Diabetes', icon: 'fitness', specializations: ['Endocrinologist', 'General Physician'] },
  { id: '6', name: 'Bones & Joints', icon: 'body', specializations: ['Orthopedic'] },
  { id: '7', name: 'Brain & Nerves', icon: 'pulse', specializations: ['Neurologist'] },
  { id: '8', name: 'Women Health', icon: 'female', specializations: ['Gynecologist'] },
  { id: '9', name: 'Ear Nose Throat', icon: 'ear', specializations: ['ENT Specialist'] },
  { id: '10', name: 'Child Health', icon: 'happy', specializations: ['Pediatrician'] },
];

export const TIME_SLOTS = [
  '09:00 AM', '09:30 AM', '10:00 AM', '10:30 AM',
  '11:00 AM', '11:30 AM', '12:00 PM', '02:00 PM',
  '02:30 PM', '03:00 PM', '03:30 PM', '04:00 PM',
  '04:30 PM', '05:00 PM', '05:30 PM', '06:00 PM',
];

export const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

// Initial Mock Hospitals
export const INITIAL_HOSPITALS: Hospital[] = [
  {
    id: 'h1',
    name: 'Apollo Hospital',
    address: '123 Healthcare Avenue',
    city: 'Mumbai',
    area: 'Andheri',
    departments: ['Cardiology', 'Dermatology', 'Orthopedics', 'General Medicine'],
    rating: 4.5,
    image: 'hospital',
    contact: '+91 9876543210',
    email: 'apollo.andheri@hospital.com',
  },
  {
    id: 'h2',
    name: 'Fortis Healthcare',
    address: '456 Medical Complex',
    city: 'Mumbai',
    area: 'Bandra',
    departments: ['Neurology', 'Ophthalmology', 'Pediatrics', 'ENT'],
    rating: 4.3,
    image: 'hospital',
    contact: '+91 9876543211',
    email: 'fortis.bandra@hospital.com',
  },
  {
    id: 'h3',
    name: 'Max Super Specialty',
    address: '789 Health Street',
    city: 'Delhi',
    area: 'Saket',
    departments: ['Cardiology', 'Endocrinology', 'Gynecology', 'General Medicine'],
    rating: 4.7,
    image: 'hospital',
    contact: '+91 9876543212',
    email: 'max.saket@hospital.com',
  },
  {
    id: 'h4',
    name: 'Manipal Hospital',
    address: '321 Wellness Road',
    city: 'Bangalore',
    area: 'Koramangala',
    departments: ['Orthopedics', 'Dermatology', 'Neurology', 'Pediatrics'],
    rating: 4.4,
    image: 'hospital',
    contact: '+91 9876543213',
    email: 'manipal.koramangala@hospital.com',
  },
];

// Initial Mock Doctors
export const INITIAL_DOCTORS: Doctor[] = [
  {
    id: 'd1',
    name: 'Dr. Rajesh Kumar',
    email: 'rajesh.kumar@doctor.com',
    specialization: 'Cardiologist',
    hospitalIds: ['h1', 'h3'],
    availableDays: ['Monday', 'Wednesday', 'Friday'],
    videoConsultation: true,
    image: 'person',
    experience: 15,
    rating: 4.8,
    consultationFee: 1000,
  },
  {
    id: 'd2',
    name: 'Dr. Priya Sharma',
    email: 'priya.sharma@doctor.com',
    specialization: 'Dermatologist',
    hospitalIds: ['h1', 'h4'],
    availableDays: ['Tuesday', 'Thursday', 'Saturday'],
    videoConsultation: true,
    image: 'person',
    experience: 10,
    rating: 4.6,
    consultationFee: 800,
  },
  {
    id: 'd3',
    name: 'Dr. Amit Patel',
    email: 'amit.patel@doctor.com',
    specialization: 'Neurologist',
    hospitalIds: ['h2', 'h4'],
    availableDays: ['Monday', 'Tuesday', 'Thursday'],
    videoConsultation: false,
    image: 'person',
    experience: 12,
    rating: 4.5,
    consultationFee: 1200,
  },
  {
    id: 'd4',
    name: 'Dr. Sneha Reddy',
    email: 'sneha.reddy@doctor.com',
    specialization: 'General Physician',
    hospitalIds: ['h1', 'h2', 'h3'],
    availableDays: ['Monday', 'Wednesday', 'Friday', 'Saturday'],
    videoConsultation: true,
    image: 'person',
    experience: 8,
    rating: 4.4,
    consultationFee: 500,
  },
  {
    id: 'd5',
    name: 'Dr. Vikram Singh',
    email: 'vikram.singh@doctor.com',
    specialization: 'Orthopedic',
    hospitalIds: ['h1', 'h4'],
    availableDays: ['Tuesday', 'Wednesday', 'Friday'],
    videoConsultation: false,
    image: 'person',
    experience: 20,
    rating: 4.9,
    consultationFee: 1500,
  },
  {
    id: 'd6',
    name: 'Dr. Meera Nair',
    email: 'meera.nair@doctor.com',
    specialization: 'Gynecologist',
    hospitalIds: ['h3'],
    availableDays: ['Monday', 'Thursday', 'Saturday'],
    videoConsultation: true,
    image: 'person',
    experience: 14,
    rating: 4.7,
    consultationFee: 900,
  },
  {
    id: 'd7',
    name: 'Dr. Arjun Menon',
    email: 'arjun.menon@doctor.com',
    specialization: 'Ophthalmologist',
    hospitalIds: ['h2'],
    availableDays: ['Wednesday', 'Thursday', 'Friday'],
    videoConsultation: true,
    image: 'person',
    experience: 11,
    rating: 4.5,
    consultationFee: 700,
  },
  {
    id: 'd8',
    name: 'Dr. Kavita Gupta',
    email: 'kavita.gupta@doctor.com',
    specialization: 'Pediatrician',
    hospitalIds: ['h2', 'h4'],
    availableDays: ['Monday', 'Tuesday', 'Saturday'],
    videoConsultation: true,
    image: 'person',
    experience: 9,
    rating: 4.6,
    consultationFee: 600,
  },
];
