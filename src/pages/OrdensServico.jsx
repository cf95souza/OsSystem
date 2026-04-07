import React, { useState } from 'react';
import { 
  Search, 
  Plus, 
  Filter, 
  Eye, 
  FileText, 
  CheckCircle2, 
  Clock, 
  TrendingUp, 
  Printer, 
  ShieldAlert, 
  ExternalLink,
  User,
  Car as CarIcon,
  Zap,
  PackageCheck,
  UserMinus,
  DollarSign,
  Edit2
} from 'lucide-react';
import { useOrders } from '../hooks/useData';
import PagamentoModal from '../components/features/PagamentoModal';
import DetalhesServicoModal from '../components/features/DetalhesServicoModal';
import { useAuth } from '../contexts/AuthContext';
import { getStatusStyle, formatCurrency } from '../utils/statusUtils';
import CarVisualChecklist from '../components/features/CarVisualChecklist';
import CertificadoGarantia from '../components/features/CertificadoGarantia';
import { sendWhatsApp, getServiceFinishedMsg, getVehicleReceivedMsg } from '../utils/whatsappUtils';
import { toast } from '../utils/toast';
import { confirmDialog } from '../utils/confirm';

const OrdensServico = () => {
  const { orders, loading, deliverOrder, updateOrderProgress, registerPayment, deletePayment, removeServiceFromOrder } = useOrders();
  const [searchTerm, setSearchTerm] = useState('');
  const [showChecklist, setShowChecklist] = useState(false);
  const [showCertificado, setShowCertificado] = useState(false);
  const [showPagamento, setShowPagamento] = useState(false);
  const [showDetalhes, setShowDetalhes] = useState(false);
  const { isAdmin, isGestor } = useAuth();
  const isManagement = isAdmin || isGestor;
  const [activePaymentOS, setActivePaymentOS] = useState(null);
  const [activeOS, setActiveOS] = useState(null);

  // Deriva o OS ativo da lista geral para garantir reatividade após updates (Fase 41)
  const currentActiveOS = activeOS ? (orders || []).find(o => o.id === activeOS.id) : null;
  const currentActivePaymentOS = activePaymentOS ? (orders || []).find(o => o.id === activePaymentOS.id) : null;

  const filteredOrders = (orders || []).filter(os => 
    os && os.status !== 'ORCAMENTO' && (
      String(os.cliente_nome || '').toLowerCase().includes(String(searchTerm || '').toLowerCase()) ||
      String(os.veiculo_desc || '').toLowerCase().includes(String(searchTerm || '').toLowerCase()) ||
      String(os.id || '').toLowerCase().includes(String(searchTerm || '').toLowerCase())
    )
  );

  return (
    <div className="fade-in space-y-6 pb-20">
      {/* Header OS */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight uppercase tracking-tighter">Ordens de Serviço</h2>
          <p className="text-sm text-slate-500 font-medium">Fluxo de produção e certificação de garantia.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
           <div className="relative group w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Buscar OS, Cliente ou Veículo..."
                className="pl-10 pr-4 py-3 bg-white border border-slate-100 rounded-2xl text-sm font-bold focus:ring-4 focus:ring-primary/5 outline-none w-full md:w-96 transition-all shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
           </div>
        </div>
      </div>

      {/* Grid de Resumo */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between border-l-4 border-l-amber-500">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Aguardando</p>
            <h4 className="text-3xl font-bold text-slate-800 tracking-tight">
                {(orders || []).filter(o => o && String(o.status || '').toUpperCase().includes('AGUARDA')).length}
            </h4>
          </div>
          <div className="w-12 h-12 bg-amber-50 rounded-md flex items-center justify-center">
            <Clock className="text-amber-500" size={24} />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between border-l-4 border-l-blue-500">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Em Execução</p>
            <h4 className="text-3xl font-bold text-slate-800 tracking-tight">
                {(orders || []).filter(o => o && String(o.status || '').toUpperCase().includes('EXECU')).length}
            </h4>
          </div>
          <div className="w-12 h-12 bg-blue-50 rounded-md flex items-center justify-center">
             <TrendingUp size={24} className="text-blue-500" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between border-l-4 border-l-emerald-500">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Concluídas</p>
            <h4 className="text-3xl font-bold text-slate-800 tracking-tight">
                {(orders || []).filter(o => o && String(o.status || '').toUpperCase().includes('CONCLU')).length}
            </h4>
          </div>
          <div className="w-12 h-12 bg-emerald-50 rounded-md flex items-center justify-center">
            <CheckCircle2 size={24} className="text-emerald-500" />
          </div>
        </div>
        <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm flex items-center justify-between border-l-4 border-l-slate-400">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Entregues</p>
            <h4 className="text-3xl font-bold text-slate-800 tracking-tight">
                {(orders || []).filter(o => o && String(o.status || '').toUpperCase() === 'ENTREGUE').length}
            </h4>
          </div>
          <div className="w-12 h-12 bg-slate-50 rounded-md flex items-center justify-center">
            <ExternalLink size={24} className="text-slate-400" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">Cód / Data</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Veículo / Cliente</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Serviço / Status</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Responsável</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Progresso</th>
                <th className="px-6 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                        <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest animate-pulse">Carregando ordens...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredOrders.map((os) => os && (
                <tr key={os.id} className="hover:bg-slate-50/50 transition-all group cursor-default">
                  <td className="px-6 py-6">
                    <p className="text-xs font-black text-slate-800 tracking-tighter italic">#{os.id}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">
                        {os.created_at && !isNaN(new Date(os.created_at).getTime()) 
                          ? new Date(os.created_at).toLocaleDateString('pt-BR') 
                          : '--'}
                    </p>
                  </td>
                  <td className="px-6 py-6">
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-primary/10 group-hover:text-primary group-hover:border-primary/20 border border-slate-200 transition-all duration-300">
                        <User size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-700 leading-none">{os.cliente_nome}</p>
                        <p className="text-[11px] text-slate-400 font-bold mt-1.5 uppercase tracking-tighter">{os.veiculo_desc}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-6">
                    <div className="space-y-2">
                        <span className="text-xs font-bold text-slate-600 block line-clamp-1">{os.servico || 'Estética Automotiva'}</span>
                        <span className={`inline-block px-3 py-1 rounded-xl text-[9px] font-black border uppercase tracking-widest transition-all ${getStatusStyle(os.status || 'AGUARDANDO')}`}>
                            {os.status || 'AGUARDANDO'}
                        </span>
                        <div className="flex items-center gap-2 mt-1">
                          {os.saldo_devedor > 0 ? (
                            <p className="text-[10px] font-black text-amber-500 uppercase tracking-tighter">
                              Falta {formatCurrency(os.saldo_devedor)}
                            </p>
                          ) : (
                            os.valor_pago > 0 && <p className="text-[10px] font-black text-emerald-500 uppercase tracking-tighter">Totalmente Pago</p>
                          )}
                        </div>
                    </div>
                  </td>
                  <td className="px-6 py-6 text-center">
                    <div className="flex flex-col items-center gap-1.5">
                       <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-[10px] font-black border transition-all ${os.tecnico ? 'bg-primary/10 text-primary border-primary/20' : 'bg-slate-50 text-slate-300 border-slate-100'}`}>
                          {os.tecnico ? <User size={14} /> : <UserMinus size={14} />}
                       </div>
                       <span className={`text-[9px] font-bold uppercase tracking-tight ${os.tecnico ? 'text-slate-600' : 'text-slate-300'}`}>
                          {os.tecnico || 'Nenhum'}
                       </span>
                    </div>
                  </td>
                  <td className="px-6 py-6 font-mono">
                     <div className="flex flex-col items-center gap-2">
                        <span className="text-[10px] font-black italic text-slate-800">{os.progresso || 0}%</span>
                        <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200/50 p-0.5">
                           <div 
                             className={`h-full rounded-full transition-all duration-1000 ${os.progresso === 100 ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.3)]' : 'bg-primary shadow-[0_0_10px_rgba(var(--primary-rgb),0.3)]'}`}
                             style={{ width: `${os.progresso || 0}%` }}
                           />
                        </div>
                     </div>
                  </td>
                  <td className="px-6 py-6 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                        <button 
                          onClick={() => { setActiveOS(os); setShowDetalhes(true); }}
                          className="p-2.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all border border-transparent hover:border-primary/20"
                          title="Visualizar Detalhes do Serviço"
                        >
                          <Eye size={20} />
                        </button>
                        <button 
                          onClick={() => { setActiveOS(os); setShowChecklist(true); }}
                          className={`p-2.5 rounded-xl transition-all border ${
                            os.has_checklist 
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100 shadow-sm' 
                              : 'text-slate-400 hover:text-primary hover:bg-primary/10 border-transparent hover:border-primary/20'
                          }`}
                          title={os.has_checklist ? "Ver Checklist Preenchido" : "Preencher Checklist"}
                        >
                          <FileText size={20} />
                        </button>
                        <button 
                          onClick={() => { setActivePaymentOS(os); setShowPagamento(true); }}
                          className={`p-2.5 rounded-xl transition-all border ${
                            os.saldo_devedor > 0 
                              ? 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100 shadow-sm' 
                              : 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100 shadow-sm'
                          }`}
                          title="Financeiro / Pagamentos"
                        >
                          <DollarSign size={20} />
                        </button>
                        {(os.status && String(os.status).toUpperCase() === 'CONCLUÍDO') && (
                          <>
                            <button 
                              onClick={() => { setActiveOS(os); setShowCertificado(true); }}
                              className="p-2.5 hover:bg-emerald-50 rounded-xl text-emerald-400 hover:text-emerald-600 transition-all border border-transparent hover:border-emerald-200"
                              title="Imprimir Garantia"
                            >
                              <Printer size={20} />
                            </button>
                            <button 
                              onClick={() => sendWhatsApp(os.cliente_telefone || '11999999999', getServiceFinishedMsg(os.cliente_nome, os.veiculo_desc, os.tracking_token || os.id))}
                              className="p-2.5 hover:bg-emerald-50 rounded-xl text-emerald-500 hover:text-emerald-700 transition-all border border-transparent hover:border-emerald-200"
                              title="Avisar no WhatsApp"
                            >
                              <Zap size={20} fill="currentColor" />
                            </button>
                            <button 
                              onClick={async () => {
                                const confirm = await confirmDialog(
                                  'Confirmar Entrega',
                                  'Deseja registrar a entrega do veículo ao cliente? Esta OS será finalizada e sairá da lista ativa.',
                                  'Confirmar Entrega',
                                  'Cancelar'
                                );
                                if (confirm) {
                                  const result = await deliverOrder(os.id);
                                  if (result.success) toast.success('Veículo entregue com sucesso!');
                                }
                              }}
                              className="p-2.5 hover:bg-amber-50 rounded-xl text-amber-600 hover:text-amber-800 transition-all border border-transparent hover:border-amber-200"
                              title="Confirmar Entrega"
                            >
                              <PackageCheck size={20} />
                            </button>
                          </>
                        )}
                        {(os.status && String(os.status).toUpperCase() === 'ENTREGUE') && (
                          <>
                            <button 
                              onClick={() => { setActiveOS(os); setShowCertificado(true); }}
                              className="p-2.5 hover:bg-emerald-50 rounded-xl text-emerald-400 hover:text-emerald-600 transition-all border border-transparent hover:border-emerald-200"
                              title="Imprimir Garantia"
                            >
                              <Printer size={20} />
                            </button>
                          </>
                        )}
                        {(os.status && !['CONCLUÍDO', 'ENTREGUE'].includes(String(os.status).toUpperCase())) && (
                           <button 
                             onClick={async () => {
                                const confirm = await confirmDialog(
                                  'Concluir Serviço',
                                  'Deseja marcar esta Ordem de Serviço como CONCLUÍDA? O status será atualizado na TV e o certificado de garantia será liberado.',
                                  'Concluir Agora',
                                  'Voltar'
                                );
                                if (confirm) {
                                  const result = await updateOrderProgress(os.id, { 
                                     status: 'CONCLUÍDO', 
                                     progresso: 100,
                                     data_fim: new Date().toISOString()
                                  });
                                  if (result.success) toast.success('Serviço concluído com sucesso!');
                                }
                             }}
                             className="p-2.5 hover:bg-emerald-50 rounded-xl text-emerald-500 hover:text-emerald-700 transition-all border border-transparent hover:border-emerald-200"
                             title="O serviço está pronto (Marcar como Concluído)"
                           >
                              <CheckCircle2 size={20} />
                           </button>
                        )}
                        <button 
                          onClick={() => {
                            if (String(os.status || '').toUpperCase().includes('CONCLU')) {
                              toast.info('Esse serviço já foi concluído! Utilize o botão de WhatsApp (Raio Verde) para avisar o cliente da retirada.');
                            } else {
                              const cleanPhone = (os.cliente_telefone || '').replace(/\D/g, '');
                              sendWhatsApp(cleanPhone || '11999999999', getVehicleReceivedMsg(os.cliente_nome, os.veiculo_desc, os.tracking_token || os.id));
                            }
                          }}
                          className="p-2.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-all border border-transparent hover:border-primary/20"
                          title={String(os.status||'').toUpperCase().includes('CONCLU') ? "Serviço Concluído" : "Reenviar Link de Acompanhamento Pelo WhatsApp"}
                        >
                          <ExternalLink size={20} />
                        </button>
                    </div>
                  </td>
                </tr>
              ))}
              {(!loading && (filteredOrders || []).length === 0) && (
                <tr>
                    <td colSpan="5" className="px-6 py-20 text-center opacity-30">
                        <CarIcon size={48} className="mx-auto mb-3" />
                        <p className="text-[10px] font-black uppercase tracking-widest">Nenhuma ordem encontrada</p>
                    </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showChecklist && <CarVisualChecklist osData={currentActiveOS} onClose={() => setShowChecklist(false)} />}
      {showCertificado && <CertificadoGarantia os={currentActiveOS} onClose={() => setShowCertificado(false)} />}
      {showPagamento && currentActivePaymentOS && (
        <PagamentoModal 
           os={currentActivePaymentOS}
           onClose={() => setShowPagamento(false)}
           onSave={registerPayment}
           onDelete={deletePayment}
        />
      )}
      {showDetalhes && currentActiveOS && (
        <DetalhesServicoModal 
          os={currentActiveOS} 
          onClose={() => {
            setShowDetalhes(false);
            setActiveOS(null);
          }} 
        />
      )}
    </div>
  );
};

export default OrdensServico;
