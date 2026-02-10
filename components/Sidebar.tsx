
import React from 'react';
import { UserRole } from '../types';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  role: UserRole;
  companyName: string;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, role, companyName }) => {
  const allMenuItems = [
    { id: 'dashboard', icon: '📊', label: 'Dashboard', roles: [UserRole.ADMIN] },
    { id: 'properties', icon: '🏠', label: 'จัดการที่พัก', roles: [UserRole.ADMIN, UserRole.USER] },
    { id: 'daily', icon: '🗓️', label: 'จัดการรายวัน', roles: [UserRole.ADMIN, UserRole.USER] },
    { id: 'accounting', icon: '🧾', label: 'ระบบบัญชี', roles: [UserRole.ADMIN] },
    { id: 'staff', icon: '👥', label: 'จัดการทีมงาน', roles: [UserRole.ADMIN] },
    { id: 'notifications', icon: '🔔', label: 'การแจ้งเตือน', roles: [UserRole.ADMIN] },
    { id: 'reports', icon: '📝', label: 'รายงานสรุป', roles: [UserRole.ADMIN] },
    { id: 'settings', icon: '⚙️', label: 'ตั้งค่าระบบ', roles: [UserRole.ADMIN] },
  ];

  const menuItems = allMenuItems.filter(item => item.roles.includes(role));

  return (
    <div className="w-64 bg-slate-900 text-white min-h-screen flex flex-col no-print shadow-2xl">
      <div className="p-6">
        <h1 className="text-xl font-bold tracking-wider text-amber-500 uppercase truncate">{companyName.split(' ')[0]}</h1>
        <p className="text-[10px] text-slate-400 mt-1 uppercase font-bold tracking-widest">Management Suite</p>
      </div>
      
      <nav className="flex-1 px-4 space-y-1">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
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
      
      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-3 px-4 py-2 text-sm text-slate-400 bg-slate-800/40 rounded-2xl">
          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-[10px] font-black">
            {role === UserRole.ADMIN ? 'AD' : 'ST'}
          </div>
          <div>
            <p className="text-white font-bold text-xs">{role === UserRole.ADMIN ? 'Administrator' : 'Staff Member'}</p>
            <p className="text-[9px] uppercase tracking-widest text-amber-500/80">{role}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
