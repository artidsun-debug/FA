
import React, { useState } from 'react';
import { UserRole, Staff, CompanyInfo, ApprovalStatus } from '../types';

interface LoginProps {
  onLogin: (role: UserRole, member: Staff | null) => void;
  staffMembers: Staff[];
  onRegister: (newStaff: Staff) => void;
  company: CompanyInfo;
}

const generateMemberCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let result = 'FA-';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

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
    confirmPassword: '',
    role: UserRole.STAFF
  });

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    setTimeout(() => {
      const normalizedUser = username.toLowerCase().trim();
      
      if (normalizedUser === 'admin' && password === 'admin123') {
        onLogin(UserRole.ADMIN, null);
      } 
      else {
        const staff = staffMembers.find(s => s.username === normalizedUser && s.password === password);
        if (staff) {
          onLogin(staff.role, staff);
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
        memberCode: generateMemberCode(),
        firstName: regData.firstName,
        lastName: regData.lastName,
        email: regData.email,
        phone: regData.phone,
        username: regData.username.toLowerCase().trim(),
        password: regData.password,
        role: regData.role,
        approvalStatus: regData.role === UserRole.STAFF ? ApprovalStatus.PENDING : ApprovalStatus.APPROVED,
        createdAt: new Date().toISOString().split('T')[0]
      };

      onRegister(newStaff);
      setIsLoading(false);
      setMode('LOGIN');
      setUsername(newStaff.username);
      alert(`ลงทะเบียนสำเร็จ! รหัสสมาชิกของคุณคือ: ${newStaff.memberCode}`);
    }, 1000);
  };

  return (
    <div className="fixed inset-0 bg-slate-950 flex items-center justify-center p-4 z-[9999] overflow-y-auto">
      <div className={`w-full transition-all duration-500 ${mode === 'REGISTER' ? 'max-w-2xl' : 'max-w-md'}`}>
        <div className="text-center mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <div className="inline-block p-4 bg-amber-500/10 rounded-3xl mb-4 border border-amber-500/20">
             <span className="text-4xl">🏢</span>
          </div>
          <h1 className="text-4xl font-black text-white mb-2 uppercase tracking-tighter">
            FIRSTARTHUR <span className="text-amber-500">RENTAL</span>
          </h1>
          <p className="text-slate-500 font-medium tracking-widest text-[10px] uppercase">Secure Real Estate Management</p>
        </div>

        <div className="bg-slate-900 border border-slate-800 p-8 md:p-10 rounded-[2.5rem] shadow-2xl animate-in zoom-in duration-500 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-3xl rounded-full -mr-16 -mt-16"></div>
          
          {mode === 'LOGIN' ? (
            <form onSubmit={handleLogin} className="space-y-6 relative z-10">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Username</label>
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 px-6 text-white outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                  placeholder="ชื่อผู้ใช้งาน"
                  required
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Password</label>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-2xl py-4 px-6 text-white outline-none focus:ring-2 focus:ring-amber-500 transition-all"
                  placeholder="รหัสผ่าน"
                  required
                />
              </div>

              {error && (
                <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-500 text-xs text-center">
                  {error}
                </div>
              )}

              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-amber-500 hover:bg-amber-600 disabled:bg-slate-800 text-slate-950 font-black py-4 rounded-2xl transition-all shadow-xl"
              >
                {isLoading ? 'กำลังประมวลผล...' : 'เข้าสู่ระบบ'}
              </button>

              <div className="text-center">
                <button type="button" onClick={() => setMode('REGISTER')} className="text-indigo-400 text-xs font-bold hover:underline">
                  ยังไม่มีบัญชี? ลงทะเบียนที่นี่
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4 relative z-10">
              <div className="flex justify-between items-center mb-6">
                 <h3 className="text-xl font-bold text-white">สร้างบัญชีผู้ใช้ใหม่</h3>
                 <button type="button" onClick={() => setMode('LOGIN')} className="text-slate-500 text-xs font-bold">← กลับ</button>
              </div>

              <div className="space-y-3 mb-6 p-1 bg-slate-950 rounded-2xl flex">
                 <button 
                    type="button"
                    onClick={() => setRegData({...regData, role: UserRole.STAFF})}
                    className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${regData.role === UserRole.STAFF ? 'bg-amber-500 text-slate-950' : 'text-slate-400'}`}
                 >
                    AGENT (ตัวแทน)
                 </button>
                 <button 
                    type="button"
                    onClick={() => setRegData({...regData, role: UserRole.OWNER})}
                    className={`flex-1 py-3 rounded-xl text-xs font-black transition-all ${regData.role === UserRole.OWNER ? 'bg-indigo-500 text-white' : 'text-slate-400'}`}
                 >
                    MEMBER (สมาชิกทั่วไป)
                 </button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <input type="text" placeholder="ชื่อจริง" value={regData.firstName} onChange={e => setRegData({...regData, firstName: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500" required />
                <input type="text" placeholder="นามสกุล" value={regData.lastName} onChange={e => setRegData({...regData, lastName: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
              </div>

              <input type="email" placeholder="อีเมล" value={regData.email} onChange={e => setRegData({...regData, email: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
              <input type="tel" placeholder="เบอร์โทรศัพท์" value={regData.phone} onChange={e => setRegData({...regData, phone: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white text-sm outline-none focus:ring-2 focus:ring-indigo-500" />
              
              <div className="pt-4 border-t border-slate-800">
                <input type="text" placeholder="Username" value={regData.username} onChange={e => setRegData({...regData, username: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white text-sm outline-none mb-3" required />
                <div className="grid grid-cols-2 gap-4">
                  <input type="password" placeholder="Password" value={regData.password} onChange={e => setRegData({...regData, password: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white text-sm outline-none" required />
                  <input type="password" placeholder="Confirm" value={regData.confirmPassword} onChange={e => setRegData({...regData, confirmPassword: e.target.value})} className="w-full bg-slate-950 border border-slate-800 rounded-xl py-3 px-4 text-white text-sm outline-none" required />
                </div>
              </div>

              {regData.role === UserRole.STAFF && (
                <p className="text-[10px] text-amber-500 font-bold bg-amber-500/5 p-3 rounded-xl border border-amber-500/10">
                  ⚠️ สำหรับบัญชี Agent: คุณต้องกรอกข้อมูลส่วนตัวและรอ Admin อนุมัติหลังสมัครสมาชิกจึงจะสามารถใช้งานระบบได้เต็มรูปแบบ
                </p>
              )}

              <button 
                type="submit" 
                disabled={isLoading}
                className={`w-full ${regData.role === UserRole.STAFF ? 'bg-amber-500' : 'bg-indigo-600 text-white'} font-black py-4 rounded-2xl transition-all shadow-xl mt-4`}
              >
                {isLoading ? 'กำลังสมัครสมาชิก...' : 'สมัครสมาชิก'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
