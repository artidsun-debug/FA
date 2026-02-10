
import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import PropertyDetail from './components/PropertyDetail';
import AISearch from './components/AISearch';
import AccountingSystem from './components/AccountingSystem';
import DailyManagement from './components/DailyManagement';
import StaffManagement from './components/StaffManagement';
import AdminSettings from './components/AdminSettings';
import ReportsSummary from './components/ReportsSummary';
import Login from './components/Login';
import AgentOnboarding from './components/AgentOnboarding';
import { Property, PropertyStatus, RepairStatus, AccountingDocument, RentalType, Expense, UserRole, Staff, CompanyInfo, SubscriptionTier, ApprovalStatus } from './types';
import { STATUS_COLORS, STATUS_LABELS } from './constants';
import { queryPropertiesWithAI } from './services/geminiService';
import { calculateCurrentStatus } from './utils/propertyUtils';

const INITIAL_COMPANY: CompanyInfo = {
  nameTh: "บริษัท เฟิร์สอาร์เธอร์ จำกัด",
  nameEn: "FIRST ARTHUR CO., LTD.",
  addressTh: "24/1 หมู่3 ต.หนองดินแดง อ.เมืองนครปฐม จ.นครปฐม 73000",
  taxId: "0745563002393",
  bankName: "ธนาคารกสิกรไทย",
  accountName: "บริษัทเฟิร์สอาร์เธอร์จำกัด",
  accountNumber: "1043443417",
  phone: "034106940",
  mobile: "0955581926",
  coordinates: "13.788395, 99.991404",
  logo: "🏢",
  subscription: { tier: SubscriptionTier.FREE, plan: 'NONE', autoRenew: false },
  pricing: { monthlyPrice: 990, yearlyPrice: 9900, currency: 'THB' }
};

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<Staff | null>(() => {
    const saved = localStorage.getItem('firstarthur_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [role, setRole] = useState<UserRole | null>(() => {
    const saved = localStorage.getItem('firstarthur_role');
    return (saved as UserRole) || null;
  });
  
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>(() => {
    const saved = localStorage.getItem('firstarthur_company');
    return saved ? JSON.parse(saved) : INITIAL_COMPANY;
  });

  const [staffMembers, setStaffMembers] = useState<Staff[]>(() => {
    const saved = localStorage.getItem('firstarthur_staff');
    return saved ? JSON.parse(saved) : [];
  });

  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [properties, setProperties] = useState<Property[]>(() => {
    const saved = localStorage.getItem('firstarthur_properties');
    const raw = saved ? JSON.parse(saved) : [];
    return raw.map((p: any) => ({ 
      ...p, 
      status: calculateCurrentStatus(p),
      linkedMembers: p.linkedMembers || [],
      paymentHistory: p.paymentHistory || []
    }));
  });
  
  const [filteredProperties, setFilteredProperties] = useState<Property[]>(properties);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [propertyFilter, setPropertyFilter] = useState<'ALL' | 'ACTIVE' | 'CANCELED'>('ACTIVE');
  
  const [isAdding, setIsAdding] = useState(false);
  const [newPropData, setNewPropData] = useState<Partial<Property>>({
    name: '', address: '', building: '', floor: '', roomNumber: '', unitNumber: '',
    status: PropertyStatus.VACANT, rentalType: RentalType.MONTHLY, rentAmount: 0,
    paymentDueDate: 1, contractStartDate: '', contractEndDate: '',
    tenantName: '', tenantPhone: '', bookings: [], documents: [],
    expenses: [], inspections: [], linkedMembers: [], paymentHistory: [], repairStatus: RepairStatus.NORMAL
  });

  useEffect(() => {
    localStorage.setItem('firstarthur_staff', JSON.stringify(staffMembers));
    if (currentUser) {
      const updatedSelf = staffMembers.find(s => s.id === currentUser.id);
      if (updatedSelf && JSON.stringify(updatedSelf) !== JSON.stringify(currentUser)) {
        setCurrentUser(updatedSelf);
        localStorage.setItem('firstarthur_user', JSON.stringify(updatedSelf));
      }
    }
  }, [staffMembers]);

  useEffect(() => {
    localStorage.setItem('firstarthur_properties', JSON.stringify(properties));
  }, [properties]);

  const handleLogin = (selectedRole: UserRole, user: Staff | null) => {
    setRole(selectedRole);
    setCurrentUser(user);
    localStorage.setItem('firstarthur_role', selectedRole);
    if (user) localStorage.setItem('firstarthur_user', JSON.stringify(user));
    setActiveTab(selectedRole === UserRole.STAFF || selectedRole === UserRole.ADMIN ? 'dashboard' : 'properties');
  };

  const handleLogout = () => {
    setRole(null);
    setCurrentUser(null);
    localStorage.removeItem('firstarthur_role');
    localStorage.removeItem('firstarthur_user');
  };

  const handleAISearch = async (query: string) => {
    setIsSearching(true);
    const results = await queryPropertiesWithAI(properties, query);
    setFilteredProperties(results);
    setIsSearching(false);
    setActiveTab('properties');
  };

  const handleUpdateProperty = (updated: Property) => {
    const refreshed = { ...updated, status: calculateCurrentStatus(updated) };
    setProperties(properties.map(p => p.id === refreshed.id ? refreshed : p));
  };

  const handleDeleteProperty = (id: string) => {
    if (window.confirm('ลบที่พักนี้หรือไม่?')) {
      setProperties(properties.filter(p => p.id !== id));
      setSelectedPropertyId(null);
    }
  };

  const handleAddProperty = () => {
    if (!newPropData.name || !newPropData.rentAmount) return alert('ระบุชื่อและราคา');
    const base: Property = { ...newPropData as Property, id: Math.random().toString(36).substr(2, 9), linkedMembers: [], paymentHistory: [] };
    setProperties([{ ...base, status: calculateCurrentStatus(base) }, ...properties]);
    setIsAdding(false);
  };

  const visibleProperties = useMemo(() => {
    if (role === UserRole.ADMIN || role === UserRole.STAFF) return properties;
    if (currentUser) {
       return properties.filter(p => p.linkedMembers?.some(m => m.memberCode === currentUser.memberCode));
    }
    return [];
  }, [properties, role, currentUser]);

  const displayProperties = useMemo(() => {
    const base = (filteredProperties.length !== properties.length && activeTab === 'properties') ? filteredProperties : visibleProperties;
    if (propertyFilter === 'ACTIVE') return base.filter(p => p.status !== PropertyStatus.CANCELED);
    if (propertyFilter === 'CANCELED') return base.filter(p => p.status === PropertyStatus.CANCELED);
    return base;
  }, [visibleProperties, filteredProperties, propertyFilter, activeTab]);

  if (!role) return <Login onLogin={handleLogin} staffMembers={staffMembers} onRegister={(s) => setStaffMembers([...staffMembers, s])} company={companyInfo} />;

  // ระบบตรวจสอบการอนุมัติสำหรับ Agent (Staff)
  if (role === UserRole.STAFF && currentUser?.approvalStatus !== ApprovalStatus.APPROVED) {
    return <AgentOnboarding agent={currentUser!} onUpdateAgent={(updated) => setStaffMembers(staffMembers.map(s => s.id === updated.id ? updated : s))} onLogout={handleLogout} />;
  }

  return (
    <div className="flex bg-slate-50 min-h-screen">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} role={role} companyName={companyInfo.nameTh} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} currentUser={currentUser} />
      
      <main className="flex-1 overflow-y-auto safe-pt">
        <header className="bg-white/80 backdrop-blur-md sticky top-0 z-30 px-8 py-4 border-b border-slate-100 flex items-center justify-between no-print">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 bg-slate-100 rounded-xl">☰</button>
            <AISearch onSearch={handleAISearch} isSearching={isSearching} />
          </div>
          <div className="flex items-center gap-4">
             <div className="hidden md:block text-[10px] font-black uppercase text-slate-400">Mode: {role}</div>
             <button onClick={handleLogout} className="p-2 text-slate-600 bg-slate-100 rounded-xl font-bold text-xs">🚪 Logout</button>
          </div>
        </header>

        <div className="p-8">
          {activeTab === 'dashboard' && (role === UserRole.ADMIN || role === UserRole.STAFF) && <Dashboard properties={properties} aiInsight="Dashboard พร้อมใช้งาน" company={companyInfo} />}
          
          {activeTab === 'properties' && (
            selectedPropertyId ? (
              <PropertyDetail 
                property={properties.find(p => p.id === selectedPropertyId)!} 
                onUpdate={handleUpdateProperty} 
                onDelete={handleDeleteProperty} 
                onBack={() => setSelectedPropertyId(null)}
                staffMembers={staffMembers}
                currentUser={currentUser}
              />
            ) : (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-black text-slate-800 tracking-tight">ที่พักทั้งหมด</h2>
                  {(role === UserRole.ADMIN || role === UserRole.STAFF) && (
                    <button onClick={() => setIsAdding(true)} className="px-6 py-2.5 bg-indigo-600 text-white font-black rounded-xl shadow-lg text-sm">+ เพิ่มที่พัก</button>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {displayProperties.map(p => (
                    <div key={p.id} onClick={() => setSelectedPropertyId(p.id)} className="bg-white rounded-[2rem] p-6 border border-slate-100 shadow-sm hover:shadow-xl transition-all cursor-pointer group">
                       <div className="flex justify-between mb-6">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${STATUS_COLORS[p.status]}`}>{STATUS_LABELS[p.status]}</span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">{p.rentalType}</span>
                       </div>
                       <h3 className="text-xl font-black text-slate-800 mb-1 group-hover:text-indigo-600 transition-colors">{p.name}</h3>
                       <p className="text-xs text-slate-400 mb-6 truncate">📍 {p.address}</p>
                       <div className="flex justify-between items-end border-t pt-4">
                          <div><p className="text-[10px] text-slate-300 font-bold uppercase">Rent</p><p className="text-lg font-black text-indigo-600">฿{p.rentAmount.toLocaleString()}</p></div>
                          <div className="text-right text-[10px] text-slate-400 font-bold">วันที่จ่าย {p.paymentDueDate}</div>
                       </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          )}
          {activeTab === 'staff' && role === UserRole.ADMIN && (
            <StaffManagement 
              staffList={staffMembers} 
              onDeleteStaff={(id) => setStaffMembers(staffMembers.filter(s => s.id !== id))}
              onApproveStaff={(id) => setStaffMembers(staffMembers.map(s => s.id === id ? {...s, approvalStatus: ApprovalStatus.APPROVED} : s))}
            />
          )}
          {/* Add more tabs as needed... */}
        </div>
      </main>

      {isAdding && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl p-10 animate-in zoom-in duration-300">
            <h3 className="text-2xl font-black mb-8">🏢 เพิ่มที่พักใหม่</h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="col-span-2"><input type="text" placeholder="ชื่อโครงการ" className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500" value={newPropData.name} onChange={e => setNewPropData({...newPropData, name: e.target.value})} /></div>
              <input type="text" placeholder="ตึก" className="px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500" value={newPropData.building} onChange={e => setNewPropData({...newPropData, building: e.target.value})} />
              <input type="text" placeholder="ห้อง" className="px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500" value={newPropData.roomNumber} onChange={e => setNewPropData({...newPropData, roomNumber: e.target.value})} />
              <input type="number" placeholder="วันกำหนดจ่ายเงิน (1-31)" className="px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500" value={newPropData.paymentDueDate} onChange={e => setNewPropData({...newPropData, paymentDueDate: parseInt(e.target.value) || 1})} />
              <input type="number" placeholder="ราคาเช่า" className="px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500" value={newPropData.rentAmount} onChange={e => setNewPropData({...newPropData, rentAmount: parseInt(e.target.value) || 0})} />
              <div className="col-span-2 grid grid-cols-2 gap-4">
                <div className="space-y-1"><label className="text-[10px] font-black uppercase text-slate-400">วันที่เริ่มสัญญา</label><input type="date" className="w-full px-4 py-2 rounded-xl border border-slate-200" value={newPropData.contractStartDate} onChange={e => setNewPropData({...newPropData, contractStartDate: e.target.value})} /></div>
                <div className="space-y-1"><label className="text-[10px] font-black uppercase text-slate-400">วันที่สิ้นสุดสัญญา</label><input type="date" className="w-full px-4 py-2 rounded-xl border border-slate-200" value={newPropData.contractEndDate} onChange={e => setNewPropData({...newPropData, contractEndDate: e.target.value})} /></div>
              </div>
            </div>
            <div className="mt-10 flex gap-4">
              <button onClick={() => setIsAdding(false)} className="flex-1 py-4 text-slate-500 font-bold hover:bg-slate-100 rounded-2xl">ยกเลิก</button>
              <button onClick={handleAddProperty} className="flex-[2] py-4 bg-slate-900 text-white font-black rounded-2xl shadow-xl">บันทึกที่พัก</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
