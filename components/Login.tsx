
import React, { useState } from 'react';
import { UserRole, Staff, CompanyInfo } from '../types';

interface LoginProps {
  onLogin: (role: UserRole) => void;
  staffMembers: Staff[];
  onRegister: (newStaff: Staff) => void;
  company: CompanyInfo;
}

const Login: React.FC<LoginProps> = ({ onLogin, staffMembers, onRegister, company }) => {
  const [mode, setMode] = useState<'LOGIN' | 'REGISTER'>('LOGIN');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [regData, setRegData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    username: '',
    password: '',
    confirmPassword: ''
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    setTimeout(() => {
      const normalizedUser = username.toLowerCase().trim();
      
      if (normalizedUser === 'admin' && password === 'admin123') {
        onLogin(UserRole.ADMIN);
      } 
      else {
        const staff = staffMembers.find(s => s.username === normalizedUser && s.password === password);
        if (staff) {
          onLogin(UserRole.USER);
        } else {
          setError('ชื่อผู้ใช้งานหรือรหัสผ่านไม่ถูกต้อง');
          setIsLoading(false);
        }
      }
    }, 800);
  };

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!regData.firstName || !regData.username || !regData.password) {
      setError('กรุณากรอกข้อมูลที่จำเป็นให้ครบถ้วน');
      return;
    }

    if (regData.password !== regData.confirmPassword) {
      setError('รหัสผ่านไม่ตรงกัน');
      return;
    }

    if (staffMembers.some(s => s.username === regData.username.toLowerCase().trim()) || regData.username.toLowerCase() === 'admin') {
      setError('ชื่อผู้ใช้งานนี้มีในระบบแล้ว');
      return;
    }

    setIsLoading(true);

    setTimeout(() => {
      const newStaff: Staff = {
        id: Math.random().toString(36).substr(2, 9),
        firstName: regData.firstName,
        lastName: regData.lastName,
        email: regData.email,
        phone: regData.phone,
        username: regData.username.toLowerCase().trim(),
        password: regData.password,
        role: UserRole.USER,
        createdAt: new Date().toISOString().split('T')[0]
      };

      onRegister(newStaff);
      setIsLoading(false);
      setMode('LOGIN');
      setUsername(newStaff.username);
      alert('ลงทะเบียนสำเร็จ! กรุณาเข้าสู่ระบบ');
    }, 1000);
  };

  return (
    <div className="fixed inset-0 bg-slate-950 flex items-center justify-center p-4 z-[9999] overflow-y-auto">
      <div className={`w-full transition-all duration-500 ${mode === 'REGISTER' ? 'max-w-xl' : 'max-w-md'}`}>
        <div className="text-center mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="inline-block p-4 bg-amber-500/10 rounded-3xl mb-4 border border-amber-500/20">
             <span className="text-4xl">🏢</span>
          </div>
          <h1 className="text-4xl font-black text-white mb-2 uppercase tracking-tighter">
            FIRSTARTHUR <span className="text-amber-500">RENTAL</span>
          </h1>
          <p className="text-slate-500 font-medium tracking-widest text-[10px] uppercase">Property Management Cloud</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-8 md:p-10 rounded-[2.5rem] shadow-2xl animate-in zoom-in duration-500 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-3xl rounded-full -mr-16 -mt-16"></div>
          
          {mode === 'LOGIN' ? (
            <form onSubmit={handleLogin} className="space-y-6 relative z-10">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Username</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">👤</span>
                  <input 
                    type="text" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-white outline-none focus:ring-2 focus:ring-amber-500 transition-all placeholder:text-slate-700"
                    placeholder="ชื่อผู้ใช้งาน"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Password</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500">🔒</span>
                  <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 pl-12 pr-4 text-white outline-none focus:ring-2 focus:ring-amber-500 transition-all placeholder:text-slate-700"
                    placeholder="รหัสผ่าน"
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-500 text-xs text-center animate-bounce">
                  {error}
                </div>
              )}

              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-slate-800 text-slate-950 font-black py-4 rounded-2xl transition-all shadow-xl shadow-amber-500/10 flex items-center justify-center gap-3"
              >
                {isLoading ? <div className="w-5 h-5 border-2 border-slate-950 border-t-transparent rounded-full animate-spin"></div> : 'เข้าสู่ระบบ'}
              </button>

              <div className="text-center">
                <button 
                  type="button" 
                  onClick={() => setMode('REGISTER')}
                  className="text-indigo-400 text-xs font-bold hover:underline"
                >
                  ยังไม่มีบัญชี? ลงทะเบียนเจ้าหน้าที่ใหม่ที่นี่
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4 relative z-10">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-white">ลงทะเบียนทีมงาน</h3>
                <button type="button" onClick={() => setMode('LOGIN')} className="text-slate-500 text-xs hover:text-white">← กลับไปเข้าสู่ระบบ</button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase ml-1">ชื่อ</label>
                  <input 
                    type="text" 
                    value={regData.firstName}
                    onChange={e => setRegData({...regData, firstName: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="ชื่อจริง"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase ml-1">นามสกุล</label>
                  <input 
                    type="text" 
                    value={regData.lastName}
                    onChange={e => setRegData({...regData, lastName: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="นามสกุล"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase ml-1">อีเมล</label>
                  <input 
                    type="email" 
                    value={regData.email}
                    onChange={e => setRegData({...regData, email: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="mail@company.com"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-500 uppercase ml-1">เบอร์โทรศัพท์</label>
                  <input 
                    type="tel" 
                    value={regData.phone}
                    onChange={e => setRegData({...regData, phone: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="08x-xxx-xxxx"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-slate-800 space-y-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-indigo-400 uppercase ml-1">Username (สำหรับใช้ล็อกอิน)</label>
                  <input 
                    type="text" 
                    value={regData.username}
                    onChange={e => setRegData({...regData, username: e.target.value})}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white text-sm outline-none focus:ring-2 focus:ring-amber-500"
                    placeholder="เช่น staff01"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-indigo-400 uppercase ml-1">Password</label>
                    <input 
                      type="password" 
                      value={regData.password}
                      onChange={e => setRegData({...regData, password: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white text-sm outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder="ตั้งรหัสผ่าน"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold text-indigo-400 uppercase ml-1">Confirm Password</label>
                    <input 
                      type="password" 
                      value={regData.confirmPassword}
                      onChange={e => setRegData({...regData, confirmPassword: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white text-sm outline-none focus:ring-2 focus:ring-amber-500"
                      placeholder="ยืนยันรหัสผ่าน"
                      required
                    />
                  </div>
                </div>
              </div>

              {error && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-500 text-[10px] text-center">
                  {error}
                </div>
              )}

              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-800 text-white font-black py-4 rounded-2xl transition-all shadow-xl shadow-indigo-500/10 flex items-center justify-center gap-3 mt-4"
              >
                {isLoading ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div> : 'สร้างบัญชีของฉัน'}
              </button>
            </form>
          )}

          <div className="mt-8 pt-6 border-t border-slate-800/50">
            <p className="text-[10px] text-slate-600 text-center leading-relaxed font-medium">
              ระบบนี้สงวนไว้สำหรับการใช้งานภายในของบริษัท <span className="text-slate-400">{company.nameTh}</span> เท่านั้น<br/>
              © 2024 All Rights Reserved.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
