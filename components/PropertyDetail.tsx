
import React, { useState, useRef, useMemo } from 'react';
import { Property, PropertyStatus, Document, LinkedMember, UserRole, Staff, PaymentRecord, PaymentStatus } from '../types';
import { STATUS_COLORS, STATUS_LABELS } from '../constants';

interface PropertyDetailProps {
  property: Property;
  onUpdate: (updated: Property) => void;
  onDelete: (id: string) => void;
  onBack: () => void;
  staffMembers: Staff[];
  currentUser: Staff | null;
}

const PropertyDetail: React.FC<PropertyDetailProps> = ({ property, onUpdate, onDelete, onBack, staffMembers, currentUser }) => {
  const [activeTab, setActiveTab] = useState<'info' | 'payments' | 'docs' | 'team'>('info');
  const [showRenewModal, setShowRenewModal] = useState(false);
  const [renewMonths, setRenewMonths] = useState(12);
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [editData, setEditData] = useState<Property>(property);
  
  const proofInputRef = useRef<HTMLInputElement>(null);
  const [uploadingForPaymentId, setUploadingForPaymentId] = useState<string | null>(null);

  // 1. ระบบคำนวณ Progress ของสัญญาตามเวลาจริง
  const contractStats = useMemo(() => {
    if (property.status === PropertyStatus.CANCELED) return { progress: 0, daysLeft: 0 };
    if (!property.contractStartDate || !property.contractEndDate) return { progress: 0, daysLeft: 0 };
    
    const start = new Date(property.contractStartDate).getTime();
    const end = new Date(property.contractEndDate).getTime();
    const now = Date.now();
    
    const totalDays = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));
    const daysPassed = Math.max(0, Math.ceil((now - start) / (1000 * 60 * 60 * 24)));
    const daysLeft = Math.ceil((end - now) / (1000 * 60 * 60 * 24));
    
    let progress = Math.min(100, Math.max(0, Math.round((daysPassed / totalDays) * 100)));
    return { progress, daysLeft };
  }, [property]);

  // 2. ระบบจำลอง Log การแจ้งเตือน (Simulated SMS/Email Notifications)
  const notificationLogs = useMemo(() => {
    if (!property.contractEndDate || property.status === PropertyStatus.CANCELED) return [];
    
    const logs: { id: string; type: string; msg: string; date: string; icon: string; status: string }[] = [];
    const today = new Date();
    const dueDate = new Date(today.getFullYear(), today.getMonth(), property.paymentDueDate);
    
    // แจ้งเตือน 1 วันก่อนครบกำหนด
    const reminderDate = new Date(dueDate);
    reminderDate.setDate(dueDate.getDate() - 1);
    if (today >= reminderDate) {
      logs.push({ id: '1', type: 'EMAIL', msg: `แจ้งเตือนเตรียมชำระเงินวันที่ ${property.paymentDueDate}`, date: reminderDate.toLocaleDateString(), icon: '🔔', status: 'Delivered' });
    }

    // แจ้งเตือนล่าช้า (ถ้ายังไม่จ่าย)
    const currentMonth = today.toISOString().slice(0, 7);
    const paidThisMonth = property.paymentHistory?.find(p => p.month === currentMonth && p.status === PaymentStatus.PAID);
    if (today > dueDate && !paidThisMonth) {
      logs.push({ id: '2', type: 'SMS', msg: 'แจ้งเตือน: ค้างชำระค่าเช่าเกินกำหนด กรุณาชำระเงินทันที', date: today.toLocaleDateString(), icon: '⚠️', status: 'Sent' });
    }

    // แจ้งเตือนต่อสัญญา (1 เดือนก่อนหมด)
    const contractEnd = new Date(property.contractEndDate);
    const oneMonthBefore = new Date(contractEnd);
    oneMonthBefore.setMonth(oneMonthBefore.getMonth() - 1);
    if (today >= oneMonthBefore) {
      logs.push({ id: '3', type: 'EMAIL', msg: 'แจ้งเตือน: สัญญาเช่ากำลังจะหมดอายุใน 30 วัน', date: oneMonthBefore.toLocaleDateString(), icon: '📜', status: 'Delivered' });
    }

    return logs.reverse();
  }, [property]);

  // 3. จัดการการอัปโหลดและยืนยันยอด
  const triggerProofUpload = (paymentId: string) => {
    setUploadingForPaymentId(paymentId);
    proofInputRef.current?.click();
  };

  const handleProofChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadingForPaymentId) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const updatedHistory = (property.paymentHistory || []).map(p => 
        p.id === uploadingForPaymentId ? { ...p, proofUrl: reader.result as string, status: PaymentStatus.VERIFYING } : p
      );
      onUpdate({ ...property, paymentHistory: updatedHistory });
      setUploadingForPaymentId(null);
      alert('อัปโหลดหลักฐานแล้ว รอ Agent/Owner ตรวจสอบ');
    };
    reader.readAsDataURL(file);
  };

  const verifyPayment = (paymentId: string) => {
    if (!currentUser || ![UserRole.ADMIN, UserRole.STAFF, UserRole.OWNER].includes(currentUser.role)) {
      return alert('เฉพาะ Agent หรือ Owner เท่านั้นที่สามารถยืนยันยอดได้');
    }

    const updatedHistory = (property.paymentHistory || []).map(p => 
      p.id === paymentId ? { ...p, status: PaymentStatus.PAID, paidDate: new Date().toLocaleDateString(), verifiedBy: currentUser.firstName } : p
    );
    onUpdate({ ...property, paymentHistory: updatedHistory });
  };

  const createNewPaymentMonth = () => {
    const month = prompt('ระบุรอบเดือน (เช่น 2024-05)');
    if (!month) return;
    const record: PaymentRecord = {
      id: Math.random().toString(36).substr(2, 9),
      month,
      amount: property.rentAmount,
      dueDate: `${month}-${String(property.paymentDueDate).padStart(2, '0')}`,
      status: PaymentStatus.PENDING
    };
    onUpdate({ ...property, paymentHistory: [...(property.paymentHistory || []), record] });
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20 px-4 lg:px-0">
      <input type="file" ref={proofInputRef} onChange={handleProofChange} className="hidden" accept="image/*" />
      
      <div className="flex justify-between items-center no-print">
        <button onClick={onBack} className="text-slate-500 hover:text-slate-800 font-bold flex items-center gap-2"><span>← กลับ</span></button>
        <div className="flex gap-2">
           <button onClick={() => setShowRenewModal(true)} className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-bold text-xs shadow-lg">✨ ต่อสัญญา</button>
           <button onClick={() => onDelete(property.id)} className="px-4 py-2 bg-rose-50 text-rose-600 rounded-xl font-bold text-xs">🗑️ ลบ</button>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
        {/* Header Section */}
        <div className="p-8 border-b border-slate-50 flex flex-col md:flex-row justify-between items-start gap-4">
          <div>
            <h2 className="text-3xl font-black text-slate-900 leading-tight">{property.name}</h2>
            <div className="flex gap-2 mt-2">
               <span className="bg-indigo-50 text-indigo-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-indigo-100">จ่ายวันที่ {property.paymentDueDate} ของเดือน</span>
               <span className="bg-slate-50 text-slate-500 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">Room {property.roomNumber}</span>
            </div>
          </div>
          <span className={`px-4 py-1.5 rounded-full text-xs font-black border uppercase ${STATUS_COLORS[property.status]}`}>{STATUS_LABELS[property.status]}</span>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-50 px-6 bg-slate-50/30 overflow-x-auto hide-scrollbar">
          {[
            { id: 'info', label: 'ภาพรวมสัญญา', icon: '📜' },
            { id: 'payments', label: 'การเงินและสลิป', icon: '💰' },
            { id: 'team', label: 'ผู้เกี่ยวข้อง', icon: '👥' },
            { id: 'docs', label: 'เอกสาร', icon: '📂' }
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`px-6 py-4 text-xs font-bold transition-all border-b-2 whitespace-nowrap flex items-center gap-2 ${activeTab === tab.id ? 'border-amber-500 text-amber-600 bg-white' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>
              <span>{tab.icon}</span> {tab.label}
            </button>
          ))}
        </div>

        <div className="p-8">
          {activeTab === 'info' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
               {/* Contract Timeline */}
               <div className="space-y-6">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contract Status (Real-time)</h4>
                  <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 space-y-6">
                     <div className="flex justify-between items-end">
                        <div>
                           <p className="text-[10px] text-slate-400 font-bold uppercase">สิ้นสุดสัญญา</p>
                           <p className="text-2xl font-black text-rose-500">{property.contractEndDate || '-'}</p>
                        </div>
                        <div className="text-right">
                           <p className="text-[10px] text-slate-400 font-bold uppercase">เหลือเวลาอีก</p>
                           <p className="text-lg font-black text-slate-900">{contractStats.daysLeft} วัน</p>
                        </div>
                     </div>
                     <div className="space-y-2">
                        <div className="w-full h-3 bg-slate-200 rounded-full overflow-hidden shadow-inner">
                           <div className="h-full bg-indigo-600 transition-all duration-1000" style={{ width: `${contractStats.progress}%` }}></div>
                        </div>
                        <p className="text-[10px] text-center font-bold text-slate-400 uppercase">Progress {contractStats.progress}%</p>
                     </div>
                  </div>
                  
                  <div className="bg-slate-900 rounded-[2rem] p-8 text-white relative overflow-hidden group">
                     <div className="relative z-10">
                        <h5 className="text-xs font-black opacity-50 uppercase mb-4 tracking-widest">การแจ้งเตือนอัตโนมัติ</h5>
                        <p className="text-[10px] leading-relaxed opacity-70 mb-4">ระบบจะส่ง SMS และ Email ถึงสมาชิกทุกคนในห้องโดยอัตโนมัติเมื่อถึงเงื่อนไขที่กำหนด</p>
                        <div className="flex gap-2">
                           <span className="bg-white/10 px-2 py-1 rounded text-[8px] font-black uppercase">1-Day Reminder</span>
                           <span className="bg-white/10 px-2 py-1 rounded text-[8px] font-black uppercase">Daily Overdue</span>
                           <span className="bg-white/10 px-2 py-1 rounded text-[8px] font-black uppercase">30-Day Renewal</span>
                        </div>
                     </div>
                     <div className="absolute -right-6 -bottom-6 text-8xl opacity-5 group-hover:scale-110 transition-transform">🔔</div>
                  </div>
               </div>

               {/* Notifications Feed */}
               <div className="space-y-6">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">System Notification Logs</h4>
                  <div className="space-y-3">
                     {notificationLogs.map(log => (
                        <div key={log.id} className="p-4 bg-white border border-slate-100 rounded-2xl flex items-center gap-4 transition-all hover:translate-x-1">
                           <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-lg shadow-sm border border-slate-50">{log.icon}</div>
                           <div className="flex-1">
                              <p className="text-xs font-black text-slate-800 leading-tight">{log.msg}</p>
                              <div className="flex gap-2 mt-1">
                                 <span className="text-[8px] font-black text-indigo-500 uppercase">{log.type}</span>
                                 <span className="text-[8px] font-bold text-slate-400">{log.date}</span>
                                 <span className="text-[8px] font-black text-emerald-500 uppercase ml-auto">{log.status}</span>
                              </div>
                           </div>
                        </div>
                     ))}
                     {notificationLogs.length === 0 && <p className="text-xs text-slate-300 italic py-10 text-center">ยังไม่มีประวัติการแจ้งเตือน</p>}
                  </div>
               </div>
            </div>
          )}

          {activeTab === 'payments' && (
            <div className="space-y-8 animate-in fade-in duration-500">
               <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-black text-slate-900">ประวัติการชำระค่าเช่า</h3>
                    <p className="text-xs text-slate-400">อัปโหลดสลิปและให้ Agent/Owner ยืนยันยอดรายเดือน</p>
                  </div>
                  <button onClick={createNewPaymentMonth} className="px-5 py-2.5 bg-slate-900 text-white font-black rounded-xl text-xs">+ เรียกเก็บเงินเดือนใหม่</button>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {(property.paymentHistory || []).slice().reverse().map(payment => (
                    <div key={payment.id} className={`bg-white border rounded-[2rem] p-6 shadow-sm relative group overflow-hidden ${payment.status === PaymentStatus.VERIFYING ? 'border-amber-300 ring-4 ring-amber-50' : 'border-slate-100'}`}>
                       <div className="flex justify-between items-start mb-6">
                          <div>
                             <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{payment.month}</p>
                             <p className="text-lg font-black text-slate-900">฿{payment.amount.toLocaleString()}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-[8px] font-black border uppercase ${
                             payment.status === PaymentStatus.PAID ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                             payment.status === PaymentStatus.VERIFYING ? 'bg-amber-50 text-amber-600 border-amber-200' :
                             payment.status === PaymentStatus.OVERDUE ? 'bg-rose-50 text-rose-600 border-rose-200' :
                             'bg-slate-50 text-slate-400 border-slate-100'
                          }`}>
                             {payment.status}
                          </span>
                       </div>

                       <div className="space-y-4">
                          <div className="flex justify-between items-center text-[10px] font-bold">
                             <span className="text-slate-400 uppercase">Due Date</span>
                             <span className="text-slate-800">{payment.dueDate}</span>
                          </div>
                          
                          {payment.proofUrl ? (
                            <div className="space-y-3">
                               <div className="aspect-[4/3] w-full bg-slate-50 rounded-2xl overflow-hidden border border-slate-100 relative group/img">
                                  <img src={payment.proofUrl} className="w-full h-full object-cover" />
                                  <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center">
                                     <a href={payment.proofUrl} target="_blank" className="px-4 py-2 bg-white rounded-xl text-xs font-black shadow-xl">ขยายรูปสลิป</a>
                                  </div>
                               </div>
                               {payment.status === PaymentStatus.VERIFYING && (
                                  <button 
                                    onClick={() => verifyPayment(payment.id)}
                                    className="w-full py-3 bg-emerald-500 text-white font-black rounded-xl text-xs shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all"
                                  >
                                    ✅ ยืนยันยอดเงิน (Verify)
                                  </button>
                               )}
                               {payment.status === PaymentStatus.PAID && (
                                  <div className="bg-emerald-50 p-3 rounded-2xl border border-emerald-100 flex items-center gap-3">
                                     <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px] font-black">✓</div>
                                     <div className="min-w-0">
                                        <p className="text-[10px] font-black text-emerald-700 truncate">ยืนยันโดย {payment.verifiedBy}</p>
                                        <p className="text-[8px] text-emerald-500 uppercase">{payment.paidDate}</p>
                                     </div>
                                  </div>
                               )}
                            </div>
                          ) : (
                            <div className="space-y-3">
                               <p className="text-center text-[10px] text-slate-300 italic py-4">รออัปโหลดหลักฐานการโอนเงิน</p>
                               <button 
                                  onClick={() => triggerProofUpload(payment.id)}
                                  className="w-full py-3 bg-indigo-50 text-indigo-600 font-black rounded-xl text-[10px] uppercase border border-indigo-100 hover:bg-indigo-100 transition-all"
                                >
                                  📤 อัปโหลดสลิป
                                </button>
                            </div>
                          )}
                       </div>
                    </div>
                  ))}
                  {(!property.paymentHistory || property.paymentHistory.length === 0) && (
                    <div className="col-span-full py-20 text-center text-slate-300 border-2 border-dashed border-slate-100 rounded-[3rem] bg-slate-50/30">
                       <p className="text-5xl mb-4 opacity-20">💳</p>
                       <p className="font-bold text-slate-400">ยังไม่มีรายการเก็บเงินสำหรับที่พักนี้</p>
                    </div>
                  )}
               </div>
            </div>
          )}
          {/* Other tabs remain similar... */}
        </div>
      </div>
    </div>
  );
};

export default PropertyDetail;
