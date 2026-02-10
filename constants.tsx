
import React from 'react';
import { PropertyStatus, RepairStatus } from './types';

export const STATUS_COLORS = {
  [PropertyStatus.VACANT]: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  [PropertyStatus.BOOKED]: 'bg-amber-100 text-amber-800 border-amber-200',
  [PropertyStatus.OCCUPIED]: 'bg-rose-100 text-rose-800 border-rose-200',
  [PropertyStatus.CANCELED]: 'bg-slate-100 text-slate-800 border-slate-200',
};

export const STATUS_LABELS = {
  [PropertyStatus.VACANT]: 'ว่าง',
  [PropertyStatus.BOOKED]: 'จองแล้ว',
  [PropertyStatus.OCCUPIED]: 'ไม่ว่าง (มีผู้เช่า)',
  [PropertyStatus.CANCELED]: 'ยกเลิกสัญญา',
};

export const REPAIR_STATUS_COLORS = {
  [RepairStatus.NORMAL]: 'text-slate-500',
  [RepairStatus.PENDING_REPAIR]: 'text-orange-500',
  [RepairStatus.UNDER_REPAIR]: 'text-blue-500',
  [RepairStatus.COMPLETED]: 'text-emerald-500',
};

export const REPAIR_STATUS_LABELS = {
  [RepairStatus.NORMAL]: 'ปกติ',
  [RepairStatus.PENDING_REPAIR]: 'รอแจ้งซ่อม',
  [RepairStatus.UNDER_REPAIR]: 'กำลังซ่อม',
  [RepairStatus.COMPLETED]: 'ซ่อมเสร็จแล้ว',
};
