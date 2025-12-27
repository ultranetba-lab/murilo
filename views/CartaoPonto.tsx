
import React, { useMemo } from 'react';
import { Calendar, Clock, MapPin, CheckCircle2, AlertCircle, Printer } from 'lucide-react';
import { PunchRecord, UserProfile } from '../types';

interface CartaoPontoProps {
  punches: PunchRecord[];
  user: UserProfile;
}

const CartaoPonto: React.FC<CartaoPontoProps> = ({ punches, user }) => {
  const groupedPunches = useMemo(() => {
    const groups: Record<string, PunchRecord[]> = {};
    
    punches.forEach(punch => {
      const dateKey = punch.timestamp.toLocaleDateString('pt-BR');
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(punch);
    });

    return Object.entries(groups).sort((a, b) => {
        const dateA = new Date(a[1][0].timestamp).getTime();
        const dateB = new Date(b[1][0].timestamp).getTime();
        return dateB - dateA;
    }).map(([date, items]) => ({
      date,
      records: items.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
    }));
  }, [punches]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Cabeçalho do Relatório */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-14 h-14 bg-purple-50 text-[#710087] rounded-xl flex items-center justify-center border border-purple-100 shadow-sm no-print">
            <Calendar size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-extrabold text-slate-900 tracking-tighter leading-none">Minha Jornada</h2>
            <p className="text-[11px] text-[#710087] font-bold uppercase tracking-[2px] mt-2">Relatório de Frequência</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button 
            onClick={handlePrint}
            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-6 py-3 bg-[#710087] text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg hover:bg-[#5a006d] transition-all no-print"
          >
            <Printer size={18} /> Imprimir Espelho
          </button>
          <div className="hidden md:block h-10 w-[1px] bg-slate-200 no-print" />
          <div className="text-right bg-slate-50 px-5 py-3 rounded-xl border border-slate-100 shadow-inner min-w-[120px]">
             <div className="text-3xl font-extrabold text-slate-900 leading-none">{groupedPunches.length}</div>
             <p className="text-[10px] text-slate-500 font-bold uppercase mt-1 tracking-wider">Dias Ativos</p>
          </div>
        </div>
      </div>

      {/* Identificação para Impressão */}
      <div className="print-only mb-8 p-6 border border-slate-200 rounded-xl bg-slate-50">
        <div className="flex justify-between items-start">
           <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Colaborador</p>
              <h3 className="text-xl font-extrabold text-slate-900 uppercase">{user.name}</h3>
              <p className="text-xs font-bold text-slate-500 mt-1 uppercase">{user.role} • {user.company}</p>
           </div>
           <div className="text-right">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Competência</p>
              <p className="text-sm font-bold text-slate-900 uppercase">Dezembro / 2025</p>
           </div>
        </div>
      </div>

      {/* Lista de Registros */}
      <div className="space-y-5">
        {groupedPunches.length > 0 ? groupedPunches.map((day, idx) => (
          <div key={idx} className="bg-white rounded-[1.5rem] shadow-sm border border-slate-200 overflow-hidden break-inside-avoid">
            <div className="bg-slate-50 px-8 py-3.5 border-b border-slate-100 flex justify-between items-center">
              <span className="text-sm font-bold text-slate-800 uppercase tracking-widest">{day.date}</span>
              <span className="text-[10px] font-bold text-[#710087] bg-white px-3 py-1 rounded-lg border border-slate-200 uppercase tracking-wider no-print">{day.records.length} Batidas</span>
            </div>
            
            <div className="divide-y divide-slate-100">
              {day.records.map((punch) => (
                <div key={punch.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-all">
                  <div className="flex items-center gap-6">
                    <div className={`w-1.5 h-10 rounded-full no-print ${punch.type === 'IN' ? 'bg-green-500' : 'bg-[#fbb03b]'}`} />
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="text-2xl font-extrabold text-slate-900 tracking-tight">
                          {punch.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md tracking-wider uppercase ${
                          punch.type === 'IN' ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-orange-100 text-orange-700 border border-orange-200'
                        }`}>
                          {punch.type === 'IN' ? 'Entrada' : 'Saída'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 mt-2 text-slate-500 no-print">
                        <MapPin size={12} className="text-slate-400" />
                        <span className="text-[11px] font-semibold uppercase tracking-tight">Sincronizado via GPS</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3 no-print">
                    {punch.photo && (
                      <div className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 shadow-sm bg-slate-50">
                        <img src={punch.photo} className="w-full h-full object-cover grayscale opacity-60" />
                      </div>
                    )}
                    <CheckCircle2 size={24} className="text-green-500" />
                  </div>
                </div>
              ))}
            </div>
            
            {day.records.length % 2 !== 0 && (
              <div className="bg-orange-50/50 p-3 border-t border-orange-100 flex items-center gap-2">
                 <AlertCircle size={16} className="text-orange-600" />
                 <span className="text-[10px] text-orange-700 font-bold uppercase tracking-wider">Atenção: Jornada incompleta</span>
              </div>
            )}
          </div>
        )) : (
          <div className="p-24 text-center bg-white rounded-3xl border-2 border-dashed border-slate-100">
             <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-200">
                <Clock size={48} />
             </div>
             <p className="text-slate-900 font-bold text-sm uppercase tracking-widest">Nenhum registro encontrado</p>
          </div>
        )}
      </div>

      {/* Rodapé de Assinatura para Impressão */}
      <div className="print-only mt-20">
         <div className="grid grid-cols-2 gap-20">
            <div className="text-center">
               <div className="border-t border-slate-900 pt-2 font-bold uppercase text-[10px] tracking-widest">Assinatura do Colaborador</div>
            </div>
            <div className="text-center">
               <div className="border-t border-slate-900 pt-2 font-bold uppercase text-[10px] tracking-widest">Assinatura da Empresa</div>
            </div>
         </div>
         <p className="text-center text-[9px] text-slate-400 mt-12 uppercase tracking-[5px]">Gerado em {new Date().toLocaleDateString('pt-BR')} via Ultranet Ponto</p>
      </div>
    </div>
  );
};

export default CartaoPonto;
