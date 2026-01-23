// أنواع البيانات لوحدة HR

export type EmploymentType = "full-time" | "part-time" | "commission";
export type EmployeeStatus = "active" | "on-leave" | "suspended";
export type LeaveType = "annual" | "sick" | "unpaid";
export type LeaveStatus = "pending" | "approved" | "rejected";
export type AttendanceStatus = "present" | "absent" | "late";
export type PenaltyType = "warning" | "deduction" | "note";

export interface Employee {
  id: string;
  code: string;
  name: string;
  position: string;
  department: string;
  hireDate: string;
  employmentType: EmploymentType;
  baseSalary: number;
  commissionRate: number;
  phone: string;
  email: string;
  status: EmployeeStatus;
  annualLeaveBalance: number;
  sickLeaveBalance: number;
  contractEndDate?: string;
  clients: number;
  totalInvestments: number;
  totalCommissions: number;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  status: AttendanceStatus;
  lateMinutes?: number;
  notes?: string;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: LeaveStatus;
  requestDate: string;
  approvedBy?: string;
  approvedDate?: string;
}

export interface Document {
  id: string;
  employeeId: string;
  type: "contract" | "id" | "cv" | "other";
  name: string;
  uploadDate: string;
  expiryDate?: string;
  url?: string;
}

export interface PayrollRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  month: string;
  baseSalary: number;
  commissions: number;
  bonuses: number;
  deductions: number;
  netSalary: number;
  status: "pending" | "paid";
}

export interface Penalty {
  id: string;
  employeeId: string;
  employeeName: string;
  type: PenaltyType;
  date: string;
  reason: string;
  amount?: number;
  issuedBy: string;
}

export interface HRAlert {
  id: string;
  type: "late" | "absent" | "contract-expiry" | "leave-request";
  employeeId: string;
  employeeName: string;
  message: string;
  date: string;
  isRead: boolean;
}
