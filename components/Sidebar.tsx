
import React from 'react';
import { CreditCard, PlusCircle, UserCircle, HelpCircle, LogOut, X, ShieldCheck } from 'lucide-react';
import { ViewType, UserProfile } from '../types';
import Logo from './Logo';

interface SidebarProps {
  user: UserProfile;
  activeView: ViewType;
  onNavigate: (view: ViewType) => void;
  onLogout: () => void;
  onClose: () => void;
  isOpen: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ user, activeView, onNavigate, onLogout, onClose, isOpen }) => {
  const isAdmin = user.userType === 'ADMIN';

  const menuItems = [
    { id: 'INCLUIR_PONTO', label: 'Registrar Ponto', icon: PlusCircle, hidden: isAdmin },
    { id: 'CARTAO_PONTO', label: 'Meu Espelho Mensal', icon: CreditCard, hidden: isAdmin },
    { id: 'ADMIN_DASHBOARD', label: 'Gestão Administrativa', icon: ShieldCheck, hidden: !isAdmin },
    { id: 'DADOS', label: 'Meus Dados', icon: UserCircle },
    { id: 'HELP', label: 'Suporte', icon: HelpCircle },
    { id: 'EXIT', label: 'Sair do Sistema', icon: LogOut, action: onLogout },
  ];

  return (
    <>
      <div className={`fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`} onClick={onClose} />
      
      <div className={`fixed inset-y-0 left-0 w-72 bg-white z-50 transform transition-transform duration-500 cubic-bezier(0.4, 0, 0.2, 1) shadow-2xl ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-8 border-b border-slate-100 relative">
          <button onClick={onClose} className="absolute top-8 right-6 text-slate-400 hover:text-slate-900 transition-colors p-2 hover:bg-slate-50 rounded-full">
            <X size={20} />
          </button>
          
          <div className="mb-10 pt-4">
            <Logo />
          </div>

          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex items-center gap-4">
            <div className="w-10 h-10 bg-white border border-slate-200 rounded-xl flex items-center justify-center text-[#710087] font-black text-sm shadow-sm">
                {user.name[0]}
            </div>
            <div className="overflow-hidden">
              <h2 className="font-bold text-slate-900 text-xs truncate leading-none mb-1">{user.name}</h2>
              <span className="text-[9px] font-black bg-purple-100 text-[#710087] px-2 py-0.5 rounded uppercase">{user.userType}</span>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-1">
          {menuItems.filter(i => !i.hidden).map((item) => (
            <button
              key={item.id}
              onClick={() => { item.action ? item.action() : onNavigate(item.id as ViewType); onClose(); }}
              className={`w-full flex items-center gap-4 px-4 py-4 text-xs font-black uppercase tracking-widest rounded-xl transition-all ${
                activeView === item.id ? 'text-white bg-[#710087] shadow-lg shadow-purple-200' : 'text-slate-500 hover:bg-slate-50 hover:text-[#710087]'
              }`}
            >
              <item.icon size={20} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-8 text-center bg-slate-50/50">
           <p className="text-[9px] font-bold text-slate-300 uppercase tracking-[3px]">Ultranet 2026</p>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
