
export enum PropertyStatus {
  VACANT = 'VACANT',
  BOOKED = 'BOOKED',
  OCCUPIED = 'OCCUPIED',
  CANCELED = 'CANCELED'
}

export enum UserRole {
  ADMIN = 'ADMIN',
  USER = 'USER'
}

export enum RentalType {
  MONTHLY = 'MONTHLY',
  DAILY = 'DAILY'
}

export enum RepairStatus {
  NORMAL = 'NORMAL',
  PENDING_REPAIR = 'PENDING_REPAIR',
  UNDER_REPAIR = 'UNDER_REPAIR',
  COMPLETED = 'COMPLETED'
}

export enum InspectionCategory {
  ARCHITECTURAL = 'งานสถาปัตย์',
  PLUMBING = 'งานระบบปะปา',
  ELECTRICAL = 'งานระบบไฟฟ้า',
  FURNITURE = 'งานเฟอร์นิเจอร์',
  CURTAINS = 'งานผ้าม่าน',
  DECOR = 'ของตกแต่ง',
  OTHER = 'อื่นๆ'
}

export enum SubscriptionTier {
  FREE = 'FREE',
  PREMIUM = 'PREMIUM'
}

export interface SubscriptionInfo {
  tier: SubscriptionTier;
  plan: 'MONTHLY' | 'YEARLY' | 'NONE';
  startDate?: string;
  expiryDate?: string;
  autoRenew: boolean;
}

export interface PricingConfig {
  monthlyPrice: number;
  yearlyPrice: number;
  currency: string;
}

export interface CompanyInfo {
  nameTh: string;
  nameEn: string;
  addressTh: string;
  taxId: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  phone: string;
  mobile: string;
  coordinates: string;
  logo: string;
  subscription: SubscriptionInfo;
  pricing: PricingConfig;
}

export interface Staff {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  username: string;
  password: string;
  role: UserRole.USER;
  createdAt: string;
}

export interface Document {
  id: string;
  name: string;
  type: 'PDF' | 'IMAGE';
  category: 'CONTRACT' | 'TENANT_ID' | 'OWNER_DOCS' | 'POA' | 'TM30' | 'OTHER';
  url: string;
  uploadDate: string;
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: 'COMMON_FEE' | 'REPAIR' | 'UTILITY' | 'COMMISSION' | 'MANAGEMENT_FEE' | 'OTHER';
  date: string;
  status: 'UNPAID' | 'PAID';
  receiptUrl?: string;
}

export interface Booking {
  id: string;
  guestName: string;
  guestPhone: string;
  checkInDate: string;
  checkOutDate: string;
  totalPrice: number;
  deposit: number;
  paymentMethod: 'TRANSFER' | 'CASH';
  status: 'CONFIRMED' | 'CHECKED_IN' | 'CHECKED_OUT' | 'CANCELLED';
}

export interface AccountingItem {
  id: string;
  description: string;
  quantity: number;
  pricePerUnit: number;
  total: number;
}

export type AccountingDocType = 'QUOTATION' | 'RECEIPT' | 'WHT' | 'INVOICE';

export interface AccountingDocument {
  id: string;
  type: AccountingDocType;
  docNumber: string;
  date: string;
  clientName: string;
  clientAddress: string;
  clientTaxId?: string;
  items: AccountingItem[];
  subtotal: number;
  vatPercent: number;
  vatAmount: number;
  whtPercent: number;
  whtAmount: number;
  grandTotal: number;
  status: 'DRAFT' | 'SENT' | 'PAID' | 'CANCELLED';
}

export interface InspectionItem {
  id: string;
  category: InspectionCategory;
  description: string;
  isOk: boolean;
  damageDetails?: string;
  images: string[];
  date: string;
  inspectorName?: string;
}

export interface Property {
  id: string;
  name: string;
  address: string;
  building?: string;
  floor?: string;
  roomNumber?: string;
  unitNumber?: string;
  status: PropertyStatus;
  rentalType: RentalType;
  rentAmount: number;
  paymentDueDate: number; 
  contractStartDate?: string;
  contractEndDate?: string;
  tenantName?: string;
  tenantPhone?: string;
  bookings: Booking[];
  documents: Document[];
  expenses: Expense[];
  inspections: InspectionItem[];
  repairStatus: RepairStatus;
  cancellationReason?: string;
  cancellationDate?: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  date: string;
  type: 'PAYMENT' | 'CONTRACT' | 'SYSTEM';
  isRead: boolean;
}
