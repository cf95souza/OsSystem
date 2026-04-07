import React, { useState, useEffect } from 'react';
import { X, Save, DollarSign, ShieldCheck, Loader2, AlertTriangle, Calculator, Plus, Trash2, Search } from 'lucide-react';
import { formatCurrency } from '../../utils/statusUtils';
import { toast } from '../../utils/toast';
import { useCatalog } from '../../hooks/useData';

const EditOrderServicesModal = ({ order, onClose, onSave }) => {
  const [services, setServices] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [totalValue, setTotalValue] = useState(0);
  const { services: catalog, loading: loadingCatalog } = useCatalog();
  const [showAddService, setShowAddService] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (order && order.servicos_detalhados) {
      setServices(JSON.parse(JSON.stringify(order.servicos_detalhados)));
      setTotalValue(Number(order.valor_total || order.valor || 0));
    }
  }, [order]);

  const recalculateTotal = (currentServices) => {
    const newTotal = currentServices.reduce((acc, s) => acc + (Number(s.preco_base) || 0), 0);
    setTotalValue(newTotal);
  };

  const handlePriceChange = (index, newValue) => {
    const updated = [...services];
    const numericValue = Number(newValue);
    updated[index].preco_base = numericValue;
    setServices(updated);
    recalculateTotal(updated);
  };

  const handleWarrantyChange = (index, newWarranty) => {
    const updated = [...services];
    updated[index].garantia = newWarranty;
    setServices(updated);
  };

  const addService = (catalogService) => {
    const newService = {
      nome: catalogService.nome,
      preco_base: Number(catalogService.preco_venda || catalogService.valor || 0),
      garantia: catalogService.garantia || 'Sem Garantia',
      progresso: 0,
      controle_estoque: !!catalogService.materiais,
      materiais: catalogService.materiais || []
    };

    const updated = [...services, newService];
    setServices(updated);
    recalculateTotal(updated);
    setShowAddService(false);
    setSearchTerm('');
    toast.success(`${catalogService.nome} adicionado!`);
  };

  const removeService = (index) => {
    if (services.length <= 1) {
      toast.warning('A OS deve ter pelo menos um serviço.');
      return;
    }
    const updated = services.filter((_, idx) => idx !== index);
    setServices(updated);
    recalculateTotal(updated);
    toast.info('Item removido da lista temporária.');
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const result = await onSave(order.id, services, totalValue);
      if (result.success) {
        toast.success('Alterações salvas com sucesso!');
        onClose();
      } else {
        throw new Error(result.error?.message || 'Erro desconhecido');
      }
    } catch (error) {
      console.error(error);
      toast.error('Erro ao salvar: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

  const filteredCatalog = (catalog || []).filter(s => 
    s.nome.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!order) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[300] flex items-center justify-center p-4">
      <div className="bg-white rounded-[2.5rem] w-full max-w-2xl shadow-2xl border border-white/20 overflow-hidden animate-scaleUp flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="p-8 border-b border-slate-50 flex items-center justify-between shrink-0 bg-white">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center shadow-inner">
              <DollarSign size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Ajuste de Escopo e Valores</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">OS #{order.id} • {order.cliente_nome}</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-3 hover:bg-slate-50 rounded-full transition-all group"
          >
            <X size={24} className="text-slate-300 group-hover:text-slate-900" />
          </button>
        </div>

        {/* List of Services */}
        <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar bg-slate-50/30">
          
          <div className="flex items-center justify-between mb-2">
             <h4 className="text-[11px] font-black text-slate-400 uppercase tracking-widest px-1">Itens do Orçamento</h4>
             <button 
               onClick={() => setShowAddService(!showAddService)}
               className="flex items-center gap-2 px-4 py-2 bg-primary/10 text-primary rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-primary/20 transition-all border border-primary/10"
             >
               <Plus size={14} /> {showAddService ? 'Fechar Busca' : 'Incluir Novo Serviço'}
             </button>
          </div>

          {/* Busca de Serviços do Catálogo */}
          {showAddService && (
            <div className="bg-white p-6 rounded-3xl border-2 border-primary/20 shadow-xl animate-dropdownIn mb-6 space-y-4">
               <div className="relative">
                 <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                 <input 
                   autoFocus
                   type="text" 
                   placeholder="Buscar no catálogo..."
                   className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-4 focus:ring-primary/10 transition-all text-sm font-bold"
                   value={searchTerm}
                   onChange={(e) => setSearchTerm(e.target.value)}
                 />
               </div>
               <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-2">
                 {filteredCatalog.length > 0 ? filteredCatalog.slice(0, 5).map(item => (
                   <button
                     key={item.id}
                     onClick={() => addService(item)}
                     className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100 group"
                   >
                     <div className="text-left">
                       <p className="text-xs font-black text-slate-700 uppercase">{item.nome}</p>
                       <p className="text-[10px] text-slate-400 font-bold group-hover:text-primary transition-colors">Padrão: {formatCurrency(item.preco_venda || item.valor)}</p>
                     </div>
                     <Plus size={16} className="text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                   </button>
                 )) : (
                   <p className="text-[10px] text-center py-4 text-slate-400 font-bold uppercase italic">Nenhum serviço disponível</p>
                 )}
               </div>
            </div>
          )}

          {order.valor_pago > 0 && (
            <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex gap-3 items-start">
              <AlertTriangle className="text-amber-500 shrink-0" size={18} />
              <p className="text-[10px] text-amber-700 font-bold uppercase tracking-wider leading-relaxed">
                Atenção: Esta OS já possui pagamentos registrados (R$ {order.valor_pago?.toLocaleString('pt-BR')}). 
              </p>
            </div>
          )}

          <div className="space-y-4">
            {services.map((service, index) => (
              <div key={index} className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm space-y-4 group">
                <div className="flex items-center justify-between">
                   <div className="flex items-center gap-3">
                     <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 font-black text-[10px]">
                       {index + 1}
                     </div>
                     <h4 className="font-black text-slate-700 uppercase text-xs tracking-tight">{service.nome}</h4>
                   </div>
                   <button 
                     onClick={() => removeService(index)}
                     className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all opacity-0 group-hover:opacity-100"
                     title="Remover este item"
                   >
                     <Trash2 size={16} />
                   </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div>
                    <label className="text-[9px] font-black uppercase text-slate-400 px-1 mb-1 block">Preço Acordado (R$)</label>
                    <div className="relative group">
                      <DollarSign size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
                      <input 
                        type="number"
                        step="0.01"
                        value={service.preco_base}
                        onChange={(e) => handlePriceChange(index, e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-4 focus:ring-primary/10 focus:bg-white transition-all font-bold text-sm shadow-inner"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[9px] font-black uppercase text-slate-400 px-1 mb-1 block">Garantia Oferecida</label>
                    <div className="relative group">
                      <ShieldCheck size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
                      <input 
                        type="text"
                        value={service.garantia}
                        onChange={(e) => handleWarrantyChange(index, e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl outline-none focus:ring-4 focus:ring-primary/10 focus:bg-white transition-all font-bold text-sm uppercase shadow-inner"
                        placeholder="Ex: 5 Anos"
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer with Total */}
        <div className="p-8 border-t border-slate-50 bg-white shrink-0 shadow-[0_-10px_40px_rgba(0,0,0,0.03)]">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4 px-6 py-4 rounded-3xl border border-slate-100 bg-slate-50 flex-1 w-full md:w-auto">
                <div className="w-12 h-12 bg-primary text-white rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20">
                  <Calculator size={24} />
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">Total Após Ajustes</p>
                  <p className="text-2xl font-black text-slate-800 tracking-tighter">{formatCurrency(totalValue)}</p>
                </div>
            </div>

            <div className="flex gap-3 w-full md:w-auto">
              <button 
                onClick={onClose}
                className="flex-1 md:flex-none px-8 py-5 text-slate-400 font-black uppercase text-[10px] hover:text-slate-600 tracking-widest transition-all"
              >
                Voltar
              </button>
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="flex-[2] md:flex-none px-10 py-5 bg-slate-900 text-white font-black uppercase text-[10px] rounded-2xl tracking-[0.2em] shadow-2xl shadow-slate-200 hover:-translate-y-1 active:translate-y-0 transition-all flex items-center justify-center gap-3 active:scale-[0.98]"
              >
                {isSaving ? <Loader2 className="animate-spin" size={18} /> : <><Save size={18} /> Salvar OS</>}
              </button>
            </div>
          </div>
        </div>

      </div>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes dropdownIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-dropdownIn { animation: dropdownIn 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
      `}} />
    </div>
  );
};

export default EditOrderServicesModal;
