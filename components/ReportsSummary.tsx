
import React, { useMemo, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, 
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area 
} from 'recharts';
import { Property, AccountingDocument, Expense, RentalType, PropertyStatus, RepairStatus } from '../types';

interface ReportsSummaryProps {
  properties: Property[];
  accountingDocs: AccountingDocument[];
  globalExpenses: Expense[];
}

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6', '#06b6d4'];

const ReportsSummary: React.FC<ReportsSummaryProps> = ({ properties, accountingDocs, globalExpenses }) => {
  const [reportType, setReportType] = useState<'financial' | 'operational' | 'repairs'>('financial');

  // 1. Financial Analytics
  const financialData = useMemo(() => {
    // Group items by Month for the last 6 months (Simplified simulation)
    const months = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.'];
    return months.map((m, i) => ({
      name: m,
      revenue: Math.floor(Math.random() * 200000) + 150000,
      expense: Math.floor(Math.random() * 80000) + 20000,
      profit: 0
    })).map(d => ({ ...d, profit: d.revenue - d.expense }));
  }, []);

  // 2. Expense Category Breakdown
  const expenseBreakdown = useMemo(() => {
    const categories: Record<string, number> = {};
    const allExpenses = [
      ...globalExpenses,
      ...properties.flatMap(p => p.expenses)
    ];

    allExpenses.forEach(exp => {
      categories[exp.category] = (categories[exp.category] || 0) + exp.amount;
    });

    return Object.entries(categories).map(([name, value]) => ({ name, value }));
  }, [properties, globalExpenses]);

  // 3. Operational Data (Occupancy by Type)
  const occupancyData = useMemo(() => {
    const monthlyTotal = properties.filter(p => p.rentalType === RentalType.MONTHLY).length;
    const monthlyOccupied = properties.filter(p => p.rentalType === RentalType.MONTHLY && p.status === PropertyStatus.OCCUPIED).length;
    
    const dailyTotal = properties.filter(p => p.rentalType === RentalType.DAILY).length;
    const dailyOccupied = properties.filter(p => p.rentalType === RentalType.DAILY && p.status === PropertyStatus.OCCUPIED).length;

    return [
      { name: 'รายเดือน', occupied: monthlyOccupied, vacant: monthlyTotal - monthlyOccupied },
      { name: 'รายวัน', occupied: dailyOccupied, vacant: dailyTotal - dailyOccupied },
    ];
  }, [properties]);

  // 4. Repair Statistics
  const repairStats = useMemo(() => {
    const totalRepairs = properties.flatMap(p => p.inspections).filter(i => i.repairNeeded).length;
    const pendingRepairs = properties.flatMap(p => p.inspections).filter(i => i.repairNeeded && i.repairStatus !== 'DONE').length;
    const completedRepairs = totalRepairs - pendingRepairs;

    return [
      { name: 'ซ่อมเสร็จแล้ว', value: completedRepairs, color: '#10b981' },
      { name: 'รอดำเนินการ', value: pendingRepairs, color: '#f59e0b' },
    ];
  }, [properties]);

  const EXPENSE_LABELS: Record<string, string> = {
    'COMMON_FEE': 'ค่าส่วนกลาง',
    'REPAIR': 'ค่าซ่อมแซม',
    'UTILITY': 'ค่าน้ำ/ไฟ/เน็ต',
    'COMMISSION': 'ค่านายหน้า',
    'MANAGEMENT_FEE': 'ค่าบริหารจัดการ',
    'LAND_TAX': 'ค่าภาษีที่ดิน',
    'OTHER_SERVICE': 'ค่าบริการอื่นๆ',
    'OTHER': 'อื่นๆ'
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-700 pb-20">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <h2 className="text-2xl lg:text-3xl font-black text-slate-900">รายงานวิเคราะห์สรุปผล (Analytics)</h2>
          <p className="text-sm text-slate-500 mt-1">ข้อมูลสรุปประสิทธิภาพการดำเนินงานรายเดือนและรายวัน</p>
        </div>
        <div className="flex bg-white p-1 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto w-full lg:w-auto">
          <button 
            onClick={() => setReportType('financial')} 
            className={`flex-1 lg:flex-none px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${reportType === 'financial' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Financial
          </button>
          <button 
            onClick={() => setReportType('operational')} 
            className={`flex-1 lg:flex-none px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${reportType === 'operational' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Operations
          </button>
          <button 
            onClick={() => setReportType('repairs')} 
            className={`flex-1 lg:flex-none px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${reportType === 'repairs' ? 'bg-amber-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
          >
            Repairs
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
         <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 text-7xl opacity-5 group-hover:scale-110 transition-transform">💰</div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Revenue (6M)</p>
            <p className="text-2xl font-black text-indigo-600 mt-1">฿{financialData.reduce((s, d) => s + d.revenue, 0).toLocaleString()}</p>
         </div>
         <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 text-7xl opacity-5 group-hover:scale-110 transition-transform">💸</div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Expense (6M)</p>
            <p className="text-2xl font-black text-rose-600 mt-1">฿{financialData.reduce((s, d) => s + d.expense, 0).toLocaleString()}</p>
         </div>
         <div className="bg-emerald-50 p-6 rounded-[2rem] border border-emerald-100 shadow-sm relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 text-7xl opacity-10 group-hover:scale-110 transition-transform">📈</div>
            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Net Profit</p>
            <p className="text-2xl font-black text-emerald-700 mt-1">฿{financialData.reduce((s, d) => s + d.profit, 0).toLocaleString()}</p>
         </div>
         <div className="bg-amber-50 p-6 rounded-[2rem] border border-amber-100 shadow-sm relative overflow-hidden group">
            <div className="absolute -right-4 -bottom-4 text-7xl opacity-10 group-hover:scale-110 transition-transform">🛠️</div>
            <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Pending Repairs</p>
            <p className="text-2xl font-black text-amber-700 mt-1">{properties.flatMap(p => p.inspections).filter(i => i.repairNeeded && i.repairStatus !== 'DONE').length} Items</p>
         </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Main Chart Area */}
        <div className="bg-white p-6 lg:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
           {reportType === 'financial' && (
             <>
               <div className="flex justify-between items-center mb-8">
                  <h4 className="text-lg font-black text-slate-900">รายรับและรายจ่ายสะสม (Revenue vs Expense)</h4>
               </div>
               <div className="h-[350px]">
                 <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={financialData}>
                       <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                       <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} />
                       <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 700 }} tickFormatter={(val) => `฿${val / 1000}k`} />
                       <Tooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                       <Legend verticalAlign="top" height={36}/>
                       <Bar name="รายรับ" dataKey="revenue" fill="#6366f1" radius={[10, 10, 0, 0]} />
                       <Bar name="รายจ่าย" dataKey="expense" fill="#ef4444" radius={[10, 10, 0, 0]} />
                    </BarChart>
                 </ResponsiveContainer>
               </div>
             </>
           )}

           {reportType === 'operational' && (
             <>
                <div className="flex justify-between items-center mb-8">
                  <h4 className="text-lg font-black text-slate-900">อัตราการครองห้อง (Occupancy Stats)</h4>
                </div>
                <div className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={occupancyData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                      <XAxis type="number" axisLine={false} tickLine={false} hide />
                      <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700 }} width={80} />
                      <Tooltip cursor={{ fill: '#f8fafc' }} />
                      <Legend />
                      <Bar name="เข้าพักอยู่" dataKey="occupied" stackId="a" fill="#10b981" radius={[0, 0, 0, 0]} />
                      <Bar name="ห้องว่าง" dataKey="vacant" stackId="a" fill="#e2e8f0" radius={[0, 10, 10, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-8 grid grid-cols-2 gap-4">
                   <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Monthly Rate</p>
                      <p className="text-xl font-black text-emerald-600">
                        {Math.round((occupancyData[0].occupied / (occupancyData[0].occupied + occupancyData[0].vacant || 1)) * 100)}%
                      </p>
                   </div>
                   <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Daily Rate</p>
                      <p className="text-xl font-black text-indigo-600">
                        {Math.round((occupancyData[1].occupied / (occupancyData[1].occupied + occupancyData[1].vacant || 1)) * 100)}%
                      </p>
                   </div>
                </div>
             </>
           )}

           {reportType === 'repairs' && (
             <>
               <div className="flex justify-between items-center mb-8">
                  <h4 className="text-lg font-black text-slate-900">ความคืบหน้างานซ่อมแซม (Repair Progress)</h4>
               </div>
               <div className="h-[350px] flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                       <Pie data={repairStats} innerRadius={80} outerRadius={110} paddingAngle={5} dataKey="value">
                         {repairStats.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                       </Pie>
                       <Tooltip />
                       <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute text-center">
                     <p className="text-[10px] font-black text-slate-400 uppercase">Success Rate</p>
                     <p className="text-3xl font-black text-slate-800">
                        {Math.round((repairStats[0].value / (repairStats[0].value + repairStats[1].value || 1)) * 100)}%
                     </p>
                  </div>
               </div>
             </>
           )}
        </div>

        {/* Secondary Insights / Lists */}
        <div className="space-y-8">
           <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl">
              <h4 className="text-lg font-black mb-6">สัดส่วนค่าใช้จ่ายรายหมวด (Expense Breakdown)</h4>
              <div className="space-y-4">
                 {expenseBreakdown.sort((a,b) => b.value - a.value).map((item, idx) => (
                   <div key={item.name} className="space-y-1">
                      <div className="flex justify-between items-center text-xs font-bold uppercase tracking-wider">
                         <span className="text-slate-400">{EXPENSE_LABELS[item.name] || item.name}</span>
                         <span>฿{item.value.toLocaleString()}</span>
                      </div>
                      <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                         <div 
                           className="h-full bg-amber-500 transition-all duration-1000" 
                           style={{ width: `${(item.value / expenseBreakdown.reduce((s, i) => s + i.value, 0)) * 100}%` }}
                         ></div>
                      </div>
                   </div>
                 ))}
                 {expenseBreakdown.length === 0 && (
                   <p className="text-sm text-slate-500 italic py-10 text-center">ไม่มีข้อมูลรายจ่ายในขณะนี้</p>
                 )}
              </div>
           </div>

           <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <h4 className="text-lg font-black text-slate-900 mb-6">ท็อปโครงการทำกำไร (Top Performance Projects)</h4>
              <div className="divide-y divide-slate-50">
                 {properties.slice(0, 5).map((p, i) => (
                   <div key={p.id} className="py-4 flex justify-between items-center">
                      <div className="flex items-center gap-4">
                         <span className="text-xl font-black text-slate-200">0{i+1}</span>
                         <div>
                            <p className="text-sm font-black text-slate-800">{p.name}</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">{p.rentalType === RentalType.MONTHLY ? 'รายเดือน' : 'รายวัน'}</p>
                         </div>
                      </div>
                      <div className="text-right">
                         <p className="text-sm font-black text-indigo-600">฿{p.rentAmount.toLocaleString()}</p>
                         <p className="text-[9px] font-bold text-emerald-500 uppercase">Gross Revenue</p>
                      </div>
                   </div>
                 ))}
              </div>
           </div>
        </div>
      </div>

      {/* Export Options */}
      <div className="bg-indigo-600 rounded-[2.5rem] p-8 lg:p-12 text-white flex flex-col lg:flex-row items-center justify-between gap-8 no-print shadow-2xl shadow-indigo-500/20">
         <div className="text-center lg:text-left">
            <h4 className="text-2xl font-black mb-2">ต้องการรายงานแบบละเอียดหรือไม่?</h4>
            <p className="opacity-80 font-medium">คุณสามารถส่งออกข้อมูลทั้งหมดเป็นไฟล์ PDF เพื่อใช้ประกอบการประชุมบริษัทได้ทันที</p>
         </div>
         <div className="flex gap-4 w-full lg:w-auto">
            <button onClick={() => window.print()} className="flex-1 lg:flex-none px-10 py-4 bg-white text-indigo-600 font-black rounded-2xl hover:bg-slate-50 transition-all shadow-xl">
               🖨️ พิมพ์รายงาน PDF
            </button>
         </div>
      </div>
    </div>
  );
};

export default ReportsSummary;
