
import React, { useState } from 'react';
import { User, Lock, ArrowRight, Loader2 } from 'lucide-react';
import { UserProfile } from '../types';

interface LoginProps {
  onLogin: (user: UserProfile) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    setTimeout(() => {
      if (username.toLowerCase() === 'admin' && password === '123') {
        onLogin({
          id: 'admin-1',
          name: 'GESTOR ULTRANET',
          username: 'admin',
          company: 'Ultranet Provedor',
          role: 'ADMINISTRADOR',
          shift: 'INTEGRAL',
          userType: 'ADMIN'
        });
      } else if (username.toLowerCase() === 'lucas' && password === '123') {
        onLogin({
          id: 'user-1',
          name: 'LUCAS ASSIS DOS SANTOS CRUZ',
          username: 'lucas',
          company: 'ULTRANET SERVICOS',
          role: 'TECNICO EXTERNO',
          shift: '08:00 - 18:00',
          userType: 'COLABORADOR'
        });
      } else {
        setError('Usuário ou senha inválidos.');
        setLoading(false);
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 relative overflow-hidden">
      {/* Decorative Blur Elements */}
      <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-purple-100 rounded-full blur-3xl opacity-40 animate-pulse"></div>
      <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-orange-50 rounded-full blur-3xl opacity-40"></div>

      <div className="w-full max-w-[420px] bg-white rounded-[2rem] shadow-2xl overflow-hidden p-12 relative z-10 border border-slate-100">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center gap-3 mb-4">
             <div className="w-12 h-12 bg-[#710087] rounded-xl flex items-center justify-center font-bold text-white text-xl shadow-lg">U</div>
             <span className="text-3xl font-extrabold text-[#710087] tracking-tighter uppercase">Ultranet</span>
          </div>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[4px]">Ponto Eletrônico v4.0</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 tracking-widest">Usuário de Acesso</label>
            <div className="relative group">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#710087] transition-colors" size={20} />
              <input 
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:border-[#710087] focus:ring-4 focus:ring-purple-500/5 transition-all outline-none text-slate-900 font-bold placeholder:text-slate-300 text-sm"
                placeholder="Ex: lucas.assis"
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-500 uppercase ml-1 tracking-widest">Senha Digital</label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#710087] transition-colors" size={20} />
              <input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:border-[#710087] focus:ring-4 focus:ring-purple-500/5 transition-all outline-none text-slate-900 font-bold placeholder:text-slate-300 text-sm"
                placeholder="••••••••"
                required
              />
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 text-red-700 text-[11px] font-bold rounded-xl border border-red-100 text-center uppercase tracking-wider animate-shake">
                {error}
            </div>
          )}

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-5 bg-[#710087] hover:bg-[#5a006d] text-white rounded-2xl font-bold text-xs uppercase tracking-widest shadow-xl shadow-purple-200 transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-70 mt-4"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : (
              <>
                Acessar Portal
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>

        <div className="mt-12 pt-8 border-t border-slate-50 flex flex-col items-center gap-2">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Suporte Técnico</span>
          <span className="text-xs font-extrabold text-slate-900">0800 000 0000</span>
        </div>
      </div>
    </div>
  );
};

export default Login;
