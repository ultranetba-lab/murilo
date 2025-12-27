
import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Clock, CheckCircle2, Navigation, Sparkles, Camera, Loader2 } from 'lucide-react';
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
        location: { ...location, address: "Bahia, Brasil" },
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
      }, 1500);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Time and Map Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="h-44 grayscale-[0.3]">
          {location ? <MapView lat={location.lat} lng={location.lng} radius={50} /> : (
            <div className="h-full bg-slate-50 flex items-center justify-center text-slate-500 font-bold uppercase text-xs tracking-widest">
              <Loader2 className="animate-spin mr-3 text-[#710087]" size={20} /> Aguardando GPS...
            </div>
          )}
        </div>
        <div className="p-6 flex items-center justify-between bg-white border-t border-slate-100">
          <div>
            <div className="text-4xl font-extrabold text-[#0f172a] tracking-tight leading-none">
              {now.toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'})}
              <span className="text-xl text-slate-400 ml-1 font-semibold">:{now.getSeconds().toString().padStart(2, '0')}</span>
            </div>
            <p className="text-[11px] font-bold text-[#710087] uppercase tracking-[2px] mt-2">
              {now.toLocaleDateString('pt-BR', {weekday: 'long', day: '2-digit', month: 'long'})}
            </p>
          </div>
          <div className="text-right">
             <span className="inline-flex items-center px-4 py-1.5 bg-green-50 text-green-700 rounded-lg text-[10px] font-bold uppercase tracking-wider border border-green-100 shadow-sm">
               GPS Ativo
             </span>
          </div>
        </div>
      </div>

      {/* Biometric Scan Card */}
      <div className="bg-white p-8 rounded-[1.5rem] shadow-sm border border-slate-200">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-widest mb-6 flex items-center gap-2">
          <Camera size={18} className="text-[#710087]" /> Reconhecimento Facial
        </h3>
        
        <div className="relative bg-slate-900 rounded-2xl overflow-hidden aspect-video mb-8 border border-slate-200 shadow-md">
          <video ref={videoRef} autoPlay playsInline className={`w-full h-full object-cover mirror ${capturedPhoto ? 'opacity-0' : 'opacity-100'} transition-opacity`} />
          {capturedPhoto && (
            <div className="absolute inset-0 bg-slate-900 animate-fadeIn">
               <img src={capturedPhoto} className="w-full h-full object-cover opacity-80" />
               <div className="absolute inset-0 flex items-center justify-center bg-[#710087]/20 backdrop-blur-sm">
                  <div className="bg-white p-5 rounded-full shadow-2xl animate-scaleUp">
                     <CheckCircle2 size={48} className="text-green-500" />
                  </div>
               </div>
            </div>
          )}
          {!isCameraReady && !capturedPhoto && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 gap-3">
               <Loader2 className="animate-spin text-[#fbb03b]" size={32} />
               <span className="text-xs font-bold uppercase tracking-widest">Iniciando Sensor...</span>
            </div>
          )}
          <div className="absolute inset-0 border-[30px] border-black/10 pointer-events-none flex items-center justify-center">
             <div className="w-40 h-52 border-2 border-dashed border-white/40 rounded-full" />
          </div>
          <canvas ref={canvasRef} className="hidden" />
        </div>

        <div className="relative mb-6">
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest ml-1 block mb-2">Justificativa / Observação</label>
          <textarea
            placeholder="Digite aqui se houver alguma observação..."
            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 font-medium focus:border-[#710087] transition-all resize-none h-24 outline-none text-sm placeholder:text-slate-400"
            value={justification}
            onChange={(e) => setJustification(e.target.value)}
          />
          {justification.length > 5 && (
            <button 
              onClick={handleSmartCheck}
              className="absolute bottom-4 right-4 p-2 bg-white text-[#710087] rounded-lg border border-slate-200 shadow-sm hover:bg-slate-50 transition-all"
              title="Analisar via IA"
            >
              <Sparkles size={18} />
            </button>
          )}
        </div>

        {aiFeedback && (
          <div className="mb-6 p-4 bg-purple-50 border border-purple-100 rounded-xl text-xs text-slate-700 animate-slideDown">
             <p className="font-bold text-[#710087] mb-1.5 flex items-center gap-1.5 uppercase tracking-tight"><Sparkles size={14} /> Sugestão da IA:</p>
             <p className="leading-relaxed">{aiFeedback.feedback}</p>
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={isSubmitting || !location || !isCameraReady}
          className="w-full py-5 rounded-xl font-bold text-sm uppercase tracking-widest text-white shadow-lg shadow-purple-100 transition-all flex items-center justify-center gap-3 bg-[#710087] hover:bg-[#5a006d] active:scale-95 disabled:bg-slate-200 disabled:shadow-none"
        >
          {isSubmitting ? (
             <><Loader2 className="animate-spin" size={20} /> Enviando...</>
          ) : (
             <><Navigation size={20} /> Registrar Presença</>
          )}
        </button>
      </div>

      {/* Recent History Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden mb-12">
        <div className="px-6 py-4 border-b border-slate-100 bg-slate-50 flex justify-between items-center">
          <h3 className="font-bold text-[11px] text-slate-800 uppercase tracking-widest">Atividades de Hoje</h3>
          <span className="text-[10px] font-bold text-slate-500 bg-white border border-slate-200 px-3 py-0.5 rounded-full uppercase">Sincronizado</span>
        </div>
        <div className="divide-y divide-slate-100">
          {recentPunches.length > 0 ? recentPunches.slice(0, 3).map((punch) => (
            <div key={punch.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <div className="flex items-center gap-5">
                <div className={`p-2.5 rounded-xl shadow-sm border ${punch.type === 'IN' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-orange-50 text-orange-700 border-orange-100'}`}>
                  <MapPin size={22} />
                </div>
                <div>
                  <p className="font-extrabold text-slate-900 text-xl leading-none mb-1">
                    {punch.timestamp.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">
                    {punch.type === 'IN' ? 'Entrada Confirmada' : 'Saída Confirmada'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 bg-slate-100 rounded-lg overflow-hidden border border-slate-200">
                   {punch.photo && <img src={punch.photo} className="w-full h-full object-cover grayscale opacity-60" />}
                 </div>
                 <CheckCircle2 size={24} className="text-green-500" />
              </div>
            </div>
          )) : (
            <div className="p-16 text-center text-slate-400">
               <p className="text-xs font-bold uppercase tracking-[4px]">Aguardando registros</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default IncluirPonto;
