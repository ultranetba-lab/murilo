import React, { useState, useMemo } from 'react';
import { 
  Users, 
  AlertTriangle, 
  Plus, 
  Search, 
  Edit2, 
  CheckCircle, 
  XCircle, 
  Save, 
  Trash2, 
  X, 
  Camera, 
  ArrowRight, 
  TrendingUp, 
  ChevronRight, 
  Printer, 
  User as UserIcon, 
  LayoutDashboard,
  Calendar,
  Palmtree,
  Sun,
  History,
  UserCheck,
  Filter,
  Navigation,
  Clock,
  Check,
  UserX,
  UserCheck2,
  Lock,
  Eye,
  EyeOff,
  ChevronDown
} from 'lucide-react';
import { PunchRecord, UserProfile, PunchStatus } from '../types';

interface AdminDashboardProps {
  punches: PunchRecord[];
  employees: UserProfile[];
  onManualPunch: (punch: PunchRecord) => void;
  onAddEmployee: (emp: UserProfile) => void;
  onUpdateEmployee: (emp: UserProfile) => void;
  onDeleteEmployee: (id: string) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  punches, 
  employees, 
  onManualPunch,
  onAddEmployee,
  onUpdateEmployee,
  onDeleteEmployee
}) => {
  const [tab, setTab] = useState<'OVERVIEW' | 'EMPLOYEES' | 'EXTRACT' | 'ADJUST'>('OVERVIEW');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployeeId, setEditingEmployeeId] = useState<string | null>(null);
  const [selectedEmployeeForDetail, setSelectedEmployeeForDetail] = useState<string | null>(null);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('Salvo com sucesso!');
  const [showPassword, setShowPassword] = useState(false);

  const [formEmp, setFormEmp] = useState({ name: '', username: '', role: 'TECNICO', password: '' });

  const [adjustmentData, setAdjustmentData] = useState({
    employeeId: '',
    type: 'ESQUECIMENTO' as 'ESQUECIMENTO' | 'FOLGA' | 'FERIADO', 
    date: new Date().toISOString().split('T')[0],
    startTime: '08:00',
    endTime: '12:00',
    startTime2: '13:00',
    endTime2: '17:00',
    reason: ''
  });

  const months = useMemo(() => {
    const list = [];
    const year = 2026;
    const monthNames = [
      "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
      "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"
    ];
    for (let m = 0; m < 12; m++) {
      list.push({
        value: `${year}-${String(m + 1).padStart(2, '0')}`,
        label: `${monthNames[m]} / ${year}`
      });
    }
    return list;
  }, []);

  const [selectedCompetency, setSelectedCompetency] = useState('2026-01');

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
  };

  const handlePrintMirror = () => {
    window.print();
  };

  const todayPresenceStatus = useMemo(() => {
    const todayStr = new Date().toLocaleDateString('pt-BR');
    return employees.map(emp => {
      const todayPunches = punches.filter(p => 
        p.userId === emp.id && 
        p.timestamp.toLocaleDateString('pt-BR') === todayStr
      ).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

      const inPunch = todayPunches.find(p => p.type === 'IN');
      const outPunch = [...todayPunches].reverse().find(p => p.type === 'OUT');
      const specialStatus = todayPunches.find(p => p.type === 'FOLGA' || p.type === 'FERIADO');

      return {
        ...emp,
        hasPunched: todayPunches.length > 0,
        inTime: inPunch?.timestamp,
        outTime: outPunch?.timestamp,
        special: specialStatus?.type
      };
    });
  }, [employees, punches]);

  const employeeStats = useMemo(() => {
    return employees.map(emp => {
      const empPunches = punches.filter(p => {
        const pDate = p.timestamp;
        const pMonth = `${pDate.getFullYear()}-${String(pDate.getMonth() + 1).padStart(2, '0')}`;
        return p.userId === emp.id && pMonth === selectedCompetency;
      }).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

      const dailyMap: Record<string, PunchRecord[]> = {};
      
      // Criar mapa para todos os dias do mês selecionado
      const [year, month] = selectedCompetency.split('-').map(Number);
      const daysInMonth = new Date(year, month, 0).getDate();
      
      for (let i = 1; i <= daysInMonth; i++) {
        const dateKey = `${String(i).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
        dailyMap[dateKey] = [];
      }

      empPunches.forEach(p => {
        const dateKey = p.timestamp.toLocaleDateString('pt-BR');
        if (dailyMap[dateKey]) dailyMap[dateKey].push(p);
      });

      let totalOvertimeMinutes = 0;
      let totalDelayMinutes = 0;

      const detailedDaily = Object.entries(dailyMap).sort().map(([date, dayPunches]) => {
        const special = dayPunches.find(p => p.type === 'FOLGA' || p.type === 'FERIADO');
        
        const ins = dayPunches.filter(p => p.type === 'IN').sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
        const outs = dayPunches.filter(p => p.type === 'OUT').sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
        
        const dateParts = date.split('/');
        const dayObj = new Date(parseInt(dateParts[2]), parseInt(dateParts[1]) - 1, parseInt(dateParts[0]));
        const isSaturday = dayObj.getDay() === 6;
        const isSunday = dayObj.getDay() === 0;

        let hoursWorked = 0;
        for(let i=0; i < Math.min(ins.length, outs.length); i++) {
          hoursWorked += (outs[i].timestamp.getTime() - ins[i].timestamp.getTime()) / (1000 * 60 * 60);
        }

        const expectedHours = isSunday ? 0 : (isSaturday ? 4 : 8);
        const diff = dayPunches.length > 0 ? (hoursWorked - expectedHours) : 0;

        let dailyResult = "--";
        // Fix: Added 'SPECIAL' to the allowed union types to fix "Type 'SPECIAL' is not assignable" error.
        let resultType: 'EXTRA' | 'DELAY' | 'NORMAL' | 'SPECIAL' = 'NORMAL';

        if (special) {
            dailyResult = special.type;
            resultType = 'SPECIAL';
        } else if (diff > 0.02) {
          dailyResult = `+${Math.floor(diff)}h ${Math.round((diff % 1) * 60)}m`;
          resultType = 'EXTRA';
          totalOvertimeMinutes += diff * 60;
        } else if (diff < -0.02 && expectedHours > 0) {
          const absDiff = Math.abs(diff);
          dailyResult = `-${Math.floor(absDiff)}h ${Math.round((absDiff % 1) * 60)}m`;
          resultType = 'DELAY';
          totalDelayMinutes += absDiff * 60;
        } else if (dayPunches.length > 0) {
            dailyResult = "OK";
        }

        return { 
          date, 
          dayOfWeek: dayObj.toLocaleDateString('pt-BR', { weekday: 'short' }).toUpperCase(),
          punch1: ins[0]?.timestamp,
          punch2: outs[0]?.timestamp,
          punch3: ins[1]?.timestamp,
          punch4: outs[1]?.timestamp,
          dailyResult, 
          resultType,
          isWeekend: isSunday || isSaturday
        };
      });

      return {
        ...emp,
        dailyExtract: detailedDaily,
        totalOvertime: `${Math.floor(totalOvertimeMinutes / 60)}h ${Math.round(totalOvertimeMinutes % 60)}m`,
        totalDelay: `${Math.floor(totalDelayMinutes / 60)}h ${Math.round(totalDelayMinutes % 60)}m`,
        absences: detailedDaily.filter(d => d.resultType === 'NORMAL' && (!d.punch1 && !d.isWeekend)).length
      };
    });
  }, [employees, punches, selectedCompetency]);

  const handleSaveEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingEmployeeId) {
      const existing = employees.find(emp => emp.id === editingEmployeeId);
      if (existing) {
        onUpdateEmployee({
          ...existing,
          name: formEmp.name.toUpperCase(),
          username: formEmp.username.toLowerCase(),
          role: formEmp.role,
          password: formEmp.password || existing.password
        });
        triggerToast('Alterações salvas!');
      }
    } else {
      const id = `user-${Math.random().toString(36).substr(2, 9)}`;
      onAddEmployee({
        id,
        name: formEmp.name.toUpperCase(),
        username: formEmp.username.toLowerCase(),
        company: 'ULTRANET',
        role: formEmp.role,
        shift: '08:00 - 18:00',
        userType: 'COLABORADOR',
        password: formEmp.password
      });
      triggerToast('Novo acesso criado!');
    }
    closeModal();
  };

  const openEditModal = (emp: UserProfile) => {
    setEditingEmployeeId(emp.id);
    setFormEmp({
      name: emp.name,
      username: emp.username,
      role: emp.role,
      password: emp.password || ''
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingEmployeeId(null);
    setFormEmp({ name: '', username: '', role: 'TECNICO', password: '' });
    setShowPassword(false);
  };

  const handleConfirmDelete = (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    const emp = employees.find(e => e.id === id);
    if (!emp) return;
    if (window.confirm(`ATENÇÃO: Deseja realmente excluir ${emp.name}?`)) {
      onDeleteEmployee(id);
      triggerToast('Colaborador removido!');
    }
  };

  const handleConfirmAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustmentData.employeeId) return;
    const emp = employees.find(e => e.id === adjustmentData.employeeId);
    if (!emp) return;

    const [year, month, day] = adjustmentData.date.split('-').map(Number);
    
    if (adjustmentData.type === 'FOLGA' || adjustmentData.type === 'FERIADO') {
      onManualPunch({
        id: `m-${Math.random().toString(36)}`,
        userId: emp.id,
        userName: emp.name,
        timestamp: new Date(year, month - 1, day, 12, 0),
        location: { lat: 0, lng: 0, address: "Manual" },
        type: adjustmentData.type,
        status: PunchStatus.ACCEPTED
      });
    } else {
      // Lançar 4 batidas automáticas para o ajuste se for "Esquecimento"
      const times = [adjustmentData.startTime, adjustmentData.endTime, adjustmentData.startTime2, adjustmentData.endTime2];
      times.forEach((time, idx) => {
        const [h, m] = time.split(':').map(Number);
        onManualPunch({
          id: `m-${idx}-${Math.random().toString(36)}`,
          userId: emp.id,
          userName: emp.name,
          timestamp: new Date(year, month - 1, day, h, m),
          location: { lat: 0, lng: 0 },
          type: idx % 2 === 0 ? 'IN' : 'OUT',
          status: PunchStatus.ACCEPTED,
          justification: adjustmentData.reason
        });
      });
    }
    triggerToast('Lançamento realizado!');
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm sticky top-20 z-20 no-print max-w-xl mx-auto flex gap-2">
          {[
            { id: 'OVERVIEW', label: 'Início', icon: LayoutDashboard }, 
            { id: 'EMPLOYEES', label: 'Equipe', icon: Users }, 
            { id: 'EXTRACT', label: 'Folha', icon: TrendingUp }, 
            { id: 'ADJUST', label: 'Ajuste', icon: AlertTriangle }
          ].map(item => (
            <button key={item.id} onClick={() => setTab(item.id as any)} className={`flex-1 flex flex-col items-center justify-center gap-1 p-2.5 rounded-xl transition-all ${tab === item.id ? 'bg-[#710087] text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'}`}>
              <item.icon size={18} />
              <span className="text-[8px] font-bold uppercase tracking-tighter">{item.label}</span>
            </button>
          ))}
      </div>

      <div className="transition-all duration-300">
        {tab === 'OVERVIEW' && (
          <div className="space-y-8 animate-fadeIn no-print">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="w-10 h-10 bg-purple-50 text-[#710087] rounded-xl flex items-center justify-center mb-4 border border-purple-100"><Users size={20} /></div>
                <p className="text-3xl font-extrabold text-slate-900 leading-none">{employees.length}</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase mt-3 tracking-widest">Equipe Ultranet</p>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="w-10 h-10 bg-green-50 text-green-600 rounded-xl flex items-center justify-center mb-4 border border-green-100"><UserCheck2 size={20} /></div>
                <p className="text-3xl font-extrabold text-slate-900 leading-none">{todayPresenceStatus.filter(s => s.hasPunched).length}</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase mt-3 tracking-widest">Ativos Hoje</p>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="w-10 h-10 bg-red-50 text-red-600 rounded-xl flex items-center justify-center mb-4 border border-red-100"><UserX size={20} /></div>
                <p className="text-3xl font-extrabold text-slate-900 leading-none">{todayPresenceStatus.filter(s => !s.hasPunched).length}</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase mt-3 tracking-widest">Ausentes Hoje</p>
              </div>
              <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                <div className="w-10 h-10 bg-orange-50 text-orange-600 rounded-xl flex items-center justify-center mb-4 border border-orange-100"><TrendingUp size={20} /></div>
                <p className="text-3xl font-extrabold text-slate-900 leading-none">0%</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase mt-3 tracking-widest">Produtividade</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-8 py-5 border-b border-slate-100 bg-slate-50/50">
                 <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2"><UserCheck size={18} className="text-[#710087]" /> Status em Tempo Real</h3>
              </div>
              <div className="divide-y divide-slate-100">
                 {employees.length > 0 ? todayPresenceStatus.map(status => (
                   <div key={status.id} className="px-8 py-5 flex items-center justify-between hover:bg-slate-50 transition-all">
                      <div className="flex items-center gap-4">
                         <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold border ${status.hasPunched ? 'bg-green-50 border-green-100 text-green-700' : 'bg-slate-50 border-slate-200 text-slate-400'}`}>{status.name[0]}</div>
                         <div>
                            <p className="text-sm font-bold text-slate-900 uppercase leading-tight">{status.name}</p>
                            <p className="text-[10px] text-slate-500 font-medium uppercase mt-1 tracking-tight">{status.role}</p>
                         </div>
                      </div>
                      <div className="flex items-center gap-6">
                         {status.special ? (
                            <div className="px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-wider bg-blue-50 border-blue-100 text-blue-600">{status.special}</div>
                         ) : status.hasPunched ? (
                           <div className="text-right">
                              <div className="flex items-center gap-2 text-green-600 bg-green-50 px-3 py-1.5 rounded-lg border border-green-100 justify-end">
                                 <CheckCircle size={14} /><span className="text-[10px] font-bold uppercase tracking-wider">Registrado</span>
                              </div>
                           </div>
                         ) : (
                           <div className="flex items-center gap-2 text-red-500 bg-red-50 px-3 py-1.5 rounded-lg border border-red-100"><AlertTriangle size={14} /><span className="text-[10px] font-bold uppercase tracking-wider">Ponto Ausente</span></div>
                         )}
                      </div>
                   </div>
                 )) : (
                    <div className="p-12 text-center text-slate-400 text-[10px] font-bold uppercase tracking-widest">Aguardando cadastro de equipe...</div>
                 )}
              </div>
            </div>
          </div>
        )}
        
        {tab === 'EMPLOYEES' && (
          <div className="space-y-6 animate-fadeIn no-print">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
              <div className="relative group w-full md:max-w-md">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input type="text" className="w-full pl-11 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-bold outline-none focus:border-[#710087] transition-all text-sm" placeholder="Pesquisar..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
              <button onClick={() => setIsModalOpen(true)} className="w-full md:w-auto px-6 py-3.5 bg-[#710087] text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 hover:bg-[#5a006d] transition-all"><Plus size={18} /> Novo Acesso</button>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-8 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Colaborador</th>
                    <th className="px-8 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest">Acesso</th>
                    <th className="px-8 py-4 text-[10px] font-bold text-slate-500 uppercase tracking-widest text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {employees.filter(e => e.name.toLowerCase().includes(searchTerm.toLowerCase())).map(emp => (
                    <tr key={emp.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-8 py-5">
                        <p className="text-sm font-bold text-slate-900 uppercase leading-none">{emp.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold tracking-tight mt-1">{emp.role} • {emp.company}</p>
                      </td>
                      <td className="px-8 py-5"><span className="text-[9px] font-bold bg-purple-50 text-[#710087] border border-purple-100 px-3 py-1 rounded-lg uppercase">@{emp.username}</span></td>
                      <td className="px-8 py-5 text-right">
                        <div className="flex justify-end items-center gap-2">
                          <button onClick={() => openEditModal(emp)} className="p-2.5 text-slate-400 hover:text-[#710087] hover:bg-purple-50 rounded-xl"><Edit2 size={18} /></button>
                          <button onClick={(e) => handleConfirmDelete(e, emp.id)} className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl"><Trash2 size={18} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'EXTRACT' && (
           <div className="space-y-6">
              {!selectedEmployeeForDetail ? (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 no-print">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 border-b border-slate-100 pb-6">
                    <div>
                      <h2 className="text-xl font-extrabold text-slate-900 uppercase">Gestão de Folha Mensal</h2>
                      <p className="text-[10px] text-[#710087] font-bold uppercase mt-1 tracking-widest">Relatórios 2026</p>
                    </div>
                    <div className="relative group">
                      <select value={selectedCompetency} onChange={(e) => setSelectedCompetency(e.target.value)} className="pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold text-slate-700 uppercase outline-none focus:border-[#710087] appearance-none cursor-pointer">
                        {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                      </select>
                      <Calendar size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {employeeStats.map(stat => (
                      <div key={stat.id} onClick={() => setSelectedEmployeeForDetail(stat.id)} className="p-6 bg-white border border-slate-200 rounded-2xl hover:border-[#710087] transition-all cursor-pointer shadow-sm active:scale-[0.98]">
                        <p className="text-sm font-bold text-slate-900 uppercase truncate mb-4">{stat.name}</p>
                        <div className="grid grid-cols-3 gap-2 border-t border-slate-100 pt-4 text-center">
                           <div><p className="text-xs font-bold text-green-600">+{stat.totalOvertime}</p><p className="text-[8px] text-slate-400 font-bold uppercase">EXTRAS</p></div>
                           <div className="border-x border-slate-100"><p className="text-xs font-bold text-orange-600">-{stat.totalDelay}</p><p className="text-[8px] text-slate-400 font-bold uppercase">DÉBITO</p></div>
                           <div><p className="text-xs font-bold text-red-500">{stat.absences}</p><p className="text-[8px] text-slate-400 font-bold uppercase">FALTAS</p></div>
                        </div>
                      </div>
                    ))}
                    {employees.length === 0 && <div className="col-span-full py-20 text-center text-slate-400 uppercase font-bold text-[10px] border-2 border-dashed border-slate-100 rounded-3xl">Nenhum funcionário cadastrado.</div>}
                  </div>
                </div>
              ) : (
                <div className="bg-white p-6 md:p-12 rounded-2xl border border-slate-200 shadow-sm animate-fadeIn">
                   {/* Header do Relatório (Oculto em tela se quiser, mas aqui visível) */}
                   <div className="flex items-center justify-between mb-8 no-print">
                      <button onClick={() => setSelectedEmployeeForDetail(null)} className="text-[10px] font-bold text-[#710087] uppercase tracking-widest flex items-center gap-2"><ArrowRight size={18} className="rotate-180" /> Voltar</button>
                      <button onClick={handlePrintMirror} className="flex items-center gap-3 px-6 py-3 bg-[#710087] text-white rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-lg"><Printer size={18} /> Imprimir Folha de Ponto</button>
                   </div>
                   
                   {(() => {
                      const stat = employeeStats.find(s => s.id === selectedEmployeeForDetail);
                      if (!stat) return null;
                      return (
                        <div className="space-y-8">
                           {/* Cabeçalho Formal para Impressão */}
                           <div className="border-b-2 border-black pb-6 flex flex-col md:flex-row justify-between items-start gap-4">
                              <div className="space-y-1">
                                 <h1 className="text-2xl font-black text-black uppercase tracking-tighter">ULTRANET PROVEDOR</h1>
                                 <p className="text-[10px] font-bold text-black uppercase">CNPJ: 00.000.000/0001-00 | Endereço: Matriz Ultranet</p>
                                 <p className="text-lg font-bold text-[#710087] uppercase mt-2">Folha de Ponto Individual de Trabalho</p>
                              </div>
                              <div className="text-right border-l-0 md:border-l border-black pl-0 md:pl-6 space-y-1">
                                 <p className="text-[10px] font-bold text-black uppercase">Competência: <span className="text-sm">{months.find(m => m.value === selectedCompetency)?.label}</span></p>
                                 <p className="text-[10px] font-bold text-black uppercase">Página: 01/01</p>
                              </div>
                           </div>

                           <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-black border border-black p-4 bg-gray-50/50">
                              <div><p className="text-[9px] font-bold uppercase">Nome do Colaborador</p><p className="text-sm font-bold uppercase">{stat.name}</p></div>
                              <div><p className="text-[9px] font-bold uppercase">Cargo / Função</p><p className="text-sm font-bold uppercase">{stat.role}</p></div>
                              <div><p className="text-[9px] font-bold uppercase">Horário de Trabalho</p><p className="text-sm font-bold uppercase">08:00 às 12:00 | 13:00 às 17:00</p></div>
                              <div><p className="text-[9px] font-bold uppercase">Unidade</p><p className="text-sm font-bold uppercase">{stat.company}</p></div>
                           </div>

                           {/* Tabela de Ponto */}
                           <div className="overflow-x-auto">
                              <table className="w-full border-collapse border border-black">
                                 <thead>
                                    <tr className="bg-black text-white">
                                       <th rowSpan={2} className="border border-black p-2 text-[9px] uppercase">Data</th>
                                       <th rowSpan={2} className="border border-black p-2 text-[9px] uppercase">Dia</th>
                                       <th colSpan={2} className="border border-black p-2 text-[9px] uppercase">Turno 1</th>
                                       <th colSpan={2} className="border border-black p-2 text-[9px] uppercase">Turno 2</th>
                                       <th rowSpan={2} className="border border-black p-2 text-[9px] uppercase">Saldo</th>
                                       <th rowSpan={2} className="border border-black p-2 text-[9px] uppercase">Assinatura</th>
                                    </tr>
                                    <tr className="bg-gray-100 text-black">
                                       <th className="border border-black p-1 text-[8px] uppercase">Entrada</th>
                                       <th className="border border-black p-1 text-[8px] uppercase">Saída</th>
                                       <th className="border border-black p-1 text-[8px] uppercase">Entrada</th>
                                       <th className="border border-black p-1 text-[8px] uppercase">Saída</th>
                                    </tr>
                                 </thead>
                                 <tbody>
                                    {stat.dailyExtract.map((day, idx) => (
                                       <tr key={idx} className={`${day.isWeekend ? 'bg-gray-50' : ''} text-center hover:bg-slate-50 transition-colors`}>
                                          <td className="border border-black p-1 text-[10px] font-bold">{day.date.split('/')[0]}</td>
                                          <td className="border border-black p-1 text-[9px]">{day.dayOfWeek}</td>
                                          <td className="border border-black p-1 text-[10px] font-medium">{day.punch1 ? day.punch1.toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'}) : '--:--'}</td>
                                          <td className="border border-black p-1 text-[10px] font-medium">{day.punch2 ? day.punch2.toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'}) : '--:--'}</td>
                                          <td className="border border-black p-1 text-[10px] font-medium">{day.punch3 ? day.punch3.toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'}) : '--:--'}</td>
                                          <td className="border border-black p-1 text-[10px] font-medium">{day.punch4 ? day.punch4.toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'}) : '--:--'}</td>
                                          <td className="border border-black p-1 text-[9px] font-bold uppercase">{day.dailyResult}</td>
                                          <td className="border border-black p-1 w-24"></td>
                                       </tr>
                                    ))}
                                 </tbody>
                                 <tfoot>
                                    <tr className="bg-black text-white font-bold">
                                       <td colSpan={6} className="p-2 text-right text-[10px] uppercase">Total Mensal</td>
                                       <td className="p-2 text-[10px] uppercase">+{stat.totalOvertime} / -{stat.totalDelay}</td>
                                       <td></td>
                                    </tr>
                                 </tfoot>
                              </table>
                           </div>

                           {/* Rodapé de Assinatura */}
                           <div className="pt-20 grid grid-cols-1 md:grid-cols-2 gap-16">
                              <div className="text-center space-y-2">
                                 <div className="border-t border-black pt-2"></div>
                                 <p className="text-[10px] font-bold uppercase text-black">{stat.name}</p>
                                 <p className="text-[8px] uppercase text-gray-500">Assinatura do Colaborador</p>
                              </div>
                              <div className="text-center space-y-2">
                                 <div className="border-t border-black pt-2"></div>
                                 <p className="text-[10px] font-bold uppercase text-black">ULTRANET PROVEDOR</p>
                                 <p className="text-[8px] uppercase text-gray-500">Assinatura da Empresa (Gestão de RH)</p>
                              </div>
                           </div>
                           <p className="text-center text-[8px] text-gray-400 uppercase tracking-widest mt-12">Documento gerado eletronicamente via Ultranet Ponto 4.0 - IP: 192.168.0.1</p>
                        </div>
                      )
                   })()}
                </div>
              )}
           </div>
        )}

        {tab === 'ADJUST' && (
          <div className="animate-fadeIn max-w-xl mx-auto space-y-6 no-print">
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
              <div className="mb-8"><h2 className="text-xl font-extrabold text-slate-900 uppercase">Ajuste e Lançamentos</h2><p className="text-[10px] text-[#710087] font-bold uppercase tracking-widest mt-1">Correção de Batidas</p></div>
              <form onSubmit={handleConfirmAdjustment} className="space-y-6">
                <div className="space-y-2"><label className="text-[10px] font-bold text-slate-500 uppercase">Colaborador</label><select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold" value={adjustmentData.employeeId} onChange={(e) => setAdjustmentData({...adjustmentData, employeeId: e.target.value})} required><option value="">Selecionar...</option>{employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}</select></div>
                <div className="grid grid-cols-3 gap-2">{[{ id: 'ESQUECIMENTO', label: 'Ajuste', icon: History }, { id: 'FOLGA', label: 'Folga', icon: Sun }, { id: 'FERIADO', label: 'Feriado', icon: Palmtree }].map(type => (<button key={type.id} type="button" onClick={() => setAdjustmentData({...adjustmentData, type: type.id as any})} className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all gap-1.5 ${adjustmentData.type === type.id ? 'border-[#710087] bg-purple-50 text-[#710087]' : 'border-slate-100 bg-slate-50 text-slate-400'}`}><type.icon size={18} /><span className="text-[9px] font-bold uppercase">{type.label}</span></button>))}</div>
                <div className="space-y-2"><label className="text-[10px] font-bold text-slate-500 uppercase">Data do Evento</label><input type="date" value={adjustmentData.date} onChange={(e) => setAdjustmentData({...adjustmentData, date: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold" required /></div>
                
                {adjustmentData.type === 'ESQUECIMENTO' && (
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1"><label className="text-[8px] font-bold uppercase text-slate-400">Entrada 1</label><input type="time" value={adjustmentData.startTime} onChange={(e) => setAdjustmentData({...adjustmentData, startTime: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg font-bold" /></div>
                            <div className="space-y-1"><label className="text-[8px] font-bold uppercase text-slate-400">Saída 1</label><input type="time" value={adjustmentData.endTime} onChange={(e) => setAdjustmentData({...adjustmentData, endTime: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg font-bold" /></div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1"><label className="text-[8px] font-bold uppercase text-slate-400">Entrada 2</label><input type="time" value={adjustmentData.startTime2} onChange={(e) => setAdjustmentData({...adjustmentData, startTime2: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg font-bold" /></div>
                            <div className="space-y-1"><label className="text-[8px] font-bold uppercase text-slate-400">Saída 2</label><input type="time" value={adjustmentData.endTime2} onChange={(e) => setAdjustmentData({...adjustmentData, endTime2: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg font-bold" /></div>
                        </div>
                    </div>
                )}
                
                <div className="space-y-2"><label className="text-[10px] font-bold text-slate-500 uppercase">Motivação</label><textarea value={adjustmentData.reason} onChange={(e) => setAdjustmentData({...adjustmentData, reason: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm" placeholder="Obrigatório..." required /></div>
                <button type="submit" className="w-full py-5 bg-[#0f172a] hover:bg-[#710087] text-white rounded-xl font-bold uppercase shadow-xl transition-all">Salvar Ajuste Mensal</button>
              </form>
            </div>
          </div>
        )}
      </div>

      {showSuccessToast && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[100] bg-slate-900 text-white px-8 py-3 rounded-2xl flex items-center gap-3 shadow-2xl animate-fadeIn">
           <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center"><Check size={14} /></div>
           <span className="text-[10px] font-bold uppercase tracking-widest">{toastMessage}</span>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-2xl border border-slate-100">
            <form onSubmit={handleSaveEmployee}>
              <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="font-extrabold text-lg text-slate-900 uppercase">{editingEmployeeId ? 'Editar Colaborador' : 'Novo Colaborador'}</h3>
                <button type="button" onClick={closeModal} className="p-2 text-slate-400 hover:text-slate-900"><X size={24} /></button>
              </div>
              <div className="p-8 space-y-4">
                 <div className="space-y-1.5"><label className="text-[10px] font-bold text-slate-500 uppercase">Nome Completo</label><input type="text" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold" value={formEmp.name} onChange={e => setFormEmp({...formEmp, name: e.target.value})} required /></div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5"><label className="text-[10px] font-bold text-slate-500 uppercase">Usuário</label><input type="text" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold" value={formEmp.username} onChange={e => setFormEmp({...formEmp, username: e.target.value})} required /></div>
                    <div className="space-y-1.5"><label className="text-[10px] font-bold text-slate-500 uppercase">Cargo</label><select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold" value={formEmp.role} onChange={e => setFormEmp({...formEmp, role: e.target.value})}><option value="TECNICO">TECNICO</option><option value="SUPORTE">SUPORTE</option><option value="FINANCEIRO">FINANCEIRO</option><option value="GERENTE">GERENTE</option></select></div>
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Senha de Acesso</label>
                    <div className="relative">
                       <input type={showPassword ? "text" : "password"} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold" value={formEmp.password} onChange={e => setFormEmp({...formEmp, password: e.target.value})} required={!editingEmployeeId} placeholder={editingEmployeeId ? "Deixe vazio para manter" : "••••••••"} />
                       <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                    </div>
                 </div>
                 <button type="submit" className="w-full py-4 bg-[#710087] text-white rounded-xl font-bold uppercase shadow-lg mt-4 active:scale-95 transition-all">Salvar Dados</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;