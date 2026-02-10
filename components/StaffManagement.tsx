
import React, { useState } from 'react';
import { Staff, ApprovalStatus, UserRole } from '../types';

interface StaffManagementProps {
  staffList: Staff[];
  onDeleteStaff: (id: string) => void;
  onApproveStaff: (id: string) => void;
}

const StaffManagement: React.FC<StaffManagementProps> = ({ staffList, onDeleteStaff, onApproveStaff }) => {
  const [selectedDoc, setSelectedDoc] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">จัดการสมาชิกและทีมงาน</h2>
          <p className="text-sm text-slate-500">จัดการสิทธิ์สมาชิกทั่วไป และพิจารณาอนุมัติ Agent ใหม่</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {staffList.map((staff) => (
          <div key={staff.id} className={`bg-white p-6 rounded-3xl border shadow-sm relative group transition-all ${staff.approvalStatus === ApprovalStatus.PENDING ? 'border-amber-200 ring-2 ring-amber-50' : 'border-slate-100'}`}>
            <button onClick={() => onDeleteStaff(staff.id)} className="absolute top-4 right-4 p-2 text-slate-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100">🗑️</button>
            
            <div className="flex items-center gap-4 mb-6">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl font-black ${staff.role === UserRole.STAFF ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'}`}>
                {staff.firstName[0]}
              </div>
              <div>
                <h4 className="font-bold text-slate-900">{staff.firstName} {staff.lastName}</h4>
                <div className="flex items-center gap-2">
                   <p className="text-[10px] text-slate-400 font-black uppercase">{staff.role}</p>
                   {staff.approvalStatus === ApprovalStatus.PENDING && (
                     <span className="text-[8px] bg-amber-500 text-white px-1.5 py-0.5 rounded font-black animate-pulse">PENDING</span>
                   )}
                </div>
              </div>
            </div>

            <div className="space-y-2 text-[11px] text-slate-500 bg-slate-50 p-4 rounded-2xl mb-6">
              <p className="flex items-center gap-2 truncate"><span>📧</span> {staff.email || '-'}</p>
              <p className="flex items-center gap-2"><span>📞</span> {staff.phone || '-'}</p>
              <p className="flex items-center gap-2"><span>🎫</span> ID: {staff.idCardNumber || 'รอดำเนินการ'}</p>
              <p className="flex items-center gap-2"><span>🔑</span> Code: <span className="font-black text-indigo-600">{staff.memberCode}</span></p>
            </div>

            {staff.role === UserRole.STAFF && staff.approvalStatus === ApprovalStatus.PENDING && (
              <div className="space-y-4 pt-4 border-t border-slate-100">
                 <div className="flex gap-2">
                    {staff.idCardPhoto && <button onClick={() => setSelectedDoc(staff.idCardPhoto!)} className="flex-1 py-2 bg-slate-100 text-[10px] font-bold rounded-lg hover:bg-slate-200 transition-all">📄 ดูบัตร ปชช.</button>}
                    {staff.deedPhoto && <button onClick={() => setSelectedDoc(staff.deedPhoto!)} className="flex-1 py-2 bg-slate-100 text-[10px] font-bold rounded-lg hover:bg-slate-200 transition-all">📜 ดูโฉนด</button>}
                 </div>
                 <button 
                    onClick={() => onApproveStaff(staff.id)}
                    className="w-full py-3 bg-emerald-500 text-white font-black rounded-xl shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all text-xs"
                 >
                    อนุมัติ Agent นี้
                 </button>
              </div>
            )}
          </div>
        ))}
        {staffList.length === 0 && (
          <div className="col-span-full py-20 text-center text-slate-300 border-2 border-dashed border-slate-100 rounded-[2.5rem]">
            <p className="text-5xl mb-4 opacity-20">👥</p>
            <p className="font-bold">ยังไม่มีรายชื่อทีมงานในระบบ</p>
          </div>
        )}
      </div>

      {selectedDoc && (
        <div className="fixed inset-0 bg-slate-950/90 z-[1000] flex items-center justify-center p-8" onClick={() => setSelectedDoc(null)}>
           <div className="max-w-4xl max-h-full bg-white p-2 rounded-2xl overflow-hidden shadow-2xl relative">
              <button className="absolute top-4 right-4 bg-white/80 w-8 h-8 rounded-full font-black text-slate-900 shadow-md">✕</button>
              <img src={selectedDoc} className="max-h-[85vh] object-contain" />
           </div>
        </div>
      )}
    </div>
  );
};

export default StaffManagement;
