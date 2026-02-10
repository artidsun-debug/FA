
import React, { useState, useRef } from 'react';
import { Property, PropertyStatus, InspectionCategory, RepairStatus, Document, InspectionItem } from '../types';
import { STATUS_COLORS, STATUS_LABELS, REPAIR_STATUS_LABELS, REPAIR_STATUS_COLORS } from '../constants';

interface PropertyDetailProps {
  property: Property;
  onUpdate: (updated: Property) => void;
  onDelete: (id: string) => void;
  onBack: () => void;
}

const PropertyDetail: React.FC<PropertyDetailProps> = ({ property, onUpdate, onDelete, onBack }) => {
  const [activeTab, setActiveTab] = useState<'info' | 'docs' | 'expenses' | 'inspection'>('info');
  const [isUploading, setIsUploading] = useState<string | null>(null);
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [renewMonths, setRenewMonths] = useState(12);
  const [editData, setEditData] = useState<Property>(property);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const inspectionPhotosRef = useRef<HTMLInputElement>(null);
  const currentCategoryRef = useRef<string | null>(null);

  // Inspection states
  const [isAddingInspection, setIsAddingInspection] = useState(false);
  const [newInspection, setNewInspection] = useState<Partial<InspectionItem>>({
    category: InspectionCategory.ARCHITECTURAL,
    description: '',
    damageDetails: '',
    isOk: true,
    images: [],
    date: new Date().toISOString().split('T')[0]
  });

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

  const handleRenew = (months: number) => {
    if (!property.contractEndDate) {
        // If no end date, set from today
        const start = new Date();
        const end = new Date();
        end.setMonth(end.getMonth() + months);
        onUpdate({
            ...property,
            contractStartDate: start.toISOString().split('T')[0],
            contractEndDate: end.toISOString().split('T')[0],
            status: PropertyStatus.OCCUPIED 
        });
    } else {
        const currentEnd = new Date(property.contractEndDate);
        const newEnd = new Date(currentEnd.setMonth(currentEnd.getMonth() + months));
        onUpdate({
            ...property,
            contractEndDate: newEnd.toISOString().split('T')[0],
            status: PropertyStatus.OCCUPIED 
        });
    }
    setShowRenewModal(false);
    alert(`ต่อสัญญาเรียบร้อยแล้ว (${months} เดือน)`);
  };

  const handleCancelContract = () => {
    if (!cancelReason.trim()) {
      alert('กรุณาระบุเหตุผลในการยกเลิกสัญญา');
      return;
    }
    onUpdate({
      ...property,
      status: PropertyStatus.CANCELED,
      cancellationReason: cancelReason,
      cancellationDate: new Date().toISOString().split('T')[0]
    });
    setShowCancelModal(false);
    setCancelReason('');
    alert('ยกเลิกสัญญาเรียบร้อยแล้ว');
  };

  const handleSaveInfo = () => {
    onUpdate(editData);
    setIsEditingInfo(false);
  };

  const handleRepairStatusChange = (status: RepairStatus) => {
    onUpdate({ ...property, repairStatus: status });
  };

  const handleDelete = () => {
    if (window.confirm(`คุณแน่ใจหรือไม่ว่าต้องการลบที่พัก "${property.name}"? การดำเนินการนี้ไม่สามารถย้อนกลับได้`)) {
      onDelete(property.id);
    }
  };

  const triggerUpload = (category: string) => {
    currentCategoryRef.current = category;
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const category = currentCategoryRef.current;
    if (!file || !category) return;
    setIsUploading(category);
    const reader = new FileReader();
    reader.onloadend = () => {
      const newDoc: Document = {
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        type: file.type.includes('pdf') ? 'PDF' : 'IMAGE',
        category: category as any,
        url: reader.result as string,
        uploadDate: new Date().toISOString().split('T')[0]
      };
      onUpdate({ ...property, documents: [...property.documents, newDoc] });
      setIsUploading(null);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Inspection Handlers
  const handleInspectionPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewInspection(prev => ({
          ...prev,
          images: [...(prev.images || []), reader.result as string]
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const handleSaveInspection = () => {
    if (!newInspection.description) {
      alert('กรุณากรอกหัวข้อการตรวจสอบ');
      return;
    }
    const created: InspectionItem = {
      ...newInspection as InspectionItem,
      id: Math.random().toString(36).substr(2, 9),
      date: new Date().toISOString().split('T')[0]
    };
    onUpdate({ ...property, inspections: [created, ...property.inspections] });
    setIsAddingInspection(false);
    setNewInspection({
      category: InspectionCategory.ARCHITECTURAL,
      description: '',
      damageDetails: '',
      isOk: true,
      images: [],
      date: new Date().toISOString().split('T')[0]
    });
  };

  const removeInspection = (id: string) => {
    if (window.confirm('ลบรายงานการตรวจสอบนี้ใช่หรือไม่?')) {
      onUpdate({ ...property, inspections: property.inspections.filter(i => i.id !== id) });
    }
  };

  const removeNewInspectionPhoto = (index: number) => {
    setNewInspection(prev => ({
      ...prev,
      images: prev.images?.filter((_, i) => i !== index)
    }));
  };

  const docCategories = [
    { id: 'CONTRACT', label: 'สัญญาเช่า' },
    { id: 'TENANT_ID', label: 'เอกสารผู้เช่า' },
    { id: 'OWNER_DOCS', label: 'เอกสารเจ้าของ' },
    { id: 'POA', label: 'ใบมอบอำนาจ' },
    { id: 'TM30', label: 'TM30' },
    { id: 'OTHER', label: 'อื่นๆ' }
  ];

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="application/pdf,image/*" />
      <input type="file" ref={inspectionPhotosRef} onChange={handleInspectionPhotoUpload} className="hidden" accept="image/*" multiple />

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 w-full max-w-md shadow-2xl animate-in zoom-in duration-200">
            <h3 className="text-xl font-bold text-slate-900 mb-4">ระบุเหตุผลในการยกเลิกสัญญา</h3>
            <textarea className="w-full h-32 p-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-rose-500 mb-6 resize-none" placeholder="เช่น ผู้เช่าขอย้ายออกก่อนกำหนด..." value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} />
            <div className="flex gap-3">
              <button onClick={() => setShowCancelModal(false)} className="flex-1 py-3 text-slate-500 font-bold hover:bg-slate-100 rounded-2xl">ยกเลิก</button>
              <button onClick={handleCancelContract} className="flex-1 py-3 bg-rose-500 text-white font-bold rounded-2xl hover:bg-rose-600 shadow-lg shadow-rose-200">ยืนยันการยกเลิก</button>
            </div>
          </div>
        </div>
      )}

      {/* Renew Modal */}
      {showRenewModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-[2.5rem] p-10 w-full max-w-md shadow-2xl animate-in zoom-in duration-200">
            <div className="text-center mb-8">
               <span className="text-5xl block mb-4">📄</span>
               <h3 className="text-2xl font-black text-slate-900">ต่อสัญญาเช่า</h3>
               <p className="text-sm text-slate-500 mt-2">ระบุจำนวนเดือนที่ต้องการขยายสัญญา</p>
            </div>
            
            <div className="space-y-6 mb-8">
               <div className="grid grid-cols-2 gap-4">
                  {[6, 12, 24, 36].map(m => (
                    <button 
                     key={m} 
                     onClick={() => setRenewMonths(m)}
                     className={`py-4 rounded-2xl border-2 font-black transition-all ${renewMonths === m ? 'bg-indigo-600 text-white border-indigo-700 shadow-lg' : 'bg-slate-50 text-slate-400 border-slate-100 hover:border-indigo-300'}`}
                    >
                      {m} เดือน
                    </button>
                  ))}
               </div>

               <div className="pt-4 border-t border-slate-50">
                 <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-3 text-center">ปรับแต่งจำนวนเดือน (เพิ่ม/ลด)</label>
                 <div className="flex items-center justify-between gap-4 p-2 bg-slate-50 rounded-2xl border border-slate-100">
                    <button 
                      onClick={() => setRenewMonths(prev => Math.max(1, prev - 1))}
                      className="w-12 h-12 rounded-xl bg-white shadow-sm border border-slate-200 text-xl font-black text-slate-400 hover:text-rose-500 transition-colors flex items-center justify-center"
                    >
                      −
                    </button>
                    <div className="flex-1 text-center">
                      <input 
                        type="number" 
                        value={renewMonths}
                        onChange={e => setRenewMonths(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full text-center bg-transparent outline-none font-black text-2xl text-indigo-600"
                      />
                      <p className="text-[10px] font-bold text-slate-300 uppercase">Months</p>
                    </div>
                    <button 
                      onClick={() => setRenewMonths(prev => prev + 1)}
                      className="w-12 h-12 rounded-xl bg-white shadow-sm border border-slate-200 text-xl font-black text-slate-400 hover:text-emerald-500 transition-colors flex items-center justify-center"
                    >
                      +
                    </button>
                 </div>
               </div>
            </div>

            <div className="flex gap-4">
              <button onClick={() => setShowRenewModal(false)} className="flex-1 py-4 text-slate-500 font-bold hover:bg-slate-100 rounded-2xl">ยกเลิก</button>
              <button onClick={() => handleRenew(renewMonths)} className="flex-[2] py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 shadow-xl shadow-slate-300">ยืนยันการต่อสัญญา</button>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-between items-center no-print">
        <button onClick={onBack} className="text-slate-500 hover:text-slate-800 flex items-center gap-2 transition-colors"><span>← กลับสู่รายการ</span></button>
        <div className="flex gap-2">
          {property.status !== PropertyStatus.CANCELED && (
            <>
                <button onClick={() => setShowRenewModal(true)} className="px-4 py-2 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-xl text-sm font-bold flex items-center gap-2 transition-all border border-indigo-100">✨ ต่อสัญญา</button>
                <button onClick={() => setShowCancelModal(true)} className="px-4 py-2 bg-slate-100 text-slate-600 hover:bg-slate-200 rounded-xl text-sm font-bold flex items-center gap-2 transition-all">🚫 ยกเลิกสัญญา</button>
            </>
          )}
          <button onClick={handleDelete} className="px-4 py-2 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-xl text-sm font-bold flex items-center gap-2 transition-all border border-rose-100"><span className="text-lg">🗑️</span> ลบที่พัก</button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex justify-between items-start">
          <div>
            <h2 className="text-3xl font-bold text-slate-900 leading-tight">{property.name}</h2>
            <div className="flex flex-wrap gap-2 mt-2">
               {property.building && <span className="bg-slate-100 px-3 py-1 rounded-full text-xs font-bold text-slate-700">ตึก {property.building}</span>}
               {property.floor && <span className="bg-slate-100 px-3 py-1 rounded-full text-xs font-bold text-slate-700">ชั้น {property.floor}</span>}
               {property.roomNumber && <span className="bg-indigo-100 px-3 py-1 rounded-full text-xs font-bold text-indigo-700">ห้อง {property.roomNumber}</span>}
            </div>
            <p className="text-slate-500 mt-2">📍 {property.address}</p>
          </div>
          <span className={`px-4 py-1.5 rounded-full text-sm font-semibold border ${STATUS_COLORS[property.status]}`}>{STATUS_LABELS[property.status]}</span>
        </div>

        <div className="flex border-b border-slate-100 px-6 no-print overflow-x-auto">
          {['info', 'docs', 'expenses', 'inspection'].map((tab) => (
            <button key={tab} onClick={() => setActiveTab(tab as any)} className={`px-6 py-4 text-sm font-medium transition-colors border-b-2 whitespace-nowrap ${activeTab === tab ? 'border-amber-500 text-amber-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
              {tab === 'info' ? 'ข้อมูลเช่า' : tab === 'docs' ? 'เอกสาร' : tab === 'expenses' ? 'ค่าใช้จ่าย' : 'ตรวจรับห้อง'}
            </button>
          ))}
        </div>

        <div className="p-8">
          {activeTab === 'info' && (
            <div className="space-y-8">
              {property.status === PropertyStatus.CANCELED && (
                <div className="p-6 bg-rose-50 border border-rose-100 rounded-2xl animate-in slide-in-from-top-2 duration-300">
                  <h4 className="text-rose-900 font-black flex items-center gap-2 mb-2"><span className="text-xl">⚠️</span> ข้อมูลการยกเลิกสัญญา</h4>
                  <p className="text-sm text-rose-800"><span className="font-bold">วันที่ยกเลิก:</span> {property.cancellationDate || '-'}</p>
                  <p className="text-sm text-rose-800"><span className="font-bold">เหตุผล:</span> {property.cancellationReason || 'ไม่ได้ระบุ'}</p>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider">รายละเอียดห้องพัก</h4>
                    <button onClick={() => { if (isEditingInfo) handleSaveInfo(); else { setEditData({...property}); setIsEditingInfo(true); } }} className="text-xs font-bold text-indigo-600 hover:underline">{isEditingInfo ? 'บันทึกข้อมูล' : 'แก้ไขข้อมูลพื้นฐาน'}</button>
                  </div>
                  <div className="bg-slate-50 p-6 rounded-xl space-y-4">
                    {isEditingInfo ? (
                      <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2"><label className="text-[10px] font-bold text-slate-400 uppercase">ชื่อโครงการ</label><input type="text" className="w-full bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-sm" value={editData.name} onChange={e => setEditData({...editData, name: e.target.value})} /></div>
                        <div><label className="text-[10px] font-bold text-slate-400 uppercase">ตึก</label><input type="text" className="w-full bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-sm" value={editData.building} onChange={e => setEditData({...editData, building: e.target.value})} /></div>
                        <div><label className="text-[10px] font-bold text-slate-400 uppercase">ชั้น</label><input type="text" className="w-full bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-sm" value={editData.floor} onChange={e => setEditData({...editData, floor: e.target.value})} /></div>
                        <div><label className="text-[10px] font-bold text-slate-400 uppercase">วันเริ่มสัญญา</label><input type="date" className="w-full bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-sm" value={editData.contractStartDate} onChange={e => setEditData({...editData, contractStartDate: e.target.value})} /></div>
                        <div><label className="text-[10px] font-bold text-slate-400 uppercase">วันสิ้นสุดสัญญา</label><input type="date" className="w-full bg-white border border-slate-200 px-3 py-1.5 rounded-lg text-sm" value={editData.contractEndDate} onChange={e => setEditData({...editData, contractEndDate: e.target.value})} /></div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex justify-between"><span className="text-slate-500">ค่าเช่ารายเดือน</span><span className="font-bold text-slate-900">฿{property.rentAmount.toLocaleString()}</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">วันครบกำหนดชำระ</span><span className="font-bold text-slate-900">วันที่ {property.paymentDueDate}</span></div>
                        <div className="flex justify-between"><span className="text-slate-500">ชื่อผู้เช่า</span><span className="font-bold text-slate-900">{property.tenantName || '-'}</span></div>
                        <div className="flex justify-between border-t pt-2 mt-2"><span className="text-slate-500 text-xs">เริ่มสัญญา</span><span className="text-xs font-bold">{property.contractStartDate || '-'}</span></div>
                        <div className="flex justify-between"><span className="text-slate-500 text-xs">สิ้นสุดสัญญา</span><span className="text-xs font-bold">{property.contractEndDate || '-'}</span></div>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center justify-between p-4 border border-slate-200 rounded-xl">
                    <span className="text-sm font-medium">สถานะการซ่อม: {REPAIR_STATUS_LABELS[property.repairStatus]}</span>
                    <select value={property.repairStatus} onChange={(e) => handleRepairStatusChange(e.target.value as RepairStatus)} className="text-xs bg-white border border-slate-200 rounded px-2 py-1">
                      {Object.values(RepairStatus).map(s => <option key={s} value={s}>{REPAIR_STATUS_LABELS[s]}</option>)}
                    </select>
                  </div>
                </div>
                <div className="space-y-4">
                   <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider">ความคืบหน้าสัญญา</h4>
                   <div className="bg-slate-50 p-6 rounded-xl">
                      <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden mb-4"><div className="h-full bg-emerald-500" style={{ width: `${stats.progress}%` }}></div></div>
                      <div className="flex justify-between items-center"><p className="text-xl font-black">{stats.daysLeft} วัน</p><p className="text-sm font-bold">{stats.progress}%</p></div>
                   </div>
                   {stats.status === 'EXPIRING_SOON' && (
                     <div className="p-4 bg-amber-50 border border-amber-100 rounded-xl">
                        <p className="text-xs font-bold text-amber-800">⚠️ สัญญาจะหมดอายุในอีก {stats.daysLeft} วัน</p>
                        <button onClick={() => setShowRenewModal(true)} className="text-[10px] font-black uppercase tracking-widest text-indigo-600 mt-2 hover:underline">คลิกเพื่อต่อสัญญาตอนนี้</button>
                     </div>
                   )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'docs' && (
            <div className="space-y-8">
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                {docCategories.map(cat => (
                  <button key={cat.id} onClick={() => triggerUpload(cat.id)} className="border-2 border-dashed border-slate-200 rounded-xl p-4 flex flex-col items-center justify-center gap-2 hover:border-amber-400 transition-colors group">
                    <span className="text-2xl">➕</span><span className="text-[10px] font-bold text-slate-400 uppercase text-center">{cat.label}</span>
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mt-8">
                 {property.documents.map(doc => (
                    <div key={doc.id} className="bg-white border border-slate-200 rounded-xl p-4 flex items-center justify-between group">
                       <p className="text-sm font-bold truncate pr-2">{doc.name}</p>
                       <div className="flex gap-2 shrink-0"><a href={doc.url} target="_blank" className="p-2 text-slate-400 hover:text-indigo-600 transition-colors">👁️</a></div>
                    </div>
                 ))}
              </div>
            </div>
          )}

          {activeTab === 'expenses' && (
            <div className="space-y-4 overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-slate-50 text-slate-400 uppercase text-[10px] font-bold"><tr><th className="p-4">รายการ</th><th className="p-4">จำนวนเงิน</th><th className="p-4">วันที่</th><th className="p-4">สถานะ</th></tr></thead>
                <tbody className="divide-y divide-slate-50">
                  {property.expenses.map(exp => (
                    <tr key={exp.id}>
                      <td className="p-4 font-medium">{exp.title}</td>
                      <td className="p-4 font-bold text-indigo-600">฿{exp.amount.toLocaleString()}</td>
                      <td className="p-4 text-slate-500">{exp.date}</td>
                      <td className="p-4"><span className={`px-2 py-1 rounded text-[10px] font-bold ${exp.status === 'PAID' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{exp.status === 'PAID' ? 'ชำระแล้ว' : 'ค้างชำระ'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {activeTab === 'inspection' && (
            <div className="space-y-8 animate-in fade-in duration-500">
              <div className="flex justify-between items-center">
                <h4 className="text-lg font-bold text-slate-800">ประวัติการตรวจรับและแจ้งความเสียหาย</h4>
                {!isAddingInspection && (
                  <button onClick={() => setIsAddingInspection(true)} className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all">+ สร้างรายการตรวจรับใหม่</button>
                )}
              </div>

              {isAddingInspection && (
                <div className="bg-slate-50 border border-slate-200 rounded-[2rem] p-8 space-y-6 animate-in slide-in-from-top-4 duration-300">
                  <div className="flex justify-between items-center">
                    <h5 className="font-black text-slate-900">📝 แบบฟอร์มตรวจรับห้องพัก</h5>
                    <button onClick={() => setIsAddingInspection(false)} className="text-slate-400 hover:text-slate-600">✕ ปิด</button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">หัวข้อการตรวจสอบ / ชื่อจุดเช็ค</label>
                        <input type="text" className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500" placeholder="เช่น ตรวจรับห้องก่อนเข้าอยู่, ตรวจรับหลังย้ายออก" value={newInspection.description} onChange={e => setNewInspection({...newInspection, description: e.target.value})} />
                      </div>
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">หมวดหมู่</label>
                        <select className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 bg-white" value={newInspection.category} onChange={e => setNewInspection({...newInspection, category: e.target.value as InspectionCategory})}>
                          {Object.values(InspectionCategory).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        </select>
                      </div>
                      <div className="flex gap-4">
                        <button onClick={() => setNewInspection({...newInspection, isOk: true})} className={`flex-1 py-3 rounded-xl border font-bold transition-all ${newInspection.isOk ? 'bg-emerald-500 text-white border-emerald-600 shadow-lg' : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50'}`}>🟢 ปกติ</button>
                        <button onClick={() => setNewInspection({...newInspection, isOk: false})} className={`flex-1 py-3 rounded-xl border font-bold transition-all ${!newInspection.isOk ? 'bg-rose-500 text-white border-rose-600 shadow-lg' : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-50'}`}>🔴 พบความเสียหาย</button>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div>
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">รายละเอียดความเสียหาย (ถ้ามี)</label>
                        <textarea className="w-full h-[150px] px-4 py-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 resize-none" placeholder="ระบุตำแหน่งที่ชำรุด หรือรายละเอียดเพิ่มเติม..." value={newInspection.damageDetails} onChange={e => setNewInspection({...newInspection, damageDetails: e.target.value})} />
                      </div>
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-4">
                       <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">📷 รูปภาพหลักฐาน ({newInspection.images?.length || 0})</label>
                       <button onClick={() => inspectionPhotosRef.current?.click()} className="text-xs font-bold text-indigo-600 hover:underline">เพิ่มรูปภาพ</button>
                    </div>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                       {newInspection.images?.map((img, idx) => (
                         <div key={idx} className="relative aspect-square rounded-xl overflow-hidden group">
                           <img src={img} className="w-full h-full object-cover" />
                           <button onClick={() => removeNewInspectionPhoto(idx)} className="absolute top-1 right-1 w-6 h-6 bg-rose-500 text-white rounded-full flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
                         </div>
                       ))}
                       <button onClick={() => inspectionPhotosRef.current?.click()} className="aspect-square border-2 border-dashed border-slate-300 rounded-xl flex items-center justify-center text-slate-300 hover:border-indigo-500 hover:text-indigo-500 transition-all">
                         <span className="text-2xl">+</span>
                       </button>
                    </div>
                  </div>

                  <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                    <button onClick={() => setIsAddingInspection(false)} className="px-8 py-3 text-slate-500 font-bold hover:bg-slate-100 rounded-xl transition-colors">ยกเลิก</button>
                    <button onClick={handleSaveInspection} className="px-10 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 shadow-xl transition-all">บันทึกรายการ</button>
                  </div>
                </div>
              )}

              <div className="space-y-6">
                {property.inspections.length === 0 ? (
                  <div className="py-20 text-center text-slate-400 border-2 border-dashed border-slate-100 rounded-[2.5rem]">
                    <span className="text-5xl block mb-4">📋</span>
                    <p className="font-bold">ยังไม่มีบันทึกการตรวจรับห้องพัก</p>
                    <p className="text-xs mt-1 italic">ประวัติความเสียหายและรูปภาพจะแสดงที่นี่หลังจากมีการบันทึกข้อมูล</p>
                  </div>
                ) : (
                  property.inspections.map((item) => (
                    <div key={item.id} className="bg-white border border-slate-100 rounded-3xl p-6 shadow-sm hover:shadow-md transition-shadow relative group">
                      <div className="flex flex-col md:flex-row gap-6">
                        <div className="w-full md:w-[200px] shrink-0">
                          <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border mb-2 inline-block ${item.isOk ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-rose-50 text-rose-700 border-rose-100'}`}>
                            {item.isOk ? '🟢 ปกติ' : '🔴 ความเสียหาย'}
                          </span>
                          <p className="text-sm font-black text-slate-900 mb-1">{item.description}</p>
                          <p className="text-[10px] font-bold text-indigo-500 uppercase">{item.category}</p>
                          <p className="text-[10px] text-slate-400 mt-4">📅 บันทึกเมื่อ: {item.date}</p>
                        </div>
                        <div className="flex-1 space-y-4">
                          {item.damageDetails && (
                            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                               <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">รายละเอียดความชำรุด</p>
                               <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{item.damageDetails}</p>
                            </div>
                          )}
                          <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                            {item.images.map((img, idx) => (
                              <a key={idx} href={img} target="_blank" rel="noreferrer" className="aspect-square rounded-lg overflow-hidden border border-slate-100 hover:ring-2 hover:ring-indigo-500 transition-all">
                                <img src={img} className="w-full h-full object-cover" />
                              </a>
                            ))}
                          </div>
                        </div>
                      </div>
                      <button onClick={() => removeInspection(item.id)} className="absolute top-4 right-4 p-2 text-slate-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all">🗑️</button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PropertyDetail;
