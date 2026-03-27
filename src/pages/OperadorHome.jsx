import React from 'react';
import { User, Wrench, AlertCircle, Car, Clock, ChevronRight } from 'lucide-react';
import { useOrders } from '../hooks/useData';
import { useAuth } from '../contexts/AuthContext';

const OperadorHome = ({ onSelectOS }) => {
  const { orders, loading } = useOrders();
  const { profile } = useAuth();

  // 1. KPI: Fila Geral (Disponíveis sem técnico)
  const filaGeral = orders.filter(os => 
    !os.tecnico_id && 
    !['CONCLUÍDO', 'CANCELADO', 'ORCAMENTO', 'ENTREGUE'].includes(String(os.status).toUpperCase())
  );

  // 2. KPI: Atribuídas a Mim (Em progresso ou aguardando)
  const minhasAtribuidas = orders.filter(os => 
    os.tecnico_id === profile?.id && 
    !['CONCLUÍDO', 'CANCELADO', 'ENTREGUE'].includes(String(os.status).toUpperCase())
  );

  // 3. KPI: Finalizadas (Para histórico)
  const minhasFinalizadas = orders.filter(os => 
    os.tecnico_id === profile?.id && 
    String(os.status).toUpperCase() === 'CONCLUÍDO'
  );

  const formatOS = (os) => ({
    ...os,
    carro: os.veiculo_desc || 'Veículo',
    cliente: os.cliente_nome || 'Cliente',
    tempo: os.tempo_estimado || '02:00h',
    prioridade: os.prioridade || 'Normal',
    checklist_concluido: os.has_checklist
  });

  return (
    <div className="fade-in space-y-4">
      {/* Resumo Rápido Reestruturado */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm text-center">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Geral</p>
            <h4 className="text-lg font-black text-slate-800">{filaGeral.length}</h4>
            <p className="text-[7px] font-bold text-slate-400 uppercase">Fila Loja</p>
        </div>
        <div className="bg-white p-3 rounded-2xl border border-primary/20 shadow-sm text-center bg-primary/5">
            <p className="text-[8px] font-black text-primary uppercase tracking-widest mb-1">Minhas</p>
            <h4 className="text-lg font-black text-primary">{minhasAtribuidas.length}</h4>
            <p className="text-[7px] font-bold text-primary/60 uppercase">Em aberto</p>
        </div>
        <div className="bg-white p-3 rounded-2xl border border-slate-100 shadow-sm text-center opacity-80 active:bg-slate-50 transition-all cursor-pointer">
            <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">OK</p>
            <h4 className="text-lg font-black text-emerald-600">{minhasFinalizadas.length}</h4>
            <p className="text-[7px] font-bold text-slate-400 uppercase">Concluídas</p>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center">
           <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4" />
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sincronizando tarefas...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Seção 1: Meus Serviços */}
          {minhasAtribuidas.length > 0 && (
            <div className="space-y-3">
              <h3 className="text-[10px] font-black text-primary uppercase tracking-[0.2em] flex items-center gap-2">
                <User size={12} /> Seus Serviços em Aberto
              </h3>
              {minhasAtribuidas.map(os => (
                <ServiceCard key={os.id} os={formatOS(os)} onSelect={onSelectOS} isMine />
              ))}
            </div>
          )}

          {/* Seção 2: Serviços Disponíveis */}
          <div className="space-y-3">
            <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] flex items-center gap-2">
              <Wrench size={12} /> Serviços Disponíveis na Loja
            </h3>
            {filaGeral.length > 0 ? filaGeral.map(os => (
              <ServiceCard key={os.id} os={formatOS(os)} onSelect={onSelectOS} />
            )) : (
              <div className="py-10 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                <p className="text-[10px] font-bold text-slate-400 italic">Sem novos serviços disponíveis.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Alerta de Dica */}
      <div className="p-4 bg-emerald-50/50 rounded-2xl border border-emerald-100 flex gap-3">
        <AlertCircle size={18} className="text-primary flex-shrink-0" />
        <p className="text-[11px] text-emerald-700 font-medium leading-relaxed">
          <strong>Atenção Operador:</strong> Mantenha o percentual de progresso atualizado para que o cliente acompanhe pela TV.
        </p>
      </div>
    </div>
  );
};

// Componente Interno para o Card
const ServiceCard = ({ os, onSelect, isMine }) => (
  <div 
    onClick={() => onSelect(os)}
    className={`bg-white rounded-2xl p-4 border shadow-sm active:scale-[0.98] transition-all duration-200 ${isMine ? 'border-primary/20 bg-primary/[0.02]' : 'border-slate-100'}`}
  >
    <div className="flex items-start justify-between mb-3">
      <div className="flex items-center gap-2">
        <span className={`w-2 h-2 rounded-full ${
          os.prioridade === 'Urgente' ? 'bg-rose-500 animate-pulse' : 
          os.prioridade === 'Alta' ? 'bg-amber-500' : 'bg-emerald-500'
        }`} />
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{os.id}</span>
      </div>
      <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-lg ${
        String(os.status).toUpperCase() === 'EM EXECUÇÃO' ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'
      }`}>
        {os.status}
      </span>
    </div>

    <div className="flex items-center gap-3 mb-4">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-all ${isMine ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
        <Car size={24} />
      </div>
      <div>
        <h4 className="text-sm font-black text-slate-800 leading-tight tracking-tight uppercase">{os.carro}</h4>
        <p className="text-[10px] font-bold text-slate-400 leading-none mt-1">{os.cliente}</p>
      </div>
    </div>

    <div className="flex items-center justify-between pt-3 border-t border-slate-50">
      <div className="flex items-center gap-1.5 text-slate-500">
        <Wrench size={12} className="text-primary" />
        <span className="text-[10px] font-bold truncate max-w-[150px]">{os.servico || 'Serviço'}</span>
      </div>
      <div className="flex items-center gap-1.5 text-slate-400">
        <Clock size={12} />
        <span className="text-[10px] font-bold">{os.tempo || '2h'}</span>
      </div>
    </div>

    <button 
      disabled={String(os.status).toUpperCase() !== 'EM EXECUÇÃO' && !os.checklist_concluido}
      className={`w-full mt-4 py-3 rounded-xl text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-all group ${
        String(os.status).toUpperCase() === 'EM EXECUÇÃO' 
          ? 'bg-primary text-white shadow-lg shadow-primary/20' 
          : !os.checklist_concluido 
          ? 'bg-slate-100 text-slate-300 cursor-not-allowed filter grayscale'
          : 'bg-slate-900 text-white hover:bg-slate-800'
      }`}
    >
      {String(os.status).toUpperCase() === 'EM EXECUÇÃO' ? 'Continuar Atividade' : 'Iniciar Atividade'}
      <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
    </button>
  </div>
);

export default OperadorHome;
