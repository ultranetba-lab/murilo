
import React, { useState } from 'react';
import { Menu, Bell } from 'lucide-react';
import Sidebar from './components/Sidebar';
import IncluirPonto from './views/IncluirPonto';
import AdminDashboard from './views/AdminDashboard';
import CartaoPonto from './views/CartaoPonto';
import Login from './views/Login';
import DadosCadastrais from './views/DadosCadastrais';
import { ViewType, UserProfile, PunchRecord } from './types';
import Logo from './components/Logo';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [activeView, setActiveView] = useState<ViewType>('INCLUIR_PONTO');
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [punches, setPunches] = useState<PunchRecord[]>([]);
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
    setEmployees(prev => [...prev.filter(e => e.id !== id)]);
    setPunches(prev => prev.filter(p => p.userId !== id));
  };

  const handleBackup = () => {
    const data = {
      version: "1.0",
      timestamp: new Date().toISOString(),
      employees: employees,
      punches: punches
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup_ultranet_ponto_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleRestore = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string);
        if (data.employees && data.punches) {
          // Re-instancia as datas dos registros de ponto
          const restoredPunches = data.punches.map((p: any) => ({
            ...p,
            timestamp: new Date(p.timestamp)
          }));
          setEmployees(data.employees);
          setPunches(restoredPunches);
          alert('Dados restaurados com sucesso!');
        } else {
          alert('Arquivo de backup inválido.');
        }
      } catch (err) {
        console.error(err);
        alert('Erro ao processar o arquivo de backup.');
      }
    };
    reader.readAsText(file);
  };

  const getTitle = () => {
    switch (activeView) {
      case 'INCLUIR_PONTO': return 'Registrar Ponto';
      case 'CARTAO_PONTO': return 'Meu Cartão Ponto';
      case 'ADMIN_DASHBOARD': return 'GESTÃO ULTRANET';
      case 'DADOS': return 'Meus Dados';
      default: return 'Ultranet';
    }
  };

  if (!currentUser) {
    return <Login onLogin={handleLogin} employees={employees} />;
  }

  const isAdminView = activeView === 'ADMIN_DASHBOARD';

  const renderView = () => {
    switch (activeView) {
      case 'INCLUIR_PONTO':
        return <IncluirPonto onAddPunch={handleAddPunch} recentPunches={punches.filter(p => p.userId === currentUser.id)} user={currentUser} />;
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
            onBackup={handleBackup}
            onRestore={handleRestore}
          />
        );
      case 'DADOS':
        return <DadosCadastrais user={currentUser} onUpdate={handleUpdateProfile} />;
      default:
        return <div className="p-8 text-center text-slate-400 font-bold uppercase text-[10px]">Em breve...</div>;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="fixed top-0 left-0 right-0 bg-white border-b border-slate-100 z-30 h-20 flex items-center px-8 justify-between no-print shadow-sm">
        <div className="flex items-center gap-6">
          <button onClick={() => setSidebarOpen(true)} className="p-2.5 hover:bg-slate-50 rounded-xl transition-all text-slate-900 border border-transparent hover:border-slate-200">
            <Menu size={24} />
          </button>
          <div className="h-6 w-[1px] bg-slate-200 mx-2" />
          <h1 className={`text-sm font-black uppercase tracking-[2px] ${isAdminView ? 'text-[#710087]' : 'text-slate-400'}`}>
            {getTitle()}
          </h1>
        </div>
        
        <div className="flex items-center gap-6">
          <button className="relative p-2 text-slate-400 hover:text-[#710087] transition-colors">
            <Bell size={22} />
            <div className="absolute top-2 right-2 w-2 h-2 bg-orange-400 rounded-full border-2 border-white" />
          </button>
          <div className="flex items-center gap-4">
            <div className="hidden sm:block text-right">
              <p className="text-[10px] font-black text-slate-900 uppercase leading-none">{currentUser.name.split(' ')[0]}</p>
              <p className="text-[9px] font-bold text-[#710087] uppercase tracking-tighter mt-0.5">{currentUser.role}</p>
            </div>
            <div className="w-11 h-11 bg-purple-50 border border-purple-100 rounded-xl flex items-center justify-center text-[#710087] text-base font-black uppercase shadow-sm">
               {currentUser.name[0]}
            </div>
          </div>
        </div>
      </header>

      <main className={`pt-32 px-6 pb-20 mx-auto transition-all duration-500 ${isAdminView ? 'max-w-7xl' : 'max-w-xl'}`}>
        {renderView()}
      </main>

      <Sidebar user={currentUser} activeView={activeView} isOpen={isSidebarOpen} onNavigate={setActiveView} onLogout={handleLogout} onClose={() => setSidebarOpen(false)} />
    </div>
  );
};

export default App;
