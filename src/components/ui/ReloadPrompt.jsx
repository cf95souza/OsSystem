import React from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { RefreshCw, X, Download } from 'lucide-react';

function ReloadPrompt() {
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW Registered: ' + r);
    },
    onRegisterError(error) {
      console.log('SW registration error', error);
    },
  });

  const close = () => {
    setNeedRefresh(false);
  };

  if (!needRefresh) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] w-[90%] max-w-md animate-in slide-in-from-bottom-5 duration-500">
      <div className="bg-white/80 backdrop-blur-xl border border-primary/20 p-6 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] flex items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center shrink-0">
            <Download size={24} className="animate-bounce" />
          </div>
          <div>
            <h4 className="text-sm font-black text-slate-800 uppercase tracking-tight leading-none mb-1">Nova Versão!</h4>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Atualização disponível na loja.</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => updateServiceWorker(true)}
            className="h-12 px-6 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
          >
            <RefreshCw size={14} />
            Atualizar
          </button>
          <button
            onClick={close}
            className="w-12 h-12 bg-slate-100 text-slate-400 rounded-2xl flex items-center justify-center hover:bg-slate-200 transition-all"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default ReloadPrompt;
