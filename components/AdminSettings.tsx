
import React from 'react';
import { CompanyInfo } from '../types';

interface AdminSettingsProps {
  companyInfo: CompanyInfo;
  setCompanyInfo: (info: CompanyInfo) => void;
}

const AdminSettings: React.FC<AdminSettingsProps> = ({ companyInfo, setCompanyInfo }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCompanyInfo({ ...companyInfo, [name]: value });
  };

  const handlePricingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCompanyInfo({ 
      ...companyInfo, 
      pricing: { ...companyInfo.pricing, [name]: parseFloat(value) || 0 }
    });
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setCompanyInfo({ ...companyInfo, logo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">ตั้งค่าบริษัทและข้อมูลติดต่อ</h2>
          <p className="text-sm text-slate-500">จัดการข้อมูลที่จะแสดงในเอกสาร หน้าล็อกอิน และแดชบอร์ด</p>
        </div>
        <div className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-xs font-bold border border-emerald-100">
          ✓ บันทึกอัตโนมัติ (Autosave)
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm text-center">
            <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">โลโก้บริษัท</h4>
            <div className="w-32 h-32 bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl mx-auto flex items-center justify-center text-4xl overflow-hidden relative group">
              {companyInfo.logo.length > 5 ? (
                <img src={companyInfo.logo} alt="Logo" className="w-full h-full object-contain" />
              ) : (
                companyInfo.logo
              )}
              <label className="absolute inset-0 bg-slate-900/60 text-white text-[10px] font-bold flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity uppercase">
                เปลี่ยนโลโก้
                <input type="file" className="hidden" accept="image/*" onChange={handleLogoUpload} />
              </label>
            </div>
            <p className="mt-4 text-xs font-bold text-slate-900">{companyInfo.nameTh}</p>
          </div>

          <div className="bg-slate-900 p-8 rounded-[2rem] text-white shadow-xl">
             <h4 className="text-[10px] font-bold text-amber-500 uppercase tracking-widest mb-4">กำหนดราคาค่าสมาชิก (Pricing Config)</h4>
             <div className="space-y-4">
                <div>
                  <label className="text-[9px] text-slate-400 uppercase block mb-1">รายเดือน (บาท)</label>
                  <input 
                    type="number" 
                    name="monthlyPrice" 
                    value={companyInfo.pricing.monthlyPrice} 
                    onChange={handlePricingChange}
                    className="w-full bg-slate-800 border-none rounded-xl py-2 px-3 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
                <div>
                  <label className="text-[9px] text-slate-400 uppercase block mb-1">รายปี (บาท)</label>
                  <input 
                    type="number" 
                    name="yearlyPrice" 
                    value={companyInfo.pricing.yearlyPrice} 
                    onChange={handlePricingChange}
                    className="w-full bg-slate-800 border-none rounded-xl py-2 px-3 text-sm focus:ring-2 focus:ring-amber-500 outline-none"
                  />
                </div>
             </div>
          </div>
        </div>

        <div className="lg:col-span-2 space-y-6">
           <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                   <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">ชื่อบริษัท (ภาษาไทย)</label>
                   <input type="text" name="nameTh" value={companyInfo.nameTh} onChange={handleChange} className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-amber-500 outline-none" />
                 </div>
                 <div>
                   <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">ชื่อบริษัท (English)</label>
                   <input type="text" name="nameEn" value={companyInfo.nameEn} onChange={handleChange} className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-amber-500 outline-none" />
                 </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">ที่อยู่จดทะเบียน</label>
                <textarea name="addressTh" value={companyInfo.addressTh} onChange={handleChange} className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-amber-500 outline-none h-24 resize-none" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 <div>
                   <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Tax ID</label>
                   <input type="text" name="taxId" value={companyInfo.taxId} onChange={handleChange} className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-amber-500 outline-none font-mono" />
                 </div>
                 <div>
                   <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Office Phone</label>
                   <input type="text" name="phone" value={companyInfo.phone} onChange={handleChange} className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-amber-500 outline-none" />
                 </div>
                 <div>
                   <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Mobile</label>
                   <input type="text" name="mobile" value={companyInfo.mobile} onChange={handleChange} className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-amber-500 outline-none" />
                 </div>
              </div>

              <div className="pt-6 border-t border-slate-50">
                 <h4 className="text-sm font-black text-slate-800 mb-4 flex items-center gap-2"><span>🏦</span> ข้อมูลบัญชีรับเงิน (สำหรับบิล/ใบเสร็จ)</h4>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">ชื่อธนาคาร</label>
                      <input type="text" name="bankName" value={companyInfo.bankName} onChange={handleChange} className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-amber-500 outline-none" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">เลขที่บัญชี</label>
                      <input type="text" name="accountNumber" value={companyInfo.accountNumber} onChange={handleChange} className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-amber-500 outline-none font-black text-indigo-600" />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">ชื่อบัญชี</label>
                      <input type="text" name="accountName" value={companyInfo.accountName} onChange={handleChange} className="w-full bg-slate-50 border-none rounded-xl py-3 px-4 text-sm focus:ring-2 focus:ring-amber-500 outline-none" />
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;
