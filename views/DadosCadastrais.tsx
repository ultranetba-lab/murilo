
import React, { useState } from 'react';
import { User, Shield, Briefcase, Building, Key, Save, CheckCircle, AlertCircle, Loader2, Clock } from 'lucide-react';
import { UserProfile } from '../types';

interface DadosCadastraisProps {
  user: UserProfile;
  onUpdate: (updatedUser: UserProfile) => void;
}

const DadosCadastrais: React.FC<DadosCadastraisProps> = ({ user, onUpdate }) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  const handleUpdatePassword = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (newPassword !== confirmPassword) {
      setMessage({ text: 'As senhas não coincidem.', type: 'error' });
      setLoading(false);
      return;
    }

    setTimeout(() => {
      onUpdate({ ...user, password: newPassword });
      setMessage({ text: 'Credenciais atualizadas!', type: 'success' });
      setNewPassword('');
      setConfirmPassword('');
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="bg-purple-50 p-10 flex flex-col items-center text-center border-b border-purple-100">
          <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center border border-purple-200 mb-5 shadow-sm">
            <User size={40} className="text-[#710087]" />
          </div>
          <h2 className="text-3xl font-extrabold text-[#0f172a] tracking-tight uppercase leading-tight">{user.name}</h2>
          <div className="mt-4 flex items-center gap-2">
             <span className="px-4 py-1.5 bg-[#710087] text-white text-[10px] font-bold rounded-lg uppercase tracking-widest shadow-sm">{user.role}</span>
          </div>
        </div>

        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-6 bg-white">
          {[
            { label: 'Identificador de Acesso', value: `@${user.username}`, icon: Shield },
            { label: 'Unidade Operacional', value: user.company, icon: Building },
            { label: 'Setor de Lotação', value: user.role, icon: Briefcase },
            { label: 'Escala de Trabalho', value: user.shift, icon: Clock }
          ].map((item, i) => (
            <div key={i} className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                 <item.icon size={13} className="text-[#710087]" /> {item.label}
              </label>
              <div className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold text-sm shadow-inner">
                 {item.value}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
        <div className="mb-6">
          <h3 className="text-lg font-extrabold text-slate-900 tracking-tight uppercase">Segurança da Conta</h3>
          <p className="text-[11px] text-[#710087] font-bold uppercase tracking-widest mt-1">Atualizar Chave de Acesso</p>
        </div>

        <form onSubmit={handleUpdatePassword} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Nova Senha</label>
              <div className="relative group">
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#710087]" size={18} />
                <input 
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="********"
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#710087] focus:ring-4 focus:ring-purple-500/5 outline-none font-bold text-slate-900 transition-all text-sm"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase ml-1">Confirmar Senha</label>
              <div className="relative group">
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#710087]" size={18} />
                <input 
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="********"
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-[#710087] focus:ring-4 focus:ring-purple-500/5 outline-none font-bold text-slate-900 transition-all text-sm"
                  required
                />
              </div>
            </div>
          </div>

          {message && (
            <div className={`p-4 rounded-xl flex items-center gap-3 animate-slideDown ${message.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
              {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
              <span className="text-[11px] font-bold uppercase tracking-widest">{message.text}</span>
            </div>
          )}

          <button 
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-[#0f172a] hover:bg-[#710087] text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-md transition-all flex items-center justify-center gap-2 active:scale-95"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : <><Save size={18} /> Confirmar Nova Senha</>}
          </button>
        </form>
      </div>

      <div className="text-center pt-4">
        <p className="text-[11px] text-slate-400 font-bold uppercase tracking-[4px]">Ultranet • Tecnologia em Conectividade • 2026</p>
      </div>
    </div>
  );
};

export default DadosCadastrais;
