// API Types and Interfaces for VitaCheckLabs

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  per_page: number;
  total: number;
  total_pages: number;
}

export interface ApiError {
  message: string;
  detail?: string;
  status?: number;
  errors?: Record<string, string[]>;
}

// Authentication Types
export interface AuthResponse {
  user: User;
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
}

export interface User {
  id: string;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
  role: 'ADMIN' | 'USER' | 'LAB_TECHNICIAN';
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  updated_at: string;
  last_login?: string;
}

export interface UserRegister {
  username: string;
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone_number?: string;
}

export interface UserLogin {
  username: string;
  password: string;
}

export interface TokenRefresh {
  refresh_token: string;
}

export interface ChangePassword {
  current_password: string;
  new_password: string;
}

// Lab Test Types
export interface LabTest {
  id: string;
  name: string;
  code: string;
  description: string;
  category: LabTestCategory;
  sub_category?: string;
  sample_type: SampleType;
  requirements?: string;
  procedure?: string;
  price: number;
  is_active: boolean;
  is_home_collection_available: boolean;
  minimum_age?: number;
  maximum_age?: number;
  duration_minutes?: number;
  report_delivery_hours?: number;
  created_at: string;
  updated_at: string;
}

export enum LabTestCategory {
  BLOOD_CHEMISTRY = 'BLOOD_CHEMISTRY',
  HEMATOLOGY = 'HEMATOLOGY',
  IMMUNOLOGY = 'IMMUNOLOGY',
  MICROBIOLOGY = 'MICROBIOLOGY',
  PATHOLOGY = 'PATHOLOGY',
  RADIOLOGY = 'RADIOLOGY',
  CARDIOLOGY = 'CARDIOLOGY',
  ENDOCRINOLOGY = 'ENDOCRINOLOGY',
  ONCOLOGY = 'ONCOLOGY',
  GENETICS = 'GENETICS'
}

export enum SampleType {
  BLOOD = 'BLOOD',
  URINE = 'URINE',
  STOOL = 'STOOL',
  SALIVA = 'SALIVA',
  SWAB = 'SWAB',
  TISSUE = 'TISSUE',
  SPUTUM = 'SPUTUM',
  OTHER = 'OTHER'
}

export interface LabTestCreate {
  name: string;
  code: string;
  description: string;
  category: LabTestCategory;
  sub_category?: string;
  sample_type: SampleType;
  requirements?: string;
  procedure?: string;
  price: number;
  is_home_collection_available: boolean;
  minimum_age?: number;
  maximum_age?: number;
  duration_minutes?: number;
  report_delivery_hours?: number;
}

export interface LabTestUpdate extends Partial<LabTestCreate> {
  is_active?: boolean;
}

export interface LabTestBooking {
  preferred_date: string;
  preferred_time: string;
  is_home_collection: boolean;
  collection_address?: string;
  patient_age: number;
  notes?: string;
}

export interface LabTestFilters {
  page?: number;
  per_page?: number;
  category?: LabTestCategory;
  sample_type?: SampleType;
  min_price?: number;
  max_price?: number;
  is_active?: boolean;
  is_home_collection_available?: boolean;
  search?: string;
}

export interface LabTestStats {
  total_tests: number;
  active_tests: number;
  categories_count: Record<LabTestCategory, number>;
  average_price: number;
  home_collection_percentage: number;
}

// Report Types
export interface Report {
  id: string;
  user_id: string;
  lab_test_id: string;
  report_number: string;
  status: ReportStatus;
  scheduled_at?: string;
  collected_at?: string;
  processed_at?: string;
  completed_at?: string;
  collection_location?: string;
  results?: string;
  observations?: string;
  recommendations?: string;
  file_path?: string;
  file_original_name?: string;
  file_size?: number;
  is_shared: boolean;
  shared_at?: string;
  shared_with?: string[];
  amount_charged?: number;
  payment_status: PaymentStatus;
  payment_reference?: string;
  priority: ReportPriority;
  created_at: string;
  updated_at: string;
  lab_test: LabTest;
}

export enum ReportStatus {
  PENDING = 'PENDING',
  SCHEDULED = 'SCHEDULED',
  COLLECTED = 'COLLECTED',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED'
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED'
}

