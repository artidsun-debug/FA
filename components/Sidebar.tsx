
import React from 'react';
import { UserRole, Staff } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  role: UserRole;
  companyName: string;
  isOpen: boolean;
  onClose: () => void;
  currentUser: Staff | null;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, role, companyName, isOpen, onClose, currentUser }) => {
  const allMenuItems = [
    { id: 'dashboard', icon: '📊', label: 'Dashboard', roles: [UserRole.ADMIN] },
    { id: 'properties', icon: '🏠', label: 'จัดการที่พัก', roles: [UserRole.ADMIN, UserRole.STAFF, UserRole.OWNER, UserRole.TENANT, UserRole.LAWYER] },
    { id: 'daily', icon: '🗓️', label: 'จัดการรายวัน', roles: [UserRole.ADMIN, UserRole.STAFF] },
    { id: 'accounting', icon: '🧾', label: 'ระบบบัญชี', roles: [UserRole.ADMIN] },
    { id: 'membership', icon: '💎', label: 'สมาชิกและแพ็คเกจ', roles: [UserRole.ADMIN] },
    { id: 'staff', icon: '👥', label: 'จัดการทีมงาน', roles: [UserRole.ADMIN] },
    { id: 'notifications', icon: '🔔', label: 'การแจ้งเตือน', roles: [UserRole.ADMIN] },
    { id: 'reports', icon: '📝', label: 'รายงานสรุป', roles: [UserRole.ADMIN] },
    { id: 'settings', icon: '⚙️', label: 'ตั้งค่าระบบ', roles: [UserRole.ADMIN] },
  ];

  const menuItems = allMenuItems.filter(item => item.roles.includes(role));

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      <div className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 bg-slate-900 text-white min-h-screen flex flex-col no-print shadow-2xl shrink-0 transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        <div className="p-6 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-bold tracking-wider text-amber-500 uppercase truncate">{companyName.split(' ')[0]}</h1>
            <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-widest">Management Suite</p>
          </div>
          <button onClick={onClose} className="lg:hidden text-slate-400 hover:text-white">✕</button>
        </div>
        
        {/* Current User Member Code Box */}
        {currentUser && (
          <div className="mx-4 mb-6 p-4 bg-indigo-900/50 border border-indigo-500/30 rounded-2xl text-center">
            <p className="text-[9px] font-black text-indigo-300 uppercase tracking-widest mb-1">Your Member Code</p>
            <p className="text-lg font-black text-white tracking-widest select-all cursor-pointer" title="คลิกเพื่อคลุมรหัส">{currentUser.memberCode}</p>
            <p className="text-[8px] text-indigo-400 mt-1 italic">บอกรหัสนี้ให้ Agent ดึงเข้าห้อง</p>
          </div>
        )}

        <nav className="flex-1 px-4 space-y-1 overflow-y-auto overflow-touch">
          {menuItems.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                setActiveTab(item.id);
                if (window.innerWidth < 1024) onClose();
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                activeTab === item.id 
                  ? 'bg-amber-600 text-white shadow-lg shadow-amber-900/20' 
                  : 'text-slate-400 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <span className="text-lg">{item.icon}</span>
              <span className="font-semibold text-sm">{item.label}</span>
            </button>
          ))}
        </nav>
        
        <div className="p-4 border-t border-slate-800 safe-pb">
          <div className="flex items-center gap-3 px-4 py-3 text-sm text-slate-400 bg-slate-800/40 rounded-2xl">
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-black shrink-0">
              {currentUser?.firstName[0] || 'AD'}
            </div>
            <div className="min-w-0">
              <p className="text-white font-bold text-xs truncate">{currentUser?.firstName || 'Administrator'}</p>
              <p className="text-[9px] uppercase tracking-widest text-amber-500/80">{role}</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
