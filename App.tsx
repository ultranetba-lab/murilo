
import React, { useState, useEffect } from 'react';
import { Menu, Bell } from 'lucide-react';
import Sidebar from './components/Sidebar';
import IncluirPonto from './views/IncluirPonto';
import AdminDashboard from './views/AdminDashboard';
import CartaoPonto from './views/CartaoPonto';
import Login from './views/Login';
import DadosCadastrais from './views/DadosCadastrais';
import { ViewType, UserProfile, PunchRecord, PunchStatus } from './types';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [activeView, setActiveView] = useState<ViewType>('INCLUIR_PONTO');
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [punches, setPunches] = useState<PunchRecord[]>([]);
  
  // Lista de funcionários iniciada vazia
  const [employees, setEmployees] = useState<UserProfile[]>([]);

  const handleLogin = (user: UserProfile) => {
    setCurrentUser(user);
    setActiveView(user.userType === 'ADMIN' ? 'ADMIN_DASHBOARD' : 'INCLUIR_PONTO');
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setSidebarOpen(false);
  };

  const handleUpdateProfile = (updatedUser: UserProfile) => {
    setCurrentUser(updatedUser);
    setEmployees(prev => prev.map(e => e.id === updatedUser.id ? updatedUser : e));
  };

  const handleAddPunch = (punch: PunchRecord) => {
    setPunches(prev => [punch, ...prev]);
  };

  const handleAddEmployee = (emp: UserProfile) => {
    setEmployees(prev => [...prev, emp]);
  };

  const handleUpdateEmployee = (emp: UserProfile) => {
    setEmployees(prev => prev.map(e => e.id === emp.id ? emp : e));
  };

  const handleDeleteEmployee = (id: string) => {
    // Exclusão com spread operator para garantir nova referência de array e re-render
    setEmployees(prev => {
      const filtered = prev.filter(e => e.id !== id);
      return [...filtered];
    });
    
    // Remove registros de ponto do funcionário excluído
    setPunches(prev => prev.filter(p => p.userId !== id));
  };

  const getTitle = () => {
    switch (activeView) {
      case 'INCLUIR_PONTO': return 'Registrar Ponto';
      case 'CARTAO_PONTO': return 'Meu Cartão Ponto';
      case 'ADMIN_DASHBOARD': return 'Gestão Ultranet';
      case 'DADOS': return 'Meus Dados';
      default: return 'Ultranet';
    }
  };

  if (!currentUser) {
    return <Login onLogin={handleLogin} employees={employees} />;
  }

  const renderView = () => {
    switch (activeView) {
      case 'INCLUIR_PONTO':
        return (
          <IncluirPonto 
            onAddPunch={handleAddPunch} 
            recentPunches={punches.filter(p => p.userId === currentUser.id)} 
            user={currentUser} 
          />
        );
      case 'CARTAO_PONTO':
        return <CartaoPonto punches={punches.filter(p => p.userId === currentUser.id)} user={currentUser} />;
      case 'ADMIN_DASHBOARD':
        return (
          <AdminDashboard 
            punches={punches} 
            employees={employees}
            onManualPunch={handleAddPunch}
            onAddEmployee={handleAddEmployee}
            onUpdateEmployee={handleUpdateEmployee}
            onDeleteEmployee={handleDeleteEmployee}
          />
        );
      case 'DADOS':
        return <DadosCadastrais user={currentUser} onUpdate={handleUpdateProfile} />;
      default:
        return (
          <div className="flex flex-col items-center justify-center h-64 text-slate-600 bg-white rounded-2xl shadow-sm border border-slate-200 p-8 text-center">
            <p className="font-bold text-slate-900 mb-2">Módulo em Desenvolvimento</p>
            <p className="text-sm">Esta funcionalidade estará disponível em breve.</p>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] no-print">
      <header className="fixed top-0 left-0 right-0 bg-white border-b border-slate-200 z-30 h-16 flex items-center px-6 justify-between no-print shadow-sm">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setSidebarOpen(true)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-all text-slate-700"
          >
            <Menu size={24} />
          </button>
          <div className="h-5 w-[1px] bg-slate-300" />
          <h1 className="text-sm font-bold text-[#710087] uppercase tracking-wider">{getTitle()}</h1>
        </div>
        
        <div className="flex items-center gap-3">
          <button className="p-2 hover:bg-slate-100 rounded-lg transition-all text-slate-600 relative">
            <Bell size={20} />
            <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-[#fbb03b] rounded-full border-2 border-white"></span>
          </button>
          <div className="w-9 h-9 bg-purple-100 border border-purple-200 rounded-lg flex items-center justify-center text-[#710087] text-sm font-bold uppercase">
             {currentUser.name[0]}
          </div>
        </div>
      </header>

      <main className={`pt-24 px-4 pb-12 mx-auto transition-all duration-300 ${activeView === 'ADMIN_DASHBOARD' ? 'max-w-7xl' : 'max-w-xl'}`}>
        {renderView()}
      </main>

      <Sidebar 
        user={currentUser} 
        activeView={activeView} 
        isOpen={isSidebarOpen} 
        onNavigate={setActiveView} 
        onLogout={handleLogout}
        onClose={() => setSidebarOpen(false)} 
      />
    </div>
  );
};

export default App;
