
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
          <h2 className="text-2xl font-black text-slate-800">จัดการสมาชิกและทีมงาน</h2>
          <p className="text-sm text-slate-500">พิจารณาอนุมัติ Agent ใหม่ และจัดการสิทธิ์ผู้เข้าใช้งาน</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {staffList.map((staff) => (
          <div key={staff.id} className={`bg-white p-6 rounded-[2rem] border shadow-sm relative group transition-all ${staff.approvalStatus === ApprovalStatus.PENDING ? 'border-amber-200 ring-2 ring-amber-50' : 'border-slate-100'}`}>
            <button onClick={() => onDeleteStaff(staff.id)} className="absolute top-6 right-6 p-2 text-slate-200 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100">🗑️</button>
            
            <div className="flex items-center gap-4 mb-6">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black shadow-inner ${staff.role === UserRole.STAFF ? 'bg-amber-100 text-amber-700' : 'bg-indigo-100 text-indigo-700'}`}>
                {staff.firstName[0]}
              </div>
              <div>
                <h4 className="font-black text-slate-900 text-lg leading-tight">{staff.firstName} {staff.lastName}</h4>
                <div className="flex items-center gap-2 mt-1">
                   <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{staff.role}</p>
                   {staff.approvalStatus === ApprovalStatus.PENDING && (
                     <span className="text-[8px] bg-amber-500 text-white px-2 py-0.5 rounded font-black animate-pulse uppercase">Waiting Approval</span>
                   )}
                </div>
              </div>
            </div>

            <div className="space-y-2 text-[11px] text-slate-500 bg-slate-50 p-5 rounded-2xl mb-6 border border-slate-100">
              <p className="flex items-center gap-2 truncate"><span>📧</span> {staff.email || '-'}</p>
              <p className="flex items-center gap-2"><span>📞</span> {staff.phone || '-'}</p>
              <p className="flex items-center gap-2"><span>🎫</span> ID Card: {staff.idCardNumber || 'รอการยืนยัน'}</p>
              <p className="flex items-center gap-2"><span>🔑</span> Member Code: <span className="font-black text-indigo-600 select-all">{staff.memberCode}</span></p>
            </div>

            {staff.role === UserRole.STAFF && staff.approvalStatus === ApprovalStatus.PENDING && (
              <div className="space-y-4 pt-4 border-t border-slate-100">
                 <div className="flex gap-2">
                    {staff.idCardPhoto && <button onClick={() => setSelectedDoc(staff.idCardPhoto!)} className="flex-1 py-2.5 bg-slate-100 text-[10px] font-black rounded-xl hover:bg-slate-200 transition-all uppercase">Check ID Card</button>}
                    {staff.deedPhoto && <button onClick={() => setSelectedDoc(staff.deedPhoto!)} className="flex-1 py-2.5 bg-slate-100 text-[10px] font-black rounded-xl hover:bg-slate-200 transition-all uppercase">Check Deed</button>}
                 </div>
                 <button 
                    onClick={() => onApproveStaff(staff.id)}
                    className="w-full py-4 bg-emerald-500 text-white font-black rounded-2xl shadow-xl shadow-emerald-500/20 hover:bg-emerald-600 transition-all text-xs uppercase"
                 >
                    Approve Agent Account
                 </button>
              </div>
            )}
            
            {staff.approvalStatus === ApprovalStatus.APPROVED && (
              <div className="flex justify-center pt-2">
                 <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">✓ Account Verified</span>
              </div>
            )}
          </div>
        ))}
        {staffList.length === 0 && (
          <div className="col-span-full py-24 text-center text-slate-300 border-2 border-dashed border-slate-100 rounded-[3rem] bg-slate-50/50">
            <p className="text-6xl mb-4 opacity-20">👥</p>
            <p className="font-black">ยังไม่มีรายชื่อสมาชิกหรือทีมงานในระบบ</p>
          </div>
        )}
      </div>

      {selectedDoc && (
        <div className="fixed inset-0 bg-slate-950/90 z-[1000] flex items-center justify-center p-4 lg:p-8" onClick={() => setSelectedDoc(null)}>
           <div className="max-w-4xl max-h-full bg-white p-2 rounded-3xl overflow-hidden shadow-2xl relative" onClick={e => e.stopPropagation()}>
              <button onClick={() => setSelectedDoc(null)} className="absolute top-4 right-4 bg-white/90 w-10 h-10 rounded-full font-black text-slate-900 shadow-xl hover:scale-110 transition-transform">✕</button>
              <img src={selectedDoc} className="max-h-[85vh] w-auto object-contain" />
           </div>
        </div>
      )}
    </div>
  );
};

export default StaffManagement;
