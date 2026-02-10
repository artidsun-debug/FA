
export enum PropertyStatus {
  VACANT = 'VACANT',
  BOOKED = 'BOOKED',
  OCCUPIED = 'OCCUPIED',
  CANCELED = 'CANCELED'
}

export enum UserRole {
  ADMIN = 'ADMIN',
  STAFF = 'STAFF', // Agent
  OWNER = 'OWNER',
  TENANT = 'TENANT',
  CO_AGENT = 'CO_AGENT',
  CO_TENANT = 'CO_TENANT',
  LAWYER = 'LAWYER'
}

export enum ApprovalStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED'
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

export enum PaymentStatus {
  PENDING = 'PENDING',
  VERIFYING = 'VERIFYING',
  PAID = 'PAID',
  OVERDUE = 'OVERDUE'
}

export interface PaymentRecord {
  id: string;
  month: string; // YYYY-MM
  amount: number;
  dueDate: string;
  status: PaymentStatus;
  proofUrl?: string;
  paidDate?: string;
  verifiedBy?: string; // ชื่อผู้ที่กดยืนยัน (Agent/Owner)
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
  memberCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  username: string;
  password: string;
  role: UserRole;
  approvalStatus: ApprovalStatus;
  idCardNumber?: string;
  idCardPhoto?: string;
  deedPhoto?: string;
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

// Fixed missing accounting related types
export type AccountingDocType = 'RECEIPT' | 'INVOICE' | 'QUOTATION';

export interface AccountingItem {
  id: string;
  description: string;
  quantity: number;
  pricePerUnit: number;
  total: number;
}

export interface AccountingDocument {
  id: string;
  type: AccountingDocType;
  docNumber: string;
  date: string;
  clientName: string;
  clientAddress: string;
  clientTaxId: string;
  items: AccountingItem[];
  subtotal: number;
  vatPercent: number;
  vatAmount: number;
  whtPercent: number;
  whtAmount: number;
  grandTotal: number;
  status: 'DRAFT' | 'ISSUED' | 'PAID' | 'CANCELLED';
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: 'COMMON_FEE' | 'REPAIR' | 'UTILITY' | 'COMMISSION' | 'MANAGEMENT_FEE' | 'LAND_TAX' | 'OTHER_SERVICE' | 'OTHER';
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

export interface LinkedMember {
  memberId: string;
  memberCode: string;
  name: string;
  role: UserRole;
  joinedDate: string;
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
  paymentDueDate: number; // วันที่ชำระเงิน (1-31)
  contractStartDate?: string;
  contractEndDate?: string;
  tenantName?: string;
  tenantPhone?: string;
  bookings: Booking[];
  documents: Document[];
  expenses: Expense[];
  inspections: InspectionItem[];
  linkedMembers: LinkedMember[];
  paymentHistory: PaymentRecord[];
  repairStatus: RepairStatus;
  cancellationReason?: string;
  cancellationDate?: string;
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
  repairNeeded?: boolean;
  repairEstimatedCost?: number;
  repairActualCost?: number;
  repairStatus?: 'PENDING' | 'QUOTED' | 'CONFIRMED' | 'DONE';
  linkedExpenseId?: string;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  date: string;
  type: 'PAYMENT' | 'CONTRACT' | 'SYSTEM';
  isRead: boolean;
}
