
import React, { useState, useRef } from 'react';
import { Property, PropertyStatus, InspectionCategory, RepairStatus, Document, InspectionItem, Expense, LinkedMember, UserRole, Staff } from '../types';
import { STATUS_COLORS, STATUS_LABELS, REPAIR_STATUS_LABELS, REPAIR_STATUS_COLORS } from '../constants';

interface PropertyDetailProps {
  property: Property;
  onUpdate: (updated: Property) => void;
  onDelete: (id: string) => void;
  onBack: () => void;
  staffMembers: Staff[];
}

const PropertyDetail: React.FC<PropertyDetailProps> = ({ property, onUpdate, onDelete, onBack, staffMembers }) => {
  const [activeTab, setActiveTab] = useState<'info' | 'docs' | 'expenses' | 'inspection' | 'team'>('info');
  const [isUploading, setIsUploading] = useState<string | null>(null);
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [renewMonths, setRenewMonths] = useState(12);
  const [editData, setEditData] = useState<Property>(property);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const expenseReceiptRef = useRef<HTMLInputElement>(null);
  const inspectionPhotosRef = useRef<HTMLInputElement>(null);
  const currentCategoryRef = useRef<string | null>(null);

  // Team Collaboration states
  const [targetMemberCode, setTargetMemberCode] = useState('');
  const [selectedTeamRole, setSelectedTeamRole] = useState<UserRole>(UserRole.TENANT);
  const [isSearching, setIsSearching] = useState(false);

  // Inspection states
  const [isAddingInspection, setIsAddingInspection] = useState(false);
  const [newInspection, setNewInspection] = useState<Partial<InspectionItem>>({
    category: InspectionCategory.ARCHITECTURAL,
    description: '',
    damageDetails: '',
    isOk: true,
    images: [],
    date: new Date().toISOString().split('T')[0],
    repairNeeded: false,
    repairEstimatedCost: 0
  });

  const [quotingItemId, setQuotingItemId] = useState<string | null>(null);
  const [tempCost, setTempCost] = useState<number>(0);

  // Expense states
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  const [newExpense, setNewExpense] = useState<Partial<Expense>>({
    title: '',
    amount: 0,
    category: 'OTHER',
    date: new Date().toISOString().split('T')[0],
    status: 'PAID',
    receiptUrl: ''
  });

  const handleLinkMember = (e: React.FormEvent) => {
    e.preventDefault();
    const code = targetMemberCode.trim().toUpperCase();
    if (!code) return;

    setIsSearching(true);

    // Simulate network delay
    setTimeout(() => {
      const member = staffMembers.find(s => s.memberCode === code);
      
      if (!member) {
        alert('❌ ไม่พบรหัสสมาชิกนี้ในระบบ กรุณาตรวจสอบรหัสจากสมาชิกอีกครั้ง');
        setIsSearching(false);
        return;
      }

      if (property.linkedMembers?.some(m => m.memberCode === code)) {
        alert('ℹ️ สมาชิกท่านนี้เชื่อมโยงกับห้องนี้อยู่แล้ว');
        setIsSearching(false);
        return;
      }

      const newLinkedMember: LinkedMember = {
        memberId: member.id,
        memberCode: member.memberCode,
        name: `${member.firstName} ${member.lastName}`,
        role: selectedTeamRole,
        joinedDate: new Date().toISOString().split('T')[0]
      };

      onUpdate({
        ...property,
        linkedMembers: [...(property.linkedMembers || []), newLinkedMember]
      });

      setTargetMemberCode('');
      setIsSearching(false);
      alert(`✨ เชื่อมต่อสำเร็จ! ดึงคุณ ${newLinkedMember.name} เข้าสู่ทีมเรียบร้อย`);
    }, 500);
  };

  const handleRemoveLinkedMember = (memberId: string) => {
    if (window.confirm('คุณต้องการยกเลิกสิทธิ์การเข้าถึงห้องนี้ของสมาชิกท่านนี้ใช่หรือไม่?')) {
      onUpdate({
        ...property,
        linkedMembers: property.linkedMembers.filter(m => m.memberId !== memberId)
      });
    }
  };

  const getContractStats = () => {
    if (property.status === PropertyStatus.CANCELED) return { progress: 0, daysLeft: 0, totalDays: 0, status: 'CANCELED' };
    if (!property.contractStartDate || !property.contractEndDate) return { progress: 0, daysLeft: 0, totalDays: 0, status: 'NO_CONTRACT' };
    const start = new Date(property.contractStartDate).getTime();
    const end = new Date(property.contractEndDate).getTime();
    const now = Date.now();
    const totalDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    const daysPassed = Math.ceil((now - start) / (1000 * 60 * 60 * 24));
    const daysLeft = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    let progress = Math.round((daysPassed / totalDays) * 100);
    progress = Math.min(Math.max(progress, 0), 100);
    let status = 'ACTIVE';
    if (daysLeft < 0) status = 'EXPIRED';
    else if (daysLeft <= 30) status = 'EXPIRING_SOON';
    return { progress, daysLeft, totalDays, status };
  };

  const stats = getContractStats();

  // Basic handlers for renew/cancel/info/files...
  const handleRenew = (months: number) => {
    if (!property.contractEndDate) {
        const start = new Date();
        const end = new Date();
        end.setMonth(end.getMonth() + months);
        onUpdate({ ...property, contractStartDate: start.toISOString().split('T')[0], contractEndDate: end.toISOString().split('T')[0], status: PropertyStatus.OCCUPIED });
    } else {
        const currentEnd = new Date(property.contractEndDate);
        const newEnd = new Date(currentEnd.setMonth(currentEnd.getMonth() + months));
        onUpdate({ ...property, contractEndDate: newEnd.toISOString().split('T')[0], status: PropertyStatus.OCCUPIED });
    }
    setShowRenewModal(false);
  };

  const handleCancelContract = () => {
    if (!cancelReason.trim()) return;
    onUpdate({ ...property, status: PropertyStatus.CANCELED, cancellationReason: cancelReason, cancellationDate: new Date().toISOString().split('T')[0] });
    setShowCancelModal(false);
  };

  const handleSaveInfo = () => { onUpdate(editData); setIsEditingInfo(false); };
  const handleRepairStatusChange = (status: RepairStatus) => { onUpdate({ ...property, repairStatus: status }); };
  const handleDelete = () => { if (window.confirm(`ลบที่พัก "${property.name}"?`)) onDelete(property.id); };
  const triggerUpload = (category: string) => { currentCategoryRef.current = category; fileInputRef.current?.click(); };
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !currentCategoryRef.current) return;
    setIsUploading(currentCategoryRef.current);
    const reader = new FileReader();
    reader.onloadend = () => {
      const newDoc: Document = { id: Math.random().toString(36).substr(2, 9), name: file.name, type: file.type.includes('pdf') ? 'PDF' : 'IMAGE', category: currentCategoryRef.current as any, url: reader.result as string, uploadDate: new Date().toISOString().split('T')[0] };
      onUpdate({ ...property, documents: [...property.documents, newDoc] });
      setIsUploading(null);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveExpense = () => {
    if (!newExpense.title || !newExpense.amount) return;
    const created: Expense = { ...newExpense as Expense, id: Math.random().toString(36).substr(2, 9) };
    onUpdate({ ...property, expenses: [created, ...property.expenses], repairStatus: created.category === 'REPAIR' ? RepairStatus.PENDING_REPAIR : property.repairStatus });
    setIsAddingExpense(false);
  };

  const handleSaveInspection = () => {
    if (!newInspection.description) return;
    const created: InspectionItem = { ...newInspection as InspectionItem, id: Math.random().toString(36).substr(2, 9), date: new Date().toISOString().split('T')[0], repairStatus: newInspection.repairNeeded ? 'PENDING' : undefined };
    onUpdate({ ...property, inspections: [created, ...property.inspections], repairStatus: created.repairNeeded ? RepairStatus.PENDING_REPAIR : property.repairStatus });
    setIsAddingInspection(false);
  };

  const handleConfirmRepairQuote = (itemId: string, cost: number) => {
    const item = property.inspections.find(i => i.id === itemId);
    if (!item || cost <= 0) return;
    const newExp: Expense = { id: Math.random().toString(36).substr(2, 9), title: `ค่าซ่อมแซม: ${item.description}`, amount: cost, category: 'REPAIR', date: new Date().toISOString().split('T')[0], status: 'PAID' };
    const updatedInsp = property.inspections.map(i => i.id === itemId ? { ...i, repairActualCost: cost, repairStatus: 'DONE' as const, linkedExpenseId: newExp.id } : i);
    onUpdate({ ...property, expenses: [newExp, ...property.expenses], inspections: updatedInsp, repairStatus: RepairStatus.COMPLETED });
    setQuotingItemId(null);
  };

  const docCategories = [{ id: 'CONTRACT', label: 'สัญญาเช่า' }, { id: 'TENANT_ID', label: 'เอกสารผู้เช่า' }, { id: 'OWNER_DOCS', label: 'เอกสารเจ้าของ' }, { id: 'POA', label: 'ใบมอบอำนาจ' }, { id: 'TM30', label: 'TM30' }, { id: 'OTHER', label: 'อื่นๆ' }];
  const EXPENSE_LABELS: Record<string, string> = { 'COMMON_FEE': 'ค่าส่วนกลาง', 'REPAIR': 'ค่าซ่อมแซม', 'UTILITY': 'ค่าน้ำ/ไฟ/เน็ต', 'COMMISSION': 'ค่านายหน้า', 'MANAGEMENT_FEE': 'ค่าบริหารจัดการ', 'LAND_TAX': 'ค่าภาษีที่ดิน', 'OTHER_SERVICE': 'ค่าบริการอื่นๆ', 'OTHER': 'อื่นๆ' };

  return (
    <div className="lg:p-6 max-w-5xl mx-auto space-y-4 lg:space-y-6 overflow-touch safe-pb">
      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="application/pdf,image/*" />
      {/* Fix: Explicitly typed e to React.ChangeEvent<HTMLInputElement> to avoid unknown type error on e.target.files and f */}
      <input type="file" ref={inspectionPhotosRef} onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
         const files = Array.from(e.target.files || []);
         files.forEach(f => {
            const reader = new FileReader();
            reader.onloadend = () => setNewInspection(prev => ({ ...prev, images: [...(prev.images || []), reader.result as string] }));
            reader.readAsDataURL(f);
         });
      }} className="hidden" accept="image/*" multiple />
      {/* Fix: Explicitly typed e to React.ChangeEvent<HTMLInputElement> to resolve Blob type mismatch error */}
      <input type="file" ref={expenseReceiptRef} onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
         const f = e.target.files?.[0];
         if (f) {
           const r = new FileReader();
           r.onloadend = () => setNewExpense(prev => ({ ...prev, receiptUrl: r.result as string }));
           r.readAsDataURL(f);
         }
      }} className="hidden" accept="image/*" />

      {/* Modals... */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl">
            <h3 className="text-xl font-bold mb-4">เหตุผลการยกเลิก</h3>
            <textarea className="w-full h-32 p-4 bg-slate-50 border rounded-2xl outline-none focus:ring-2 focus:ring-rose-500 mb-6" value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} />
            <div className="flex gap-3">
              <button onClick={() => setShowCancelModal(false)} className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-100 rounded-2xl">ยกเลิก</button>
              <button onClick={handleCancelContract} className="flex-1 py-3 bg-rose-500 text-white font-bold rounded-2xl">ยืนยัน</button>
            </div>
          </div>
        </div>
      )}

      {showRenewModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2rem] p-10 w-full max-w-md shadow-2xl">
            <h3 className="text-2xl font-black mb-8 text-center">ต่อสัญญาเช่า</h3>
            <div className="grid grid-cols-2 gap-4 mb-8">
              {[6, 12, 24, 36].map(m => (
                <button key={m} onClick={() => setRenewMonths(m)} className={`py-4 rounded-2xl border-2 font-black transition-all ${renewMonths === m ? 'bg-indigo-600 text-white border-indigo-700' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>{m} เดือน</button>
              ))}
            </div>
            <div className="flex gap-4">
              <button onClick={() => setShowRenewModal(false)} className="flex-1 py-4 text-slate-500 font-bold hover:bg-slate-100 rounded-2xl">ยกเลิก</button>
              <button onClick={() => handleRenew(renewMonths)} className="flex-[2] py-4 bg-slate-900 text-white font-black rounded-2xl">บันทึก</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center no-print px-4 lg:px-0">
        <button onClick={onBack} className="text-slate-500 hover:text-slate-800 flex items-center gap-2 font-bold"><span>← กลับ</span></button>
        <div className="flex gap-2">
          {property.status !== PropertyStatus.CANCELED && (
            <>
              <button onClick={() => setShowRenewModal(true)} className="p-2 lg:px-4 lg:py-2 bg-indigo-50 text-indigo-600 rounded-xl font-bold border border-indigo-100">✨ ต่อสัญญา</button>
              <button onClick={() => setShowCancelModal(true)} className="p-2 lg:px-4 lg:py-2 bg-slate-100 text-slate-600 rounded-xl font-bold border">🚫 ยกเลิก</button>
            </>
          )}
          <button onClick={handleDelete} className="p-2 lg:px-4 lg:py-2 bg-rose-50 text-rose-600 rounded-xl font-bold border border-rose-100">🗑️ ลบ</button>
        </div>
      </div>

      <div className="bg-white rounded-2xl lg:rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-6 lg:p-8 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-start gap-4">
          <div>
            <h2 className="text-2xl lg:text-3xl font-black text-slate-900">{property.name}</h2>
            <div className="flex flex-wrap gap-2 mt-2">
               {property.roomNumber && <span className="bg-indigo-100 px-2.5 py-1 rounded-lg text-[10px] font-bold text-indigo-700">ห้อง {property.roomNumber}</span>}
            </div>
          </div>
          <span className={`px-4 py-1.5 rounded-full text-xs font-black border uppercase ${STATUS_COLORS[property.status]}`}>{STATUS_LABELS[property.status]}</span>
        </div>

        <div className="flex border-b border-slate-100 px-4 lg:px-6 no-print overflow-x-auto overflow-touch hide-scrollbar bg-slate-50/30">
          {[
            { id: 'info', label: 'ข้อมูลเช่า', icon: '📝' },
            { id: 'docs', label: 'เอกสาร', icon: '📂' },
            { id: 'expenses', label: 'ค่าใช้จ่าย', icon: '💰' },
            { id: 'inspection', label: 'ตรวจรับห้อง', icon: '📋' },
            { id: 'team', label: 'ผู้เกี่ยวข้อง', icon: '👥' }
          ].map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`px-6 py-4 text-xs lg:text-sm font-bold transition-all border-b-2 whitespace-nowrap flex items-center gap-2 ${activeTab === tab.id ? 'border-amber-500 text-amber-600 bg-white' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
              <span>{tab.icon}</span> {tab.label}
            </button>
          ))}
        </div>

        <div className="p-4 lg:p-8">
          {activeTab === 'info' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
               <div className="space-y-4">
                  <div className="flex justify-between items-center"><h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Property Details</h4><button onClick={() => { if (isEditingInfo) handleSaveInfo(); else { setEditData({...property}); setIsEditingInfo(true); } }} className="text-[10px] font-black text-indigo-600 uppercase underline">{isEditingInfo ? 'บันทึก' : 'แก้ไข'}</button></div>
                  <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 space-y-4">
                    {isEditingInfo ? (
                      <div className="space-y-3">
                         <input type="text" className="w-full bg-white border p-2 rounded-xl" value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} />
                         <input type="number" className="w-full bg-white border p-2 rounded-xl" value={editData.rentAmount} onChange={e => setEditData({...editData, rentAmount: parseInt(e.target.value) || 0})} />
                         <div className="grid grid-cols-2 gap-2">
                            <input type="date" className="w-full bg-white border p-2 rounded-xl text-xs" value={editData.contractStartDate} onChange={e => setEditData({...editData, contractStartDate: e.target.value})} />
                            <input type="date" className="w-full bg-white border p-2 rounded-xl text-xs" value={editData.contractEndDate} onChange={e => setEditData({...editData, contractEndDate: e.target.value})} />
                         </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex justify-between"><span className="text-slate-500 text-xs">ค่าเช่ารายเดือน</span><span className="font-black">฿{property.rentAmount.toLocaleString()}</span></div>
                        <div className="flex justify-between"><span className="text-slate-500 text-xs">ผู้เช่า</span><span className="font-black">{property.tenantName || '-'}</span></div>
                        <div className="pt-3 border-t text-[10px] text-slate-400 uppercase font-bold">สัญญาเช่า: {property.contractStartDate || '-'} ถึง {property.contractEndDate || '-'}</div>
                      </div>
                    )}
                  </div>
                  <select value={property.repairStatus} onChange={(e) => handleRepairStatusChange(e.target.value as RepairStatus)} className={`w-full text-xs font-bold rounded-xl p-3 border ${REPAIR_STATUS_COLORS[property.repairStatus]} bg-slate-50`}>
                    {Object.values(RepairStatus).map(s => <option key={s} value={s}>{REPAIR_STATUS_LABELS[s]}</option>)}
                  </select>
               </div>
               <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden">
                  <div className="relative z-10">
                    <p className="text-[9px] font-bold opacity-50 uppercase tracking-widest mb-2">Contract Health</p>
                    <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden mb-6"><div className="h-full bg-amber-500" style={{ width: `${stats.progress}%` }}></div></div>
                    <p className="text-4xl font-black">{stats.daysLeft} <span className="text-sm font-normal opacity-50 uppercase tracking-tighter">Days Left</span></p>
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'team' && (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-2 duration-500">
               {/* Member Code Entry Area */}
               <div className="bg-indigo-600 rounded-[2.5rem] p-8 lg:p-12 text-white shadow-2xl shadow-indigo-500/20 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
                  <div className="relative z-10 max-w-2xl">
                     <div className="flex items-center gap-4 mb-8">
                        <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-2xl border border-white/20">🔑</div>
                        <div>
                           <h4 className="text-2xl font-black">ดึงผู้เกี่ยวข้องเข้าร่วมทีม</h4>
                           <p className="text-indigo-100 text-sm opacity-90">ระบุบทบาทและรหัสสมาชิกที่คุณได้รับจาก Owner หรือ Tenant</p>
                        </div>
                     </div>

                     <form onSubmit={handleLinkMember} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
                        <div className="md:col-span-4 space-y-2">
                           <label className="text-[10px] font-black uppercase tracking-widest ml-1 text-indigo-100">1. เลือกบทบาท</label>
                           <select 
                              value={selectedTeamRole}
                              onChange={e => setSelectedTeamRole(e.target.value as UserRole)}
                              className="w-full px-5 py-4 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl outline-none focus:ring-2 focus:ring-white/50 font-bold text-white transition-all cursor-pointer hover:bg-white/20"
                           >
                              <option value={UserRole.OWNER} className="text-slate-900">👑 Owner (เจ้าของห้อง)</option>
                              <option value={UserRole.TENANT} className="text-slate-900">👤 Tenant (ผู้เช่า)</option>
                              <option value={UserRole.CO_AGENT} className="text-slate-900">💼 Co-Agent (ตัวแทนร่วม)</option>
                              <option value={UserRole.CO_TENANT} className="text-slate-900">👥 Co-Tenant (ผู้เช่าร่วม)</option>
                              <option value={UserRole.LAWYER} className="text-slate-900">⚖️ Lawyer (ฝ่ายกฎหมาย)</option>
                           </select>
                        </div>
                        <div className="md:col-span-5 space-y-2">
                           <label className="text-[10px] font-black uppercase tracking-widest ml-1 text-indigo-100">2. กรอกรหัสสมาชิก</label>
                           <input 
                              type="text" 
                              placeholder="เช่น FA-XXXXXX" 
                              value={targetMemberCode}
                              onChange={e => setTargetMemberCode(e.target.value)}
                              className="w-full px-5 py-4 bg-white border-none rounded-2xl outline-none focus:ring-4 focus:ring-amber-400 font-black text-indigo-600 placeholder:text-slate-300 text-lg shadow-inner uppercase"
                              required
                           />
                        </div>
                        <div className="md:col-span-3">
                           <button 
                              type="submit"
                              disabled={isSearching}
                              className="w-full py-4 bg-amber-400 hover:bg-amber-300 disabled:bg-slate-300 text-slate-950 font-black rounded-2xl shadow-xl transition-all flex items-center justify-center gap-2 transform active:scale-95"
                           >
                              {isSearching ? <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div> : '✅ ดึงข้อมูล'}
                           </button>
                        </div>
                     </form>
                  </div>
               </div>

               {/* Connected Members Grid */}
               <div className="space-y-6">
                  <div className="flex items-baseline gap-2 px-2">
                     <h5 className="text-lg font-black text-slate-900">สมาชิกที่เชื่อมต่อแล้ว</h5>
                     <span className="text-xs font-bold text-slate-400">({property.linkedMembers?.length || 0} ท่าน)</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                     {property.linkedMembers?.map(member => (
                        <div key={member.memberId} className="bg-white border border-slate-100 rounded-[2rem] p-6 shadow-sm hover:shadow-xl transition-all group flex flex-col justify-between">
                           <div className="flex items-start justify-between mb-6">
                              <div className="flex items-center gap-4">
                                 <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black shadow-inner ${
                                    member.role === UserRole.OWNER ? 'bg-amber-100 text-amber-700' :
                                    member.role === UserRole.TENANT ? 'bg-emerald-100 text-emerald-700' :
                                    member.role === UserRole.LAWYER ? 'bg-rose-100 text-rose-700' :
                                    'bg-indigo-100 text-indigo-700'
                                 }`}>
                                    {member.role === UserRole.OWNER ? '👑' : member.role === UserRole.TENANT ? '👤' : member.role === UserRole.LAWYER ? '⚖️' : '💼'}
                                 </div>
                                 <div>
                                    <p className="text-base font-black text-slate-900 leading-tight">{member.name}</p>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{member.role}</span>
                                 </div>
                              </div>
                              <button 
                                 onClick={() => handleRemoveLinkedMember(member.memberId)}
                                 className="p-2 text-slate-200 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                                 title="ยกเลิกการเข้าถึง"
                              >
                                 ✕
                              </button>
                           </div>
                           
                           <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                              <div className="space-y-0.5">
                                 <p className="text-[9px] font-bold text-slate-300 uppercase tracking-tighter">Member Code</p>
                                 <p className="text-xs font-mono font-black text-indigo-500">{member.memberCode}</p>
                              </div>
                              <div className="text-right">
                                 <p className="text-[9px] font-bold text-slate-300 uppercase tracking-tighter">Connected since</p>
                                 <p className="text-xs font-bold text-slate-600">{member.joinedDate}</p>
                              </div>
                           </div>
                        </div>
                     ))}
                     
                     {(!property.linkedMembers || property.linkedMembers.length === 0) && (
                        <div className="col-span-full py-24 text-center text-slate-300 border-2 border-dashed border-slate-100 rounded-[3rem] bg-slate-50/50">
                           <div className="text-5xl mb-4 opacity-20">🤝</div>
                           <p className="text-lg font-bold">ยังไม่มีผู้เกี่ยวข้องสำหรับห้องนี้</p>
                           <p className="text-xs mt-1">กรอกรหัสสมาชิกด้านบนเพื่อเริ่มการทำงานร่วมกัน</p>
                        </div>
                     )}
                  </div>
               </div>

               {/* Access Guidelines Card */}
               <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 border-l-4 border-l-indigo-500">
                  <h6 className="font-black text-slate-800 text-sm mb-4">สิทธิ์การเข้าถึงข้อมูลตามบทบาท (Access Summary)</h6>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                     <div className="space-y-1">
                        <p className="text-[10px] font-black text-amber-600 uppercase">👑 Owner</p>
                        <p className="text-xs text-slate-500 leading-relaxed">ดูรายรับ-รายจ่าย สรุปสัญญา และสถานะการตรวจห้อง</p>
                     </div>
                     <div className="space-y-1">
                        <p className="text-[10px] font-black text-emerald-600 uppercase">👤 Tenant</p>
                        <p className="text-xs text-slate-500 leading-relaxed">ดูสัญญาเช่าของตนเอง วันครบกำหนดจ่าย และแจ้งซ่อม</p>
                     </div>
                     <div className="space-y-1">
                        <p className="text-[10px] font-black text-indigo-600 uppercase">💼 Co-Agent</p>
                        <p className="text-xs text-slate-500 leading-relaxed">ช่วยจัดการข้อมูลห้อง เอกสาร และงานรายวันร่วมกัน</p>
                     </div>
                     <div className="space-y-1">
                        <p className="text-[10px] font-black text-rose-600 uppercase">⚖️ Lawyer</p>
                        <p className="text-xs text-slate-500 leading-relaxed">เน้นการเข้าถึงเอกสารทางกฎหมายและสัญญาที่สำคัญ</p>
                     </div>
                  </div>
               </div>
            </div>
          )}

          {/* Docs, Expenses, Inspection tabs... */}
          {activeTab === 'docs' && (
            <div className="space-y-8">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {docCategories.map(cat => (
                  <button key={cat.id} onClick={() => triggerUpload(cat.id)} className="border-2 border-dashed border-slate-200 rounded-2xl p-4 flex flex-col items-center justify-center gap-2 hover:border-amber-400 hover:bg-white transition-all group aspect-square lg:aspect-auto">
                    {isUploading === cat.id ? <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div> : <span className="text-2xl group-hover:scale-110 transition-transform">➕</span>}
                    <span className="text-[10px] font-black text-slate-400 uppercase text-center leading-tight">{cat.label}</span>
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                 {property.documents.map(doc => (
                    <div key={doc.id} className="bg-white border border-slate-100 rounded-2xl p-4 flex items-center justify-between group shadow-sm hover:shadow-md transition-all">
                       <div className="min-w-0">
                          <p className="text-sm font-black truncate text-slate-700">{doc.name}</p>
                          <p className="text-[9px] text-slate-400 font-bold uppercase">{doc.category}</p>
                       </div>
                       <a href={doc.url} target="_blank" rel="noreferrer" className="p-2 text-slate-400 hover:text-indigo-600 transition-colors bg-slate-50 rounded-xl">👁️</a>
                    </div>
                 ))}
              </div>
            </div>
          )}

          {activeTab === 'expenses' && (
            <div className="space-y-6">
              <div className="flex justify-between items-center"><h4 className="text-xl font-black">ค่าใช้จ่ายรายห้อง</h4>{!isAddingExpense && <button onClick={() => setIsAddingExpense(true)} className="px-6 py-2 bg-rose-600 text-white font-black rounded-xl hover:bg-rose-700 transition-all text-sm">+ เพิ่มรายการ</button>}</div>
              {isAddingExpense && (
                <div className="bg-slate-50 border rounded-3xl p-8 space-y-6 animate-in slide-in-from-top-4">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <input type="text" className="px-4 py-3 rounded-xl border" placeholder="ชื่อรายการ" value={newExpense.title} onChange={e => setNewExpense({...newExpense, title: e.target.value})} />
                      <input type="number" className="px-4 py-3 rounded-xl border font-black text-rose-600" placeholder="จำนวนเงิน" value={newExpense.amount} onChange={e => setNewExpense({...newExpense, amount: parseFloat(e.target.value) || 0})} />
                   </div>
                   <div className="flex gap-2">
                      <button onClick={() => setIsAddingExpense(false)} className="flex-1 py-3 text-slate-500 font-bold">ยกเลิก</button>
                      <button onClick={handleSaveExpense} className="flex-[2] py-3 bg-slate-900 text-white font-black rounded-xl">บันทึก</button>
                   </div>
                </div>
              )}
              <div className="overflow-x-auto border rounded-2xl"><table className="w-full text-left text-sm"><thead className="bg-slate-50 uppercase text-[10px] font-black"><tr><th className="p-4">รายการ</th><th className="p-4">จำนวนเงิน</th><th className="p-4">วันที่</th><th className="p-4">สถานะ</th><th className="p-4">จัดการ</th></tr></thead><tbody className="divide-y">{property.expenses.map(exp => (<tr key={exp.id} className="hover:bg-slate-50"><td className="p-4 font-bold">{exp.title}</td><td className="p-4 font-black text-rose-600">฿{exp.amount.toLocaleString()}</td><td className="p-4 text-slate-500">{exp.date}</td><td className="p-4"><span className="px-2 py-1 bg-emerald-100 text-emerald-700 text-[10px] font-black rounded-lg">{exp.status}</span></td><td className="p-4"><button onClick={() => onUpdate({...property, expenses: property.expenses.filter(e => e.id !== exp.id)})} className="text-slate-300 hover:text-rose-500">🗑️</button></td></tr>))}</tbody></table></div>
            </div>
          )}

          {activeTab === 'inspection' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="flex justify-between items-center"><h4 className="text-xl font-black">ตรวจรับห้องพักและงานซ่อม</h4>{!isAddingInspection && <button onClick={() => setIsAddingInspection(true)} className="px-6 py-2 bg-indigo-600 text-white font-black rounded-xl hover:bg-indigo-700 transition-all text-sm">+ สร้างรายงาน</button>}</div>
              {isAddingInspection && (
                <div className="bg-slate-50 border rounded-3xl p-8 space-y-6 animate-in slide-in-from-top-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                       <input type="text" className="w-full px-4 py-3 rounded-xl border" placeholder="หัวข้อการตรวจสอบ" value={newInspection.description} onChange={e => setNewInspection({...newInspection, description: e.target.value})} />
                       <select className="w-full px-4 py-3 rounded-xl border bg-white" value={newInspection.category} onChange={e => setNewInspection({...newInspection, category: e.target.value as any})}>{Object.values(InspectionCategory).map(c => <option key={c} value={c}>{c}</option>)}</select>
                       <div className="flex gap-2"><button onClick={() => setNewInspection({...newInspection, isOk: true})} className={`flex-1 py-3 rounded-xl font-bold ${newInspection.isOk ? 'bg-emerald-500 text-white' : 'bg-white border'}`}>ปกติ</button><button onClick={() => setNewInspection({...newInspection, isOk: false})} className={`flex-1 py-3 rounded-xl font-bold ${!newInspection.isOk ? 'bg-rose-500 text-white' : 'bg-white border'}`}>ชำรุด</button></div>
                    </div>
                    <textarea className="w-full h-full px-4 py-3 rounded-xl border resize-none" placeholder="รายละเอียดการชำรุด..." value={newInspection.damageDetails} onChange={e => setNewInspection({...newInspection, damageDetails: e.target.value})} />
                  </div>
                  <div className="flex gap-2 pt-4"><button onClick={() => setIsAddingInspection(false)} className="flex-1 py-3 font-bold text-slate-500">ยกเลิก</button><button onClick={handleSaveInspection} className="flex-[2] py-3 bg-slate-900 text-white font-black rounded-xl">บันทึกรายงาน</button></div>
                </div>
              )}
              <div className="space-y-4">{property.inspections.map(item => (
                <div key={item.id} className="bg-white border rounded-3xl p-6 flex flex-col md:flex-row gap-6 group relative">
                   <div className="w-full md:w-48 shrink-0">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${item.isOk ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>{item.isOk ? 'NORMAL' : 'DEFECT'}</span>
                      <p className="font-black mt-2">{item.description}</p>
                      <p className="text-[10px] text-slate-400 mt-4">{item.date}</p>
                      {item.repairNeeded && item.repairStatus !== 'DONE' && (
                        <button onClick={() => { setQuotingItemId(item.id); setTempCost(item.repairEstimatedCost || 0); }} className="mt-4 w-full py-2 bg-indigo-50 text-indigo-600 text-xs font-bold rounded-lg border border-indigo-100">ดำเนินการซ่อม</button>
                      )}
                   </div>
                   <div className="flex-1 bg-slate-50 p-4 rounded-2xl text-xs text-slate-600 whitespace-pre-line">{item.damageDetails || 'ไม่มีรายละเอียดเพิ่มเติม'}</div>
                   {quotingItemId === item.id && (
                     <div className="absolute inset-0 bg-white/95 rounded-3xl flex items-center justify-center p-8 z-10">
                        <div className="text-center space-y-4">
                           <p className="font-black">ระบุค่าซ่อมแซมจริงเพื่อลงบัญชี</p>
                           <input type="number" className="px-4 py-2 border rounded-xl text-center text-lg font-black text-indigo-600" value={tempCost} onChange={e => setTempCost(parseFloat(e.target.value) || 0)} />
                           <div className="flex gap-2"><button onClick={() => setQuotingItemId(null)} className="px-4 py-2 text-slate-500 font-bold">ยกเลิก</button><button onClick={() => handleConfirmRepairQuote(item.id, tempCost)} className="px-6 py-2 bg-indigo-600 text-white font-black rounded-xl">ยืนยันและจ่ายเงิน</button></div>
                        </div>
                     </div>
                   )}
                   <button onClick={() => onUpdate({...property, inspections: property.inspections.filter(i => i.id !== item.id)})} className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 text-slate-300 hover:text-rose-500 transition-opacity">🗑️</button>
                </div>
              ))}</div>
            </div>
          )}
        </div>
      </div>
      <style>{`
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

export default PropertyDetail;
