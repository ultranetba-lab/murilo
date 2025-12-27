
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
  EyeOff
} from 'lucide-react';
import { PunchRecord, UserProfile, PunchStatus } from '../types';

interface AdminDashboardProps {
  punches: PunchRecord[];
  onManualPunch: (punch: PunchRecord) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ punches, onManualPunch }) => {
  const [tab, setTab] = useState<'OVERVIEW' | 'EMPLOYEES' | 'EXTRACT' | 'ADJUST'>('OVERVIEW');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployeeId, setEditingEmployeeId] = useState<string | null>(null);
  const [selectedEmployeeForDetail, setSelectedEmployeeForDetail] = useState<string | null>(null);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [employees, setEmployees] = useState<UserProfile[]>([
    { id: 'user-1', name: 'LUCAS ASSIS DOS SANTOS CRUZ', username: 'lucas', company: 'ULTRANET', role: 'TECNICO', shift: '08:00 - 18:00', userType: 'COLABORADOR', password: '123' },
    { id: 'user-2', name: 'MARIA OLIVEIRA', username: 'maria', company: 'ULTRANET', role: 'SUPORTE', shift: '08:00 - 18:00', userType: 'COLABORADOR', password: '123' },
    { id: 'user-3', name: 'JOAO SILVA', username: 'joao', company: 'ULTRANET', role: 'FINANCEIRO', shift: '08:00 - 18:00', userType: 'COLABORADOR', password: '123' },
    { id: 'user-4', name: 'RAFAEL COSTA', username: 'rafael', company: 'ULTRANET', role: 'GERENTE', shift: '08:00 - 18:00', userType: 'COLABORADOR', password: '123' },
  ]);

  const [formEmp, setFormEmp] = useState({ name: '', username: '', role: 'TECNICO', password: '' });

  const [adjustmentData, setAdjustmentData] = useState({
    employeeId: '',
    type: 'ESQUECIMENTO' as 'ESQUECIMENTO' | 'FOLGA' | 'FERIADO', 
    date: new Date().toISOString().split('T')[0],
    startTime: '08:00',
    endTime: '18:00',
    reason: ''
  });

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
      const empPunches = punches.filter(p => p.userId === emp.id).sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());
      const dailyMap: Record<string, PunchRecord[]> = {};
      empPunches.forEach(p => {
        const dateKey = p.timestamp.toLocaleDateString('pt-BR');
        if (!dailyMap[dateKey]) dailyMap[dateKey] = [];
        dailyMap[dateKey].push(p);
      });

      let totalOvertimeMinutes = 0;
      let totalDelayMinutes = 0;

      const detailedDaily = Object.entries(dailyMap).map(([date, dayPunches]) => {
        const special = dayPunches.find(p => p.type === 'FOLGA' || p.type === 'FERIADO');
        if (special) return { date, special: special.type, dailyResult: special.type, resultType: 'SPECIAL' };

        const ins = dayPunches.filter(p => p.type === 'IN');
        const outs = dayPunches.filter(p => p.type === 'OUT');
        
        const dateParts = date.split('/');
        const dayObj = new Date(parseInt(dateParts[2]), parseInt(dateParts[1]) - 1, parseInt(dateParts[0]));
        const isSaturday = dayObj.getDay() === 6;
        const isSunday = dayObj.getDay() === 0;

        let hoursWorked = 0;
        for(let i=0; i < Math.min(ins.length, outs.length); i++) {
          hoursWorked += (outs[i].timestamp.getTime() - ins[i].timestamp.getTime()) / (1000 * 60 * 60);
        }

        const expectedHours = isSunday ? 0 : (isSaturday ? 4 : 8);
        const diff = hoursWorked - expectedHours;

        let dailyResult = "OK";
        let resultType: 'EXTRA' | 'DELAY' | 'NORMAL' = 'NORMAL';

        if (diff > 0.02) {
          dailyResult = `+${Math.floor(diff)}h ${Math.round((diff % 1) * 60)}m`;
          resultType = 'EXTRA';
          totalOvertimeMinutes += diff * 60;
        } else if (diff < -0.02 && expectedHours > 0) {
          const absDiff = Math.abs(diff);
          dailyResult = `-${Math.floor(absDiff)}h ${Math.round((absDiff % 1) * 60)}m`;
          resultType = 'DELAY';
          totalDelayMinutes += absDiff * 60;
        }

        return { date, in: ins[0]?.timestamp, out: outs[outs.length-1]?.timestamp, dailyResult, resultType, punches: dayPunches };
      });

      return {
        ...emp,
        dailyExtract: detailedDaily,
        totalOvertime: `${Math.floor(totalOvertimeMinutes / 60)}h ${Math.round(totalOvertimeMinutes % 60)}m`,
        totalDelay: `${Math.floor(totalDelayMinutes / 60)}h ${Math.round(totalDelayMinutes % 60)}m`,
        absences: detailedDaily.filter(d => d.resultType === 'NORMAL' && (!d.punches || d.punches.length === 0)).length
      };
    });
  }, [employees, punches]);

  const handleSaveEmployee = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingEmployeeId) {
      setEmployees(employees.map(emp => emp.id === editingEmployeeId ? {
        ...emp,
        name: formEmp.name.toUpperCase(),
        username: formEmp.username.toLowerCase(),
        role: formEmp.role,
        password: formEmp.password || emp.password
      } : emp));
    } else {
      const id = `user-${Math.random().toString(36).substr(2, 9)}`;
      setEmployees([...employees, {
        id,
        name: formEmp.name.toUpperCase(),
        username: formEmp.username.toLowerCase(),
        company: 'ULTRANET',
        role: formEmp.role,
        shift: '08:00 - 18:00',
        userType: 'COLABORADOR',
        password: formEmp.password
      }]);
    }
    closeModal();
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
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
  };

  const handleDeleteEmployee = (id: string) => {
    if (window.confirm("Deseja realmente remover este colaborador?")) {
      setEmployees(employees.filter(e => e.id !== id));
    }
  };

  const handleConfirmAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adjustmentData.employeeId) return;
    const emp = employees.find(e => e.id === adjustmentData.employeeId);
    if (!emp) return;

    const [year, month, day] = adjustmentData.date.split('-').map(Number);
    const baseDate = new Date(year, month - 1, day, 12, 0, 0);
    
    if (adjustmentData.type === 'FOLGA' || adjustmentData.type === 'FERIADO') {
      onManualPunch({
        id: `m-${Math.random().toString(36).substr(2, 9)}`,
        userId: emp.id,
        userName: emp.name,
        timestamp: baseDate,
        location: { lat: 0, lng: 0, address: "Lançamento Manual" },
        type: adjustmentData.type,
        status: PunchStatus.ACCEPTED,
        justification: adjustmentData.reason
      });
    } else {
      const inDate = new Date(year, month - 1, day);
      const [sh, sm] = adjustmentData.startTime.split(':').map(Number);
      inDate.setHours(sh, sm, 0);
      onManualPunch({ id: `m-in-${Math.random().toString(36)}`, userId: emp.id, userName: emp.name, timestamp: inDate, location: { lat: 0, lng: 0 }, type: 'IN', status: PunchStatus.ACCEPTED, justification: adjustmentData.reason });

      const outDate = new Date(year, month - 1, day);
      const [eh, em] = adjustmentData.endTime.split(':').map(Number);
      outDate.setHours(eh, em, 0);
      onManualPunch({ id: `m-out-${Math.random().toString(36)}`, userId: emp.id, userName: emp.name, timestamp: outDate, location: { lat: 0, lng: 0 }, type: 'OUT', status: PunchStatus.ACCEPTED, justification: adjustmentData.reason });
    }
    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
    setAdjustmentData({...adjustmentData, reason: ''});
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
                <p className="text-3xl font-extrabold text-slate-900 leading-none">92%</p>
                <p className="text-[10px] text-slate-500 font-bold uppercase mt-3 tracking-widest">Produtividade</p>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-8 py-5 border-b border-slate-100 bg-slate-50/50">
                 <h3 className="text-xs font-bold text-slate-900 uppercase tracking-widest flex items-center gap-2"><UserCheck size={18} className="text-[#710087]" /> Status em Tempo Real</h3>
              </div>
              <div className="divide-y divide-slate-100">
                 {todayPresenceStatus.map(status => (
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
                              <div className="flex flex-col mt-1.5 items-end space-y-0.5">
                                 {status.inTime && <p className="text-[9px] text-slate-500 font-bold uppercase">Entrada: {status.inTime.toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})}</p>}
                                 {status.outTime && <p className="text-[9px] text-[#710087] font-bold uppercase">Saída: {status.outTime.toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'})}</p>}
                              </div>
                           </div>
                         ) : (
                           <div className="flex items-center gap-2 text-red-500 bg-red-50 px-3 py-1.5 rounded-lg border border-red-100"><AlertTriangle size={14} /><span className="text-[10px] font-bold uppercase tracking-wider">Ponto Ausente</span></div>
                         )}
                      </div>
                   </div>
                 ))}
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
                        <p className="text-sm font-bold text-slate-900 uppercase">{emp.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold tracking-tight">{emp.role} • {emp.company}</p>
                      </td>
                      <td className="px-8 py-5"><span className="text-[9px] font-bold bg-purple-50 text-[#710087] border border-purple-100 px-3 py-1 rounded-lg uppercase">@{emp.username}</span></td>
                      <td className="px-8 py-5 text-right flex justify-end gap-2">
                        <button onClick={() => openEditModal(emp)} className="p-2 text-slate-400 hover:text-[#710087] transition-colors"><Edit2 size={16} /></button>
                        <button onClick={() => handleDeleteEmployee(emp.id)} className="p-2 text-slate-400 hover:text-red-500 transition-colors"><Trash2 size={16} /></button>
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
                   <div className="mb-8 border-b border-slate-100 pb-6"><h2 className="text-xl font-extrabold text-slate-900 uppercase">Espelho de Ponto Ultranet</h2><p className="text-[10px] text-[#710087] font-bold uppercase mt-1 tracking-widest">Gestão de Frequência</p></div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {employeeStats.map(stat => (
                      <div key={stat.id} onClick={() => setSelectedEmployeeForDetail(stat.id)} className="p-6 bg-white border border-slate-200 rounded-2xl hover:border-[#710087] transition-all cursor-pointer shadow-sm active:scale-[0.98]">
                        <p className="text-sm font-bold text-slate-900 uppercase truncate mb-4">{stat.name}</p>
                        <div className="grid grid-cols-3 gap-2 border-t border-slate-100 pt-4">
                           <div className="text-center"><p className="text-xs font-bold text-green-600">+{stat.totalOvertime}</p><p className="text-[8px] text-slate-400 font-bold uppercase">EXTRAS</p></div>
                           <div className="text-center border-x border-slate-100"><p className="text-xs font-bold text-orange-600">-{stat.totalDelay}</p><p className="text-[8px] text-slate-400 font-bold uppercase">DÉBITO</p></div>
                           <div className="text-center"><p className="text-xs font-bold text-red-500">{stat.absences}</p><p className="text-[8px] text-slate-400 font-bold uppercase">FALTAS</p></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="bg-white p-10 rounded-2xl border border-slate-200 shadow-sm animate-fadeIn">
                   <div className="flex items-center justify-between mb-10 no-print">
                      <button onClick={() => setSelectedEmployeeForDetail(null)} className="text-[10px] font-bold text-[#710087] uppercase tracking-widest flex items-center gap-2"><ArrowRight size={18} className="rotate-180" /> Voltar à lista</button>
                      <button onClick={handlePrintMirror} className="flex items-center gap-3 px-6 py-3 bg-[#710087] text-white rounded-xl font-bold text-[10px] uppercase tracking-widest shadow-lg"><Printer size={18} /> Imprimir Folha</button>
                   </div>
                   {(() => {
                      const stat = employeeStats.find(s => s.id === selectedEmployeeForDetail);
                      if (!stat) return null;
                      return (
                        <div className="space-y-10">
                           <div className="flex flex-col md:flex-row justify-between items-start gap-6 border-b border-slate-100 pb-10">
                              <div><h2 className="text-2xl font-extrabold text-slate-900 tracking-tight uppercase leading-none">{stat.name}</h2><p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-3">{stat.role} • {stat.company}</p></div>
                              <div className="text-right"><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Competência</p><p className="text-sm font-bold text-slate-900 uppercase">Dezembro / 2025</p></div>
                           </div>
                           <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                              {stat.dailyExtract.map((day, idx) => (
                                <div key={idx} className={`p-5 border rounded-xl break-inside-avoid shadow-sm ${day.resultType === 'SPECIAL' ? 'bg-purple-50 border-purple-100' : 'bg-slate-50 border-slate-200'}`}>
                                   <div className="flex justify-between items-center border-b border-slate-200 pb-2 mb-4"><p className="text-[9px] font-bold text-slate-500 uppercase">{day.date}</p>{day.resultType === 'SPECIAL' && <span className="text-[8px] font-extrabold text-[#710087] uppercase">{day.special}</span>}</div>
                                   {day.resultType !== 'SPECIAL' ? (
                                     <><div className="grid grid-cols-2 gap-4 mb-4"><div className="text-center"><p className="text-base font-bold text-slate-900">{day.in ? day.in.toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'}) : '--:--'}</p><p className="text-[8px] text-slate-400 font-bold uppercase">Entrada</p></div><div className="text-center"><p className="text-base font-bold text-slate-900">{day.out ? day.out.toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'}) : '--:--'}</p><p className="text-[8px] text-slate-400 font-bold uppercase">Saída</p></div></div><div className={`text-[9px] font-bold py-1.5 rounded-lg text-center uppercase ${day.resultType === 'EXTRA' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>{day.dailyResult}</div></>
                                   ) : (<div className="py-6 flex items-center justify-center text-[#710087]">{day.special === 'FOLGA' ? <Sun size={24} /> : <Palmtree size={24} />}</div>)}
                                </div>
                              ))}
                           </div>
                           <div className="print-only mt-20 pt-10 grid grid-cols-2 gap-20"><div className="border-t border-slate-900 pt-2 text-center text-[10px] font-bold uppercase tracking-widest">Assinatura Funcionário</div><div className="border-t border-slate-900 pt-2 text-center text-[10px] font-bold uppercase tracking-widest">Assinatura Gestão</div></div>
                        </div>
                      )
                   })()}
                </div>
              )}
           </div>
        )}

        {tab === 'ADJUST' && (
          <div className="animate-fadeIn max-w-xl mx-auto space-y-6 no-print">
            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="mb-8"><h2 className="text-xl font-extrabold text-slate-900 uppercase tracking-tight">Ajuste e Lançamentos</h2><p className="text-[10px] text-[#710087] font-bold uppercase tracking-[2px] mt-1">Lançamento de abonos e folgas</p></div>
              <form onSubmit={handleConfirmAdjustment} className="space-y-6">
                <div className="space-y-2"><label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Colaborador</label><select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-[#710087] text-slate-900 font-bold text-sm" value={adjustmentData.employeeId} onChange={(e) => setAdjustmentData({...adjustmentData, employeeId: e.target.value})} required><option value="">Selecionar...</option>{employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}</select></div>
                <div className="grid grid-cols-3 gap-2">{[{ id: 'ESQUECIMENTO', label: 'Ajuste', icon: History }, { id: 'FOLGA', label: 'Folga', icon: Sun }, { id: 'FERIADO', label: 'Feriado', icon: Palmtree }].map(type => (<button key={type.id} type="button" onClick={() => setAdjustmentData({...adjustmentData, type: type.id as any})} className={`flex flex-col items-center p-3 rounded-xl border-2 transition-all gap-1.5 ${adjustmentData.type === type.id ? 'border-[#710087] bg-purple-50 text-[#710087]' : 'border-slate-100 bg-slate-50 text-slate-400'}`}><type.icon size={18} /><span className="text-[9px] font-bold uppercase tracking-wider">{type.label}</span></button>))}</div>
                <div className="space-y-2"><label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Data do Evento</label><input type="date" value={adjustmentData.date} onChange={(e) => setAdjustmentData({...adjustmentData, date: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none" required /></div>
                {adjustmentData.type === 'ESQUECIMENTO' && (<div className="grid grid-cols-2 gap-4"><div className="space-y-2"><label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Horário Início</label><input type="time" value={adjustmentData.startTime} onChange={(e) => setAdjustmentData({...adjustmentData, startTime: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none" /></div><div className="space-y-2"><label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Horário Fim</label><input type="time" value={adjustmentData.endTime} onChange={(e) => setAdjustmentData({...adjustmentData, endTime: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 outline-none" /></div></div>)}
                <div className="space-y-2"><label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Motivação</label><textarea value={adjustmentData.reason} onChange={(e) => setAdjustmentData({...adjustmentData, reason: e.target.value})} placeholder="Descreva o motivo..." className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium outline-none h-20 resize-none focus:border-[#710087]" required /></div>
                <button type="submit" className="w-full py-5 bg-[#0f172a] hover:bg-[#710087] text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-xl transition-all"><Save size={18} className="inline mr-2" /> Salvar Lançamento</button>
              </form>
              {showSuccessToast && (<div className="absolute top-4 left-1/2 -translate-x-1/2 bg-green-600 text-white px-6 py-2 rounded-full flex items-center gap-2 shadow-lg animate-bounce z-50"><Check size={16} /><span className="text-[9px] font-bold uppercase tracking-widest">Salvo!</span></div>)}
            </div>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-2xl overflow-hidden shadow-2xl border border-slate-100">
            <form onSubmit={handleSaveEmployee}>
              <div className="p-8 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                <h3 className="font-extrabold text-lg text-slate-900 uppercase tracking-tight">{editingEmployeeId ? 'Editar Colaborador' : 'Novo Colaborador'}</h3>
                <button type="button" onClick={closeModal} className="p-2 text-slate-400 hover:text-slate-900 transition-all"><X size={24} /></button>
              </div>
              <div className="p-8 space-y-4">
                 <div className="space-y-1.5"><label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Nome Completo</label><input type="text" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none focus:border-[#710087] transition-all" value={formEmp.name} onChange={e => setFormEmp({...formEmp, name: e.target.value})} required /></div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5"><label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Usuário</label><input type="text" className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none focus:border-[#710087] transition-all" value={formEmp.username} onChange={e => setFormEmp({...formEmp, username: e.target.value})} required /></div>
                    <div className="space-y-1.5"><label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Cargo</label><select className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none focus:border-[#710087] transition-all" value={formEmp.role} onChange={e => setFormEmp({...formEmp, role: e.target.value})}><option value="TECNICO">TECNICO</option><option value="SUPORTE">SUPORTE</option><option value="FINANCEIRO">FINANCEIRO</option><option value="GERENTE">GERENTE</option></select></div>
                 </div>
                 <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1">Senha de Acesso</label>
                    <div className="relative">
                       <input type={showPassword ? "text" : "password"} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none focus:border-[#710087] transition-all" value={formEmp.password} onChange={e => setFormEmp({...formEmp, password: e.target.value})} required={!editingEmployeeId} placeholder={editingEmployeeId ? "Deixe vazio para manter" : "••••••••"} />
                       <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400">{showPassword ? <EyeOff size={18} /> : <Eye size={18} />}</button>
                    </div>
                 </div>
                 <button type="submit" className="w-full py-4 bg-[#710087] hover:bg-[#5a006d] text-white rounded-xl font-bold uppercase text-xs tracking-widest shadow-lg mt-4 transition-all active:scale-95"><Save size={18} className="inline mr-2" /> {editingEmployeeId ? 'Salvar Alterações' : 'Criar Acesso'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
