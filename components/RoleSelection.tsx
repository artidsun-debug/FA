
import React from 'react';
import { UserRole } from '../types';

interface RoleSelectionProps {
  onSelect: (role: UserRole) => void;
}

const RoleSelection: React.FC<RoleSelectionProps> = ({ onSelect }) => {
  return (
    <div className="fixed inset-0 bg-slate-950 flex items-center justify-center p-4 z-[9999]">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="col-span-full text-center mb-4">
          <h1 className="text-4xl font-black text-white mb-2 uppercase tracking-tighter">
            FIRSTARTHUR <span className="text-amber-500">RENTAL</span>
          </h1>
          <p className="text-slate-400 font-medium">กรุณาเลือกสิทธิ์การเข้าใช้งานระบบ</p>
        </div>

        <button 
          onClick={() => onSelect(UserRole.ADMIN)}
          className="group relative bg-slate-900 border border-slate-800 p-10 rounded-3xl hover:border-amber-500 transition-all text-left overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-8 text-6xl opacity-10 group-hover:opacity-20 transition-opacity">🔐</div>
          <div className="w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-lg shadow-amber-500/20 group-hover:scale-110 transition-transform">
            👔
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">Administrator</h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            สิทธิ์ผู้ดูแลระบบสูงสุด สามารถจัดการที่พัก, บัญชีรายรับ-รายจ่าย, ดูรายงานสรุป และตั้งค่าระบบทั้งหมดได้
          </p>
          <div className="mt-8 flex items-center gap-2 text-amber-500 font-bold text-sm uppercase tracking-widest">
            Enter Admin Panel <span>→</span>
          </div>
        </button>

        <button 
          onClick={() => onSelect(UserRole.USER)}
          className="group relative bg-slate-900 border border-slate-800 p-10 rounded-3xl hover:border-indigo-500 transition-all text-left overflow-hidden"
        >
          <div className="absolute top-0 right-0 p-8 text-6xl opacity-10 group-hover:opacity-20 transition-opacity">🏢</div>
          <div className="w-16 h-16 bg-indigo-500 rounded-2xl flex items-center justify-center text-3xl mb-6 shadow-lg shadow-indigo-500/20 group-hover:scale-110 transition-transform">
            👤
          </div>
          <h3 className="text-2xl font-bold text-white mb-2">Staff / User</h3>
          <p className="text-slate-400 text-sm leading-relaxed">
            สิทธิ์เจ้าหน้าที่ปฏิบัติการ เน้นการจัดการที่พักรายเดือนและรายวัน, เช็คอิน-เช็คเอาท์ และข้อมูลผู้เช่าทั่วไป
          </p>
          <div className="mt-8 flex items-center gap-2 text-indigo-500 font-bold text-sm uppercase tracking-widest">
            Enter Staff Panel <span>→</span>
          </div>
        </button>

        <div className="col-span-full text-center mt-4">
          <p className="text-slate-600 text-[10px] uppercase tracking-widest">Firstarthur Property Management v2.5</p>
        </div>
      </div>
    </div>
  );
};

export default RoleSelection;
