// Common types for VitaCheckLabs UI

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'user';
  createdAt: string;
  updatedAt: string;
}

export interface LabTest {
  id: string;
  name: string;
  description: string;
  category: string;
  price: number;
  duration: string;
  requirements: string;
}

export interface Report {
  id: string;
  userId: string;
  labTestId: string;
  status: 'pending' | 'completed' | 'reviewed';
  results?: string;
  filePath?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Company {
  id: string;
  name: string;
  description: string;
  services: string[];
  contactInfo: ContactInfo;
}

export interface ContactInfo {
  email: string;
  phone: string;
  address: string;
  hours: string;
}

// Re-export from api.ts to avoid duplication
export type { ApiResponse, ApiError } from './api';