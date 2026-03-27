import React, { useState } from 'react';
import { 
  Plus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  FilePlus, 
  Car, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  TrendingUp,
  ArrowUpRight,
  Zap,
  X
} from 'lucide-react';
import { useQuotes, useCatalog } from '../hooks/useData';
import AgendamentoModal from '../components/features/AgendamentoModal';
import NovoOrcamentoModal from '../components/features/NovoOrcamentoModal';
import { sendWhatsApp, getBudgetMsg, getAppointmentMsg } from '../utils/whatsappUtils';

const Vendas = () => {
  const { quotes, loading, saveQuote, approveQuote, reopenQuote, deleteQuote } = useQuotes();
  const [searchTerm, setSearchTerm] = useState('');
  const [showNovoModal, setShowNovoModal] = useState(false);
  const [showAgendaModal, setShowAgendaModal] = useState(false);
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [activeMenuQuote, setActiveMenuQuote] = useState(null);

  const getStatusStyle = (status) => {
    switch (status) {
      case 'APROVADO': return 'bg-emerald-50 text-emerald-600 border-emerald-100';
      case 'PENDENTE': return 'bg-amber-50 text-amber-600 border-amber-100';
      case 'REJEITADO': return 'bg-rose-50 text-rose-600 border-rose-100';
      case 'AGUARDANDO': return 'bg-blue-50 text-blue-600 border-blue-100';
      case 'EM EXECUÇÃO': return 'bg-blue-50 text-blue-500 border-blue-100';
      case 'CONCLUÍDO': return 'bg-emerald-50 text-emerald-500 border-emerald-50';
      case 'ENTREGUE': return 'bg-slate-100 text-slate-500 border-slate-200';
      default: return 'bg-slate-50 text-slate-600 border-slate-100';
    }
  };

  // Cálculos Reais de Vendas
  const aguardandoFaturamento = (quotes || [])
    .filter(q => q && q.status === 'ORCAMENTO')
    .reduce((acc, q) => acc + (Number(q.valor) || 0), 0);

  const convertidosFaturamento = (quotes || [])
    .filter(q => q && q.status !== 'ORCAMENTO')
    .reduce((acc, q) => acc + (Number(q.valor) || 0), 0);

  const aprovados = (quotes || []).filter(q => q && q.status !== 'ORCAMENTO');
  const ticketMedio = aprovados.length > 0 ? convertidosFaturamento / aprovados.length : 0;

  const handleApprove = async (quote) => {
    setSelectedQuote(quote);
    setShowAgendaModal(true);
  };

  const confirmApproval = async (appointmentData) => {
    const result = await approveQuote(appointmentData);
    if (result.success) {
        setShowAgendaModal(false);
        
        // Dispara aviso opcional de WhatsApp para Agendamento Confirmado
        if (window.confirm('Orçamento aprovado e agendado com sucesso! Deseja enviar a confirmação de horário por WhatsApp ao cliente?')) {
            const dateObj = new Date(appointmentData.data_agendamento);
            const dataStr = dateObj.toLocaleDateString('pt-BR');
            const horaStr = dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
            const cleanPhone = (selectedQuote.cliente_telefone || '').replace(/\D/g, '');
            sendWhatsApp(cleanPhone || '11999999999', getAppointmentMsg(selectedQuote.cliente_nome, dataStr, horaStr, selectedQuote.servico || 'Estética Automotiva'));
        }

        setSelectedQuote(null);
    }
  };

  const handleReopen = async (quote) => {
    if (window.confirm(`Deseja reabrir o orçamento #${quote.id}? O agendamento anterior será removido.`)) {
      const result = await reopenQuote(quote.id);
      if (result.success) {
        setSelectedQuote(null);
      }
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este orçamento permanentemente?')) {
      const result = await deleteQuote(id);
      if (result.success) setActiveMenuQuote(null);
    }
  };

  const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  const filteredQuotes = (quotes || []).filter(q => 
    q && (
      (q.cliente_nome || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (q.veiculo_desc || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (q.id || '').toString().toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  return (
    <div className="fade-in space-y-6 pb-20">
      {/* Header Profissional */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase tracking-tighter">Vendas e Orçamentos</h2>
          <p className="text-sm text-slate-500 font-medium">Converta interessados em clientes premium.</p>
        </div>
        <button 
          onClick={() => setShowNovoModal(true)}
          className="btn-primary flex items-center gap-2 group shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-all"
        >
          <FilePlus size={18} className="group-hover:scale-110 transition-transform" /> 
          Novo Orçamento
        </button>
      </div>

      {/* KPIs de Conversão Dinâmicos */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card-premium p-6 flex items-center justify-between border-0 shadow-xl shadow-slate-200/50 bg-white group">
          <div className="flex-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Aguardando Aprovação</p>
            {loading ? (
                <div className="h-8 w-24 bg-slate-50 animate-pulse rounded-lg"></div>
            ) : (
                <h4 className="text-2xl font-black text-slate-800">{formatCurrency(aguardandoFaturamento)}</h4>
            )}
            <p className="text-[10px] text-amber-500 font-bold mt-1 uppercase tracking-wider">
                {(quotes || []).filter(q => q.status === 'ORCAMENTO').length} Orçamentos ativos
            </p>
          </div>
          <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500 shadow-inner group-hover:scale-110 transition-transform">
            <Clock size={28} />
          </div>
        </div>

        <div className="card-premium p-6 flex items-center justify-between border-0 shadow-xl shadow-slate-200/50 bg-white group">
          <div className="flex-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Total Convertido</p>
             {loading ? (
                <div className="h-8 w-24 bg-slate-50 animate-pulse rounded-lg"></div>
            ) : (
                <h4 className="text-2xl font-black text-slate-800">{formatCurrency(convertidosFaturamento)}</h4>
            )}
            <p className="text-[10px] text-emerald-500 font-bold mt-1 uppercase tracking-wider">
                Taxa: {quotes.length > 0 ? Math.round((aprovados.length / quotes.length) * 100) : 0}% de sucesso
            </p>
          </div>
          <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-emerald-500 shadow-inner group-hover:scale-110 transition-transform">
            <TrendingUp size={28} />
          </div>
        </div>

        <div className="card-premium p-6 flex items-center justify-between border-0 shadow-xl shadow-slate-200/50 bg-white group">
          <div className="flex-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Ticket Médio</p>
             {loading ? (
                <div className="h-8 w-24 bg-slate-50 animate-pulse rounded-lg"></div>
            ) : (
                <h4 className="text-2xl font-black text-slate-800">{formatCurrency(ticketMedio)}</h4>
            )}
            <p className="text-[10px] text-primary font-bold mt-1 uppercase tracking-wider">Média por venda aprovada</p>
          </div>
          <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary shadow-inner group-hover:scale-110 transition-transform">
            <ArrowUpRight size={28} />
          </div>
        </div>
      </div>

      {/* Barra de Busca e Filtros */}
      <div className="flex flex-col md:flex-row gap-3 items-center">
        <div className="relative flex-1 w-full group">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            placeholder="Buscar por cliente, veículo ou código..." 
            className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/20 transition-all text-sm font-bold shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="flex items-center gap-2 px-8 py-4 bg-white border border-slate-100 rounded-2xl text-sm font-black text-slate-600 hover:bg-slate-50 transition-all shadow-sm uppercase tracking-widest">
          <Filter size={18} /> Filtros
        </button>
      </div>

      {/* Tabela de Orçamentos */}
      <div className="card-premium border-none shadow-2xl shadow-slate-200/50">
        <div className="overflow-x-auto overflow-y-visible">
          <table className="w-full text-left border-collapse">
            <thead className="bg-slate-50/50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Cód / Data</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Cliente / Veículo</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Serviço Proposto</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Valor Total</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-center">Status</th>
                <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-8 h-8 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Carregando propostas...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredQuotes.map((q) => (
                <tr key={q.id} className="hover:bg-slate-50/30 transition-all group">
                  <td className="px-6 py-4">
                    <p className="text-xs font-black text-slate-800 tracking-tighter italic">#{q.id}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">
                                {q.data && !isNaN(new Date(q.data).getTime()) 
                                  ? new Date(q.data).toLocaleDateString('pt-BR') 
                                  : '--'}
                            </p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center text-slate-300 group-hover:bg-primary/10 group-hover:text-primary transition-all duration-300 border border-slate-100">
                        <Car size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-700 leading-none">{q.cliente_nome}</p>
                        <p className="text-[11px] text-slate-400 font-bold mt-1.5 uppercase tracking-tighter">{q.veiculo_desc}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-bold text-slate-500 line-clamp-1">{q.servico || 'Detalhamento Premium'}</span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-black text-slate-800">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(q.valor || 0)}
                    </p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center">
                      <span className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border transition-all ${getStatusStyle(q.status)}`}>
                        {q.status}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1 relative">
                      <button 
                        onClick={() => setSelectedQuote(q)}
                        className="p-2.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all" 
                        title="Ver Detalhes"
                      >
                        <ArrowUpRight size={20} />
                      </button>
                        <button 
                          onClick={() => {
                            const cleanPhone = (q.cliente_telefone || '').replace(/\D/g, '');
                            sendWhatsApp(cleanPhone || '11999999999', getBudgetMsg(q.cliente_nome, q.veiculo_desc, q.valor, q.servicos_detalhados, q.servico));
                          }}
                          className="p-2.5 hover:bg-emerald-50 rounded-xl text-emerald-400 hover:text-emerald-600 transition-all font-bold"
                          title="Enviar por WhatsApp"
                        >
                          <Zap size={20} fill="currentColor" />
                        </button>
                        <div>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveMenuQuote(q);
                            }}
                            className="p-2.5 rounded-xl transition-all text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                          >
                            <MoreHorizontal size={20} />
                          </button>
                        </div>
                    </div>
                  </td>
                </tr>
              ))}
              {!loading && filteredQuotes.length === 0 && (
                 <tr>
                  <td colSpan="6" className="px-6 py-20 text-center opacity-30">
                    <FilePlus size={48} className="mx-auto mb-3" />
                    <p className="font-bold uppercase tracking-widest text-xs">Nenhum orçamento encontrado</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Detalhes do Orçamento */}
      {selectedQuote && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[200] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-2xl p-8 md:p-12 shadow-2xl border border-white/20 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center shadow-inner">
                  <ArrowUpRight size={24} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Detalhes da Proposta</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">#{selectedQuote.id} • {selectedQuote.status}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedQuote(null)}
                className="p-4 hover:bg-slate-50 rounded-full transition-all group"
              >
                <X size={24} className="text-slate-300 group-hover:text-slate-900" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50 p-6 rounded-3xl border border-slate-100">
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Cliente</label>
                  <p className="font-bold text-slate-800">{selectedQuote.cliente_nome}</p>
                </div>
                <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Veículo</label>
                  <p className="font-bold text-slate-800">{selectedQuote.veiculo_desc}</p>
                </div>
                <div className="md:col-span-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Serviços Selecionados</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {(selectedQuote.servico || 'Detalhamento Premium').split(',').map((serv, i) => (
                      <span key={i} className="bg-white border border-slate-200 shadow-sm text-slate-600 text-[10px] font-black uppercase px-3 py-1.5 rounded-lg">
                        {serv.trim()}
                      </span>
                    ))}
                  </div>
                </div>
                {selectedQuote.data_agendamento && (
                  <div className="md:col-span-2 bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
                    <label className="text-[9px] font-black text-blue-400 uppercase tracking-widest block mb-1 flex items-center gap-2">
                      <Clock size={12} /> Data do Agendamento
                    </label>
                    <p className="font-black text-blue-800 text-sm">
                      {new Date(selectedQuote.data_agendamento).toLocaleString('pt-BR', { dateStyle: 'full', timeStyle: 'short' })}
                    </p>
                  </div>
                )}
                {selectedQuote.observacoes && (
                  <div className="md:col-span-2 bg-white p-4 rounded-2xl border border-slate-200">
                    <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Observações Privadas</label>
                    <p className="text-xs text-slate-600 italic font-medium">{selectedQuote.observacoes}</p>
                  </div>
                )}
              </div>

              <div className="p-6 border-2 border-slate-50 rounded-3xl space-y-4">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest block">Resumo Financeiro</label>
                <div className="flex items-center justify-between py-2 border-b border-slate-50">
                  <span className="text-sm font-medium text-slate-500">Valor Estimado:</span>
                  <span className="text-lg font-black text-slate-800 font-mono tracking-tighter">{formatCurrency(selectedQuote.valor)}</span>
                </div>
                <div className="bg-primary/5 p-4 rounded-2xl italic text-[10px] text-primary/70 font-medium">
                  Este valor é uma estimativa baseada nos serviços pré-selecionados e pode variar após o laudo técnico presencial.
                </div>
              </div>

               <div className="flex gap-4 pt-4">
                 {selectedQuote.status === 'ORCAMENTO' ? (
                   <button 
                     onClick={() => handleApprove(selectedQuote)}
                     className="flex-1 py-5 bg-emerald-600 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-emerald-200 hover:-translate-y-1 active:translate-y-0 transition-all font-bold"
                   >
                     APROVAR
                   </button>
                 ) : (
                   <button 
                     onClick={() => handleReopen(selectedQuote)}
                     className="flex-1 py-5 bg-amber-500 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-amber-200 hover:-translate-y-1 active:translate-y-0 transition-all font-bold"
                   >
                     Reabrir Orçamento
                   </button>
                 )}
                <button 
                   onClick={() => {
                     const cleanPhone = (selectedQuote.cliente_telefone || '').replace(/\D/g, '');
                     sendWhatsApp(cleanPhone || '11999999999', getBudgetMsg(selectedQuote.cliente_nome, selectedQuote.veiculo_desc, selectedQuote.valor, selectedQuote.servicos_detalhados, selectedQuote.servico));
                   }}
                  className="flex-1 py-5 bg-slate-900 text-white rounded-[2rem] text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-slate-200 hover:-translate-y-1 active:translate-y-0 transition-all flex items-center justify-center gap-2 font-bold"
                >
                  <Zap size={14} fill="currentColor" /> Enviar WhatsApp
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Independente de Ações (Substitui os 3 pontinhos com scroll bug) */}
      {activeMenuQuote && (
        <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-sm z-[200] flex items-center justify-center p-4" onClick={() => setActiveMenuQuote(null)}>
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl animate-scaleUp border border-white/20" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-black text-slate-800 uppercase text-sm tracking-widest">Ações • OS #{activeMenuQuote.id}</h3>
              <button 
                onClick={() => setActiveMenuQuote(null)} 
                className="p-2 hover:bg-slate-50 rounded-full transition-all text-slate-400 hover:text-slate-800"
              >
                <X size={18} />
              </button>
            </div>

            <div className="space-y-3">
              {activeMenuQuote.status === 'ORCAMENTO' ? (
                <button 
                  onClick={() => { handleApprove(activeMenuQuote); setActiveMenuQuote(null); }} 
                  className="w-full py-4 bg-emerald-50 text-emerald-600 font-black uppercase text-xs tracking-widest rounded-2xl flex items-center justify-center gap-2 hover:bg-emerald-100 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  <CheckCircle2 size={16} /> Aproveitar Proposta
                </button>
              ) : (
                <button 
                  onClick={() => { handleReopen(activeMenuQuote); setActiveMenuQuote(null); }} 
                  className="w-full py-4 bg-amber-50 text-amber-600 font-black uppercase text-xs tracking-widest rounded-2xl flex items-center justify-center gap-2 hover:bg-amber-100 hover:scale-[1.02] active:scale-[0.98] transition-all"
                >
                  <Zap size={16} /> Reabrir Orçamento
                </button>
              )}
              
              <div className="pt-4 mt-4 border-t border-slate-50">
                <button 
                  onClick={() => handleDelete(activeMenuQuote.id)} 
                  className="w-full py-4 text-rose-500 font-bold uppercase text-[10px] tracking-widest rounded-2xl flex items-center justify-center gap-2 hover:bg-rose-50 transition-all"
                >
                  <AlertCircle size={14} /> Excluir Permanentemente
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

       {showNovoModal && (
         <NovoOrcamentoModal 
           onClose={() => setShowNovoModal(false)}
           onSave={saveQuote}
         />
       )}

       {showAgendaModal && selectedQuote && (
         <AgendamentoModal 
            quote={selectedQuote}
            onClose={() => setShowAgendaModal(false)}
            onConfirm={confirmApproval}
         />
       )}
    </div>
  );
};

export default Vendas;
