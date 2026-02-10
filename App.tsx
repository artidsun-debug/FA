
import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import PropertyDetail from './components/PropertyDetail';
import AISearch from './components/AISearch';
import AccountingSystem from './components/AccountingSystem';
import DailyManagement from './components/DailyManagement';
import StaffManagement from './components/StaffManagement';
import AdminSettings from './components/AdminSettings';
import MembershipManagement from './components/MembershipManagement';
import ReportsSummary from './components/ReportsSummary';
import Login from './components/Login';
import AgentOnboarding from './components/AgentOnboarding';
import { Property, PropertyStatus, RepairStatus, AccountingDocument, RentalType, Expense, UserRole, Staff, CompanyInfo, SubscriptionTier, ApprovalStatus } from './types';
import { STATUS_COLORS, STATUS_LABELS } from './constants';
import { queryPropertiesWithAI, getPropertyInsights } from './services/geminiService';
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
  subscription: {
    tier: SubscriptionTier.FREE,
    plan: 'NONE',
    autoRenew: false
  },
  pricing: {
    monthlyPrice: 990,
    yearlyPrice: 9900,
    currency: 'THB'
  }
};

const MOCK_PROPERTIES: Property[] = [
  {
    id: '1',
    name: 'Artisan Condo',
    building: 'A',
    floor: '10',
    roomNumber: '101',
    unitNumber: '123/456',
    address: 'Huai Khwang, Bangkok',
    status: PropertyStatus.OCCUPIED,
    rentalType: RentalType.MONTHLY,
    rentAmount: 25000,
    paymentDueDate: 5,
    contractStartDate: '2023-12-01',
    contractEndDate: '2025-11-30',
    tenantName: 'John Doe',
    tenantPhone: '081-234-5678',
    bookings: [],
    documents: [],
    expenses: [],
    inspections: [],
    linkedMembers: [
       { memberId: 'user_01', memberCode: 'FA-MEMBER', name: 'John Doe', role: UserRole.TENANT, joinedDate: '2023-12-01' }
    ],
    repairStatus: RepairStatus.NORMAL
  }
];

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
    const raw = saved ? JSON.parse(saved) : MOCK_PROPERTIES;
    return raw.map((p: Property) => ({ 
      ...p, 
      status: calculateCurrentStatus(p),
      linkedMembers: p.linkedMembers || [] 
    }));
  });
  const [filteredProperties, setFilteredProperties] = useState<Property[]>(properties);
  const [accountingDocs, setAccountingDocs] = useState<AccountingDocument[]>([]);
  const [globalExpenses, setGlobalExpenses] = useState<Expense[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [aiInsight, setAiInsight] = useState('กำลังรวบรวมข้อมูลสรุปจาก AI...');
  const [propertyFilter, setPropertyFilter] = useState<'ALL' | 'ACTIVE' | 'CANCELED'>('ACTIVE');
  
  const [isAdding, setIsAdding] = useState(false);
  const [newPropData, setNewPropData] = useState<Partial<Property>>({
    name: '', address: '', building: '', floor: '', roomNumber: '', unitNumber: '',
    status: PropertyStatus.VACANT, rentalType: RentalType.MONTHLY, rentAmount: 0,
    paymentDueDate: 1, contractStartDate: '', contractEndDate: '',
    tenantName: '', tenantPhone: '', bookings: [], documents: [],
    expenses: [], inspections: [], linkedMembers: [], repairStatus: RepairStatus.NORMAL
  });

  useEffect(() => {
    localStorage.setItem('firstarthur_company', JSON.stringify(companyInfo));
  }, [companyInfo]);

  useEffect(() => {
    localStorage.setItem('firstarthur_staff', JSON.stringify(staffMembers));
    // Update current user if they are in the list (for approval status sync)
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
    
    if (selectedRole === UserRole.STAFF) {
      setActiveTab('properties');
    } else {
      setActiveTab('dashboard');
    }
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
    setPropertyFilter('ALL'); 
  };

  const handleUpdateProperty = (updated: Property) => {
    const refreshed = { ...updated, status: calculateCurrentStatus(updated) };
    const newProps = properties.map(p => p.id === refreshed.id ? refreshed : p);
    setProperties(newProps);
    setFilteredProperties(newProps);
  };

  const handleDeleteProperty = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (window.confirm('ลบที่พักนี้หรือไม่?')) {
      const newProps = properties.filter(p => p.id !== id);
      setProperties(newProps);
      setFilteredProperties(newProps);
      setSelectedPropertyId(null);
    }
  };

  const handleAddProperty = () => {
    if (!newPropData.name || !newPropData.rentAmount) return alert('ระบุชื่อและราคา');
    const base: Property = { ...newPropData as Property, id: Math.random().toString(36).substr(2, 9), linkedMembers: [] };
    const created = { ...base, status: calculateCurrentStatus(base) };
    const updated = [created, ...properties];
    setProperties(updated);
    setFilteredProperties(updated);
    setIsAdding(false);
  };

  const handleUpdateStaff = (updated: Staff) => {
     setStaffMembers(prev => prev.map(s => s.id === updated.id ? updated : s));
  };

  // Visibility Logic: Admin/Agent see all, Others see only linked rooms
  const visibleProperties = useMemo(() => {
    if (role === UserRole.ADMIN || role === UserRole.STAFF) {
       return properties;
    }
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

  if (!role) {
    return <Login onLogin={handleLogin} staffMembers={staffMembers} onRegister={(s) => setStaffMembers([...staffMembers, s])} company={companyInfo} />;
  }

  // Intercept Pending Agents
  if (role === UserRole.STAFF && currentUser?.approvalStatus !== ApprovalStatus.APPROVED) {
    return <AgentOnboarding agent={currentUser!} onUpdateAgent={handleUpdateStaff} onLogout={handleLogout} />;
  }

  return (
    <div className="flex bg-slate-50 min-h-screen">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} role={role} companyName={companyInfo.nameTh} isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} currentUser={currentUser} />
      
      <main className="flex-1 overflow-y-auto overflow-touch safe-pt">
        <header className="bg-white/80 backdrop-blur-md sticky top-0 z-30 px-4 lg:px-8 py-4 border-b border-slate-100 flex items-center justify-between no-print">
          <div className="flex items-center gap-3">
            <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 bg-slate-100 rounded-xl">☰</button>
            <AISearch onSearch={handleAISearch} isSearching={isSearching} />
          </div>

          <div className="flex items-center gap-4">
            <div className={`hidden md:block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${role === UserRole.ADMIN ? 'bg-amber-100 text-amber-800' : 'bg-indigo-100 text-indigo-800'}`}>Mode: {role}</div>
            <button onClick={handleLogout} className="p-2 lg:px-3 lg:py-2 bg-slate-100 text-slate-600 rounded-xl text-xs font-bold transition-all">🚪 Logout</button>
            <button onClick={() => window.print()} className="p-2 lg:px-4 lg:py-2 bg-slate-900 text-white text-sm font-bold rounded-xl hidden sm:flex items-center gap-2">🖨️ PDF</button>
          </div>
        </header>

        <div className="p-4 lg:p-8 safe-pb">
          {activeTab === 'dashboard' && role === UserRole.ADMIN && <Dashboard properties={properties} aiInsight={aiInsight} company={companyInfo} />}
          
          {activeTab === 'properties' && (
            selectedPropertyId ? (
              <PropertyDetail 
                property={properties.find(p => p.id === selectedPropertyId)!} 
                onUpdate={handleUpdateProperty} 
                onDelete={handleDeleteProperty} 
                onBack={() => setSelectedPropertyId(null)}
                staffMembers={staffMembers}
              />
            ) : (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div className="space-y-1">
                    <h2 className="text-xl lg:text-2xl font-bold text-slate-800">รายการที่พัก ({role === UserRole.STAFF ? 'Agent View' : 'Member View'})</h2>
                    <div className="flex gap-4">
                      <button onClick={() => setPropertyFilter('ACTIVE')} className={`text-xs font-bold pb-1 border-b-2 ${propertyFilter === 'ACTIVE' ? 'border-amber-500' : 'text-slate-400'}`}>ปัจจุบัน</button>
                      <button onClick={() => setPropertyFilter('CANCELED')} className={`text-xs font-bold pb-1 border-b-2 ${propertyFilter === 'CANCELED' ? 'border-rose-500' : 'text-slate-400'}`}>ยกเลิก</button>
                    </div>
                  </div>
                  {(role === UserRole.ADMIN || role === UserRole.STAFF) && (
                    <div className="flex gap-2">
                       <button onClick={() => setIsAdding(true)} className="px-6 py-2.5 bg-amber-500 text-white font-bold rounded-xl shadow-lg shadow-amber-500/20 text-sm">+ เพิ่มที่พัก</button>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {displayProperties.map(p => (
                    <div key={p.id} onClick={() => setSelectedPropertyId(p.id)} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-xl transition-all cursor-pointer">
                       <div className="flex justify-between mb-6">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${STATUS_COLORS[p.status]}`}>{STATUS_LABELS[p.status]}</span>
                          <span className="text-[10px] text-slate-400 font-bold uppercase">{p.rentalType}</span>
                       </div>
                       <h3 className="text-xl font-black text-slate-800 mb-1">{p.name}</h3>
                       <p className="text-xs text-slate-400 mb-6">📍 {p.address}</p>
                       <div className="flex justify-between items-end border-t pt-4">
                          <div><p className="text-[10px] text-slate-300 font-bold uppercase">Rent</p><p className="text-xl font-black text-indigo-600">฿{p.rentAmount.toLocaleString()}</p></div>
                          <div className="text-right text-[10px] text-slate-400">ห้อง: {p.roomNumber}</div>
                       </div>
                    </div>
                  ))}
                  {displayProperties.length === 0 && (
                    <div className="col-span-full py-20 text-center text-slate-300 border-2 border-dashed rounded-[2.5rem]">
                       <span className="text-4xl block mb-2">🏢</span>
                       <p className="font-bold">ยังไม่พบที่พักในรายการของคุณ</p>
                    </div>
                  )}
                </div>
              </div>
            )
          )}

          {activeTab === 'daily' && (role === UserRole.ADMIN || role === UserRole.STAFF) && <DailyManagement properties={properties} onUpdateProperty={handleUpdateProperty} onAddProperty={() => setIsAdding(true)} onDeleteProperty={handleDeleteProperty} onExportExcel={() => {}} />}
          
          {activeTab === 'staff' && role === UserRole.ADMIN && (
            <StaffManagement 
              staffList={staffMembers} 
              onDeleteStaff={(id) => setStaffMembers(staffMembers.filter(s => s.id !== id))}
              onApproveStaff={(id) => setStaffMembers(staffMembers.map(s => s.id === id ? {...s, approvalStatus: ApprovalStatus.APPROVED} : s))}
            />
          )}

          {activeTab === 'reports' && role === UserRole.ADMIN && <ReportsSummary properties={properties} accountingDocs={accountingDocs} globalExpenses={globalExpenses} />}
          {activeTab === 'settings' && role === UserRole.ADMIN && <AdminSettings companyInfo={companyInfo} setCompanyInfo={setCompanyInfo} />}
        </div>
      </main>

      {/* Add Property Modal */}
      {isAdding && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl p-10">
            <h3 className="text-2xl font-black mb-8">🏢 เพิ่มที่พักใหม่</h3>
            <div className="grid grid-cols-2 gap-6">
              <div className="col-span-2"><input type="text" placeholder="ชื่อโครงการ" className="w-full px-4 py-3 rounded-xl border" value={newPropData.name} onChange={e => setNewPropData({...newPropData, name: e.target.value})} /></div>
              <div className="col-span-2"><textarea placeholder="ที่อยู่" className="w-full px-4 py-3 rounded-xl border h-20" value={newPropData.address} onChange={e => setNewPropData({...newPropData, address: e.target.value})} /></div>
              <input type="text" placeholder="ตึก" className="px-4 py-3 rounded-xl border" value={newPropData.building} onChange={e => setNewPropData({...newPropData, building: e.target.value})} />
              <input type="text" placeholder="ห้อง" className="px-4 py-3 rounded-xl border" value={newPropData.roomNumber} onChange={e => setNewPropData({...newPropData, roomNumber: e.target.value})} />
              <select className="px-4 py-3 rounded-xl border bg-white" value={newPropData.rentalType} onChange={e => setNewPropData({...newPropData, rentalType: e.target.value as any})}>
                <option value={RentalType.MONTHLY}>รายเดือน</option>
                <option value={RentalType.DAILY}>รายวัน</option>
              </select>
              <input type="number" placeholder="ราคาเช่า" className="px-4 py-3 rounded-xl border" value={newPropData.rentAmount} onChange={e => setNewPropData({...newPropData, rentAmount: parseInt(e.target.value) || 0})} />
            </div>
            <div className="mt-8 flex gap-3">
              <button onClick={() => setIsAdding(false)} className="flex-1 py-3 text-slate-500 font-bold">ยกเลิก</button>
              <button onClick={handleAddProperty} className="flex-[2] py-3 bg-slate-900 text-white font-black rounded-xl">บันทึก</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
