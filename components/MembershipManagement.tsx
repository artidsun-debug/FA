
import React from 'react';
import { CompanyInfo, SubscriptionTier, SubscriptionInfo } from '../types';

interface MembershipManagementProps {
  company: CompanyInfo;
  setCompany: (info: CompanyInfo) => void;
}

const MembershipManagement: React.FC<MembershipManagementProps> = ({ company, setCompany }) => {
  const currentPlan = company.subscription;
  const pricing = company.pricing;

  const handleSubscribe = (plan: 'MONTHLY' | 'YEARLY') => {
    const duration = plan === 'MONTHLY' ? 1 : 12;
    const startDate = new Date();
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + duration);

    const updatedSubscription: SubscriptionInfo = {
      tier: SubscriptionTier.PREMIUM,
      plan,
      startDate: startDate.toISOString().split('T')[0],
      expiryDate: expiryDate.toISOString().split('T')[0],
      autoRenew: true
    };

    setCompany({ ...company, subscription: updatedSubscription });
    alert(`สมัครสมาชิกแพ็คเกจ ${plan === 'MONTHLY' ? 'รายเดือน' : 'รายปี'} สำเร็จ!`);
  };

  const handleCancel = () => {
    if (window.confirm('คุณแน่ใจหรือไม่ว่าต้องการยกเลิกการต่ออายุสมาชิก? สิทธิ์การใช้งานจะสิ้นสุดลงเมื่อครบกำหนดรอบบิลปัจจุบัน')) {
      setCompany({ 
        ...company, 
        subscription: { ...company.subscription, autoRenew: false } 
      });
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">ระบบสมาชิกและแพ็คเกจ (Membership)</h2>
          <p className="text-sm text-slate-500">ยกระดับการจัดการด้วยฟีเจอร์ Premium สำหรับมืออาชีพ</p>
        </div>
        <div className={`px-4 py-2 rounded-xl text-sm font-bold border ${currentPlan.tier === SubscriptionTier.PREMIUM ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
          สถานะปัจจุบัน: {currentPlan.tier === SubscriptionTier.PREMIUM ? 'PREMIUM ✨' : 'FREE VERSION'}
        </div>
      </div>

      {currentPlan.tier === SubscriptionTier.PREMIUM && (
        <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white shadow-2xl relative overflow-hidden">
           <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl -mr-32 -mt-32"></div>
           <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
              <div className="space-y-2 text-center md:text-left">
                 <p className="text-emerald-400 text-xs font-black uppercase tracking-widest">Active Subscription</p>
                 <h3 className="text-4xl font-black">คุณกำลังใช้งานแพ็คเกจ {currentPlan.plan === 'MONTHLY' ? 'รายเดือน' : 'รายปี'}</h3>
                 <p className="text-slate-400">ครบกำหนดชำระรอบถัดไป: <span className="text-white font-bold">{currentPlan.expiryDate}</span></p>
              </div>
              <div className="flex gap-4">
                 {currentPlan.autoRenew ? (
                   <button onClick={handleCancel} className="px-8 py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-2xl text-sm font-bold transition-all">ยกเลิกการต่ออายุ</button>
                 ) : (
                   <button onClick={() => setCompany({...company, subscription: {...currentPlan, autoRenew: true}})} className="px-8 py-3 bg-emerald-500 hover:bg-emerald-600 text-slate-950 rounded-2xl text-sm font-black transition-all">เปิดใช้งานต่ออายุอัตโนมัติ</button>
                 )}
              </div>
           </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Monthly Plan */}
        <div className={`bg-white rounded-[2.5rem] p-10 border-2 transition-all shadow-sm flex flex-col ${currentPlan.plan === 'MONTHLY' ? 'border-amber-500 ring-4 ring-amber-50 shadow-xl' : 'border-slate-100 hover:border-slate-200'}`}>
           <div className="mb-8 flex justify-between items-start">
              <div>
                <span className="bg-slate-100 text-slate-500 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Flexibility</span>
                <h4 className="text-2xl font-black text-slate-900 mt-2">รายเดือน (Monthly)</h4>
              </div>
              <span className="text-4xl">🌕</span>
           </div>
           <div className="mb-10 flex items-baseline gap-2">
              <span className="text-5xl font-black text-slate-900">฿{pricing.monthlyPrice.toLocaleString()}</span>
              <span className="text-slate-400 font-bold">/ เดือน</span>
           </div>
           <ul className="space-y-4 mb-10 flex-1">
              {['ระบบจัดการที่พักไม่จำกัดจำนวน', 'ระบบบัญชี รายรับ-รายจ่าย เต็มรูปแบบ', 'สแกนใบเสร็จด้วย AI (Gemini Flash)', 'จัดการทีมงานและสิทธิ์เข้าถึง', 'แจ้งเตือนวันครบกำหนดชำระ'].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-sm font-medium text-slate-600">
                   <span className="text-emerald-500">✓</span> {item}
                </li>
              ))}
           </ul>
           <button 
             disabled={currentPlan.plan === 'MONTHLY'}
             onClick={() => handleSubscribe('MONTHLY')}
             className={`w-full py-4 rounded-2xl font-black transition-all ${currentPlan.plan === 'MONTHLY' ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-slate-900 text-white hover:bg-slate-800 shadow-xl shadow-slate-200'}`}
           >
             {currentPlan.plan === 'MONTHLY' ? 'กำลังใช้งาน' : 'เลือกแพ็คเกจรายเดือน'}
           </button>
        </div>

        {/* Yearly Plan */}
        <div className={`bg-white rounded-[2.5rem] p-10 border-2 transition-all shadow-sm relative overflow-hidden flex flex-col ${currentPlan.plan === 'YEARLY' ? 'border-amber-500 ring-4 ring-amber-50 shadow-xl' : 'border-slate-100 hover:border-slate-200'}`}>
           <div className="absolute top-0 right-0 bg-amber-500 text-white px-8 py-2 rounded-bl-3xl font-black text-[10px] uppercase tracking-widest">Best Value - ประหยัด 17%</div>
           <div className="mb-8 flex justify-between items-start">
              <div>
                <span className="bg-amber-100 text-amber-700 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Professional</span>
                <h4 className="text-2xl font-black text-slate-900 mt-2">รายปี (Yearly)</h4>
              </div>
              <span className="text-4xl">⭐</span>
           </div>
           <div className="mb-10 flex items-baseline gap-2">
              <span className="text-5xl font-black text-slate-900">฿{pricing.yearlyPrice.toLocaleString()}</span>
              <span className="text-slate-400 font-bold">/ ปี</span>
           </div>
           <ul className="space-y-4 mb-10 flex-1">
              {[
                'สิทธิประโยชน์ทั้งหมดจากรายเดือน', 
                'การสนับสนุนพิเศษจากทีมงาน (Priority Support)', 
                'ปรับแต่งแดชบอร์ด AI (Custom Insights)', 
                'รองรับพนักงานสูงสุดไม่จำกัด',
                'เก็บข้อมูลสำรองแบบ Real-time'
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-sm font-medium text-slate-600">
                   <span className="text-amber-500">✓</span> {item}
                </li>
              ))}
           </ul>
           <button 
             disabled={currentPlan.plan === 'YEARLY'}
             onClick={() => handleSubscribe('YEARLY')}
             className={`w-full py-4 rounded-2xl font-black transition-all ${currentPlan.plan === 'YEARLY' ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-amber-500 text-white hover:bg-amber-600 shadow-xl shadow-amber-200'}`}
           >
             {currentPlan.plan === 'YEARLY' ? 'กำลังใช้งาน' : 'เลือกแพ็คเกจรายปี'}
           </button>
        </div>
      </div>
    </div>
  );
};

export default MembershipManagement;
