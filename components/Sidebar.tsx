
import React from 'react';
import { 
  CreditCard, 
  PlusCircle, 
  UserCircle, 
  HelpCircle, 
  LogOut,
  X,
  ShieldCheck
} from 'lucide-react';
import { ViewType, UserProfile } from '../types';

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
    { id: 'INCLUIR_PONTO', label: 'Incluir Ponto', icon: PlusCircle, hidden: isAdmin },
    { id: 'CARTAO_PONTO', label: 'Meu Cartão Ponto', icon: CreditCard, hidden: isAdmin },
    { id: 'ADMIN_DASHBOARD', label: 'Painel Admin', icon: ShieldCheck, hidden: !isAdmin },
    { id: 'DADOS', label: 'Dados Cadastrais', icon: UserCircle },
    { id: 'HELP', label: 'Ajuda', icon: HelpCircle },
    { id: 'EXIT', label: 'Sair', icon: LogOut, action: onLogout },
  ];

  return (
    <>
      <div 
        className={`fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
        onClick={onClose}
      />
      
      <div className={`fixed inset-y-0 left-0 w-72 bg-white z-50 transform transition-transform duration-300 shadow-2xl border-r border-slate-100 ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-6 border-b border-slate-100 flex flex-col relative">
          <button onClick={onClose} className="absolute top-6 right-4 p-1.5 text-slate-400 hover:bg-slate-50 rounded-lg transition-all">
            <X size={20} />
          </button>
          
          <div className="mb-6">
            <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-[#710087] rounded-lg flex items-center justify-center font-bold text-white text-xs shadow-sm">U</div>
                <span className="font-extrabold text-[#710087] tracking-tighter text-lg">Ultranet</span>
            </div>
          </div>

          <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-[#710087] font-bold border border-slate-200 shadow-sm shrink-0">
                {user.name[0]}
            </div>
            <div className="overflow-hidden">
              <h2 className="font-bold text-slate-900 text-sm truncate leading-tight">{user.name}</h2>
              <div className="flex items-center gap-1.5 mt-1">
                 <span className="text-[10px] font-bold bg-[#fbb03b]/20 text-[#8a5d15] px-2 py-0.5 rounded uppercase tracking-wider">{user.userType}</span>
              </div>
            </div>
          </div>
        </div>

        <nav className="py-4 space-y-1 px-3">
          {menuItems.filter(i => !i.hidden).map((item) => (
            <button
              key={item.id}
              onClick={() => {
                if (item.action) {
                  item.action();
                } else {
                  onNavigate(item.id as ViewType);
                }
                onClose();
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-semibold transition-all rounded-xl relative ${
                activeView === item.id 
                  ? 'text-[#710087] bg-purple-50 border border-purple-100' 
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <item.icon size={20} className={`${activeView === item.id ? 'text-[#710087]' : 'text-slate-400'}`} />
              {item.label}
              {activeView === item.id && <div className="absolute right-3 w-1.5 h-1.5 bg-[#710087] rounded-full" />}
            </button>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-slate-50 bg-slate-50/50">
           <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">v4.0.0 Clean Edition</p>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
