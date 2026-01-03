
import React, { useMemo, useState } from 'react';
import { Calendar, Clock, MapPin, CheckCircle2, AlertCircle, Printer, ChevronDown } from 'lucide-react';
import { PunchRecord, UserProfile } from '../types';

interface CartaoPontoProps {
  punches: PunchRecord[];
  user: UserProfile;
}

const CartaoPonto: React.FC<CartaoPontoProps> = ({ punches, user }) => {
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

  const filteredPunches = useMemo(() => {
    return punches.filter(p => {
      const pDate = p.timestamp;
      const pMonth = `${pDate.getFullYear()}-${String(pDate.getMonth() + 1).padStart(2, '0')}`;
      return pMonth === selectedCompetency;
    });
  }, [punches, selectedCompetency]);

  const groupedPunches = useMemo(() => {
    const [year, month] = selectedCompetency.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    const days = [];

    for (let i = 1; i <= daysInMonth; i++) {
        const dateStr = `${String(i).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
        const dayPunches = filteredPunches.filter(p => p.timestamp.toLocaleDateString('pt-BR') === dateStr);
        const ins = dayPunches.filter(p => p.type === 'IN').sort((a,b) => a.timestamp.getTime() - b.timestamp.getTime());
        const outs = dayPunches.filter(p => p.type === 'OUT').sort((a,b) => a.timestamp.getTime() - b.timestamp.getTime());
        const special = dayPunches.find(p => p.type === 'FOLGA' || p.type === 'FERIADO');

        const dayObj = new Date(year, month - 1, i);
        const isWeekend = dayObj.getDay() === 0 || dayObj.getDay() === 6;

        days.push({
            date: dateStr,
            dayOfWeek: dayObj.toLocaleDateString('pt-BR', { weekday: 'short' }).toUpperCase(),
            punch1: ins[0]?.timestamp,
            punch2: outs[0]?.timestamp,
            punch3: ins[1]?.timestamp,
            punch4: outs[1]?.timestamp,
            special: special?.type,
            isWeekend
        });
    }

    return days;
  }, [filteredPunches, selectedCompetency]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-6 no-print">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 bg-purple-50 text-[#710087] rounded-xl flex items-center justify-center border border-purple-100 shadow-sm">
            <Calendar size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tighter leading-none">Meu Espelho Mensal</h2>
            <p className="text-[11px] text-[#710087] font-bold uppercase tracking-[2px] mt-2">Folha de Ponto 2026</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative group mr-2">
            <select 
              value={selectedCompetency}
              onChange={(e) => setSelectedCompetency(e.target.value)}
              className="pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold text-slate-700 uppercase outline-none focus:border-[#710087] appearance-none cursor-pointer"
            >
              {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          <button onClick={handlePrint} className="px-6 py-3 bg-[#710087] text-white rounded-xl font-bold text-xs uppercase shadow-lg hover:bg-[#5a006d] transition-all flex items-center gap-2">
            <Printer size={18} /> Imprimir Relatório
          </button>
        </div>
      </div>

      {/* Relatório Formal para Tela e Impressão */}
      <div className="bg-white p-8 md:p-12 rounded-2xl border border-slate-200 shadow-sm space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start gap-4 border-b-2 border-black pb-6">
           <div>
              <h1 className="text-2xl font-black uppercase text-black">ULTRANET PROVEDOR</h1>
              <p className="text-[10px] font-bold text-black uppercase">Espelho de Ponto Individual do Colaborador</p>
           </div>
           <div className="text-right">
              <p className="text-[10px] font-bold text-black uppercase">Período: <span className="text-sm">{months.find(m => m.value === selectedCompetency)?.label}</span></p>
           </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border border-black p-4 text-black">
           <div><p className="text-[9px] font-bold uppercase">Colaborador</p><p className="text-sm font-bold uppercase">{user.name}</p></div>
           <div><p className="text-[9px] font-bold uppercase">Função</p><p className="text-sm font-bold uppercase">{user.role}</p></div>
        </div>

        <div className="overflow-x-auto">
           <table className="w-full border-collapse border border-black text-black">
              <thead>
                 <tr className="bg-black text-white">
                    <th rowSpan={2} className="border border-black p-2 text-[9px] uppercase">Data</th>
                    <th rowSpan={2} className="border border-black p-2 text-[9px] uppercase">Dia</th>
                    <th colSpan={2} className="border border-black p-2 text-[9px] uppercase">Turno 1</th>
                    <th colSpan={2} className="border border-black p-2 text-[9px] uppercase">Turno 2</th>
                    <th rowSpan={2} className="border border-black p-2 text-[9px] uppercase">Obs.</th>
                 </tr>
                 <tr className="bg-gray-100 text-black">
                    <th className="border border-black p-1 text-[8px] uppercase">E1</th>
                    <th className="border border-black p-1 text-[8px] uppercase">S1</th>
                    <th className="border border-black p-1 text-[8px] uppercase">E2</th>
                    <th className="border border-black p-1 text-[8px] uppercase">S2</th>
                 </tr>
              </thead>
              <tbody>
                 {groupedPunches.map((day, idx) => (
                    <tr key={idx} className={`${day.isWeekend ? 'bg-gray-50' : ''} text-center`}>
                       <td className="border border-black p-1 text-[10px] font-bold">{day.date.split('/')[0]}</td>
                       <td className="border border-black p-1 text-[9px] uppercase">{day.dayOfWeek}</td>
                       <td className="border border-black p-1 text-[10px]">{day.punch1 ? day.punch1.toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'}) : '--:--'}</td>
                       <td className="border border-black p-1 text-[10px]">{day.punch2 ? day.punch2.toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'}) : '--:--'}</td>
                       <td className="border border-black p-1 text-[10px]">{day.punch3 ? day.punch3.toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'}) : '--:--'}</td>
                       <td className="border border-black p-1 text-[10px]">{day.punch4 ? day.punch4.toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'}) : '--:--'}</td>
                       <td className="border border-black p-1 text-[8px] font-bold uppercase">{day.special || (day.isWeekend ? '---' : '')}</td>
                    </tr>
                 ))}
              </tbody>
           </table>
        </div>

        <div className="pt-20 grid grid-cols-1 md:grid-cols-2 gap-16">
           <div className="text-center space-y-2">
              <div className="border-t border-black pt-2"></div>
              <p className="text-[10px] font-bold uppercase text-black">{user.name}</p>
              <p className="text-[8px] uppercase text-gray-500">Assinatura do Colaborador</p>
           </div>
           <div className="text-center space-y-2">
              <div className="border-t border-black pt-2"></div>
              <p className="text-[10px] font-bold uppercase text-black">ULTRANET PROVEDOR</p>
              <p className="text-[8px] uppercase text-gray-500">Assinatura do Gestor</p>
           </div>
        </div>
        <p className="text-center text-[8px] text-gray-400 mt-12 uppercase tracking-[5px]">Gerado Eletronicamente via Ultranet Ponto 4.0</p>
      </div>
    </div>
  );
};

export default CartaoPonto;