export enum ReportPriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

export interface ReportCreate {
  lab_test_id: string;
  scheduled_at?: string;
  is_home_collection: boolean;
  collection_address?: string;
  patient_age: number;
  notes?: string;
}

export interface ReportUpdate {
  status?: ReportStatus;
  scheduled_at?: string;
  collected_at?: string;
  processed_at?: string;
  completed_at?: string;
  collection_location?: string;
  results?: string;
  observations?: string;
  recommendations?: string;
  priority?: ReportPriority;
}

export interface ReportFilters {
  page?: number;
  per_page?: number;
  status?: ReportStatus;
  payment_status?: PaymentStatus;
  priority?: ReportPriority;
  start_date?: string;
  end_date?: string;
  search?: string;
}

export interface ReportShare {
  email_addresses: string[];
  message?: string;
  expires_at?: string;
}

export interface ReportDownload {
  download_url: string;
  expires_at: string;
}

export interface ReportStats {
  total_reports: number;
  status_counts: Record<ReportStatus, number>;
  payment_status_counts: Record<PaymentStatus, number>;
  priority_counts: Record<ReportPriority, number>;
  total_revenue: number;
  average_processing_time: number;
}

// Company Types
export interface CompanyInfo {
  id: string;
  name: string;
  legal_name: string;
  registration_number: string;
  email: string;
  phone_primary: string;
  phone_secondary?: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  established_year: number;
  license_number: string;
  accreditation?: string;
  services: string[];
  specializations: string[];
  certifications: string[];
  operating_hours: Record<string, string>;
  home_collection_radius_km: number;
  created_at: string;
  updated_at: string;
}

export interface CompanyInfoUpdate extends Partial<Omit<CompanyInfo, 'id' | 'created_at' | 'updated_at'>> {}

export interface ContactInfo {
  email: string;
  phone_primary: string;
  phone_secondary?: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  operating_hours: Record<string, string>;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  category: string;
  is_active: boolean;
}

export interface ContactFormSubmission {
  full_name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  inquiry_type: InquiryType;
}

export enum InquiryType {
  GENERAL = 'GENERAL',
  BOOKING = 'BOOKING',
  COMPLAINT = 'COMPLAINT',
  SUPPORT = 'SUPPORT',
  BUSINESS = 'BUSINESS'
}

export interface ContactMessage {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  inquiry_type: InquiryType;
  status: ContactMessageStatus;
  priority: ContactMessagePriority;
  response?: string;
  response_at?: string;
  responded_by?: string;
  source?: string;
  user_agent?: string;
  ip_address?: string;
  created_at: string;
  updated_at: string;
}

export enum ContactMessageStatus {
  UNREAD = 'UNREAD',
  READ = 'READ',
  RESPONDED = 'RESPONDED',
  CLOSED = 'CLOSED'
}

export enum ContactMessagePriority {
  LOW = 'LOW',
  NORMAL = 'NORMAL',
  HIGH = 'HIGH',
  URGENT = 'URGENT'
}

export interface ContactMessageUpdate {
  status?: ContactMessageStatus;
  priority?: ContactMessagePriority;
  response?: string;
}

export interface ContactMessageFilters {
  page?: number;
  per_page?: number;
  status?: ContactMessageStatus;
  priority?: ContactMessagePriority;
  inquiry_type?: InquiryType;
  start_date?: string;
  end_date?: string;
  search?: string;
}

export interface ContactStats {
  total_messages: number;
  status_counts: Record<ContactMessageStatus, number>;
  priority_counts: Record<ContactMessagePriority, number>;
  inquiry_type_counts: Record<InquiryType, number>;
  average_response_time: number;
  response_rate: number;
}

// Health Check Types
export interface HealthCheck {
  status: 'healthy' | 'unhealthy';
  version: string;
  timestamp: string;
  components: {
    database: ComponentStatus;
    s3: ComponentStatus;
    rate_limiter: ComponentStatus;
  };
}

export interface ComponentStatus {
  status: 'healthy' | 'unhealthy';
  details?: string;
  response_time_ms?: number;
}