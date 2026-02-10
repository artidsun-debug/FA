
import React, { useState, useEffect, useMemo } from 'react';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import PropertyDetail from './components/PropertyDetail';
import AISearch from './components/AISearch';
import AccountingSystem from './components/AccountingSystem';
import DailyManagement from './components/DailyManagement';
import StaffManagement from './components/StaffManagement';
import AdminSettings from './components/AdminSettings';
import Login from './components/Login';
import { Property, PropertyStatus, RepairStatus, AccountingDocument, RentalType, Expense, UserRole, Staff, CompanyInfo } from './types';
import { STATUS_COLORS, STATUS_LABELS } from './constants';
import { queryPropertiesWithAI, getPropertyInsights } from './services/geminiService';

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
  logo: "🏢"
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
    contractEndDate: '2024-11-30',
    tenantName: 'John Doe',
    tenantPhone: '081-234-5678',
    bookings: [],
    documents: [],
    expenses: [
      { id: 'e1', title: 'ค่าส่วนกลางปี 2567', amount: 12000, category: 'COMMON_FEE', date: '2024-01-10', status: 'PAID' },
      { id: 'e2', title: 'ซ่อมก๊อกน้ำ', amount: 500, category: 'REPAIR', date: '2024-03-15', status: 'PAID' },
      { id: 'e3', title: 'ค่าจัดการรายเดือน (มิ.ย.)', amount: 1500, category: 'MANAGEMENT_FEE', date: '2024-06-01', status: 'PAID' },
      { id: 'e4', title: 'ค่านายหน้า (ต่อสัญญา)', amount: 25000, category: 'COMMISSION', date: '2023-12-05', status: 'PAID' }
    ],
    inspections: [],
    repairStatus: RepairStatus.NORMAL
  }
];

