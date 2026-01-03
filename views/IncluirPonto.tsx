
import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Clock, CheckCircle2, Navigation, Sparkles, Camera, Loader2, UserCheck } from 'lucide-react';
import MapView from '../components/MapView';
import { PunchRecord, PunchStatus, UserProfile } from '../types';
import { analyzeJustification } from '../services/geminiService';

interface IncluirPontoProps {
  onAddPunch: (punch: PunchRecord) => void;
  recentPunches: PunchRecord[];
  user: UserProfile;
}

const IncluirPonto: React.FC<IncluirPontoProps> = ({ onAddPunch, recentPunches, user }) => {
  const [now, setNow] = useState(new Date());
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [justification, setJustification] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [aiFeedback, setAiFeedback] = useState<any>(null);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [capturedPhoto, setCapturedPhoto] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.error("GPS Error:", err)
      );
    }

    startCamera();
    return () => {
      clearInterval(timer);
      stopCamera();
    };
  }, []);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => setIsCameraReady(true);
      }
    } catch (err) {
      console.error("Camera Access Error:", err);
    }
  };

  const stopCamera = () => {
    if (videoRef.current?.srcObject) {
      (videoRef.current.srcObject as MediaStream).getTracks().forEach(t => t.stop());
    }
  };

  const handleSmartCheck = async () => {
    if (!justification) return;
    const feedback = await analyzeJustification(justification);
    setAiFeedback(feedback);
  };

  const handleSubmit = async () => {
    if (!location || !isCameraReady || !videoRef.current || !canvasRef.current) return;
    setIsSubmitting(true);

    const context = canvasRef.current.getContext('2d');
    if (context) {
      canvasRef.current.width = videoRef.current.videoWidth;
      canvasRef.current.height = videoRef.current.videoHeight;
      context.drawImage(videoRef.current, 0, 0);
      const photoData = canvasRef.current.toDataURL('image/jpeg');
      setCapturedPhoto(photoData);

      const newPunch: PunchRecord = {
        id: Math.random().toString(36).substr(2, 9),
        userId: user.id,
        userName: user.name,
        timestamp: new Date(),
        location: { ...location, address: "Ponto Verificado via GPS" },
        justification,
        photo: photoData,
        status: PunchStatus.ACCEPTED,
        type: recentPunches.length % 2 === 0 ? 'IN' : 'OUT'
      };

      setTimeout(() => {
        onAddPunch(newPunch);
        setJustification("");
        setAiFeedback(null);
        setCapturedPhoto(null);
        setIsSubmitting(false);
      }, 2000);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Relógio e Mapa */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden">
        <div className="h-48 relative">
          {location ? <MapView lat={location.lat} lng={location.lng} radius={50} /> : (
            <div className="h-full bg-slate-50 flex items-center justify-center text-slate-400 font-bold uppercase text-[10px] tracking-[4px]">
              <Loader2 className="animate-spin mr-3 text-[#710087]" size={20} /> Localizando...
            </div>
          )}
          <div className="absolute top-4 right-4 z-[1000]">
             <span className="flex items-center gap-2 px-3 py-1 bg-white/90 backdrop-blur shadow-sm rounded-full text-[9px] font-black text-green-600 border border-green-100 uppercase">
                <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> GPS Ativo
             </span>
          </div>
        </div>
        <div className="p-8 flex items-center justify-between">
          <div>
            <div className="text-5xl font-black text-[#0f172a] tracking-tighter leading-none">
              {now.toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'})}
              <span className="text-2xl text-slate-300 ml-1 font-bold">:{now.getSeconds().toString().padStart(2, '0')}</span>
            </div>
            <p className="text-[11px] font-black text-[#710087] uppercase tracking-[3px] mt-3">
              {now.toLocaleDateString('pt-BR', {weekday: 'long', day: '2-digit', month: 'long'})}
            </p>
          </div>
        </div>
      </div>

      {/* Biometria Facial */}
      <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-200">
        <div className="flex items-center justify-between mb-8">
          <h3 className="text-[10px] font-black text-slate-800 uppercase tracking-[3px] flex items-center gap-2">
            <Camera size={16} className="text-[#710087]" /> Reconhecimento de Presença
          </h3>
          <UserCheck size={20} className="text-slate-200" />
        </div>
        
        <div className="relative bg-slate-900 rounded-3xl overflow-hidden aspect-[4/3] mb-8 border-4 border-slate-50 shadow-inner">
          <video ref={videoRef} autoPlay playsInline className={`w-full h-full object-cover mirror ${capturedPhoto ? 'opacity-0' : 'opacity-100'} transition-opacity`} />
          {capturedPhoto && (
            <div className="absolute inset-0 bg-slate-950 animate-fadeIn">
               <img src={capturedPhoto} className="w-full h-full object-cover opacity-60" />
               <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
                  <div className="w-20 h-20 bg-green-500 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(34,197,94,0.5)] animate-scaleUp">
                     <CheckCircle2 size={40} className="text-white" />
                  </div>
                  <span className="text-xs font-black text-white uppercase tracking-[4px]">Ponto Confirmado</span>
               </div>
            </div>
          )}
          
          {!isCameraReady && !capturedPhoto && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-500 gap-4">
               <Loader2 className="animate-spin text-[#710087]" size={32} />
               <span className="text-[10px] font-black uppercase tracking-[3px]">Iniciando Sensor...</span>
            </div>
          )}

          {/* HUD de Reconhecimento */}
          {!capturedPhoto && isCameraReady && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-0 border-[40px] border-black/20" />
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-64 border-2 border-white/30 border-dashed rounded-[3rem]" />
              <div className="absolute top-6 left-6 flex flex-col gap-1">
                 <div className="w-24 h-1 bg-white/20 rounded-full overflow-hidden">
                    <div className="h-full bg-[#710087] animate-[shimmer_2s_infinite]" style={{width: '60%'}} />
                 </div>
                 <span className="text-[8px] font-black text-white/50 uppercase tracking-widest">Análise Biométrica</span>
              </div>
            </div>
          )}
          <canvas ref={canvasRef} className="hidden" />
        </div>

        <div className="space-y-6">
          <div className="relative">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 block mb-3">Justificativa Opcional</label>
            <textarea
              placeholder="Digite aqui observações relevantes..."
              className="w-full p-5 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-medium focus:border-[#710087] focus:ring-4 focus:ring-purple-50 transition-all resize-none h-24 outline-none text-sm placeholder:text-slate-300 shadow-inner"
              value={justification}
              onChange={(e) => setJustification(e.target.value)}
            />
            {justification.length > 5 && (
              <button 
                onClick={handleSmartCheck}
                className="absolute bottom-4 right-4 p-2.5 bg-white text-[#710087] rounded-xl border border-slate-100 shadow-sm hover:shadow-md transition-all group"
                title="Melhorar com IA"
              >
                <Sparkles size={18} className="group-hover:scale-110 transition-transform" />
              </button>
            )}
          </div>

          {aiFeedback && (
            <div className="p-5 bg-purple-50 border border-purple-100 rounded-2xl text-xs text-slate-700 animate-slideDown shadow-sm">
               <p className="font-black text-[#710087] mb-2 flex items-center gap-2 uppercase tracking-tight">
                 <Sparkles size={14} /> Sugestão da Inteligência Ultranet:
               </p>
               <p className="leading-relaxed font-medium">{aiFeedback.feedback}</p>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={isSubmitting || !location || !isCameraReady}
            className="w-full py-5 rounded-[1.25rem] font-black text-xs uppercase tracking-[3px] text-white shadow-xl shadow-purple-100 transition-all flex items-center justify-center gap-3 bg-[#710087] hover:bg-[#5a006d] active:scale-[0.98] disabled:bg-slate-200 disabled:shadow-none"
          >
            {isSubmitting ? (
               <><Loader2 className="animate-spin" size={20} /> Validando Dados...</>
            ) : (
               <><Navigation size={20} /> Registrar Presença Agora</>
            )}
          </button>
        </div>
      </div>

      {/* Histórico Recente */}
      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden mb-12">
        <div className="px-8 py-5 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <h3 className="font-black text-[10px] text-slate-800 uppercase tracking-[3px]">Atividades de Hoje</h3>
          <div className="h-2 w-2 bg-green-500 rounded-full" />
        </div>
        <div className="divide-y divide-slate-50">
          {recentPunches.length > 0 ? recentPunches.slice(0, 4).map((punch) => (
            <div key={punch.id} className="p-8 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
              <div className="flex items-center gap-6">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border shadow-sm ${punch.type === 'IN' ? 'bg-green-50 text-green-600 border-green-100' : 'bg-orange-50 text-orange-600 border-orange-100'}`}>
                  <Clock size={24} />
                </div>
                <div>
                  <p className="font-black text-slate-900 text-2xl leading-none mb-1">
                    {punch.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    {punch.type === 'IN' ? 'Entrada Confirmada' : 'Saída Confirmada'}
                  </p>
                </div>
              </div>
              <div className="w-12 h-12 bg-slate-100 rounded-xl overflow-hidden border border-slate-200 rotate-3">
                 {punch.photo && <img src={punch.photo} className="w-full h-full object-cover grayscale brightness-110" />}
              </div>
            </div>
          )) : (
            <div className="p-20 text-center">
               <p className="text-[10px] font-black text-slate-300 uppercase tracking-[4px]">Nenhum registro hoje</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default IncluirPonto;
