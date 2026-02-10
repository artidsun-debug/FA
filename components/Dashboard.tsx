
import React, { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { Property, PropertyStatus, RentalType, CompanyInfo } from '../types';
import { STATUS_COLORS, STATUS_LABELS } from '../constants';

interface DashboardProps {
  properties: Property[];
  aiInsight: string;
  company: CompanyInfo;
}

const Dashboard: React.FC<DashboardProps> = ({ properties, aiInsight, company }) => {
  const statusData = useMemo(() => {
    const counts = properties.reduce((acc, p) => {
      acc[p.status] = (acc[p.status] || 0) + 1;
      return acc;
    }, {} as any);
    
    return [
      { name: STATUS_LABELS[PropertyStatus.VACANT], value: counts[PropertyStatus.VACANT] || 0, color: '#10b981' },
      { name: STATUS_LABELS[PropertyStatus.BOOKED], value: counts[PropertyStatus.BOOKED] || 0, color: '#f59e0b' },
      { name: STATUS_LABELS[PropertyStatus.OCCUPIED], value: counts[PropertyStatus.OCCUPIED] || 0, color: '#f43f5e' },
    ];
  }, [properties]);

  const stats = useMemo(() => {
    let totalRent = 0;
    let totalCommission = 0;
    const now = new Date();
    const expiringSoon: Property[] = [];
    let activeContracts = 0;

    properties.forEach(p => {
      if (p.status === PropertyStatus.OCCUPIED) {
        totalRent += p.rentAmount;
        activeContracts++;
      }
      
      // Calculate Commissions from expenses
      p.expenses.forEach(e => {
        if (e.category === 'COMMISSION' && e.status === 'PAID') {
          totalCommission += e.amount;
        }
      });

      // Check for expiring contracts (within 30 days)
      if (p.contractEndDate && p.status === PropertyStatus.OCCUPIED) {
        const endDate = new Date(p.contractEndDate);
        const diffTime = endDate.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays <= 30 && diffDays >= 0) {
          expiringSoon.push(p);
        }
      }
    });

    return { totalRent, totalCommission, expiringSoon, activeContracts };
  }, [properties]);

  return (
    <div className="space-y-8 p-6">
      {/* Welcome & AI Header */}
      <div className="bg-gradient-to-r from-slate-900 to-indigo-900 rounded-[2.5rem] p-8 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center gap-8">
        <div className="w-32 h-32 bg-white/10 rounded-full flex items-center justify-center text-4xl backdrop-blur-md shrink-0 border border-white/20">
          {company.logo.length > 5 ? <img src={company.logo} className="w-full h-full object-contain p-4" /> : company.logo}
        </div>
        <div className="relative z-10 flex-1 text-center md:text-left">
          <h2 className="text-3xl font-black mb-2">{company.nameTh}</h2>
          <p className="text-slate-300 text-sm mb-6 max-w-lg">📍 {company.addressTh}</p>
          <div className="flex flex-wrap justify-center md:justify-start gap-4 mb-6">
             <div className="bg-white/10 px-4 py-2 rounded-2xl border border-white/10">
                <p className="text-[9px] uppercase font-bold opacity-50">โทรสำนักงาน</p>
                <p className="text-sm font-bold">{company.phone}</p>
             </div>
             <div className="bg-white/10 px-4 py-2 rounded-2xl border border-white/10">
                <p className="text-[9px] uppercase font-bold opacity-50">มือถือ</p>
                <p className="text-sm font-bold">{company.mobile}</p>
             </div>
          </div>
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20">
            <h4 className="text-amber-400 text-[10px] font-bold uppercase tracking-widest mb-1 flex items-center justify-center md:justify-start gap-2">
              <span className="animate-pulse">✨</span> AI Insights Summary
            </h4>
            <p className="text-sm italic font-light opacity-90">{aiInsight}</p>
          </div>
        </div>
        <div className="absolute right-[-50px] top-[-50px] w-64 h-64 bg-amber-500/10 rounded-full blur-3xl"></div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
          <span className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">รวมที่พักทั้งหมด</span>
          <span className="text-3xl font-black text-slate-900 mt-1">{properties.length}</span>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 flex flex-col items-center justify-center text-center">
          <span className="text-indigo-500 text-[10px] font-bold uppercase tracking-widest">ค่าเช่ารวมต่อเดือน</span>
          <span className="text-2xl font-black text-indigo-600 mt-1">฿{stats.totalRent.toLocaleString()}</span>
        </div>
        <div className="bg-amber-50 p-6 rounded-3xl shadow-sm border border-amber-100 flex flex-col items-center justify-center text-center">
          <span className="text-amber-600 text-[10px] font-bold uppercase tracking-widest">รวมค่านายหน้า (Commission)</span>
          <span className="text-2xl font-black text-amber-700 mt-1">฿{stats.totalCommission.toLocaleString()}</span>
        </div>
        <div className="bg-emerald-50 p-6 rounded-3xl shadow-sm border border-emerald-100 flex flex-col items-center justify-center text-center">
          <span className="text-emerald-600 text-[10px] font-bold uppercase tracking-widest">สัญญาที่ใช้งานอยู่</span>
          <span className="text-3xl font-black text-emerald-700 mt-1">{stats.activeContracts}</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Expiring Soon Section */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
            <div className="flex justify-between items-center mb-6">
               <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                 <span>⏰</span> การต่อสัญญา (หมดอายุภายใน 30 วัน)
               </h3>
               <span className="bg-rose-100 text-rose-600 text-[10px] font-black px-3 py-1 rounded-full uppercase">
                 {stats.expiringSoon.length} รายการ
               </span>
            </div>
            
            <div className="space-y-4">
               {stats.expiringSoon.length > 0 ? (
                 stats.expiringSoon.map(p => (
                   <div key={p.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:bg-white hover:shadow-md transition-all">
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 bg-rose-100 text-rose-600 rounded-xl flex items-center justify-center text-lg">📄</div>
                         <div>
                            <p className="text-sm font-bold text-slate-900">{p.name} {p.roomNumber && `(${p.roomNumber})`}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">สิ้นสุดวันที่: {p.contractEndDate}</p>
                         </div>
                      </div>
                      <div className="text-right">
                         <p className="text-xs font-black text-rose-600 mb-1">ใกล้หมดอายุ</p>
                         <button className="text-[9px] font-bold text-indigo-600 uppercase tracking-widest hover:underline">จัดการต่อสัญญา</button>
                      </div>
                   </div>
                 ))
               ) : (
                 <div className="py-12 text-center text-slate-300">
                    <p className="text-3xl mb-2">🎉</p>
                    <p className="text-sm font-bold">ไม่มีสัญญาที่กำลังจะหมดอายุในเร็วๆ นี้</p>
                 </div>
               )}
            </div>
          </div>

          {/* Contact & Location */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-100 p-8">
            <h3 className="text-lg font-bold mb-6 text-slate-800">ข้อมูลติดต่อและสถานที่</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
               <div className="space-y-4">
                  <div className="flex gap-4">
                     <span className="text-2xl">📞</span>
                     <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400">เบอร์โทรติดต่อ</p>
                        <p className="text-sm font-bold">{company.phone} / {company.mobile}</p>
                     </div>
                  </div>
                  <div className="flex gap-4">
                     <span className="text-2xl">🏢</span>
                     <div>
                        <p className="text-[10px] uppercase font-bold text-slate-400">ที่อยู่สำนักงาน</p>
                        <p className="text-sm leading-relaxed">{company.addressTh}</p>
                     </div>
                  </div>
               </div>
               <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 flex flex-col items-center justify-center text-center space-y-4">
                  <span className="text-3xl">📍</span>
                  <p className="text-xs font-bold text-slate-600">พิกัดทางภูมิศาสตร์ (GPS)</p>
                  <p className="text-xs font-mono bg-white px-3 py-1 rounded-lg border border-slate-200">{company.coordinates}</p>
                  <a href={`https://www.google.com/maps?q=${company.coordinates}`} target="_blank" className="px-6 py-2 bg-indigo-600 text-white rounded-xl text-xs font-black shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all">เปิดใน Google Maps</a>
               </div>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          {/* Chart Section */}
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-bold mb-6 text-slate-800">สัดส่วนห้องพัก</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={statusData} innerRadius={60} outerRadius={80} paddingAngle={5} dataKey="value">
                    {statusData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          
          {/* Payment Info */}
          <div className="bg-slate-900 p-8 rounded-3xl text-white">
             <div className="flex items-center gap-4 mb-6">
                <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center text-xl">🏦</div>
                <div>
                   <h5 className="font-bold text-sm">การรับชำระเงิน</h5>
                   <p className="text-[10px] opacity-60">สำหรับธุรกรรมบริษัท</p>
                </div>
             </div>
             <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-white/10 pb-2">
                   <span className="text-[10px] opacity-60">ธนาคาร</span>
                   <span className="text-xs font-bold">{company.bankName}</span>
                </div>
                <div className="flex justify-between items-center border-b border-white/10 pb-2">
                   <span className="text-[10px] opacity-60">เลขที่บัญชี</span>
                   <span className="text-sm font-black text-amber-500">{company.accountNumber}</span>
                </div>
                <div>
                   <span className="text-[10px] opacity-60 block">ชื่อบัญชี</span>
                   <span className="text-xs font-bold">{company.accountName}</span>
                </div>
             </div>
          </div>

          {/* Tax Info Card */}
          <div className="bg-slate-100 p-6 rounded-3xl border border-slate-200">
             <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">เลขประจำตัวผู้เสียภาษี</p>
             <p className="text-lg font-black text-slate-800">{company.taxId}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