const App: React.FC = () => {
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
  const [properties, setProperties] = useState<Property[]>(() => {
    const saved = localStorage.getItem('firstarthur_properties');
    return saved ? JSON.parse(saved) : MOCK_PROPERTIES;
  });
  const [filteredProperties, setFilteredProperties] = useState<Property[]>(properties);
  const [accountingDocs, setAccountingDocs] = useState<AccountingDocument[]>([]);
  const [globalExpenses, setGlobalExpenses] = useState<Expense[]>([]);
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [aiInsight, setAiInsight] = useState('กำลังรวบรวมข้อมูลสรุปจาก AI...');
  const [propertyFilter, setPropertyFilter] = useState<'ALL' | 'ACTIVE' | 'CANCELED'>('ACTIVE');
  
  // Add Property State
  const [isAdding, setIsAdding] = useState(false);
  const [newPropData, setNewPropData] = useState<Partial<Property>>({
    name: '',
    address: '',
    building: '',
    floor: '',
    roomNumber: '',
    unitNumber: '',
    status: PropertyStatus.VACANT,
    rentalType: RentalType.MONTHLY,
    rentAmount: 0,
    paymentDueDate: 1,
    contractStartDate: '',
    contractEndDate: '',
    tenantName: '',
    tenantPhone: '',
    bookings: [],
    documents: [],
    expenses: [],
    inspections: [],
    repairStatus: RepairStatus.NORMAL
  });

  useEffect(() => {
    localStorage.setItem('firstarthur_company', JSON.stringify(companyInfo));
  }, [companyInfo]);

  useEffect(() => {
    localStorage.setItem('firstarthur_staff', JSON.stringify(staffMembers));
  }, [staffMembers]);

  useEffect(() => {
    localStorage.setItem('firstarthur_properties', JSON.stringify(properties));
  }, [properties]);

  useEffect(() => {
    if (role === UserRole.USER) {
      const restrictedTabs = ['dashboard', 'accounting', 'staff', 'notifications', 'reports', 'settings'];
      if (restrictedTabs.includes(activeTab)) {
        setActiveTab('properties');
      }
    }
  }, [role, activeTab]);

  useEffect(() => {
    const fetchInsight = async () => {
      const insight = await getPropertyInsights(properties);
      setAiInsight(insight);
    };
    fetchInsight();
  }, [properties]);

  const handleLogin = (selectedRole: UserRole) => {
    setRole(selectedRole);
    localStorage.setItem('firstarthur_role', selectedRole);
    if (selectedRole === UserRole.USER) {
      setActiveTab('properties');
    } else {
      setActiveTab('dashboard');
    }
  };

  const handleLogout = () => {
    setRole(null);
    localStorage.removeItem('firstarthur_role');
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
    const newProps = properties.map(p => p.id === updated.id ? updated : p);
    setProperties(newProps);
    setFilteredProperties(newProps);
  };

  const handleDeleteProperty = (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (window.confirm('คุณแน่ใจหรือไม่ว่าต้องการลบที่พักนี้?')) {
      const newProps = properties.filter(p => p.id !== id);
      setProperties(newProps);
      setFilteredProperties(newProps);
      setSelectedPropertyId(null);
    }
  };

  const handleAddProperty = () => {
    if (!newPropData.name || !newPropData.rentAmount) {
      alert('กรุณากรอกชื่อโครงการและราคาเช่า');
      return;
    }

    const createdProperty: Property = {
      ...newPropData as Property,
      id: Math.random().toString(36).substr(2, 9),
      status: (newPropData.tenantName && newPropData.contractStartDate) ? PropertyStatus.OCCUPIED : PropertyStatus.VACANT,
      bookings: [],
      documents: [],
      expenses: [],
      inspections: [],
      repairStatus: RepairStatus.NORMAL
    };

    const updatedProps = [createdProperty, ...properties];
    setProperties(updatedProps);
    setFilteredProperties(updatedProps);
    setIsAdding(false);
    setNewPropData({
      name: '',
      address: '',
      building: '',
      floor: '',
      roomNumber: '',
      unitNumber: '',
      status: PropertyStatus.VACANT,
      rentalType: RentalType.MONTHLY,
      rentAmount: 0,
      paymentDueDate: 1,
      contractStartDate: '',
      contractEndDate: '',
      tenantName: '',
      tenantPhone: ''
    });
    alert('เพิ่มข้อมูลที่พักเรียบร้อยแล้ว');
  };

  const selectedProperty = useMemo(() => 
    properties.find(p => p.id === selectedPropertyId), 
  [properties, selectedPropertyId]);

  const displayProperties = useMemo(() => {
    const base = (filteredProperties.length !== properties.length && activeTab === 'properties') ? filteredProperties : properties;
    if (propertyFilter === 'ACTIVE') return base.filter(p => p.status !== PropertyStatus.CANCELED);
    if (propertyFilter === 'CANCELED') return base.filter(p => p.status === PropertyStatus.CANCELED);
    return base;
  }, [properties, filteredProperties, propertyFilter, activeTab]);

  if (!role) {
    return <Login onLogin={handleLogin} staffMembers={staffMembers} onRegister={(s) => setStaffMembers([...staffMembers, s])} company={companyInfo} />;
  }

  return (
    <div className="flex bg-slate-50 min-h-screen">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} role={role} companyName={companyInfo.nameTh} />
      
      <main className="flex-1 overflow-y-auto">
        <header className="bg-white/80 backdrop-blur-md sticky top-0 z-20 px-8 py-4 border-b border-slate-100 flex items-center justify-between no-print">
          <AISearch onSearch={handleAISearch} isSearching={isSearching} />
          <div className="flex items-center gap-4">
            <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${role === UserRole.ADMIN ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-indigo-100 text-indigo-800 border-indigo-200'}`}>
              Mode: {role}
            </div>
            <button onClick={handleLogout} className="px-3 py-2 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-xl text-xs font-bold transition-all">🚪 Logout</button>
            <div className="h-8 w-px bg-slate-200"></div>
            <button onClick={() => window.print()} className="px-4 py-2 bg-slate-900 text-white text-sm font-bold rounded-xl flex items-center gap-2 hover:bg-slate-800 transition-colors">
              <span>🖨️</span> Export PDF
            </button>
          </div>
        </header>

        <div className="p-8">
          {activeTab === 'dashboard' && role === UserRole.ADMIN && <Dashboard properties={properties} aiInsight={aiInsight} company={companyInfo} />}
          
          {activeTab === 'properties' && (
            selectedProperty ? (
              <PropertyDetail property={selectedProperty} onUpdate={handleUpdateProperty} onDelete={handleDeleteProperty} onBack={() => setSelectedPropertyId(null)} />
            ) : (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-bold text-slate-800">จัดการที่พัก (รายเดือน)</h2>
                    <div className="flex gap-4">
                      <button onClick={() => setPropertyFilter('ACTIVE')} className={`text-xs font-bold uppercase tracking-widest pb-1 border-b-2 ${propertyFilter === 'ACTIVE' ? 'border-amber-500 text-amber-600' : 'border-transparent text-slate-400'}`}>ที่พักปัจจุบัน</button>
                      <button onClick={() => setPropertyFilter('CANCELED')} className={`text-xs font-bold uppercase tracking-widest pb-1 border-b-2 ${propertyFilter === 'CANCELED' ? 'border-rose-500 text-rose-600' : 'border-transparent text-slate-400'}`}>การยกเลิกสัญญา</button>
                    </div>
                  </div>
                  <button onClick={() => setIsAdding(true)} className="px-6 py-2.5 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 shadow-lg shadow-amber-500/20 transition-all">+ เพิ่มห้องใหม่</button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {displayProperties.filter(p => p.rentalType === RentalType.MONTHLY).map(p => (
                    <div key={p.id} onClick={() => setSelectedPropertyId(p.id)} className={`bg-white rounded-3xl p-7 border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all cursor-pointer group relative overflow-hidden ${p.status === PropertyStatus.CANCELED ? 'grayscale-[0.5]' : ''}`}>
                       <div className={`absolute top-0 left-0 w-1 h-full transition-all ${p.status === PropertyStatus.CANCELED ? 'bg-rose-500' : 'bg-amber-500/0 group-hover:bg-amber-500'}`}></div>
                       <div className="flex justify-between items-start mb-6">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${STATUS_COLORS[p.status]}`}>{STATUS_LABELS[p.status]}</span>
                       </div>
                       <h3 className="text-xl font-black text-slate-800 mb-1 leading-tight">{p.name}</h3>
                       <p className="text-xs text-slate-400 mb-6 flex items-center gap-1">📍 {p.address}</p>
                       <div className="flex justify-between items-center border-t border-slate-50 pt-5">
                          <div><p className="text-[10px] text-slate-300 uppercase font-bold">Rent</p><p className="text-xl font-black text-indigo-600">฿{p.rentAmount.toLocaleString()}</p></div>
                          <div className="text-right"><p className="text-[10px] text-slate-300 uppercase font-bold">Next Due</p><p className="text-sm font-bold text-slate-700">วันที่ {p.paymentDueDate}</p></div>
                       </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          )}

          {activeTab === 'daily' && <DailyManagement properties={properties} onUpdateProperty={handleUpdateProperty} onAddProperty={() => setIsAdding(true)} onDeleteProperty={handleDeleteProperty} />}
          
          {activeTab === 'accounting' && role === UserRole.ADMIN && (
            <AccountingSystem 
              documents={accountingDocs} 
              expenses={globalExpenses} 
              onCreateDoc={(d) => setAccountingDocs([...accountingDocs, d])} 
              onUpdateDoc={(d) => setAccountingDocs(accountingDocs.map(x => x.id === d.id ? d : x))} 
              onDeleteDoc={(id) => setAccountingDocs(accountingDocs.filter(d => d.id !== id))} 
              onCreateExpense={(e) => setGlobalExpenses([e, ...globalExpenses])} 
              onDeleteExpense={(id) => setGlobalExpenses(globalExpenses.filter(e => e.id !== id))}
              company={companyInfo}
            />
          )}

          {activeTab === 'staff' && role === UserRole.ADMIN && <StaffManagement staffList={staffMembers} onDeleteStaff={(id) => setStaffMembers(staffMembers.filter(s => s.id !== id))} />}

          {activeTab === 'settings' && role === UserRole.ADMIN && (
            <AdminSettings companyInfo={companyInfo} setCompanyInfo={setCompanyInfo} />
          )}
        </div>
      </main>

      {/* Add Property Modal */}
      {isAdding && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl animate-in zoom-in duration-300 p-8 md:p-10 my-8">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-slate-900">🏢 เพิ่มข้อมูลที่พักใหม่</h3>
              <button onClick={() => setIsAdding(false)} className="text-slate-400 hover:text-slate-600 transition-colors">✕ ปิดหน้าต่าง</button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">ชื่อโครงการ / ชื่อที่พัก</label>
                <input 
                  type="text" 
                  value={newPropData.name}
                  onChange={e => setNewPropData({...newPropData, name: e.target.value})}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                  placeholder="เช่น Artisan Condo, Firstarthur Building"
                />
              </div>

              <div className="md:col-span-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">ที่อยู่โครงการ</label>
                <textarea 
                  value={newPropData.address}
                  onChange={e => setNewPropData({...newPropData, address: e.target.value})}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-amber-500 outline-none transition-all h-20 resize-none"
                  placeholder="ระบุที่อยู่โดยสังเขป..."
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">ตึก (Building)</label>
                <input 
                  type="text" 
                  value={newPropData.building}
                  onChange={e => setNewPropData({...newPropData, building: e.target.value})}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                  placeholder="เช่น A, B1"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">ชั้น (Floor)</label>
                <input 
                  type="text" 
                  value={newPropData.floor}
                  onChange={e => setNewPropData({...newPropData, floor: e.target.value})}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                  placeholder="เช่น 10, PH"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">เลขที่ห้อง (Room No.)</label>
                <input 
                  type="text" 
                  value={newPropData.roomNumber}
                  onChange={e => setNewPropData({...newPropData, roomNumber: e.target.value})}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                  placeholder="เช่น 101/55"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">เลขตู้ (Unit No.)</label>
                <input 
                  type="text" 
                  value={newPropData.unitNumber}
                  onChange={e => setNewPropData({...newPropData, unitNumber: e.target.value})}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-amber-500 outline-none transition-all"
                  placeholder="ระบุเลข Unit (ถ้ามี)"
                />
              </div>

              <div className="pt-4 border-t border-slate-100 md:col-span-2">
                <h4 className="text-sm font-black text-slate-800 mb-4">⚙️ ตั้งค่าประเภทการเช่าและราคา</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">ประเภทการเช่า</label>
                    <select 
                      value={newPropData.rentalType}
                      onChange={e => setNewPropData({...newPropData, rentalType: e.target.value as RentalType})}
                      className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-white transition-all"
                    >
                      <option value={RentalType.MONTHLY}>รายเดือน (Monthly)</option>
                      <option value={RentalType.DAILY}>รายวัน (Daily)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">ราคาเช่า (บาท)</label>
                    <input 
                      type="number" 
                      value={newPropData.rentAmount}
                      onChange={e => setNewPropData({...newPropData, rentAmount: parseInt(e.target.value) || 0})}
                      className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-black text-indigo-600"
                    />
                  </div>
                  {newPropData.rentalType === RentalType.MONTHLY && (
                    <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-50">
                       <div className="md:col-span-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">ชื่อผู้เช่า (ถ้ามี)</label>
                          <input 
                            type="text" 
                            value={newPropData.tenantName}
                            onChange={e => setNewPropData({...newPropData, tenantName: e.target.value})}
                            className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                            placeholder="ระบุชื่อผู้เช่า"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">วันเริ่มสัญญา</label>
                          <input 
                            type="date" 
                            value={newPropData.contractStartDate}
                            onChange={e => setNewPropData({...newPropData, contractStartDate: e.target.value})}
                            className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">วันสิ้นสุดสัญญา</label>
                          <input 
                            type="date" 
                            value={newPropData.contractEndDate}
                            onChange={e => setNewPropData({...newPropData, contractEndDate: e.target.value})}
                            className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                          />
                        </div>
                        <div className="md:col-span-2">
                          <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">วันครบกำหนดชำระ (ทุกวันที่...)</label>
                          <input 
                            type="number" 
                            min="1" 
                            max="31"
                            value={newPropData.paymentDueDate}
                            onChange={e => setNewPropData({...newPropData, paymentDueDate: parseInt(e.target.value) || 1})}
                            className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                          />
                        </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="mt-10 flex gap-4">
              <button 
                onClick={() => setIsAdding(false)} 
                className="flex-1 py-4 text-slate-500 font-bold hover:bg-slate-100 rounded-2xl transition-all"
              >
                ยกเลิก
              </button>
              <button 
                onClick={handleAddProperty}
                className="flex-[2] py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 shadow-xl shadow-slate-200 transition-all"
              >
                บันทึกข้อมูลที่พัก
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
