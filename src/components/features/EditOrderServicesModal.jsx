import React, { useState, useEffect } from 'react';
import { X, Save, DollarSign, ShieldCheck, Loader2, AlertTriangle, Calculator } from 'lucide-react';
import { formatCurrency } from '../../utils/statusUtils';
import { toast } from '../../utils/toast';

const EditOrderServicesModal = ({ order, onClose, onSave }) => {
  const [services, setServices] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [totalValue, setTotalValue] = useState(0);

  useEffect(() => {
    if (order && order.servicos_detalhados) {
      // Clona o array para evitar mutação direta
      setServices(JSON.parse(JSON.stringify(order.servicos_detalhados)));
      setTotalValue(Number(order.valor_total || order.valor || 0));
    }
  }, [order]);

  const handlePriceChange = (index, newValue) => {
    const updated = [...services];
    // Remove R$, pontos e converte vírgula para ponto se vier de máscara (simplificado)
    const numericValue = Number(newValue.replace(/[^0-9.-]+/g, ""));
    updated[index].preco_base = numericValue;
    setServices(updated);
    
    // Recalcula o total
    const newTotal = updated.reduce((acc, s) => acc + (Number(s.preco_base) || 0), 0);
    setTotalValue(newTotal);
  };

  const handleWarrantyChange = (index, newWarranty) => {
    const updated = [...services];
    updated[index].garantia = newWarranty;
    setServices(updated);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const result = await onSave(order.id, services, totalValue);
      if (result.success) {
        toast.success('Valores e Garantias atualizados com sucesso!');
        onClose();
      } else {
        throw new Error(result.error?.message || 'Erro desconhecido');
      }
    } catch (error) {
      console.error(error);
      toast.error('Erro ao salvar alterações: ' + error.message);
    } finally {
      setIsSaving(false);
    }
  };

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
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-tighter">Ajuste de Valores e Garantia</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">OS #{order.id} • Edição Administrativa</p>
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
        <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
          
          {order.valor_pago > 0 && (
            <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 flex gap-3 items-start">
              <AlertTriangle className="text-amber-500 shrink-0" size={18} />
              <p className="text-[10px] text-amber-700 font-bold uppercase tracking-wider leading-relaxed">
                Atenção: Esta OS já possui pagamentos registrados (R$ {order.valor_pago}). 
                Alterar o valor total agora impactará o saldo devedor do cliente.
              </p>
            </div>
          )}

          <div className="space-y-4">
            {services.map((service, index) => (
              <div key={index} className="p-6 bg-slate-50 rounded-3xl border border-slate-100 space-y-4">
                <div className="flex items-center justify-between">
                   <h4 className="font-black text-slate-700 uppercase text-xs tracking-tight">{service.nome}</h4>
                   <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Item #{index + 1}</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[9px] font-black uppercase text-slate-400 px-1 mb-1 block">Preço de Venda (R$)</label>
                    <div className="relative group">
                      <DollarSign size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
                      <input 
                        type="number"
                        step="0.01"
                        value={service.preco_base}
                        onChange={(e) => handlePriceChange(index, e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-primary/10 transition-all font-bold text-sm"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[9px] font-black uppercase text-slate-400 px-1 mb-1 block">Prazo de Garantia</label>
                    <div className="relative group">
                      <ShieldCheck size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
                      <input 
                        type="text"
                        value={service.garantia}
                        onChange={(e) => handleWarrantyChange(index, e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-primary/10 transition-all font-bold text-sm uppercase"
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
        <div className="p-8 border-t border-slate-50 bg-slate-50/50 shrink-0">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4 bg-white px-6 py-4 rounded-2xl border border-slate-100 shadow-sm">
                <div className="w-10 h-10 bg-primary/10 text-primary rounded-xl flex items-center justify-center">
                  <Calculator size={20} />
                </div>
                <div>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Novo Valor Total</p>
                  <p className="text-xl font-black text-slate-800 tracking-tighter">{formatCurrency(totalValue)}</p>
                </div>
            </div>

            <div className="flex gap-2 w-full md:w-auto">
              <button 
                onClick={onClose}
                className="flex-1 md:flex-none px-4 py-4 text-slate-500 font-black uppercase text-[10px] hover:bg-slate-100 rounded-2xl tracking-widest transition-all"
              >
                Descartar
              </button>
              <button 
                onClick={handleSave}
                disabled={isSaving}
                className="flex-[2] md:flex-none px-6 py-4 bg-primary text-white font-black uppercase text-[10px] rounded-2xl tracking-widest shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
              >
                {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                Salvar Alterações
              </button>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default EditOrderServicesModal;
