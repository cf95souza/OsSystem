import React, { useState } from 'react';
import { X, User, UserMinus, Save, Search } from 'lucide-react';
import { useProfiles, useOrders } from '../../hooks/useData';
import { toast } from '../../utils/toast';

const AtribuirTecnicoModal = ({ os, onClose }) => {
  const { profiles, loading: loadingProfiles } = useProfiles();
  const { updateOrderProgress } = useOrders();
  const [searchTerm, setSearchTerm] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Filtra apenas perfis de OPERADORES ou ADM/GESTOR para atribuição
  const filteredProfiles = profiles.filter(p => 
    (p.nome || p.email || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAssign = async (tecnicoId, tecnicoNome) => {
    setIsSaving(true);
    try {
      // Disparamos a atualização (que agora é otimista no hook)
      updateOrderProgress(os.id, {
        tecnico_id: tecnicoId,
        tecnico: tecnicoNome
      });

      // Fechamos o modal imediatamente para dar a sensação de velocidade
      toast.success(tecnicoId ? `Atribuindo OS a ${tecnicoNome}...` : 'Liberando OS...');
      onClose();
    } catch (error) {
      toast.error('Erro ao processar atribuição');
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[300] flex items-center justify-center p-4">
      <div className="bg-white rounded-[3rem] w-full max-w-md flex flex-col overflow-hidden shadow-2xl animate-scaleUp max-h-[85vh]">
        {/* Header */}
        <div className="p-8 border-b border-slate-50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
              <User size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight">Atribuir Técnico</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-none">OS #{os.id} • {os.veiculo_desc}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full transition-all">
            <X size={24} className="text-slate-300 hover:text-slate-800" />
          </button>
        </div>

        {/* Busca */}
        <div className="px-8 pt-6 pb-2 shrink-0">
          <div className="relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Buscar colaborador..." 
              className="w-full pl-12 pr-4 py-3 bg-slate-50 border-none rounded-xl outline-none focus:ring-2 focus:ring-primary/20 font-bold text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Lista de Técnicos */}
        <div className="p-8 space-y-3 overflow-y-auto custom-scrollbar flex-1">
          {/* Opção de Desvincular */}
          <button
            disabled={isSaving}
            onClick={() => handleAssign(null, null)}
            className={`w-full p-4 rounded-2xl border-2 border-dashed flex items-center justify-between group transition-all ${
              !os.tecnico_id 
                ? 'bg-slate-50 border-slate-200 opacity-50 cursor-not-allowed' 
                : 'border-slate-100 hover:border-amber-200 hover:bg-amber-50/30'
            }`}
          >
            <div className="flex items-center gap-4 text-left">
              <div className="w-10 h-10 bg-slate-100 text-slate-400 rounded-xl flex items-center justify-center group-hover:bg-amber-100 group-hover:text-amber-500 transition-all">
                <UserMinus size={20} />
              </div>
              <div>
                <p className="text-sm font-black text-slate-700 uppercase tracking-tight">Remover Responsável</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Liberar OS na fila da loja</p>
              </div>
            </div>
          </button>

          <div className="py-2 flex items-center gap-4">
             <div className="h-px bg-slate-100 flex-1"></div>
             <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Colaboradores Disponíveis</span>
             <div className="h-px bg-slate-100 flex-1"></div>
          </div>

          {loadingProfiles ? (
             <div className="py-10 text-center">
                <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
             </div>
          ) : filteredProfiles.length > 0 ? (
            filteredProfiles.map(p => {
              const displayName = (p.nome && p.nome.includes('@')) || !p.nome 
                ? p.email.split('@')[0].split(/[._-]/).map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
                : p.nome;
              
              const isSelected = os.tecnico_id === p.id;

              return (
                <button
                  key={p.id}
                  disabled={isSaving || isSelected}
                  onClick={() => handleAssign(p.id, displayName)}
                  className={`w-full p-4 rounded-2xl border-2 flex items-center justify-between transition-all ${
                    isSelected 
                      ? 'bg-primary/5 border-primary/20' 
                      : 'bg-white border-slate-50 hover:border-primary/20 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-4 text-left">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isSelected ? 'bg-primary text-white' : 'bg-slate-100 text-slate-400'}`}>
                      <User size={20} />
                    </div>
                    <div>
                      <p className={`text-sm font-black uppercase tracking-tight ${isSelected ? 'text-primary' : 'text-slate-700'}`}>{displayName}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{String(p.cargo || 'OPERADOR').toUpperCase()}</p>
                    </div>
                  </div>
                  {isSelected && (
                    <span className="text-[9px] font-black text-primary uppercase tracking-widest px-2 py-1 bg-primary/10 rounded-lg">Atual</span>
                  )}
                </button>
              );
            })
          ) : (
            <div className="py-10 text-center text-slate-400 opacity-50">
               <p className="text-xs font-bold uppercase tracking-widest">Nenhum colaborador encontrado</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AtribuirTecnicoModal;
