
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { 
  Users, UserCheck, UserX, TrendingUp, Search, Trash2, 
  Printer, LayoutDashboard, FileText, Settings, 
  Activity, ChevronRight, Plus, X, User, Briefcase, AtSign, Lock, Clock, Save,
  CalendarDays, Coffee, Palmtree, Edit3, Fingerprint, AlertCircle, Eye, CheckCircle2, AlertTriangle,
  Download, Upload, Database
} from 'lucide-react';
import { PunchRecord, UserProfile, PunchStatus } from '../types';

interface AdminDashboardProps {
  punches: PunchRecord[];
  employees: UserProfile[];
  onManualPunch: (punch: PunchRecord) => void;
  onAddEmployee: (emp: UserProfile) => void;
  onUpdateEmployee: (emp: UserProfile) => void;
  onDeleteEmployee: (id: string) => void;
  onBackup?: () => void;
  onRestore?: (file: File) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  punches, employees, onAddEmployee, onUpdateEmployee, onDeleteEmployee, onManualPunch, onBackup, onRestore
}) => {
  const [activeTab, setActiveTab] = useState<'INICIO' | 'EQUIPE' | 'FOLHA' | 'AJUSTE'>('INICIO');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showPrintPreview, setShowPrintPreview] = useState(false);
  const [editingEmployeeId, setEditingEmployeeId] = useState<string | null>(null);
  const [employeeToDelete, setEmployeeToDelete] = useState<UserProfile | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Report states
  const [reportType, setReportType] = useState<'DIARIO' | 'MENSAL'>('MENSAL');
  const [reportMonth, setReportMonth] = useState(new Date().toISOString().slice(0, 7));
  const [reportDay, setReportDay] = useState(new Date().toISOString().split('T')[0]);
  const [reportFilterEmployeeId, setReportFilterEmployeeId] = useState<string>('all');

  // Employee Form State
  const [formData, setFormData] = useState({
    name: '',
    role: '',
    cpf: '',
    username: '',
    password: '',
    shift: '08:00 - 12:00 / 13:00 - 17:00'
  });

  // Adjustment Form State
  const [adjustmentData, setAdjustmentData] = useState({
    userId: '',
    type: 'IN' as 'IN' | 'OUT' | 'FOLGA' | 'FERIADO',
    date: new Date().toISOString().split('T')[0],
    time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    justification: ''
  });

  // Effect to populate form when editing
  useEffect(() => {
    if (editingEmployeeId) {
      const emp = employees.find(e => e.id === editingEmployeeId);
      if (emp) {
        setFormData({
          name: emp.name,
          role: emp.role,
          cpf: emp.cpf || '',
          username: emp.username,
          password: emp.password || '',
          shift: emp.shift
        });
        setIsModalOpen(true);
      }
    }
  }, [editingEmployeeId, employees]);

  const stats = useMemo(() => {
    const today = new Date().toDateString();
    const todayPunches = punches.filter(p => new Date(p.timestamp).toDateString() === today);
    const uniqueUsersToday = new Set(todayPunches.map(p => p.userId)).size;
    
    return {
      total: employees.length,
      active: uniqueUsersToday,
      absent: employees.length - uniqueUsersToday,
      productivity: employees.length > 0 ? Math.round((uniqueUsersToday / employees.length) * 100) : 0
    };
  }, [punches, employees]);

  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => 
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.cpf?.includes(searchTerm)
    );
  }, [employees, searchTerm]);

  // Cálculo de Relatório Mensal com Filtro e Detalhe de Faltas
  const monthlyReportData = useMemo(() => {
    if (reportType !== 'MENSAL') return [];
    
    const [year, month] = reportMonth.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    const workHoursPerDay = 8;

    const targetEmployees = reportFilterEmployeeId === 'all' 
      ? employees 
      : employees.filter(e => e.id === reportFilterEmployeeId);

    return targetEmployees.map(emp => {
      let totalMinutesWorked = 0;
      let absenceDays: string[] = [];
      let overtimeMinutes = 0;
      let daysPresent = 0;

      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month - 1, day);
        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
        const dateStr = date.toLocaleDateString('pt-BR');
        
        const dayPunches = punches.filter(p => 
          p.userId === emp.id && 
          new Date(p.timestamp).toLocaleDateString('pt-BR') === dateStr
        );

        const hasSpecialStatus = dayPunches.some(p => p.type === 'FOLGA' || p.type === 'FERIADO');
        
        if (dayPunches.length > 0 && !hasSpecialStatus) {
          daysPresent++;
          const sorted = [...dayPunches].sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
          let dayMinutes = 0;
          
          for (let i = 0; i < sorted.length - 1; i += 2) {
            if (sorted[i].type === 'IN' && sorted[i+1]?.type === 'OUT') {
              const diff = (new Date(sorted[i+1].timestamp).getTime() - new Date(sorted[i].timestamp).getTime()) / 60000;
              dayMinutes += diff;
            }
          }
          
          totalMinutesWorked += dayMinutes;
          const expectedMinutes = workHoursPerDay * 60;
          if (dayMinutes > expectedMinutes) {
            overtimeMinutes += (dayMinutes - expectedMinutes);
          }
        } else if (!isWeekend && !hasSpecialStatus && date <= new Date()) {
          absenceDays.push(String(day).padStart(2, '0'));
        }
      }

      return {
        id: emp.id,
        name: emp.name,
        role: emp.role,
        daysPresent,
        absences: absenceDays.length,
        absenceDays,
        overtime: Math.round(overtimeMinutes / 60) + 'h ' + Math.round(overtimeMinutes % 60) + 'm',
        totalHours: Math.round(totalMinutesWorked / 60) + 'h'
      };
    });
  }, [employees, punches, reportMonth, reportType, reportFilterEmployeeId]);

  // Cálculo de Relatório Diário com Filtro
  const dailyReportData = useMemo(() => {
    if (reportType !== 'DIARIO') return [];
    const dateStr = new Date(reportDay + 'T12:00:00').toLocaleDateString('pt-BR');
    
    const targetEmployees = reportFilterEmployeeId === 'all' 
      ? employees 
      : employees.filter(e => e.id === reportFilterEmployeeId);

    return targetEmployees.map(emp => {
      const dayPunches = punches.filter(p => 
        p.userId === emp.id && 
        new Date(p.timestamp).toLocaleDateString('pt-BR') === dateStr
      );
      
      const hasSpecialStatus = dayPunches.find(p => p.type === 'FOLGA' || p.type === 'FERIADO');
      
      return {
        id: emp.id,
        name: emp.name,
        punches: dayPunches.filter(p => p.type === 'IN' || p.type === 'OUT').sort((a,b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()),
        status: hasSpecialStatus ? hasSpecialStatus.type : (dayPunches.length > 0 ? 'PRESENTE' : 'AUSENTE')
      };
    });
  }, [employees, punches, reportDay, reportType, reportFilterEmployeeId]);

  const handleAddOrUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const empData: UserProfile = {
      id: editingEmployeeId || Math.random().toString(36).substr(2, 9),
      name: formData.name,
      role: formData.role,
      cpf: formData.cpf,
      username: formData.username,
      password: formData.password,
      shift: formData.shift,
      company: 'Ultranet Provedor',
      userType: 'COLABORADOR'
    };

    if (editingEmployeeId) {
      onUpdateEmployee(empData);
    } else {
      onAddEmployee(empData);
    }

    handleCloseModal();
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingEmployeeId(null);
    setFormData({ name: '', role: '', cpf: '', username: '', password: '', shift: '08:00 - 12:00 / 13:00 - 17:00' });
  };

  const handleManualPunchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedEmp = employees.find(emp => emp.id === adjustmentData.userId);
    if (!selectedEmp) return;

    const [year, month, day] = adjustmentData.date.split('-').map(Number);
    const [hours, minutes] = adjustmentData.time.split(':').map(Number);
    const timestamp = new Date(year, month - 1, day, hours, minutes);

    const manualPunch: PunchRecord = {
      id: Math.random().toString(36).substr(2, 9),
      userId: selectedEmp.id,
      userName: selectedEmp.name,
      timestamp,
      location: { lat: 0, lng: 0, address: "Lançamento Manual (Adm)" },
      justification: adjustmentData.justification || `Ajuste Administrativo: ${adjustmentData.type}`,
      status: PunchStatus.ACCEPTED,
      type: adjustmentData.type
    };

    onManualPunch(manualPunch);
    setAdjustmentData({
      userId: '',
      type: 'IN',
      date: new Date().toISOString().split('T')[0],
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      justification: ''
    });
    alert('Registro manual efetuado com sucesso!');
  };

  const handlePrint = () => {
    setShowPrintPreview(false);
    setTimeout(() => {
      window.print();
    }, 100);
  };

  const confirmDelete = () => {
    if (employeeToDelete) {
      onDeleteEmployee(employeeToDelete.id);
      setEmployeeToDelete(null);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onRestore) {
      if (confirm('A restauração irá sobrescrever todos os dados atuais por este backup. Deseja continuar?')) {
        onRestore(file);
      }
    }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="space-y-8 animate-fadeIn max-w-6xl mx-auto pb-20">
      
      {/* Navegação por Abas */}
      <div className="flex justify-center no-print">
        <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-100 flex gap-1">
          {[
            { id: 'INICIO', label: 'INÍCIO', icon: LayoutDashboard },
            { id: 'EQUIPE', label: 'EQUIPE', icon: Users },
            { id: 'FOLHA', label: 'FOLHA', icon: FileText },
            { id: 'AJUSTE', label: 'AJUSTE', icon: Settings },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex flex-col items-center justify-center w-24 h-20 rounded-xl transition-all gap-2 ${
                activeTab === tab.id 
                ? 'bg-[#710087] text-white shadow-lg shadow-purple-100' 
                : 'text-slate-400 hover:bg-slate-50'
              }`}
            >
              <tab.icon size={22} />
              <span className="text-[9px] font-black tracking-widest">{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {activeTab === 'INICIO' && (
        <div className="space-y-8 animate-fadeIn no-print">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center text-[#710087] mb-4">
                <Users size={20} />
              </div>
              <p className="text-4xl font-black text-slate-900 tracking-tighter">{stats.total}</p>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Equipe</p>
            </div>
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <div className="w-10 h-10 bg-green-50 rounded-xl flex items-center justify-center text-green-600 mb-4">
                <UserCheck size={20} />
              </div>
              <p className="text-4xl font-black text-slate-900 tracking-tighter">{stats.active}</p>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Ativos Hoje</p>
            </div>
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-red-500 mb-4">
                <UserX size={20} />
              </div>
              <p className="text-4xl font-black text-slate-900 tracking-tighter">{stats.absent}</p>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Ausentes</p>
            </div>
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
              <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center text-orange-500 mb-4">
                <TrendingUp size={20} />
              </div>
              <p className="text-4xl font-black text-slate-900 tracking-tighter">{stats.productivity}%</p>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Presença</p>
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-slate-50 flex items-center gap-3">
              <Activity size={18} className="text-[#710087]" />
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-[2px]">Status em Tempo Real</h3>
            </div>
            <div className="p-8">
              {punches.length > 0 ? (
                <div className="space-y-4">
                  {punches.slice(0, 5).map(p => (
                    <div key={p.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center font-bold text-[#710087] shadow-sm uppercase">
                          {p.userName[0]}
                        </div>
                        <div>
                          <p className="text-xs font-black uppercase text-slate-800">{p.userName}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase">{p.type === 'IN' ? 'Entrada' : p.type === 'OUT' ? 'Saída' : p.type} registrada</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black text-slate-900">{new Date(p.timestamp).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-20 text-center text-[10px] font-black text-slate-300 uppercase tracking-[4px]">Sem atividades recentes</div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'EQUIPE' && (
        <div className="space-y-6 no-print">
          <div className="flex flex-wrap items-center justify-between gap-4 px-2">
            <div>
              <h2 className="text-lg font-black text-slate-900 uppercase tracking-[1px]">Gestão de Pessoas</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[2px]">Administre os colaboradores da Ultranet</p>
            </div>
            <button 
              onClick={() => { setEditingEmployeeId(null); setIsModalOpen(true); }}
              className="px-6 py-4 bg-[#710087] text-white rounded-2xl font-black text-[10px] uppercase tracking-[2px] shadow-xl shadow-purple-100 hover:bg-[#5a006d] transition-all flex items-center gap-2 active:scale-95"
            >
              <Plus size={18} /> Novo Colaborador
            </button>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden animate-fadeIn">
            <div className="p-8 border-b border-slate-50 flex flex-wrap gap-4 justify-between items-center bg-slate-50/30">
              <div className="relative flex-1 max-md:max-w-none max-w-md">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" />
                <input 
                  type="text" 
                  placeholder="BUSCAR PELO NOME, CARGO OU CPF..." 
                  value={searchTerm} 
                  onChange={e => setSearchTerm(e.target.value)}
                  className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest outline-none focus:border-[#710087] shadow-sm transition-all"
                />
              </div>
            </div>
            <div className="divide-y divide-slate-50">
              {filteredEmployees.length > 0 ? filteredEmployees.map(emp => (
                <div key={emp.id} className="p-8 flex items-center justify-between hover:bg-slate-50/50 transition-colors group">
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 bg-purple-50 text-[#710087] rounded-[1.25rem] flex items-center justify-center font-black text-xl border border-purple-100 shadow-sm group-hover:scale-105 transition-transform uppercase">
                      {emp.name[0]}
                    </div>
                    <div>
                      <p className="font-black text-slate-900 text-sm uppercase tracking-tight">{emp.name}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-[9px] bg-slate-100 text-slate-500 font-black px-2 py-0.5 rounded uppercase tracking-widest">{emp.role}</span>
                        <div className="w-1 h-1 bg-slate-200 rounded-full" />
                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">CPF: {emp.cpf || 'Não inf.'}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setEditingEmployeeId(emp.id)}
                      className="p-3 text-slate-300 hover:text-[#710087] hover:bg-purple-50 rounded-xl transition-all"
                      title="Editar Colaborador"
                    >
                      <Edit3 size={18} />
                    </button>
                    <button 
                      onClick={() => setEmployeeToDelete(emp)} 
                      className="p-3 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                      title="Excluir Colaborador"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              )) : (
                <div className="p-24 text-center">
                  <p className="text-[10px] font-black text-slate-300 uppercase tracking-[4px]">Nenhum colaborador encontrado</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'AJUSTE' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-fadeIn no-print">
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden h-fit">
              <div className="p-10 border-b border-slate-50 bg-slate-50/30">
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Lançamento Manual</h3>
                <p className="text-[10px] font-bold text-[#710087] uppercase tracking-[2px] mt-2">Corrija ou registre ausências</p>
              </div>
              
              <form onSubmit={handleManualPunchSubmit} className="p-10 space-y-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Colaborador</label>
                  <div className="relative group">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#710087]" size={18} />
                    <select 
                      required
                      value={adjustmentData.userId}
                      onChange={e => setAdjustmentData({...adjustmentData, userId: e.target.value})}
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-black uppercase tracking-widest outline-none focus:border-[#710087] transition-all appearance-none"
                    >
                      <option value="">SELECIONE UM FUNCIONÁRIO</option>
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.name.toUpperCase()}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo</label>
                    <div className="grid grid-cols-2 gap-2">
                      {[
                        { id: 'IN', label: 'ENTRADA', icon: Clock },
                        { id: 'OUT', label: 'SAÍDA', icon: Clock },
                        { id: 'FOLGA', label: 'FOLGA', icon: Coffee },
                        { id: 'FERIADO', label: 'FERIADO', icon: Palmtree },
                      ].map(type => (
                        <button
                          key={type.id}
                          type="button"
                          onClick={() => setAdjustmentData({...adjustmentData, type: type.id as any})}
                          className={`flex items-center justify-center gap-2 p-3.5 rounded-xl border text-[9px] font-black uppercase transition-all ${
                            adjustmentData.type === type.id 
                            ? 'bg-[#710087] text-white border-[#710087] shadow-md shadow-purple-50' 
                            : 'bg-white text-slate-400 border-slate-100 hover:bg-slate-50'
                          }`}
                        >
                          <type.icon size={14} />
                          {type.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Data</label>
                      <input 
                        type="date" required
                        value={adjustmentData.date}
                        onChange={e => setAdjustmentData({...adjustmentData, date: e.target.value})}
                        className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-black outline-none focus:border-[#710087] transition-all"
                      />
                    </div>
                    {(adjustmentData.type === 'IN' || adjustmentData.type === 'OUT') && (
                      <div className="space-y-1.5 animate-fadeIn">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Horário</label>
                        <input 
                          type="time" required
                          value={adjustmentData.time}
                          onChange={e => setAdjustmentData({...adjustmentData, time: e.target.value})}
                          className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-black outline-none focus:border-[#710087] transition-all"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Justificativa</label>
                  <textarea 
                    placeholder="MOTIVO DO AJUSTE..."
                    value={adjustmentData.justification}
                    onChange={e => setAdjustmentData({...adjustmentData, justification: e.target.value})}
                    className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-medium resize-none h-24 outline-none focus:border-[#710087] transition-all"
                  />
                </div>

                <div className="pt-4">
                  <button type="submit" className="w-full py-5 bg-[#710087] text-white rounded-2xl font-black text-xs uppercase tracking-[3px] shadow-xl shadow-purple-100 hover:bg-[#5a006d] transition-all flex items-center justify-center gap-3 active:scale-[0.98]">
                    <Save size={20} /> Salvar Lançamento
                  </button>
                </div>
              </form>
            </div>

            {/* Gerenciamento de Dados (Backup e Restauração) */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
               <div className="p-10 border-b border-slate-50 bg-slate-50/30 flex items-center gap-3">
                  <Database size={20} className="text-[#710087]" />
                  <div>
                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight leading-none">Gerenciamento de Dados</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[2px] mt-2">Segurança e Backup do Sistema</p>
                  </div>
               </div>
               <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
                    <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Backup do Sistema</h4>
                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed">Exporte todos os dados de funcionários e registros de ponto para um arquivo de segurança.</p>
                    <button 
                      onClick={onBackup}
                      className="w-full py-4 bg-white border border-slate-200 text-[#710087] rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-sm hover:bg-purple-50 hover:border-purple-200 transition-all flex items-center justify-center gap-2 active:scale-95"
                    >
                      <Download size={18} /> Exportar Backup (JSON)
                    </button>
                  </div>
                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
                    <h4 className="text-[10px] font-black text-slate-800 uppercase tracking-widest">Restaurar Dados</h4>
                    <p className="text-[11px] text-slate-500 font-medium leading-relaxed">Importe dados de um arquivo de backup anterior para restaurar o sistema em um novo ambiente.</p>
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      onChange={handleFileChange} 
                      accept=".json" 
                      className="hidden" 
                    />
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg hover:bg-black transition-all flex items-center justify-center gap-2 active:scale-95"
                    >
                      <Upload size={18} /> Restaurar do Arquivo
                    </button>
                  </div>
               </div>
            </div>
          </div>

          <div className="bg-white rounded-[2rem] border border-slate-100 shadow-sm overflow-hidden h-fit">
             <div className="p-8 border-b border-slate-50">
                <h3 className="text-xs font-black text-slate-900 uppercase tracking-[2px]">Ajustes Recentes</h3>
             </div>
             <div className="divide-y divide-slate-50 max-h-[500px] overflow-y-auto">
               {punches.filter(p => p.location.address?.includes('Manual')).length > 0 ? (
                  punches.filter(p => p.location.address?.includes('Manual')).map(p => (
                    <div key={p.id} className="p-6">
                      <p className="text-[10px] font-black uppercase text-slate-800">{p.userName}</p>
                      <div className="flex justify-between items-center mt-2">
                        <span className="text-[9px] font-bold text-slate-400">{new Date(p.timestamp).toLocaleDateString('pt-BR')}</span>
                        <span className="text-[9px] font-black text-[#710087] bg-purple-50 px-2 py-0.5 rounded">{p.type}</span>
                      </div>
                    </div>
                  ))
               ) : (
                  <div className="p-12 text-center text-[10px] font-black text-slate-300 uppercase">Sem ajustes</div>
               )}
             </div>
          </div>
        </div>
      )}

      {activeTab === 'FOLHA' && (
        <div className="space-y-8 animate-fadeIn">
          {/* Filtros de Relatório - Não imprimíveis */}
          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-wrap gap-6 items-end no-print">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo de Relatório</label>
              <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-200">
                <button 
                  onClick={() => setReportType('MENSAL')}
                  className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${reportType === 'MENSAL' ? 'bg-[#710087] text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Mensal
                </button>
                <button 
                  onClick={() => setReportType('DIARIO')}
                  className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${reportType === 'DIARIO' ? 'bg-[#710087] text-white shadow-md' : 'text-slate-400 hover:text-slate-600'}`}
                >
                  Diário
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Filtrar Funcionário</label>
              <select 
                value={reportFilterEmployeeId}
                onChange={e => setReportFilterEmployeeId(e.target.value)}
                className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[10px] font-black uppercase outline-none focus:border-[#710087] appearance-none pr-10"
              >
                <option value="all">TODOS OS FUNCIONÁRIOS</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name.toUpperCase()}</option>
                ))}
              </select>
            </div>

            {reportType === 'MENSAL' ? (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Competência</label>
                <input 
                  type="month" 
                  value={reportMonth}
                  onChange={(e) => setReportMonth(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[10px] font-black uppercase outline-none focus:border-[#710087]"
                />
              </div>
            ) : (
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Data Específica</label>
                <input 
                  type="date" 
                  value={reportDay}
                  onChange={(e) => setReportDay(e.target.value)}
                  className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-[10px] font-black uppercase outline-none focus:border-[#710087]"
                />
              </div>
            )}

            <button 
              onClick={() => setShowPrintPreview(true)} 
              className="ml-auto flex items-center gap-2 px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[2px] hover:bg-black transition-all shadow-xl shadow-slate-100 active:scale-95"
            >
              <Eye size={18} /> Visualizar e Imprimir
            </button>
          </div>

          {/* Área do Relatório - Mensal (Versão Web) */}
          {reportType === 'MENSAL' && (
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden no-print">
              <div className="p-10 border-b border-slate-50 flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Consolidado Mensal</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[2px] mt-2">Filtro: {reportFilterEmployeeId === 'all' ? 'Todos' : employees.find(e => e.id === reportFilterEmployeeId)?.name}</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Colaborador</th>
                      <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Faltas (Dias)</th>
                      <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Horas Extras</th>
                      <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Horas Totais</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {monthlyReportData.map(row => (
                      <tr key={row.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="p-6">
                          <p className="text-xs font-black text-slate-900 uppercase">{row.name}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase">{row.role}</p>
                        </td>
                        <td className="p-6 text-center">
                          <div className="flex flex-col items-center gap-1">
                            <span className={`px-3 py-1 rounded-lg text-[11px] font-black ${row.absences > 0 ? 'bg-red-50 text-red-600' : 'text-slate-300'}`}>
                              {row.absences}
                            </span>
                            {row.absenceDays.length > 0 && (
                              <div className="flex flex-wrap justify-center gap-1 mt-1 max-w-[120px]">
                                {row.absenceDays.map(day => (
                                  <span key={day} className="text-[8px] font-black bg-slate-100 text-slate-500 px-1 py-0.5 rounded border border-slate-200" title={`Falta no dia ${day}`}>
                                    {day}
                                  </span>
                                ))}
                              </div>
                            )}
                          </div>
                        </td>
                        <td className="p-6 text-center">
                          <span className={`px-3 py-1 rounded-lg text-[10px] font-black ${row.overtime !== '0h 0m' ? 'bg-green-50 text-green-600' : 'text-slate-300'}`}>
                            {row.overtime}
                          </span>
                        </td>
                        <td className="p-6 text-center font-black text-slate-800 text-sm">{row.totalHours}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Área do Relatório - Diário (Versão Web) */}
          {reportType === 'DIARIO' && (
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden p-10 no-print">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {dailyReportData.map(row => (
                  <div key={row.id} className="p-6 rounded-3xl border border-slate-100 flex items-center justify-between">
                     <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-2xl bg-purple-50 flex items-center justify-center font-black text-sm text-[#710087] uppercase">
                           {row.name[0]}
                        </div>
                        <div>
                           <p className="text-xs font-black text-slate-900 uppercase leading-none">{row.name}</p>
                           <p className="text-[8px] font-black uppercase text-slate-400 mt-1">{row.status}</p>
                        </div>
                     </div>
                     <div className="flex gap-2">
                        {row.punches.map(p => (
                           <span key={p.id} className="text-[10px] font-black text-slate-700 bg-slate-50 px-2 py-1 rounded-lg">{new Date(p.timestamp).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})}</span>
                        ))}
                     </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL DE VISUALIZAÇÃO PRÉVIA (PRINT PREVIEW) */}
      {showPrintPreview && (
        <div className="fixed inset-0 z-[200] bg-slate-900/80 backdrop-blur-lg flex items-center justify-center p-4 overflow-y-auto no-print">
          <div className="max-w-4xl w-full bg-white rounded-3xl shadow-2xl overflow-hidden animate-scaleUp">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3 text-slate-900">
                <Printer size={20} className="text-[#710087]" />
                <h3 className="font-black text-sm uppercase tracking-widest">Pré-visualização do Relatório</h3>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => setShowPrintPreview(false)}
                  className="px-5 py-2.5 bg-slate-200 text-slate-600 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-300 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handlePrint}
                  className="px-8 py-2.5 bg-[#710087] text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-purple-200 hover:bg-[#5a006d] transition-all flex items-center gap-2"
                >
                  <CheckCircle2 size={16} /> Confirmar e Imprimir
                </button>
              </div>
            </div>

            {/* Simulação da Folha A4 */}
            <div className="p-12 bg-slate-100 overflow-y-auto max-h-[70vh]">
              <div className="bg-white w-full shadow-2xl mx-auto p-10 border border-slate-300 print:shadow-none print:border-none" id="print-area">
                
                {/* Cabeçalho do Relatório */}
                <div className="border-b-2 border-black pb-8 mb-8 flex justify-between items-end">
                  <div>
                    <h1 className="text-3xl font-black uppercase tracking-tighter text-black">Ultranet Provedor</h1>
                    <p className="text-[10px] font-bold text-black uppercase tracking-[3px] mt-1">Gestão de Recursos Humanos</p>
                  </div>
                  <div className="text-right">
                    <h2 className="text-xl font-black uppercase text-black">Relatório {reportType === 'MENSAL' ? 'Consolidado Mensal' : 'Atividades Diárias'}</h2>
                    <p className="text-xs font-bold uppercase text-black mt-1">
                      Referência: <span className="font-black">{reportType === 'MENSAL' ? reportMonth : new Date(reportDay + 'T12:00:00').toLocaleDateString('pt-BR')}</span>
                    </p>
                    {reportFilterEmployeeId !== 'all' && (
                      <p className="text-[9px] font-black uppercase text-black mt-1">Colaborador: {employees.find(e => e.id === reportFilterEmployeeId)?.name}</p>
                    )}
                  </div>
                </div>

                {/* Conteúdo do Relatório Mensal */}
                {reportType === 'MENSAL' && (
                  <table className="w-full border-collapse border border-black text-black">
                    <thead className="bg-slate-100">
                      <tr>
                        <th className="border border-black p-3 text-[10px] font-black uppercase text-left">Colaborador</th>
                        <th className="border border-black p-3 text-[10px] font-black uppercase text-center">Faltas (Dias)</th>
                        <th className="border border-black p-3 text-[10px] font-black uppercase text-center">Horas Extras</th>
                        <th className="border border-black p-3 text-[10px] font-black uppercase text-center">Total de Horas</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthlyReportData.map(row => (
                        <tr key={row.id}>
                          <td className="border border-black p-3">
                            <p className="text-[11px] font-black uppercase">{row.name}</p>
                            <p className="text-[9px] font-bold uppercase text-slate-600">{row.role}</p>
                          </td>
                          <td className="border border-black p-3 text-center">
                            <p className="text-[12px] font-black">{row.absences}</p>
                            {row.absenceDays.length > 0 && (
                              <p className="text-[8px] font-bold mt-1 text-slate-500">Dias: {row.absenceDays.join(', ')}</p>
                            )}
                          </td>
                          <td className="border border-black p-3 text-center text-[10px] font-black">{row.overtime}</td>
                          <td className="border border-black p-3 text-center text-[10px] font-black">{row.totalHours}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}

                {/* Conteúdo do Relatório Diário */}
                {reportType === 'DIARIO' && (
                  <div className="space-y-4">
                    {dailyReportData.map(row => (
                      <div key={row.id} className="border border-black p-4 flex justify-between items-center">
                        <div>
                          <p className="text-xs font-black uppercase text-black">{row.name}</p>
                          <p className="text-[9px] font-bold uppercase text-slate-500">{row.status}</p>
                        </div>
                        <div className="flex gap-2">
                          {row.punches.map(p => (
                            <span key={p.id} className="text-[10px] font-black border border-black px-2 py-1">
                              {new Date(p.timestamp).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})}
                            </span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Rodapé de Assinaturas */}
                <div className="mt-24 grid grid-cols-2 gap-20">
                  <div className="text-center border-t border-black pt-3">
                    <p className="text-[10px] font-black uppercase text-black">Assinatura Responsável RH</p>
                    <p className="text-[8px] font-bold text-slate-400 mt-1 uppercase">Ultranet Tecnologia</p>
                  </div>
                  <div className="text-center border-t border-black pt-3">
                    <p className="text-[10px] font-black uppercase text-black">Assinatura Diretoria</p>
                    <p className="text-[8px] font-bold text-slate-400 mt-1 uppercase">Emissora do Relatório</p>
                  </div>
                </div>

                <div className="mt-12 text-center">
                  <p className="text-[8px] font-black text-slate-300 uppercase tracking-[4px]">Relatório Gerado Eletronicamente via Sistema de Ponto Ultranet • {new Date().toLocaleDateString('pt-BR')} {new Date().toLocaleTimeString('pt-BR')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cabeçalho de Impressão Definitivo (Visível apenas na saída da impressora) */}
      <div className="hidden print:block" id="real-print-content">
        <div className="p-10">
          {/* Cabeçalho */}
          <div className="border-b-2 border-black pb-8 mb-8 flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-black uppercase tracking-tighter text-black">Ultranet Provedor</h1>
              <p className="text-[10px] font-bold text-black uppercase tracking-[3px] mt-1">Gestão de Recursos Humanos</p>
            </div>
            <div className="text-right">
              <h2 className="text-xl font-black uppercase text-black">Relatório {reportType === 'MENSAL' ? 'Consolidado Mensal' : 'Atividades Diárias'}</h2>
              <p className="text-xs font-bold uppercase text-black mt-1">
                Ref: {reportType === 'MENSAL' ? reportMonth : reportDay}
              </p>
            </div>
          </div>

          {/* Dados Mensais */}
          {reportType === 'MENSAL' && (
            <table className="w-full border-collapse border border-black text-black">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border border-black p-2 text-[10px] font-black uppercase">Colaborador</th>
                  <th className="border border-black p-2 text-[10px] font-black uppercase">Faltas</th>
                  <th className="border border-black p-2 text-[10px] font-black uppercase">Extras</th>
                  <th className="border border-black p-2 text-[10px] font-black uppercase">Total</th>
                </tr>
              </thead>
              <tbody>
                {monthlyReportData.map(row => (
                  <tr key={row.id}>
                    <td className="border border-black p-2 text-[11px] font-black uppercase">{row.name}</td>
                    <td className="border border-black p-2 text-center text-[10px]">
                      {row.absences} {row.absenceDays.length > 0 && `(${row.absenceDays.join(', ')})`}
                    </td>
                    <td className="border border-black p-2 text-center text-[10px]">{row.overtime}</td>
                    <td className="border border-black p-2 text-center text-[10px] font-black">{row.totalHours}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {/* Dados Diários */}
          {reportType === 'DIARIO' && (
            <div className="space-y-4">
              {dailyReportData.map(row => (
                <div key={row.id} className="border border-black p-4 flex justify-between items-center">
                  <p className="text-xs font-black uppercase">{row.name}</p>
                  <div className="flex gap-2">
                    {row.punches.map(p => (
                      <span key={p.id} className="text-[10px] border border-black px-2 py-1 font-black">
                        {new Date(p.timestamp).toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Assinaturas no Rodapé */}
          <div className="mt-40 grid grid-cols-2 gap-20">
            <div className="text-center border-t border-black pt-2">
              <p className="text-[10px] font-black uppercase">Responsável RH</p>
            </div>
            <div className="text-center border-t border-black pt-2">
              <p className="text-[10px] font-black uppercase">Diretoria</p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal de Cadastro / Edição - No Print */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 no-print">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-fadeIn" onClick={handleCloseModal} />
          <div className="bg-white w-full max-w-lg rounded-[3rem] shadow-2xl relative z-10 overflow-hidden animate-scaleUp border border-white/20">
            <div className="p-10 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight leading-none">
                  {editingEmployeeId ? 'Editar Colaborador' : 'Novo Colaborador'}
                </h3>
                <p className="text-[10px] font-bold text-[#710087] uppercase tracking-[2px] mt-2">Dados da Ultranet</p>
              </div>
              <button onClick={handleCloseModal} className="p-3 hover:bg-white rounded-2xl text-slate-400 transition-all">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAddOrUpdateSubmit} className="p-10 space-y-4">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
                <input 
                  type="text" required placeholder="EX: JOÃO DA SILVA"
                  value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-black uppercase tracking-widest outline-none focus:border-[#710087] transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">CPF</label>
                  <div className="relative group">
                    <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#710087]" size={18} />
                    <input 
                      type="text" required placeholder="000.000.000-00"
                      value={formData.cpf} onChange={e => setFormData({...formData, cpf: e.target.value})}
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-black outline-none focus:border-[#710087] transition-all"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Cargo</label>
                  <div className="relative group">
                    <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-[#710087]" size={18} />
                    <input 
                      type="text" required placeholder="EX: TÉCNICO"
                      value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})}
                      className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-black uppercase tracking-widest outline-none focus:border-[#710087] transition-all"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Carga Horária</label>
                <input 
                  type="text" required
                  value={formData.shift} onChange={e => setFormData({...formData, shift: e.target.value})}
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-[10px] font-black uppercase outline-none focus:border-[#710087] transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Usuário</label>
                  <input 
                    type="text" required placeholder="EX: JOAO.SILVA"
                    value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})}
                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-black uppercase outline-none focus:border-[#710087] transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Senha</label>
                  <input 
                    type="password" required placeholder="••••••••"
                    value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})}
                    className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-xs font-black outline-none focus:border-[#710087] transition-all"
                  />
                </div>
              </div>

              <div className="pt-6">
                <button type="submit" className="w-full py-5 bg-[#710087] text-white rounded-2xl font-black text-xs uppercase tracking-[3px] shadow-xl shadow-purple-100 hover:bg-[#5a006d] transition-all flex items-center justify-center gap-3">
                  <Save size={20} /> {editingEmployeeId ? 'Salvar Alterações' : 'Finalizar Cadastro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL DE CONFIRMAÇÃO DE EXCLUSÃO */}
      {employeeToDelete && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 no-print">
          <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-md animate-fadeIn" onClick={() => setEmployeeToDelete(null)} />
          <div className="bg-white w-full max-sm rounded-[2.5rem] shadow-2xl relative z-10 overflow-hidden animate-scaleUp border border-red-50">
            <div className="p-10 text-center">
              <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertTriangle size={40} />
              </div>
              <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Atenção!</h3>
              <p className="text-[11px] text-slate-500 font-bold uppercase tracking-widest mt-4 leading-relaxed">
                Você está prestes a remover <span className="text-red-600 font-black">{employeeToDelete.name}</span> permanentemente. 
                Esta ação também excluirá todo o histórico de pontos deste colaborador.
              </p>
              
              <div className="grid grid-cols-2 gap-4 mt-10">
                <button 
                  onClick={() => setEmployeeToDelete(null)}
                  className="py-4 bg-slate-100 text-slate-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={confirmDelete}
                  className="py-4 bg-red-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-red-200 hover:bg-red-700 transition-all active:scale-95"
                >
                  Confirmar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
