
import React, { useState } from 'react';
import { User, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { UserProfile } from '../types';
import Logo from '../components/Logo';

interface LoginProps {
  onLogin: (user: UserProfile) => void;
  employees: UserProfile[];
}

const Login: React.FC<LoginProps> = ({ onLogin, employees }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    setTimeout(() => {
      const lowerUser = username.toLowerCase();
      if (lowerUser === 'admin' && password === 'Win9135@') {
        onLogin({
          id: 'admin-1',
          name: 'GESTOR ULTRANET',
          username: 'admin',
          company: 'Ultranet Provedor',
          role: 'ADMINISTRADOR',
          shift: 'INTEGRAL',
          userType: 'ADMIN'
        });
      } else {
        const found = employees.find(emp => emp.username.toLowerCase() === lowerUser && emp.password === password);
        if (found) {
          onLogin(found);
        } else {
          setError('Credenciais inválidas. Verifique seu usuário e senha.');
          setLoading(false);
        }
      }
    }, 1200);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8fafc] p-4 relative overflow-hidden">
      {/* Background Decorativo */}
      <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-purple-100/50 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-blue-100/30 rounded-full blur-[100px]" />
      
      <div className="w-full max-w-[440px] bg-white rounded-[2.5rem] shadow-[0_32px_64px_-12px_rgba(88,28,135,0.12)] overflow-hidden p-10 md:p-14 relative z-10 border border-slate-100">
        <div className="flex flex-col items-center mb-12">
          <Logo className="mb-4" />
          <div className="h-px w-12 bg-slate-100 my-6" />
          <h2 className="text-xs font-black text-slate-400 uppercase tracking-[4px]">Portal do Colaborador</h2>
        </div>

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 tracking-widest">Usuário</label>
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#710087] transition-colors" size={18} />
              <input 
                type="text"
                placeholder="Ex: joao.silva"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:border-[#710087] focus:ring-4 focus:ring-purple-50 transition-all outline-none text-slate-900 font-semibold text-sm placeholder:text-slate-300"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 tracking-widest">Senha de Acesso</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#710087] transition-colors" size={18} />
              <input 
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:border-[#710087] focus:ring-4 focus:ring-purple-50 transition-all outline-none text-slate-900 font-semibold text-sm placeholder:text-slate-300"
                required
              />
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 text-red-600 text-[11px] font-bold rounded-xl border border-red-100 text-center uppercase animate-shake">
                {error}
            </div>
          )}

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-5 bg-[#710087] hover:bg-[#5a006d] text-white rounded-2xl font-bold text-xs uppercase tracking-widest shadow-xl shadow-purple-200 transition-all flex items-center justify-center gap-3 active:scale-95 disabled:bg-slate-300"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : (
              <>
                Entrar no Sistema
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="mt-12 text-center">
          <p className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Ultranet Tecnologia © 2026</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
