
import React, { useMemo, useState } from 'react';
import { Calendar, Printer, ChevronDown } from 'lucide-react';
import { PunchRecord, UserProfile } from '../types';

interface CartaoPontoProps {
  punches: PunchRecord[];
  user: UserProfile;
}

const PrintLogo: React.FC = () => (
  <div className="flex items-center gap-3">
    <svg width="40" height="40" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10 30V70L50 90L90 70V30L50 10L10 30Z" fill="black" />
    </svg>
    <div className="flex flex-col text-left">
       <span className="font-black text-xl tracking-tighter uppercase leading-none text-black">UltraNet</span>
       <span className="text-[7px] font-bold uppercase tracking-widest text-black">Folha de Ponto Eletrônica</span>
    </div>
  </div>
);

const CartaoPonto: React.FC<CartaoPontoProps> = ({ punches, user }) => {
  const [selectedCompetency, setSelectedCompetency] = useState('2026-01');

  const months = useMemo(() => {
    const list = [];
    const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
    for (let m = 0; m < 12; m++) {
      list.push({ value: `2026-${String(m + 1).padStart(2, '0')}`, label: `${monthNames[m]} / 2026` });
    }
    return list;
  }, []);

  const dayRecords = useMemo(() => {
    const [year, month] = selectedCompetency.split('-').map(Number);
    const daysInMonth = new Date(year, month, 0).getDate();
    const days = [];

    for (let i = 1; i <= daysInMonth; i++) {
        const dateStr = `${String(i).padStart(2, '0')}/${String(month).padStart(2, '0')}/${year}`;
        const dayPunches = punches.filter(p => p.timestamp.toLocaleDateString('pt-BR') === dateStr);
        
        const ins = dayPunches.filter(p => p.type === 'IN').sort((a,b) => a.timestamp.getTime() - b.timestamp.getTime());
        const outs = dayPunches.filter(p => p.type === 'OUT').sort((a,b) => a.timestamp.getTime() - b.timestamp.getTime());
        
        const dayObj = new Date(year, month - 1, i);
        const isWeekend = dayObj.getDay() === 0 || dayObj.getDay() === 6;

        days.push({
            date: dateStr,
            dayOfWeek: dayObj.toLocaleDateString('pt-BR', { weekday: 'short' }).toUpperCase(),
            p1: ins[0]?.timestamp,
            p2: outs[0]?.timestamp,
            p3: ins[1]?.timestamp,
            p4: outs[1]?.timestamp,
            isWeekend
        });
    }
    return days;
  }, [punches, selectedCompetency]);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-6 no-print">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 bg-purple-50 text-[#581c87] rounded-xl flex items-center justify-center border border-purple-100 shadow-sm">
            <Calendar size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tighter leading-none uppercase">Meu Espelho</h2>
            <p className="text-[10px] text-[#581c87] font-bold uppercase tracking-[2px] mt-2">Relatório Mensal 2026</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative group flex-1">
            <select 
              value={selectedCompetency} onChange={e => setSelectedCompetency(e.target.value)}
              className="w-full pl-4 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-black uppercase outline-none focus:border-[#581c87] appearance-none"
            >
              {months.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
          </div>
          <button onClick={() => window.print()} className="px-6 py-3 bg-[#581c87] text-white rounded-xl font-black text-[10px] uppercase shadow-lg flex items-center gap-2">
            <Printer size={18} /> Imprimir
          </button>
        </div>
      </div>

      <div className="bg-white p-8 md:p-12 rounded-[2rem] border border-slate-200 shadow-sm space-y-10">
        <div className="flex justify-between items-end border-b-2 border-black pb-6">
           <PrintLogo />
           <div className="text-right">
              <p className="text-[10px] font-bold text-black uppercase">Período: <span className="font-black">{months.find(m => m.value === selectedCompetency)?.label}</span></p>
           </div>
        </div>

        <div className="grid grid-cols-2 gap-4 border border-black p-4 text-black">
           <div><p className="text-[8px] font-bold uppercase">Colaborador</p><p className="text-xs font-black uppercase">{user.name}</p></div>
           <div><p className="text-[8px] font-bold uppercase">Cargo</p><p className="text-xs font-black uppercase">{user.role}</p></div>
        </div>

        <div className="overflow-hidden border border-black">
           <table className="w-full border-collapse text-black text-center">
              <thead>
                 <tr className="bg-black text-white text-[8px] font-black uppercase">
                    <th className="p-2 border border-black">Data</th>
                    <th className="p-2 border border-black">Dia</th>
                    <th className="p-2 border border-black">E1</th>
                    <th className="p-2 border border-black">S1</th>
                    <th className="p-2 border border-black">E2</th>
                    <th className="p-2 border border-black">S2</th>
                 </tr>
              </thead>
              <tbody>
                 {dayRecords.map((day, idx) => (
                    <tr key={idx} className={`text-[10px] font-bold ${day.isWeekend ? 'bg-slate-50' : ''}`}>
                       <td className="p-2 border border-black">{day.date.split('/')[0]}</td>
                       <td className="p-2 border border-black text-[7px] uppercase">{day.dayOfWeek}</td>
                       <td className="p-2 border border-black">{day.p1 ? day.p1.toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'}) : '--:--'}</td>
                       <td className="p-2 border border-black">{day.p2 ? day.p2.toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'}) : '--:--'}</td>
                       <td className="p-2 border border-black">{day.p3 ? day.p3.toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'}) : '--:--'}</td>
                       <td className="p-2 border border-black">{day.p4 ? day.p4.toLocaleTimeString('pt-BR', {hour:'2-digit', minute:'2-digit'}) : '--:--'}</td>
                    </tr>
                 ))}
              </tbody>
           </table>
        </div>

        <div className="pt-20 grid grid-cols-2 gap-16 no-screen-print">
           <div className="text-center space-y-2">
              <div className="border-t border-black pt-2"></div>
              <p className="text-[9px] font-black uppercase text-black">{user.name}</p>
              <p className="text-[7px] uppercase text-slate-400">Assinatura</p>
           </div>
           <div className="text-center space-y-2">
              <div className="border-t border-black pt-2"></div>
              <p className="text-[9px] font-black uppercase text-black">UltraNet Provedor</p>
              <p className="text-[7px] uppercase text-slate-400">Responsável</p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default CartaoPonto;
