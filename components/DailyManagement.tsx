
import React, { useState, useMemo, useEffect } from 'react';
import { Property, Booking, PropertyStatus, RentalType, RepairStatus } from '../types';

interface DailyManagementProps {
  properties: Property[];
  onUpdateProperty: (property: Property) => void;
  onAddProperty: () => void;
  onDeleteProperty: (id: string) => void;
}

const DailyManagement: React.FC<DailyManagementProps> = ({ properties, onUpdateProperty, onAddProperty, onDeleteProperty }) => {
  const dailyProps = properties.filter(p => p.rentalType === RentalType.DAILY);
  
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');
  const [showAddBooking, setShowAddBooking] = useState<string | null>(null);
  const [editingPropId, setEditingPropId] = useState<string | null>(null);
  const [currentCalendarDate, setCurrentCalendarDate] = useState(new Date());
  
  const [newBooking, setNewBooking] = useState<Partial<Booking> & { duration?: number }>({
    guestName: '',
    guestPhone: '',
    checkInDate: new Date().toISOString().split('T')[0],
    checkOutDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
    duration: 1,
    deposit: 0,
    totalPrice: 0,
    paymentMethod: 'TRANSFER'
  });

  const [editPropData, setEditPropData] = useState<Partial<Property>>({});

  // Sync duration and checkOutDate
  useEffect(() => {
    if (newBooking.checkInDate && newBooking.duration !== undefined) {
      const checkIn = new Date(newBooking.checkInDate);
      const checkOut = new Date(checkIn);
      checkOut.setDate(checkIn.getDate() + (newBooking.duration || 1));
      
      const checkOutStr = checkOut.toISOString().split('T')[0];
      if (checkOutStr !== newBooking.checkOutDate) {
        setNewBooking(prev => ({ ...prev, checkOutDate: checkOutStr }));
      }

      // Update total price based on duration if property is selected
      if (showAddBooking) {
        const prop = properties.find(p => p.id === showAddBooking);
        if (prop) {
           setNewBooking(prev => ({ ...prev, totalPrice: prop.rentAmount * (prev.duration || 1) }));
        }
      }
    }
  }, [newBooking.checkInDate, newBooking.duration, showAddBooking]);

  const handleAddBooking = (propertyId: string) => {
    const property = properties.find(p => p.id === propertyId);
    if (!property) return;

    const booking: Booking = {
      id: Math.random().toString(36).substr(2, 9),
      guestName: newBooking.guestName || 'Anonymous Guest',
      guestPhone: newBooking.guestPhone || '-',
      checkInDate: newBooking.checkInDate || '',
      checkOutDate: newBooking.checkOutDate || '',
      totalPrice: newBooking.totalPrice || property.rentAmount,
      deposit: newBooking.deposit || 0,
      paymentMethod: newBooking.paymentMethod as 'TRANSFER' | 'CASH',
      status: 'CHECKED_IN'
    };

    onUpdateProperty({
      ...property,
      bookings: [...(property.bookings || []), booking],
      status: PropertyStatus.OCCUPIED
    });
    setShowAddBooking(null);
    setNewBooking({ 
      guestName: '', 
      guestPhone: '', 
      checkInDate: new Date().toISOString().split('T')[0],
      checkOutDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      duration: 1,
      deposit: 0, 
      totalPrice: 0, 
      paymentMethod: 'TRANSFER' 
    });
  };

  const updateBookingStatus = (property: Property, bookingId: string, status: Booking['status']) => {
    const updatedBookings = property.bookings.map(b => 
      b.id === bookingId ? { ...b, status } : b
    );
    
    const isOccupied = updatedBookings.some(b => b.status === 'CHECKED_IN');
    
    onUpdateProperty({
      ...property,
      bookings: updatedBookings,
      status: isOccupied ? PropertyStatus.OCCUPIED : PropertyStatus.VACANT
    });
  };

  const startEditProperty = (p: Property) => {
    setEditingPropId(p.id);
    setEditPropData({ ...p });
  };

  const saveEditProperty = () => {
    if (editingPropId && editPropData.name) {
      onUpdateProperty(editPropData as Property);
      setEditingPropId(null);
    }
  };

  // Calendar Logic
  const calendarDays = useMemo(() => {
    const year = currentCalendarDate.getFullYear();
    const month = currentCalendarDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return Array.from({ length: daysInMonth }, (_, i) => i + 1);
  }, [currentCalendarDate]);

  const monthLabel = currentCalendarDate.toLocaleString('th-TH', { month: 'long', year: 'numeric' });

  const getBookingForDate = (prop: Property, day: number) => {
    const checkDate = new Date(currentCalendarDate.getFullYear(), currentCalendarDate.getMonth(), day);
    return prop.bookings.find(b => {
      if (b.status === 'CANCELLED') return false;
      const start = new Date(b.checkInDate);
      const end = new Date(b.checkOutDate);
      return checkDate >= start && checkDate < end;
    });
  };

  const nextMonth = () => {
    setCurrentCalendarDate(new Date(currentCalendarDate.setMonth(currentCalendarDate.getMonth() + 1)));
  };

  const prevMonth = () => {
    setCurrentCalendarDate(new Date(currentCalendarDate.setMonth(currentCalendarDate.getMonth() - 1)));
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">จัดการที่พักรายวัน</h2>
          <p className="text-sm text-slate-500">บันทึกการจองและจัดการสถานะห้องพักรายวัน</p>
        </div>
        <div className="flex gap-2">
          <div className="bg-slate-200 p-1 rounded-xl flex">
            <button 
              onClick={() => setViewMode('list')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
            >
              รายการ
            </button>
            <button 
              onClick={() => setViewMode('calendar')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'calendar' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
            >
              ปฏิทิน
            </button>
          </div>
          <button 
            onClick={onAddProperty}
            className="px-6 py-2.5 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-500/20 transition-all"
          >
            + เพิ่มห้องรายวัน
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Occupancy Today</p>
          <p className="text-3xl font-black text-slate-900 mt-1">
            {dailyProps.filter(p => p.status === PropertyStatus.OCCUPIED).length} / {dailyProps.length}
          </p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Expected Check-ins</p>
          <p className="text-3xl font-black text-indigo-600 mt-1">
             {dailyProps.filter(p => p.status === PropertyStatus.VACANT).length}
          </p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Revenue Potential</p>
          <p className="text-3xl font-black text-emerald-600 mt-1">
            ฿{dailyProps.reduce((sum, p) => sum + (p.status === PropertyStatus.OCCUPIED ? p.rentAmount : 0), 0).toLocaleString()}
          </p>
        </div>
      </div>

      {viewMode === 'list' ? (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
          <div className="p-6 border-b border-slate-50 flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-800">สถานะและรายการจอง</h3>
            <div className="flex gap-4">
              <span className="flex items-center gap-1 text-[10px] font-bold uppercase text-emerald-600">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span> ห้องว่าง
              </span>
              <span className="flex items-center gap-1 text-[10px] font-bold uppercase text-rose-600">
                <span className="w-2 h-2 rounded-full bg-rose-500"></span> มีผู้พัก
              </span>
            </div>
          </div>
          
          <div className="divide-y divide-slate-50">
            {dailyProps.map(p => (
              <div key={p.id} className="p-6 hover:bg-slate-50/50 transition-colors group relative">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                  <div className="flex items-center gap-4 min-w-[200px]">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-inner transition-all ${p.status === PropertyStatus.VACANT ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                      {p.status === PropertyStatus.VACANT ? '🟢' : '🏠'}
                    </div>
                    <div>
                      {editingPropId === p.id ? (
                        <div className="flex flex-col gap-1">
                          <input 
                            className="font-black text-slate-900 border-b border-indigo-500 outline-none" 
                            value={editPropData.name} 
                            placeholder="ชื่อโครงการ"
                            onChange={e => setEditPropData({...editPropData, name: e.target.value})}
                          />
                          <div className="flex gap-2">
                             <input className="text-[10px] w-12 border-b outline-none" placeholder="ตึก" value={editPropData.building} onChange={e => setEditPropData({...editPropData, building: e.target.value})} />
                             <input className="text-[10px] w-12 border-b outline-none" placeholder="ชั้น" value={editPropData.floor} onChange={e => setEditPropData({...editPropData, floor: e.target.value})} />
                             <input className="text-[10px] w-12 border-b outline-none" placeholder="ห้อง" value={editPropData.roomNumber} onChange={e => setEditPropData({...editPropData, roomNumber: e.target.value})} />
                          </div>
                        </div>
                      ) : (
                        <div>
                          <h4 className="font-black text-slate-900 group-hover:text-indigo-600 transition-colors">{p.name}</h4>
                          <div className="flex gap-1 mb-1">
                             {p.building && <span className="text-[9px] bg-slate-100 px-1.5 py-0.5 rounded font-bold">ตึก {p.building}</span>}
                             {p.floor && <span className="text-[9px] bg-slate-100 px-1.5 py-0.5 rounded font-bold">ชั้น {p.floor}</span>}
                             {p.roomNumber && <span className="text-[9px] bg-indigo-50 px-1.5 py-0.5 rounded font-bold text-indigo-600">ห้อง {p.roomNumber}</span>}
                          </div>
                        </div>
                      )}
                      <p className="text-xs text-slate-400">{p.address}</p>
                    </div>
                  </div>

                  <div className="flex-1 flex flex-wrap items-center gap-8 justify-between">
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Base Price</p>
                      {editingPropId === p.id ? (
                        <input 
                          type="number"
                          className="text-sm font-black text-slate-900 border-b border-indigo-500 w-20 outline-none" 
                          value={editPropData.rentAmount} 
                          onChange={e => setEditPropData({...editPropData, rentAmount: parseInt(e.target.value) || 0})}
                        />
                      ) : (
                        <p className="text-sm font-black text-slate-900">฿{p.rentAmount.toLocaleString()}</p>
                      )}
                    </div>
                    
                    {p.status === PropertyStatus.OCCUPIED ? (
                      (() => {
                        const active = p.bookings.find(b => b.status === 'CHECKED_IN');
                        return active ? (
                          <div className="bg-slate-900 text-white p-4 rounded-2xl flex gap-6 min-w-[300px] shadow-lg">
                            <div className="flex flex-col">
                              <span className="text-[9px] font-bold opacity-50 uppercase">Guest</span>
                              <span className="text-xs font-black truncate max-w-[100px]">{active.guestName}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[9px] font-bold opacity-50 uppercase">Payment ({active.paymentMethod === 'TRANSFER' ? '🏦' : '💵'})</span>
                              <span className="text-xs font-black text-amber-400">฿{active.totalPrice.toLocaleString()}</span>
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[9px] font-bold opacity-50 uppercase">Deposit</span>
                              <span className="text-xs font-black text-emerald-400">฿{active.deposit.toLocaleString()}</span>
                            </div>
                          </div>
                        ) : null;
                      })()
                    ) : (
                      <div className="text-slate-300 text-xs italic">พร้อมสำหรับการจองใหม่</div>
                    )}

                    <div className="flex gap-2">
                      {editingPropId === p.id ? (
                        <>
                          <button onClick={saveEditProperty} className="px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl">บันทึก</button>
                          <button onClick={() => setEditingPropId(null)} className="px-4 py-2 bg-slate-200 text-slate-600 text-xs font-bold rounded-xl">ยกเลิก</button>
                        </>
                      ) : (
                        <>
                          {p.status === PropertyStatus.VACANT ? (
                            <button 
                              onClick={() => setShowAddBooking(p.id)}
                              className="px-6 py-2 bg-indigo-600 text-white text-xs font-bold rounded-xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                            >
                              + เช็คอิน (Check-in)
                            </button>
                          ) : (
                            <button 
                              onClick={() => {
                                const active = p.bookings.find(b => b.status === 'CHECKED_IN');
                                if (active) updateBookingStatus(p, active.id, 'CHECKED_OUT');
                              }}
                              className="px-6 py-2 bg-rose-500 text-white text-xs font-bold rounded-xl hover:bg-rose-600 transition-all shadow-lg shadow-rose-100"
                            >
                              เช็คเอาท์ (Check-out)
                            </button>
                          )}
                          <div className="flex opacity-0 group-hover:opacity-100 transition-opacity gap-1">
                            <button onClick={() => startEditProperty(p)} className="p-2 bg-slate-100 text-slate-500 hover:text-indigo-600 rounded-lg" title="แก้ไขห้อง">✏️</button>
                            <button onClick={() => onDeleteProperty(p.id)} className="p-2 bg-rose-50 text-rose-400 hover:text-rose-600 rounded-lg" title="ลบห้อง">🗑️</button>
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Booking Form Overlay */}
                {showAddBooking === p.id && (
                  <div className="mt-6 p-8 bg-indigo-50 border border-indigo-100 rounded-[2rem] animate-in zoom-in duration-300 shadow-inner">
                    <div className="flex justify-between items-center mb-6">
                      <h5 className="text-sm font-black text-indigo-900 flex items-center gap-2">
                        <span>📑</span> เช็คอิน: {p.name} {p.roomNumber && `(${p.roomNumber})`}
                      </h5>
                      <button onClick={() => setShowAddBooking(null)} className="text-indigo-300 hover:text-indigo-600 transition-colors">✕ ปิด</button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-indigo-400 uppercase">ชื่อผู้เข้าพัก</label>
                        <input 
                          type="text" 
                          value={newBooking.guestName}
                          onChange={e => setNewBooking({...newBooking, guestName: e.target.value})}
                          className="w-full px-4 py-3 bg-white border border-indigo-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                          placeholder="ระบุชื่อจริง"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-indigo-400 uppercase">เบอร์ติดต่อ</label>
                        <input 
                          type="tel" 
                          value={newBooking.guestPhone}
                          onChange={e => setNewBooking({...newBooking, guestPhone: e.target.value})}
                          className="w-full px-4 py-3 bg-white border border-indigo-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                          placeholder="08X-XXX-XXXX"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-indigo-400 uppercase">วันที่เข้าพัก (Check-in)</label>
                        <input type="date" value={newBooking.checkInDate} onChange={e => setNewBooking({...newBooking, checkInDate: e.target.value})} className="w-full px-4 py-3 bg-white border border-indigo-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
                      </div>
                      
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-indigo-400 uppercase text-center block mb-1">จำนวนคืน (Nights)</label>
                        <div className="flex items-center gap-2 p-1.5 bg-white border border-indigo-200 rounded-xl">
                          <button 
                            onClick={() => setNewBooking(prev => ({ ...prev, duration: Math.max(1, (prev.duration || 1) - 1) }))}
                            className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center font-black text-xl hover:bg-indigo-100 transition-colors"
                          >
                            −
                          </button>
                          <input 
                            type="number" 
                            value={newBooking.duration}
                            onChange={e => setNewBooking({...newBooking, duration: Math.max(1, parseInt(e.target.value) || 1)})}
                            className="flex-1 min-w-0 text-center font-black text-indigo-600 text-lg outline-none bg-transparent"
                          />
                          <button 
                            onClick={() => setNewBooking(prev => ({ ...prev, duration: (prev.duration || 1) + 1 }))}
                            className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center font-black text-xl hover:bg-indigo-100 transition-colors"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-indigo-400 uppercase">วันที่ออก (Check-out)</label>
                        <input type="date" value={newBooking.checkOutDate} readOnly className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-500 cursor-not-allowed outline-none" />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-indigo-400 uppercase">ยอดเงินรวม (Total)</label>
                        <div className="relative">
                          <input 
                            type="number" 
                            value={newBooking.totalPrice}
                            onChange={e => setNewBooking({...newBooking, totalPrice: parseInt(e.target.value) || 0})}
                            className="w-full px-4 py-3 bg-white border border-indigo-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-black text-indigo-700 pl-8"
                          />
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">฿</span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-indigo-400 uppercase">เงินมัดจำ (Deposit)</label>
                        <div className="relative">
                          <input 
                            type="number" 
                            value={newBooking.deposit}
                            onChange={e => setNewBooking({...newBooking, deposit: parseInt(e.target.value) || 0})}
                            className="w-full px-4 py-3 bg-white border border-indigo-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-black text-emerald-600 pl-8"
                          />
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs">฿</span>
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-indigo-400 uppercase">วิธีการชำระเงิน</label>
                        <div className="flex gap-1 p-1 bg-white border border-indigo-200 rounded-xl">
                          <button 
                            onClick={() => setNewBooking({...newBooking, paymentMethod: 'TRANSFER'})}
                            className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition-all ${newBooking.paymentMethod === 'TRANSFER' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-400'}`}
                          >
                            🏦 โอนเงิน
                          </button>
                          <button 
                            onClick={() => setNewBooking({...newBooking, paymentMethod: 'CASH'})}
                            className={`flex-1 py-2 text-[10px] font-bold rounded-lg transition-all ${newBooking.paymentMethod === 'CASH' ? 'bg-amber-500 text-white shadow-md' : 'text-slate-400'}`}
                          >
                            💵 เงินสด
                          </button>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-4 md:col-span-2 lg:col-span-4">
                        <button onClick={() => handleAddBooking(p.id)} className="flex-1 py-4 bg-slate-900 text-white text-sm font-black rounded-2xl hover:bg-slate-800 shadow-xl shadow-slate-200 transition-all">บันทึกข้อมูลการเข้าพัก</button>
                        <button onClick={() => setShowAddBooking(null)} className="px-10 py-4 bg-white border border-slate-200 text-slate-500 text-sm font-bold rounded-2xl hover:bg-slate-50 transition-all">ยกเลิก</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {dailyProps.length === 0 && (
              <div className="p-20 text-center text-slate-400">
                <span className="text-5xl block mb-4">🏨</span>
                <p className="font-bold">ยังไม่มีข้อมูลที่พักรายวัน</p>
                <button onClick={onAddProperty} className="mt-4 text-indigo-600 font-bold underline">เริ่มเพิ่มห้องแรกที่นี่</button>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Calendar View */
        <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-black text-slate-800">{monthLabel}</h3>
            <div className="flex gap-2">
              <button onClick={prevMonth} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">◀</button>
              <button onClick={() => setCurrentCalendarDate(new Date())} className="px-4 py-2 bg-slate-100 hover:bg-slate-200 rounded-xl text-xs font-bold">Today</button>
              <button onClick={nextMonth} className="p-2 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors">▶</button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <div className="min-w-[1000px]">
              <div className="grid grid-cols-[250px_repeat(auto-fill,minmax(35px,1fr))] border-b border-slate-100">
                <div className="p-4 font-bold text-xs text-slate-400 uppercase tracking-widest">Property / Date</div>
                {calendarDays.map(day => (
                  <div key={day} className="p-2 text-center text-[10px] font-black text-slate-500 border-l border-slate-50">
                    {day}
                  </div>
                ))}
              </div>
              <div className="divide-y divide-slate-50">
                {dailyProps.map(p => (
                  <div key={p.id} className="grid grid-cols-[250px_repeat(auto-fill,minmax(35px,1fr))] items-stretch hover:bg-slate-50/50 transition-colors group">
                    <div className="p-4 border-r border-slate-50 flex flex-col justify-center">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-slate-900 group-hover:text-indigo-600 transition-colors truncate max-w-[150px]">{p.name}</span>
                        {p.roomNumber && <span className="text-[8px] bg-indigo-50 text-indigo-600 px-1 rounded font-black">{p.roomNumber}</span>}
                      </div>
                      <span className="text-[9px] text-slate-400">฿{p.rentAmount.toLocaleString()} / Night</span>
                    </div>
                    {calendarDays.map(day => {
                      const booking = getBookingForDate(p, day);
                      return (
                        <div 
                          key={day} 
                          className={`p-1 border-l border-slate-50 relative min-h-[50px] transition-all ${booking ? 'bg-indigo-50/30' : ''}`}
                        >
                          {booking && (
                            <div 
                              className={`absolute inset-0.5 rounded-md flex items-center justify-center text-[8px] font-bold shadow-sm transition-transform hover:scale-105 z-10 cursor-help ${
                                booking.status === 'CHECKED_IN' ? 'bg-indigo-600 text-white' : 'bg-slate-400 text-white'
                              }`}
                              title={`${booking.guestName} (${booking.checkInDate} to ${booking.checkOutDate})`}
                            >
                              {booking.guestName[0]}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DailyManagement;
