
import React from 'react';
import { Staff } from '../types';

interface StaffManagementProps {
  staffList: Staff[];
  onDeleteStaff: (id: string) => void;
}

const StaffManagement: React.FC<StaffManagementProps> = ({ staffList, onDeleteStaff }) => {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">จัดการทีมงาน (Staff Accounts)</h2>
          <p className="text-sm text-slate-500">ตรวจสอบและจัดการรายชื่อเจ้าหน้าที่ที่ลงทะเบียนในระบบ</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {staffList.map((staff) => (
          <div key={staff.id} className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative group">
            <button 
              onClick={() => onDeleteStaff(staff.id)}
              className="absolute top-4 right-4 p-2 text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100"
              title="ลบบัญชี"
            >
              🗑️
            </button>
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center text-xl font-black">
                {staff.firstName[0]}
              </div>
              <div>
                <h4 className="font-bold text-slate-900">{staff.firstName} {staff.lastName}</h4>
                <p className="text-[10px] text-indigo-500 font-black uppercase tracking-widest">@{staff.username}</p>
              </div>
            </div>
            <div className="space-y-2 text-xs text-slate-500">
              <p className="flex items-center gap-2"><span>📧</span> {staff.email || '-'}</p>
              <p className="flex items-center gap-2"><span>📞</span> {staff.phone || '-'}</p>
              <p className="flex items-center gap-2"><span>📅</span> ลงทะเบียนเมื่อ: {staff.createdAt}</p>
            </div>
          </div>
        ))}
        {staffList.length === 0 && (
          <div className="col-span-full py-16 text-center text-slate-400 bg-white rounded-[2.5rem] border border-dashed border-slate-200">
            <div className="text-4xl mb-4">👥</div>
            <p>ยังไม่มีบัญชีทีมงานที่ลงทะเบียนในระบบ</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default StaffManagement;
