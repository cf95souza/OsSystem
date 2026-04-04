import React, { useState } from 'react';
import { Plus, Search, Wrench, ShieldCheck, MoreHorizontal, DollarSign, Loader2, Type, Car, Trash2, X, Zap, AlertCircle } from 'lucide-react';
import { useCatalog, useInventory } from '../hooks/useData';
import { toast } from '../utils/toast';
import { confirmDialog } from '../utils/confirm';

const ServicosView = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editingService, setEditingService] = useState(null);
  const [formService, setFormService] = useState({
    nome: '',
    descricao: '',
    preco_base: '',
    categoria: 'Geral',
    tipo_veiculo: 'AMBOS',
    garantia: '12 meses',
    controle_estoque: false,
    materiais: []
  });

  const { inventory } = useInventory();

  const { services, loading, saveService, updateService, deleteService } = useCatalog();

  const handleOpenEdit = (service) => {
    setEditingService(service);
    setFormService({
      nome: service.nome || '',
      descricao: service.descricao || '',
      preco_base: service.preco_base || '',
      categoria: service.categoria || 'Geral',
      tipo_veiculo: service.tipo_veiculo || 'AMBOS',
      garantia: service.garantia || '12 meses',
      controle_estoque: service.controle_estoque || false,
      materiais: service.materiais || []
    });
    setShowAddModal(true);
  };

  const handleAddService = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    
    const serviceData = {
      ...formService,
      preco_base: parseFloat(formService.preco_base) || 0
    };

    let res;
    if (editingService) {
      res = await updateService(editingService.id, serviceData);
    } else {
      res = await saveService(serviceData);
    }

    setIsSaving(false);
    if (res.success) {
      toast.success(editingService ? 'Serviço atualizado com sucesso!' : 'Novo serviço adicionado ao catálogo!');
      setShowAddModal(false);
      setEditingService(null);
      setFormService({ nome: '', descricao: '', preco_base: '', categoria: 'Geral', tipo_veiculo: 'AMBOS', garantia: '12 meses', controle_estoque: false, materiais: [] });
    }
  };

  const handleOpenAdd = () => {
     setEditingService(null);
     setFormService({ nome: '', descricao: '', preco_base: '', categoria: 'Geral', tipo_veiculo: 'AMBOS', garantia: '12 meses', controle_estoque: false, materiais: [] });
     setShowAddModal(true);
  };

  const filteredServices = services.filter(s => 
    (s.nome || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (s.categoria || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="animate-spin text-primary mb-4" size={48} />
        <p className="text-slate-500 font-bold animate-pulse uppercase tracking-widest text-xs">Carregando catálogo...</p>
      </div>
    );
  }

  return (
    <div className="fade-in space-y-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Catálogo de Serviços</h2>
          <p className="text-sm text-slate-500 font-medium">Defina os serviços oferecidos e seus tempos de garantia.</p>
        </div>
        <button 
          onClick={handleOpenAdd}
          className="bg-primary text-white px-5 py-2.5 rounded-xl shadow-lg shadow-primary/20 flex items-center gap-2 hover:bg-emerald-600 transition-all font-black uppercase text-[10px] tracking-widest"
        >
          <Plus size={18} /> Novo Serviço
        </button>
      </div>

      <div className="relative w-full">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input 
          type="text" 
          placeholder="Buscar no catálogo..." 
          className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-primary/5 focus:border-primary/30 transition-all text-sm font-bold shadow-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredServices.map((s) => (
          <div key={s.id} className="bg-white p-8 flex flex-col justify-between border border-slate-100 rounded-[2rem] shadow-sm hover:shadow-xl hover:scale-[1.01] transition-all duration-300 group">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center gap-5">
                <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 border border-slate-100 group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all duration-300">
                  <Wrench size={28} />
                </div>
                <div>
                  <h4 className="font-black text-slate-800 text-lg leading-tight uppercase tracking-tight">{s.nome}</h4>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-primary bg-primary/5 px-2 py-0.5 rounded-md">{s.categoria || 'Geral'}</span>
                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-md border ${
                      s.tipo_veiculo === 'MOTO' ? 'bg-orange-50 text-orange-600 border-orange-100' : 
                      s.tipo_veiculo === 'CARRO' ? 'bg-blue-50 text-blue-600 border-blue-100' : 
                      'bg-slate-50 text-slate-500 border-slate-100'
                    }`}>
                      {s.tipo_veiculo === 'MOTO' ? 'Moto' : s.tipo_veiculo === 'CARRO' ? 'Carro' : 'Ambos'}
                    </span>
                  </div>
                </div>
              </div>
              <div className="relative">
                <button 
                  onClick={async () => {
                    const confirm = await confirmDialog(
                      'Excluir Serviço',
                      `Tem certeza que deseja remover "${s.nome}" do catálogo?`,
                      'Excluir',
                      'Cancelar'
                    );
                    if (confirm) {
                      const res = await deleteService(s.id);
                      if (res.success) {
                        toast.success('Serviço excluído!');
                      } else {
                        toast.error('Erro ao excluir serviço.');
                      }
                    }
                  }}
                  className="text-slate-300 hover:text-rose-600 p-2 transition-colors rounded-full hover:bg-rose-50"
                  title="Excluir Serviço"
                >
                  <Trash2 size={24} />
                </button>
              </div>
            </div>
            
            <p className="text-sm text-slate-500 mb-8 line-clamp-3 font-medium leading-relaxed italic">{s.descricao || 'Sem descrição cadastrada.'}</p>
            
            <div className="flex items-center justify-between pt-6 border-t border-slate-50">
              <div className="flex items-center gap-6">
                <div className="flex flex-col">
                  <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest mb-1 items-center flex gap-1">
                    <ShieldCheck size={10} className="text-emerald-500" /> Garantia
                  </span>
                  <span className="text-xs font-bold text-slate-600">{s.garantia || 'Consultar'}</span>
                </div>
                
                {s.controle_estoque && (
                  <div className="flex flex-col border-l border-slate-100 pl-6">
                     <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest mb-1 items-center flex gap-1">
                      <ShieldCheck size={10} className="text-blue-500" /> Estoque
                    </span>
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded uppercase tracking-widest mt-0.5">Controlado</span>
                  </div>
                )}
                
                <div className="flex flex-col border-l border-slate-100 pl-6">
                   <span className="text-[8px] font-black uppercase text-slate-400 tracking-widest mb-1 items-center flex gap-1">
                    <DollarSign size={10} className="text-primary" /> Investimento
                  </span>
                  <span className="text-lg font-black text-slate-800 tracking-tighter">
                    {s.preco_base ? new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(s.preco_base) : '---'}
                  </span>
                </div>
              </div>
              <button 
                onClick={() => handleOpenEdit(s)}
                className="text-[10px] font-black text-primary hover:text-emerald-700 uppercase tracking-[0.2em] transition-all bg-primary/5 px-4 py-2 rounded-xl border border-primary/10 hover:border-primary/30"
              >
                Detalhes
              </button>
            </div>
          </div>
        ))}
        {filteredServices.length === 0 && (
          <div className="col-span-full py-20 text-center opacity-30">
            <Wrench size={48} className="mx-auto mb-3" />
            <p className="font-black uppercase tracking-widest text-xs">Nenhum serviço no catálogo</p>
          </div>
        )}
      </div>

      {/* Modal - Novo Serviço / Edição */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[3rem] w-full max-w-2xl shadow-2xl border border-white/20 flex flex-col overflow-hidden animate-in fade-in zoom-in duration-300 max-h-[90vh]">
            {/* Header Fixo */}
            <div className="p-6 md:p-10 border-b border-slate-50 flex justify-between items-center bg-white shrink-0">
              <div>
                <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight">
                  {editingService ? 'Editar Serviço' : 'Cadastrar Serviço'}
                </h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] mt-1">Configurações do Catálogo de Estética</p>
              </div>
              <button 
                onClick={() => setShowAddModal(false)} 
                className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 hover:text-slate-800 transition-all group"
              >
                <Plus size={24} className="rotate-45 group-hover:scale-110 transition-transform" />
              </button>
            </div>
            
            {/* Conteúdo Rolável */}
            <form onSubmit={handleAddService} className="flex-1 overflow-y-auto p-10 space-y-6 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome do Serviço</label>
                  <div className="relative group">
                    <Wrench className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors" size={18} />
                    <input 
                      required 
                      className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-primary/5 focus:bg-white font-bold text-sm transition-all shadow-inner" 
                      placeholder="Ex: PPF Capô Frontal"
                      value={formService.nome}
                      onChange={e => setFormService({...formService, nome: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Categoria</label>
                  <div className="relative group">
                    <Type className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors" size={18} />
                    <select 
                      className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-primary/5 focus:bg-white font-bold text-sm appearance-none transition-all shadow-inner"
                      value={formService.categoria}
                      onChange={e => setFormService({...formService, categoria: e.target.value})}
                    >
                      <option value="Geral">Geral</option>
                      <option value="PPF">PPF</option>
                      <option value="Estética">Estética</option>
                      <option value="Insulfilm">Insulfilm</option>
                      <option value="Adesivagem">Adesivagem</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Veículos Compatíveis</label>
                  <div className="relative group">
                    <Car className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors" size={18} />
                    <select 
                      className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-primary/5 focus:bg-white font-bold text-sm appearance-none transition-all shadow-inner"
                      value={formService.tipo_veiculo}
                      onChange={e => setFormService({...formService, tipo_veiculo: e.target.value})}
                    >
                      <option value="AMBOS">Todos (Carro & Moto)</option>
                      <option value="CARRO">Apenas Carros</option>
                      <option value="MOTO">Apenas Motos</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tempo de Garantia</label>
                  <div className="relative group">
                    <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-primary transition-colors" size={18} />
                    <input 
                      className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-primary/5 focus:bg-white font-bold text-sm transition-all shadow-inner" 
                      placeholder="Ex: 12 meses"
                      value={formService.garantia}
                      onChange={e => setFormService({...formService, garantia: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Preço Base (R$)</label>
                  <div className="relative group">
                    <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-primary/40 group-focus-within:text-primary transition-colors">R$</span>
                    <input 
                      type="number" 
                      step="0.01" 
                      className="w-full pl-14 pr-6 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-primary/5 focus:bg-white font-black text-sm transition-all shadow-inner" 
                      placeholder="0,00"
                      value={formService.preco_base}
                      onChange={e => setFormService({...formService, preco_base: e.target.value})}
                    />
                  </div>
                </div>
              </div>
              
              <div className="space-y-2 pb-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Detalhamento Técnico / Descrição</label>
                <textarea 
                  className="w-full h-32 px-6 py-5 bg-slate-50 border border-slate-100 rounded-[1.5rem] outline-none focus:ring-4 focus:ring-primary/5 focus:bg-white font-bold text-sm resize-none shadow-inner transition-all" 
                  placeholder="Descreva os materiais inclusos e o que será feito..."
                  value={formService.descricao}
                  onChange={e => setFormService({...formService, descricao: e.target.value})}
                ></textarea>
              </div>

              <div className="flex flex-col gap-4 bg-blue-50/50 p-6 rounded-2xl border border-blue-100 transition-all">
                <div className="flex items-center gap-4">
                  <input 
                    type="checkbox" 
                    id="controle_estoque" 
                    className="w-6 h-6 rounded-lg text-primary border-slate-300 focus:ring-primary/20 transition-all cursor-pointer"
                    checked={formService.controle_estoque}
                    onChange={(e) => setFormService({...formService, controle_estoque: e.target.checked})}
                  />
                  <label htmlFor="controle_estoque" className="cursor-pointer select-none">
                    <span className="block text-sm font-black text-slate-800 tracking-tight">Habilitar Controle de Estoque</span>
                    <span className="block text-[10px] font-bold text-slate-500 mt-1 uppercase tracking-widest">Exige baixa obrigatória de material na OS (ex: Metros de PPF).</span>
                  </label>
                </div>

                {formService.controle_estoque && (
                  <div className="pt-4 border-t border-blue-100 flex flex-col mt-2 mb-2 animate-in fade-in slide-in-from-top-4">
                     <div className="flex items-center justify-between mb-4 px-1">
                         <label className="text-[10px] font-black text-blue-500 uppercase tracking-widest flex items-center gap-1">
                             <Zap size={12} className="text-blue-500" /> Insumos Padrão do Serviço
                         </label>
                     </div>

                     {(formService.materiais || []).map((mat, matIdx) => (
                       <div key={mat.id || matIdx} className="flex items-end gap-3 mb-3">
                         <div className="flex-1 space-y-1.5">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Material do Almoxarifado</label>
                            <select 
                              className="w-full px-4 py-3 bg-white border border-blue-100 rounded-xl outline-none focus:ring-4 focus:ring-blue-100 text-sm font-bold shadow-sm"
                              value={mat.material_id || ''}
                              onChange={e => {
                                 const next = [...(formService.materiais || [])];
                                 next[matIdx].material_id = e.target.value;
                                 setFormService({ ...formService, materiais: next });
                              }}
                            >
                              <option value="">Selecione o Produto...</option>
                              {inventory.map(inv => (
                                <option key={inv.id} value={inv.id}>{inv.nome} ({inv.quantidade} {inv.unidade})</option>
                              ))}
                            </select>
                         </div>
                         <div className="w-24 space-y-1.5">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Qtd</label>
                            <input 
                              type="number" 
                              min="0.1" 
                              step="any"
                              className="w-full px-4 py-3 bg-white border border-blue-100 rounded-xl outline-none focus:ring-4 focus:ring-blue-100 text-sm font-bold shadow-sm text-center"
                              value={mat.quantidade}
                              onChange={e => {
                                 const next = [...(formService.materiais || [])];
                                 next[matIdx].quantidade = e.target.value === '' ? '' : parseFloat(e.target.value) || 0;
                                 setFormService({ ...formService, materiais: next });
                              }}
                              placeholder="0"
                            />
                         </div>
                         <button 
                           type="button"
                           onClick={() => {
                              const next = (formService.materiais || []).filter((_, i) => i !== matIdx);
                              setFormService({ ...formService, materiais: next });
                           }}
                           className="w-11 h-11 shrink-0 flex items-center justify-center rounded-xl bg-white border border-rose-100 text-rose-400 hover:bg-rose-50 hover:text-rose-600 transition-all font-black"
                           title="Remover Insumo"
                         >
                           <X size={16} strokeWidth={3} />
                         </button>
                       </div>
                     ))}

                     <button 
                       type="button"
                       onClick={() => {
                          const next = [...(formService.materiais || []), { id: Date.now(), material_id: '', quantidade: '' }];
                          setFormService({ ...formService, materiais: next });
                       }}
                       className="mt-2 text-[10px] font-black uppercase text-blue-500 hover:text-blue-700 bg-white/50 hover:bg-white px-4 py-2.5 rounded-xl self-start flex items-center gap-2 transition-all border border-blue-200/50 shadow-sm"
                     >
                       <Plus size={14} /> Adicionar Item
                     </button>
                  </div>
                )}
              </div>
            </form>

            {/* Rodapé Fixo */}
            <div className="p-6 md:p-8 border-t border-slate-50 shrink-0 bg-white">
              <div className="flex flex-col-reverse md:flex-row gap-4">
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-8 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={handleAddService}
                  disabled={isSaving}
                  className="flex-1 bg-primary text-white py-5 rounded-[2rem] shadow-xl shadow-primary/20 uppercase tracking-[0.2em] font-black text-[10px] flex items-center justify-center gap-3 hover:bg-emerald-600 transition-all active:scale-[0.98]"
                >
                  {isSaving ? <Loader2 className="animate-spin" size={20} /> : <Plus size={20} />}
                  {editingService ? 'Atualizar Serviço' : 'Salvar no Catálogo'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServicosView;
