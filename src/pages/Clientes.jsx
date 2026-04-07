import React, { useState } from 'react';
import { Plus, Search, Filter, MoreHorizontal, UserPlus, Car, Loader2, ArrowRight, FilePlus, X, Clock, CheckCircle2, History, Edit2 } from 'lucide-react';
import { useClients, useQuotes } from '../hooks/useData';
import NovoOrcamentoModal from '../components/features/NovoOrcamentoModal';
import DetalhesServicoModal from '../components/features/DetalhesServicoModal';
import { toast } from '../utils/toast';

const ClientesView = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const { clients, loading, saveClient, updateClient } = useClients();
  const { quotes, saveQuote } = useQuotes();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [selectedClientProfile, setSelectedClientProfile] = useState(null);
  const [showNovoModal, setShowNovoModal] = useState(false);
  const [selectedServiceDetails, setSelectedServiceDetails] = useState(null);

  // Filtragem básica local
  const filteredClients = clients.filter(c => 
    c.nome?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.telefone?.includes(searchTerm)
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="animate-spin text-primary mb-4" size={48} />
        <p className="text-slate-500 font-bold animate-pulse">Carregando Clientes...</p>
      </div>
    );
  }

  return (
    <div className="fade-in space-y-6">
      {/* Header da View */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Gestão de Clientes</h2>
          <p className="text-sm text-slate-500 font-medium">Cadastre e gerencie os proprietários e seus veículos.</p>
        </div>
        <button 
          onClick={() => { setEditingClient(null); setShowAddModal(true); }}
          className="btn-primary flex items-center gap-2 shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-all"
        >
          <UserPlus size={18} /> Novo Cliente
        </button>
      </div>

      {/* Barra de Ações */}
      <div className="flex flex-col md:flex-row gap-3 items-center">
        <div className="relative flex-1 w-full group">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            placeholder="Buscar por nome, telefone ou placa..." 
            className="w-full pl-10 pr-4 py-3 border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-sm font-medium"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="flex items-center gap-2 px-6 py-3 border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all w-full md:w-auto">
          <Filter size={18} /> Filtros
        </button>
      </div>

      {/* Tabela de Clientes */}
      <div className="card-premium overflow-hidden border-0 shadow-xl shadow-slate-200/50">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="bg-slate-50/50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cliente</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Contato</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Serviços</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Cadastro</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/50">
              {filteredClients.slice(0, 50).map((c) => (
                <tr key={c.id} onClick={() => setSelectedClientProfile(c)} className="hover:bg-slate-50/80 transition-all group cursor-pointer">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 font-black text-sm border border-slate-200 group-hover:bg-primary/10 group-hover:text-primary group-hover:border-primary/20 transition-all">
                        {c.nome?.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-sm font-bold text-slate-700 leading-tight">{c.nome}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-sm font-semibold text-slate-500 font-mono tracking-tighter">{c.telefone || 'Sem telefone'}</span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-2">
                       <span className="text-xs font-black text-slate-700 bg-slate-100 px-2 py-1 rounded-lg">
                          {(quotes || []).filter(q => q.cliente_id === c.id || q.cliente_telefone === c.telefone).length}
                       </span>
                       <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Itens</span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      {new Date(c.created_at).toLocaleDateString('pt-BR')}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-right">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingClient(c);
                        setShowAddModal(true);
                      }}
                      className="p-2.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all"
                      title="Editar Cadastro"
                    >
                      <Edit2 size={18} />
                    </button>
                  </td>
                </tr>
              ))}
              {filteredClients.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-2 opacity-30">
                      <Search size={48} />
                      <p className="font-bold">Nenhum cliente encontrado</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Simplicado para Novo Cliente / Edição */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4 zoom-in">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-scaleUp">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <h3 className="font-black text-slate-800 uppercase tracking-tighter">
                {editingClient ? 'Editar Cliente' : 'Cadastrar Novo Cliente'}
              </h3>
              <button onClick={() => { setShowAddModal(false); setEditingClient(null); }} className="text-slate-400 hover:text-slate-600 tracking-widest text-xs font-bold">FECHAR</button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.target);
              const data = Object.fromEntries(formData.entries());
              
              let res;
              if (editingClient) {
                 res = await updateClient(editingClient.id, data);
              } else {
                 res = await saveClient(data);
              }

              if (res.success) {
                  toast.success(editingClient ? 'Cliente atualizado!' : 'Cliente cadastrado com sucesso!');
                  setShowAddModal(false);
                  setEditingClient(null);
                  if (selectedClientProfile && editingClient?.id === selectedClientProfile.id) {
                     setSelectedClientProfile({...selectedClientProfile, ...data});
                  }
              } else {
                  if (res.error?.message?.includes('telefones') || res.error?.message?.includes('cadastrado')) {
                    toast.warning(res.error.message);
                  } else {
                    toast.error('Erro ao salvar. Verifique o banco!');
                  }
              }
            }} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">Nome Completo</label>
                <input name="nome" defaultValue={editingClient?.nome || ''} required className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-sm font-bold shadow-inner" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">WhatsApp / Telefone</label>
                <input name="telefone" defaultValue={editingClient?.telefone || ''} required className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-sm font-bold shadow-inner" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-1">E-mail (Opcional)</label>
                <input name="email" type="email" defaultValue={editingClient?.email || ''} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-sm font-bold shadow-inner" />
              </div>
              <button type="submit" className="w-full btn-primary py-4 rounded-2xl shadow-xl shadow-primary/20 mt-4 flex items-center justify-center gap-2">
                <Plus size={20} /> {editingClient ? 'Atualizar Dados' : 'Salvar Cliente'}
              </button>
            </form>
          </div>
        </div>
      )}
      {/* Painel Lateral Perfil do Cliente */}
      {selectedClientProfile && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex justify-end">
          <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-slideInRight">
            
            {/* Header Perfil */}
            <div className="p-6 bg-slate-50 flex items-start justify-between border-b border-slate-100">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-primary text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-lg shadow-primary/30">
                  {selectedClientProfile.nome.charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-800 uppercase tracking-tighter">{selectedClientProfile.nome}</h3>
                  <p className="text-xs text-slate-500 font-bold font-mono mt-1">{selectedClientProfile.telefone}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button 
                   onClick={() => { setEditingClient(selectedClientProfile); setShowAddModal(true); }}
                   className="p-2 hover:bg-slate-200 rounded-full transition-all text-primary hover:text-primary-dark"
                   title="Editar Informações Básicas"
                >
                  <Edit2 size={18} />
                </button>
                <button onClick={() => setSelectedClientProfile(null)} className="p-2 hover:bg-slate-200 rounded-full transition-all text-slate-400 hover:text-slate-700">
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Conteúdo (Histórico) */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div className="flex items-center justify-between">
                <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <History size={14} /> Histórico de Atendimentos
                </h4>
                <span className="text-[10px] font-black text-primary bg-primary/5 px-2 py-1 rounded-full border border-primary/10 transition-all">
                  {(quotes || []).filter(q => q.cliente_id === selectedClientProfile.id || q.cliente_telefone === selectedClientProfile.telefone).length} Serviços
                </span>
              </div>

              <div className="space-y-3">
                {quotes?.filter(q => q.cliente_id == selectedClientProfile.id || q.cliente_telefone === selectedClientProfile.telefone).length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
                    <History className="mx-auto text-slate-300 mb-3" size={32} />
                    <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Nenhum serviço registrado</p>
                  </div>
                ) : (
                  quotes?.filter(q => q.cliente_id == selectedClientProfile.id || q.cliente_telefone === selectedClientProfile.telefone)
                    .sort((a,b) => new Date(b.created_at) - new Date(a.created_at))
                    .map(quote => (
                    <div 
                      key={quote.id} 
                      onClick={() => setSelectedServiceDetails(quote)}
                      className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm hover:border-primary/40 hover:shadow-md transition-all group cursor-pointer active:scale-[0.98]"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[9px] font-black px-2 py-1 bg-slate-100 text-slate-500 rounded-md uppercase tracking-wider">#{quote.id}</span>
                        <span className={`text-[8px] font-black px-2 py-1 rounded-md uppercase tracking-widest ${
                          quote.status === 'CONCLUIDO' || quote.status === 'ENTREGUE' ? 'bg-emerald-50 text-emerald-600' :
                          quote.status === 'ORCAMENTO' ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'
                        }`}>
                          {quote.status}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-slate-800 mb-1">{quote.veiculo_desc}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-2 line-clamp-1">{quote.servico}</p>
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-50">
                        <span className="text-xs font-black text-slate-800 text-mono">
                           {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(quote.valor || 0)}
                        </span>
                        <div className="flex items-center gap-3">
                          <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                            <Clock size={10} /> {new Date(quote.created_at).toLocaleDateString()}
                          </span>
                          <div className="w-6 h-6 rounded-full bg-primary/5 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-all">
                            <ArrowRight size={12} strokeWidth={3} />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Ações (Gatilho para Orçamento) */}
            <div className="p-6 bg-white border-t border-slate-100 shadow-[0_-10px_40px_rgba(0,0,0,0.03)]">
              <button 
                onClick={() => setShowNovoModal(true)}
                className="w-full btn-primary py-4 rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-primary/20 hover:-translate-y-1 transition-all"
              >
                <FilePlus size={18} /> Cadastrar Novo Orçamento
              </button>
            </div>

          </div>
        </div>
      )}

      {/* Modal Novo Orçamento (Herdando Dados do Cliente Selecionado) */}
      {showNovoModal && (
         <NovoOrcamentoModal 
           onClose={() => setShowNovoModal(false)}
           onSave={saveQuote}
           initialClient={selectedClientProfile}
         />
      )}

      {/* Modal Detalhes do Serviço */}
      {selectedServiceDetails && (
        <DetalhesServicoModal 
          os={selectedServiceDetails}
          onClose={() => setSelectedServiceDetails(null)}
        />
      )}

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .animate-slideInRight { animation: slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
      `}} />
    </div>
  );
};

export default ClientesView;
