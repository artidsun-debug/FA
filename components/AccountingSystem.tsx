
import React, { useState, useRef } from 'react';
import { AccountingDocument, AccountingDocType, AccountingItem, Expense, CompanyInfo } from '../types';
import { scanReceiptWithAI } from '../services/geminiService';

interface AccountingSystemProps {
  documents: AccountingDocument[];
  expenses: Expense[];
  onCreateDoc: (doc: AccountingDocument) => void;
  onUpdateDoc: (doc: AccountingDocument) => void;
  onDeleteDoc: (id: string) => void;
  onCreateExpense: (exp: Expense) => void;
  onDeleteExpense: (id: string) => void;
  company: CompanyInfo;
}

const AccountingSystem: React.FC<AccountingSystemProps> = ({ 
  documents, 
  expenses,
  onCreateDoc, 
  onUpdateDoc, 
  onDeleteDoc,
  onCreateExpense,
  onDeleteExpense,
  company
}) => {
  const [activeTab, setActiveTab] = useState<'revenue' | 'expenses'>('revenue');
  const [view, setView] = useState<'list' | 'editor' | 'preview' | 'scanner'>('list');
  const [currentDoc, setCurrentDoc] = useState<AccountingDocument | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isAddingExpense, setIsAddingExpense] = useState(false);
  
  const [manualExpense, setManualExpense] = useState<Partial<Expense>>({
    title: '',
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    category: 'OTHER',
    status: 'PAID'
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  const emptyDoc = (type: AccountingDocType): AccountingDocument => ({
    id: Math.random().toString(36).substr(2, 9),
    type,
    docNumber: `${type}-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(documents.length + 1).padStart(3, '0')}`,
    date: new Date().toISOString().split('T')[0],
    clientName: '',
    clientAddress: '',
    clientTaxId: '',
    items: [{ id: '1', description: '', quantity: 1, pricePerUnit: 0, total: 0 }],
    subtotal: 0,
    vatPercent: 7,
    vatAmount: 0,
    whtPercent: 0,
    whtAmount: 0,
    grandTotal: 0,
    status: 'DRAFT'
  });

  const updateItem = (id: string, field: keyof AccountingItem, value: any) => {
    if (!currentDoc) return;
    const items = currentDoc.items.map(item => {
      if (item.id === id) {
        const updated = { ...item, [field]: value };
        if (field === 'quantity' || field === 'pricePerUnit') {
          updated.total = updated.quantity * updated.pricePerUnit;
        }
        return updated;
      }
      return item;
    });

    const subtotal = items.reduce((sum, item) => sum + item.total, 0);
    const vatAmount = (subtotal * currentDoc.vatPercent) / 100;
    const whtAmount = (subtotal * currentDoc.whtPercent) / 100;
    const grandTotal = subtotal + vatAmount - whtAmount;
    setCurrentDoc({ ...currentDoc, items, subtotal, vatAmount, whtAmount, grandTotal });
  };

  const saveDoc = () => {
    if (!currentDoc) return;
    const existing = documents.find(d => d.id === currentDoc.id);
    if (existing) onUpdateDoc(currentDoc);
    else onCreateDoc(currentDoc);
    setView('list');
  };

  const handleScanReceipt = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsScanning(true);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = reader.result as string;
      try {
        const extracted = await scanReceiptWithAI(base64);
        onCreateExpense({
          id: Math.random().toString(36).substr(2, 9),
          title: extracted.title || 'สแกนใบเสร็จ',
          amount: extracted.amount || 0,
          date: extracted.date || new Date().toISOString().split('T')[0],
          category: (extracted.category as any) || 'OTHER',
          status: 'PAID',
          receiptUrl: base64
        });
      } catch (err: any) { 
        console.error("Scan error:", err);
        const msg = err?.message || "";
        if (msg.includes('429')) {
          alert('⚠️ โควตาการใช้งาน AI เต็มชั่วคราว กรุณารอประมาณ 1 นาทีแล้วลองใหม่อีกครั้ง');
        } else {
          alert('❌ เกิดข้อผิดพลาดในการวิเคราะห์ใบเสร็จ กรุณาลองใหม่อีกครั้ง หรือกรอกข้อมูลด้วยตนเอง'); 
        }
      }
      finally { setIsScanning(false); }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleAddManualExpense = () => {
    if (!manualExpense.title || !manualExpense.amount) {
      alert('กรุณากรอกชื่อรายการและจำนวนเงิน');
      return;
    }
    
    onCreateExpense({
      id: Math.random().toString(36).substr(2, 9),
      title: manualExpense.title,
      amount: manualExpense.amount,
      date: manualExpense.date || new Date().toISOString().split('T')[0],
      category: manualExpense.category as any,
      status: manualExpense.status as any,
    });

    setIsAddingExpense(false);
    setManualExpense({
      title: '',
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      category: 'OTHER',
      status: 'PAID'
    });
  };

  return (
    <div className="p-6 space-y-6">
      <input type="file" ref={fileInputRef} onChange={handleScanReceipt} className="hidden" accept="image/*" />

      {view === 'list' && (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <h2 className="text-2xl font-bold text-slate-800">ระบบบัญชีและการเงิน</h2>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => { setCurrentDoc(emptyDoc('RECEIPT')); setView('editor'); }} className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-emerald-200">+ ออกใบเสร็จ</button>
              <button onClick={() => setIsAddingExpense(true)} className="px-4 py-2 bg-rose-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-rose-200">
                + เพิ่มรายจ่าย (Manual)
              </button>
              <button onClick={() => fileInputRef.current?.click()} disabled={isScanning} className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold shadow-lg shadow-indigo-200 flex items-center gap-2 disabled:opacity-50">
                {isScanning ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    กำลังวิเคราะห์...
                  </>
                ) : '📷 สแกนรายจ่าย'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
             <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100"><p className="text-[10px] font-bold text-slate-400 uppercase">รายรับสะสม</p><p className="text-2xl font-black text-emerald-600 mt-1">฿{documents.reduce((sum, d) => sum + d.grandTotal, 0).toLocaleString()}</p></div>
             <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100"><p className="text-[10px] font-bold text-slate-400 uppercase">รายจ่ายสะสม</p><p className="text-2xl font-black text-rose-600 mt-1">฿{expenses.reduce((sum, e) => sum + e.amount, 0).toLocaleString()}</p></div>
             <div className="bg-slate-900 p-6 rounded-2xl shadow-sm"><p className="text-[10px] font-bold text-slate-400 uppercase">ยอดสุทธิ</p><p className="text-2xl font-black text-white mt-1">฿{(documents.reduce((sum, d) => sum + d.grandTotal, 0) - expenses.reduce((sum, e) => sum + e.amount, 0)).toLocaleString()}</p></div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
            <div className="flex border-b border-slate-50 overflow-x-auto">
               <button onClick={() => setActiveTab('revenue')} className={`px-6 py-4 text-sm font-bold ${activeTab === 'revenue' ? 'text-indigo-600 bg-indigo-50 border-b-2 border-indigo-500' : 'text-slate-400'}`}>รายรับ (เอกสาร)</button>
               <button onClick={() => setActiveTab('expenses')} className={`px-6 py-4 text-sm font-bold ${activeTab === 'expenses' ? 'text-rose-600 bg-rose-50 border-b-2 border-rose-500' : 'text-slate-400'}`}>รายจ่าย (บิลสแกน)</button>
            </div>
            <div className="overflow-x-auto">
               <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                     <tr><th className="px-6 py-4">เลขที่ / รายการ</th><th className="px-6 py-4">ชื่อผู้ติดต่อ / หมวดหมู่</th><th className="px-6 py-4">วันที่</th><th className="px-6 py-4 text-right">ยอดเงิน</th><th className="px-6 py-4 text-center">จัดการ</th></tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                     {activeTab === 'revenue' ? documents.map(doc => (
                       <tr key={doc.id} className="hover:bg-slate-50">
                          <td className="px-6 py-4 font-bold text-slate-900">{doc.docNumber}</td>
                          <td className="px-6 py-4">{doc.clientName}</td>
                          <td className="px-6 py-4 text-slate-500">{doc.date}</td>
                          <td className="px-6 py-4 text-right font-black">฿{doc.grandTotal.toLocaleString()}</td>
                          <td className="px-6 py-4 text-center">
                             <button onClick={() => { setCurrentDoc(doc); setView('preview'); }} className="p-2 text-slate-400 hover:text-indigo-600">👁️</button>
                             <button onClick={() => onDeleteDoc(doc.id)} className="p-2 text-slate-400 hover:text-rose-600">🗑️</button>
                          </td>
                       </tr>
                     )) : expenses.map(exp => (
                        <tr key={exp.id}>
                           <td className="px-6 py-4 font-bold">{exp.title}</td>
                           <td className="px-6 py-4 text-[10px] font-bold opacity-50">{exp.category}</td>
                           <td className="px-6 py-4 text-slate-500">{exp.date}</td>
                           <td className="px-6 py-4 text-right font-black text-rose-600">฿{exp.amount.toLocaleString()}</td>
                           <td className="px-6 py-4 text-center"><button onClick={() => onDeleteExpense(exp.id)} className="p-2 text-slate-400 hover:text-rose-600">🗑️</button></td>
                        </tr>
                     ))}
                  </tbody>
               </table>
               {((activeTab === 'revenue' && documents.length === 0) || (activeTab === 'expenses' && expenses.length === 0)) && (
                 <div className="py-20 text-center text-slate-300">
                    <p className="text-4xl mb-2">📑</p>
                    <p className="text-sm font-bold uppercase tracking-widest">ไม่พบรายการข้อมูล</p>
                 </div>
               )}
            </div>
          </div>
        </div>
      )}

      {/* Manual Expense Modal */}
      {isAddingExpense && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-[2.5rem] w-full max-w-lg shadow-2xl animate-in zoom-in duration-300 p-10">
            <div className="flex justify-between items-center mb-8">
              <h3 className="text-2xl font-black text-slate-900">💵 เพิ่มรายการรายจ่าย</h3>
              <button onClick={() => setIsAddingExpense(false)} className="text-slate-400 hover:text-slate-600 transition-colors">✕ ปิด</button>
            </div>
            
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">ชื่อรายการ (เช่น ซ่อมแอร์, ค่าน้ำ, ค่าไฟ)</label>
                <input 
                  type="text" 
                  value={manualExpense.title}
                  onChange={e => setManualExpense({...manualExpense, title: e.target.value})}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  placeholder="ระบุชื่อรายการรายจ่าย"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">จำนวนเงิน (บาท)</label>
                  <input 
                    type="number" 
                    value={manualExpense.amount}
                    onChange={e => setManualExpense({...manualExpense, amount: parseFloat(e.target.value) || 0})}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-black text-rose-600"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">วันที่จ่าย</label>
                  <input 
                    type="date" 
                    value={manualExpense.date}
                    onChange={e => setManualExpense({...manualExpense, date: e.target.value})}
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">หมวดหมู่รายจ่าย</label>
                <select 
                  value={manualExpense.category}
                  onChange={e => setManualExpense({...manualExpense, category: e.target.value as any})}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-white transition-all"
                >
                  <option value="COMMON_FEE">ค่าส่วนกลาง</option>
                  <option value="REPAIR">ค่าซ่อมแซม</option>
                  <option value="UTILITY">ค่าน้ำ/ไฟ/เน็ต</option>
                  <option value="COMMISSION">ค่านายหน้า (Commission)</option>
                  <option value="MANAGEMENT_FEE">ค่าจัดการ</option>
                  <option value="OTHER">อื่นๆ</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">สถานะ</label>
                <div className="flex gap-2 p-1 bg-slate-100 rounded-2xl">
                   <button 
                     onClick={() => setManualExpense({...manualExpense, status: 'PAID'})}
                     className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${manualExpense.status === 'PAID' ? 'bg-emerald-500 text-white shadow-md' : 'text-slate-400'}`}
                   >
                     ชำระแล้ว
                   </button>
                   <button 
                     onClick={() => setManualExpense({...manualExpense, status: 'UNPAID'})}
                     className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${manualExpense.status === 'UNPAID' ? 'bg-rose-500 text-white shadow-md' : 'text-slate-400'}`}
                   >
                     ค้างชำระ
                   </button>
                </div>
              </div>
            </div>

            <div className="mt-10 flex gap-4">
              <button 
                onClick={() => setIsAddingExpense(false)} 
                className="flex-1 py-4 text-slate-500 font-bold hover:bg-slate-100 rounded-2xl transition-all"
              >
                ยกเลิก
              </button>
              <button 
                onClick={handleAddManualExpense}
                className="flex-[2] py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 shadow-xl shadow-slate-200 transition-all"
              >
                บันทึกรายจ่าย
              </button>
            </div>
          </div>
        </div>
      )}

      {view === 'editor' && currentDoc && (
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex justify-between items-center no-print">
            <button onClick={() => setView('list')} className="text-slate-500 font-bold">← ยกเลิก</button>
            <button onClick={saveDoc} className="px-6 py-2 bg-slate-900 text-white rounded-xl font-bold shadow-xl">บันทึกเอกสาร</button>
          </div>
          <div className="bg-white rounded-3xl p-10 shadow-2xl space-y-8">
             <div className="flex justify-between border-b pb-8 border-slate-100">
                <div className="space-y-1">
                   <h3 className="text-xl font-black text-slate-900">{company.nameTh}</h3>
                   <p className="text-xs text-slate-500">{company.addressTh}</p>
                   <p className="text-xs text-slate-400 font-mono">Tax ID: {company.taxId}</p>
                </div>
                <div className="text-right">
                   <h4 className="text-2xl font-black text-indigo-600">{currentDoc.type}</h4>
                   <p className="text-sm font-bold mt-1">No: {currentDoc.docNumber}</p>
                   <input type="date" value={currentDoc.date} onChange={e => setCurrentDoc({...currentDoc, date: e.target.value})} className="text-right text-xs outline-none bg-slate-50 px-2 py-1 rounded mt-2" />
                </div>
             </div>
             <div className="space-y-4">
                <input placeholder="ชื่อลูกค้า" value={currentDoc.clientName} onChange={e => setCurrentDoc({...currentDoc, clientName: e.target.value})} className="w-full bg-slate-50 px-4 py-2 rounded-xl text-sm font-bold border-none outline-none focus:ring-2 focus:ring-indigo-500" />
                <textarea placeholder="ที่อยู่ลูกค้า" value={currentDoc.clientAddress} onChange={e => setCurrentDoc({...currentDoc, clientAddress: e.target.value})} className="w-full bg-slate-50 px-4 py-2 rounded-xl text-sm border-none outline-none focus:ring-2 focus:ring-indigo-500 h-20 resize-none" />
             </div>
             <table className="w-full text-sm">
                <thead className="bg-slate-900 text-white text-[10px] uppercase font-black tracking-widest">
                   <tr><th className="p-3 text-left">Description</th><th className="p-3 text-center w-24">Qty</th><th className="p-3 text-right w-32">Price</th><th className="p-3 text-right w-32">Total</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                   {currentDoc.items.map(item => (
                     <tr key={item.id}>
                        <td className="py-4"><input className="w-full bg-transparent outline-none" value={item.description} onChange={e => updateItem(item.id, 'description', e.target.value)} /></td>
                        <td className="py-4 text-center"><input type="number" className="w-12 text-center bg-transparent outline-none" value={item.quantity} onChange={e => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)} /></td>
                        <td className="py-4 text-right"><input type="number" className="w-24 text-right bg-transparent outline-none" value={item.pricePerUnit} onChange={e => updateItem(item.id, 'pricePerUnit', parseFloat(e.target.value) || 0)} /></td>
                        <td className="py-4 text-right font-black">฿{item.total.toLocaleString()}</td>
                     </tr>
                   ))}
                </tbody>
             </table>
             <div className="flex justify-end pt-8 border-t border-slate-100">
                <div className="w-64 space-y-2">
                   <div className="flex justify-between text-sm"><span>Subtotal</span><span className="font-bold">฿{currentDoc.subtotal.toLocaleString()}</span></div>
                   <div className="flex justify-between text-lg font-black text-indigo-600 border-t pt-2"><span>Grand Total</span><span>฿{currentDoc.grandTotal.toLocaleString()}</span></div>
                </div>
             </div>
          </div>
        </div>
      )}

      {view === 'preview' && currentDoc && (
        <div className="max-w-4xl mx-auto space-y-6">
           <div className="flex justify-between items-center no-print">
              <button onClick={() => setView('list')} className="text-slate-500 font-bold">← Back</button>
              <button onClick={() => window.print()} className="px-6 py-2 bg-slate-900 text-white rounded-xl font-bold shadow-xl">🖨️ พิมพ์ PDF</button>
           </div>
           <div className="bg-white p-12 shadow-2xl print:shadow-none min-h-[1000px]">
              <div className="flex justify-between items-start mb-12">
                 <div className="flex gap-4">
                    <div className="w-20 h-20 bg-slate-50 rounded-2xl flex items-center justify-center text-3xl shrink-0 overflow-hidden border">
                       {company.logo.length > 5 ? <img src={company.logo} className="w-full h-full object-contain" /> : company.logo}
                    </div>
                    <div>
                       <h1 className="text-xl font-black text-slate-900">{company.nameTh}</h1>
                       <p className="text-[10px] text-slate-500 leading-tight max-w-[300px] mt-1">{company.addressTh}</p>
                       <p className="text-[10px] text-slate-400 mt-1 font-mono">Tax ID: {company.taxId} | โทร: {company.phone}</p>
                    </div>
                 </div>
                 <div className="text-right">
                    <h2 className="text-2xl font-black text-indigo-600">{currentDoc.type}</h2>
                    <p className="text-sm font-bold">No: {currentDoc.docNumber}</p>
                    <p className="text-sm">Date: {currentDoc.date}</p>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-12 mb-12 border-y border-slate-50 py-6">
                 <div>
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Customer</h4>
                    <p className="font-bold text-sm">{currentDoc.clientName}</p>
                    <p className="text-[10px] text-slate-500 mt-1">{currentDoc.clientAddress}</p>
                 </div>
                 <div className="text-right space-y-1">
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Bank Account</h4>
                    <p className="text-xs font-bold text-slate-800">{company.bankName}</p>
                    <p className="text-sm font-black text-indigo-600">{company.accountNumber}</p>
                    <p className="text-[10px] text-slate-500">{company.accountName}</p>
                 </div>
              </div>

              <table className="w-full mb-12">
                 <thead className="bg-slate-900 text-white text-[10px] uppercase font-black tracking-widest">
                    <tr><th className="p-3 text-left">Description</th><th className="p-3 text-center">Qty</th><th className="p-3 text-right">Price</th><th className="p-3 text-right">Total</th></tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                    {currentDoc.items.map(item => (
                      <tr key={item.id} className="text-sm">
                         <td className="p-3">{item.description}</td>
                         <td className="p-3 text-center">{item.quantity}</td>
                         <td className="p-3 text-right">฿{item.pricePerUnit.toLocaleString()}</td>
                         <td className="p-3 text-right font-black">฿{item.total.toLocaleString()}</td>
                      </tr>
                    ))}
                 </tbody>
              </table>

              <div className="flex justify-end pt-8 border-t-2 border-slate-900">
                 <div className="w-64 space-y-2">
                    <div className="flex justify-between text-sm"><span>Total</span><span className="font-bold">฿{currentDoc.subtotal.toLocaleString()}</span></div>
                    <div className="flex justify-between text-xl font-black text-indigo-600 pt-2 border-t"><span>Grand Total</span><span>฿{currentDoc.grandTotal.toLocaleString()}</span></div>
                 </div>
              </div>
              
              <div className="mt-32 grid grid-cols-2 gap-20">
                 <div className="text-center pt-8 border-t border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Authorized Signature</p>
                 </div>
                 <div className="text-center pt-8 border-t border-slate-100">
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Receiver Signature</p>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default AccountingSystem;
