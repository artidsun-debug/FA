
import React, { useState, useRef } from 'react';
import { Staff, ApprovalStatus } from '../types';

interface AgentOnboardingProps {
  agent: Staff;
  onUpdateAgent: (agent: Staff) => void;
  onLogout: () => void;
}

const AgentOnboarding: React.FC<AgentOnboardingProps> = ({ agent, onUpdateAgent, onLogout }) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    idCardNumber: agent.idCardNumber || '',
    idCardPhoto: agent.idCardPhoto || '',
    deedPhoto: agent.deedPhoto || ''
  });
  const [isUploading, setIsUploading] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const deedInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
     const file = e.target.files?.[0];
     if (!file) return;
     setIsUploading(field);
     const reader = new FileReader();
     reader.onloadend = () => {
        setFormData(prev => ({ ...prev, [field]: reader.result as string }));
        setIsUploading(null);
     };
     reader.readAsDataURL(file);
  };

  const handleSave = () => {
    if (!formData.idCardNumber || !formData.idCardPhoto) {
      return alert('กรุณาระบุเลขบัตรประชาชนและอัปโหลดรูปถ่ายบัตรประชาชน');
    }
    
    onUpdateAgent({
      ...agent,
      idCardNumber: formData.idCardNumber,
      idCardPhoto: formData.idCardPhoto,
      deedPhoto: formData.deedPhoto,
      approvalStatus: ApprovalStatus.PENDING
    });
    setStep(3);
  };

  return (
    <div className="fixed inset-0 bg-slate-50 flex items-center justify-center p-4 z-[9999] overflow-y-auto">
      <div className="w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden animate-in zoom-in duration-500">
        <div className="bg-slate-900 p-8 text-white flex justify-between items-center">
           <div>
              <h2 className="text-2xl font-black">ยินดีต้อนรับ Agent ใหม่ 💼</h2>
              <p className="text-slate-400 text-sm">กรุณายืนยันตัวตนเพื่อขอสิทธิ์การเข้าใช้งานระบบ</p>
           </div>
           <button onClick={onLogout} className="text-xs font-bold text-slate-500 hover:text-white transition-colors">Logout</button>
        </div>

        <div className="p-10">
          {step === 1 && (
            <div className="space-y-8 animate-in slide-in-from-right-4">
               <div className="space-y-4">
                  <h3 className="text-lg font-bold text-slate-800">ขั้นตอนที่ 1: ข้อมูลบัตรประชาชน</h3>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-1">เลขประจำตัวประชาชน (13 หลัก)</label>
                    <input 
                      type="text" 
                      maxLength={13}
                      value={formData.idCardNumber}
                      onChange={e => setFormData({...formData, idCardNumber: e.target.value.replace(/\D/g, '')})}
                      className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-2 focus:ring-amber-500 font-black text-slate-900 tracking-widest"
                      placeholder="X-XXXX-XXXXX-XX-X"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
                     <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-slate-400 ml-1">รูปถ่ายบัตรประชาชน (Front View)</label>
                        <button 
                           onClick={() => fileInputRef.current?.click()}
                           className="w-full aspect-video bg-slate-100 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center gap-2 hover:border-amber-400 transition-all overflow-hidden relative group"
                        >
                           {formData.idCardPhoto ? (
                             <img src={formData.idCardPhoto} className="w-full h-full object-cover" />
                           ) : (
                             <>
                                <span className="text-3xl text-slate-400">📷</span>
                                <span className="text-[10px] font-bold text-slate-400">คลิกเพื่ออัปโหลด</span>
                             </>
                           )}
                           <input type="file" ref={fileInputRef} onChange={e => handleFileUpload(e, 'idCardPhoto')} className="hidden" accept="image/*" />
                        </button>
                     </div>
                     <div className="bg-amber-50 border border-amber-100 p-6 rounded-3xl self-center">
                        <p className="text-[10px] text-amber-800 font-black uppercase mb-2">คำแนะนำ ⚠️</p>
                        <p className="text-xs text-amber-700 leading-relaxed">ข้อมูลบัตรประชาชนจะถูกใช้เพื่อการตรวจสอบความปลอดภัยภายในบริษัทเท่านั้น และจะถูกเก็บเป็นความลับสูงสุด</p>
                     </div>
                  </div>
               </div>
               <button onClick={() => setStep(2)} className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl shadow-xl hover:bg-slate-800 transition-all">ถัดไป</button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8 animate-in slide-in-from-right-4">
               <div className="space-y-4">
                  <h3 className="text-lg font-bold text-slate-800">ขั้นตอนที่ 2: เอกสารกรรมสิทธิ์ (ถ้ามี)</h3>
                  <p className="text-sm text-slate-500">แนบโฉนดที่ดินของที่พักที่คุณต้องการนำมาปล่อยเช่าในระบบ</p>
                  
                  <button 
                     onClick={() => deedInputRef.current?.click()}
                     className="w-full aspect-[2/1] bg-slate-50 border-2 border-dashed border-slate-200 rounded-[2rem] flex flex-col items-center justify-center gap-3 hover:border-indigo-400 transition-all overflow-hidden relative"
                  >
                     {formData.deedPhoto ? (
                        <img src={formData.deedPhoto} className="w-full h-full object-contain" />
                     ) : (
                        <>
                           <span className="text-5xl opacity-30">📜</span>
                           <span className="text-xs font-black text-slate-400 uppercase">คลิกเพื่อแนบรูปโฉนดที่ดิน</span>
                        </>
                     )}
                     <input type="file" ref={deedInputRef} onChange={e => handleFileUpload(e, 'deedPhoto')} className="hidden" accept="image/*" />
                  </button>
               </div>
               
               <div className="flex gap-4">
                  <button onClick={() => setStep(1)} className="flex-1 py-4 border border-slate-200 text-slate-500 font-bold rounded-2xl">ย้อนกลับ</button>
                  <button onClick={handleSave} className="flex-[2] py-4 bg-amber-500 text-slate-900 font-black rounded-2xl shadow-xl shadow-amber-500/20 hover:bg-amber-400 transition-all">ส่งข้อมูลขออนุมัติ</button>
               </div>
            </div>
          )}

          {step === 3 && (
            <div className="text-center space-y-8 animate-in zoom-in duration-500 py-10">
               <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-4xl mx-auto border-4 border-emerald-50">
                  ⏳
               </div>
               <div className="space-y-2">
                  <h3 className="text-2xl font-black text-slate-900">ได้รับข้อมูลเรียบร้อยแล้ว</h3>
                  <p className="text-slate-500 text-sm max-w-sm mx-auto">ขณะนี้ Admin กำลังตรวจสอบข้อมูลและเอกสารของคุณ เมื่อได้รับการอนุมัติ คุณจะสามารถเข้าจัดการที่พักในระบบได้ทันที</p>
               </div>
               <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 inline-block">
                  <p className="text-[10px] font-black text-slate-400 uppercase mb-1">Status</p>
                  <span className="px-4 py-1 bg-amber-100 text-amber-800 rounded-full text-xs font-black border border-amber-200 uppercase">Waiting for Approval</span>
               </div>
               <div className="pt-6">
                  <button onClick={onLogout} className="text-indigo-600 font-black text-sm hover:underline">ออกจากระบบ</button>
               </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AgentOnboarding;
