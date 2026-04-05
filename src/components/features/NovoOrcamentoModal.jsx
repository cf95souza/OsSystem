import React, { useState, useEffect } from 'react';
import { X, Save, User, Car, Wrench, DollarSign, Info, ChevronRight, Check, Search, UserPlus, Plus, FilePlus, Zap, Clock } from 'lucide-react';
import { useClients, useVehicles, useCatalog, useInventory } from '../../hooks/useData';
import { toast } from '../../utils/toast';

const NovoOrcamentoModal = ({ onClose, onSave, initialClient, defaultStatus, defaultDate, existingOrders = [] }) => {
  const { clients, saveClient } = useClients();
  const { services: catalog } = useCatalog();
  
  const [step, setStep] = useState(initialClient ? 2 : 1);
  const [searchTerm, setSearchTerm] = useState('');
  const [showQuickAddClient, setShowQuickAddClient] = useState(false);
  const [newClientData, setNewClientData] = useState({ nome: '', telefone: '', email: '' });
  
  const [selectedClient, setSelectedClient] = useState(initialClient ? initialClient.id : '');
  const [selectedVehicle, setSelectedVehicle] = useState('');
  const [selectedServices, setSelectedServices] = useState([]);
  const [subTotal, setSubTotal] = useState(0);
  const [desconto, setDesconto] = useState(0);
  const [valorTotal, setValorTotal] = useState(0);
  const [observacoes, setObservacoes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [selectedTime, setSelectedTime] = useState('08:00');

  // Estados para cadastro rápido de veículo
  const [showQuickAddVehicle, setShowQuickAddVehicle] = useState(false);
  const [newVehicleData, setNewVehicleData] = useState({ marca: '', modelo: '', placa: '', cor: '', tipo: 'CARRO' });

  const { vehicles, saveVehicle } = useVehicles(selectedClient);
  const { inventory } = useInventory();

  useEffect(() => {
    const total = selectedServices.reduce((acc, s) => {
      return acc + (Number(s.preco_custom) || 0);
    }, 0);
    setSubTotal(total);
    // Cálculo do Desconto em Porcentagem
    const valorDesconto = (total * (desconto || 0)) / 100;
    setValorTotal(total - valorDesconto);
  }, [selectedServices, desconto]);

  const filteredClients = clients.filter(c => 
    c.nome.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.telefone?.includes(searchTerm) ||
    c.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleQuickAddClient = async () => {
    if (!newClientData.nome || !newClientData.telefone) {
      toast.warning('Nome e Telefone são obrigatórios');
      return;
    }
    const result = await saveClient(newClientData);
    if (result.success) {
      setSelectedClient(result.data.id);
      setShowQuickAddClient(false);
      setStep(2);
    }
  };

  const handleQuickAddVehicle = async () => {
    if (!newVehicleData.marca || !newVehicleData.modelo || !newVehicleData.placa) {
      toast.warning('Marca, Modelo e Placa são obrigatórios');
      return;
    }
    const result = await saveVehicle(newVehicleData);
    if (result.success) {
      setSelectedVehicle(result.data.id);
      setShowQuickAddVehicle(false);
      setStep(3);
    }
  };

  const handleServiceToggle = (service) => {
    setSelectedServices(prev => {
      const exists = prev.find(s => s.id === service.id);
      if (exists) {
        return prev.filter(s => s.id !== service.id);
      } else {
        return [...prev, { 
          id: service.id, 
          nome: service.nome, 
          preco_custom: service.preco_base, 
          preco_base: service.preco_base,
          garantia: service.garantia || '12 Meses',
          controle_estoque: service.controle_estoque,
          materiais: service.materiais || []
        }];
      }
    });
  };

  const handleUpdateServicePrice = (id, newPrice) => {
    setSelectedServices(prev => prev.map(s => 
      s.id === id ? { ...s, preco_custom: Number(newPrice) } : s
    ));
  };

  const handleFinalSave = async () => {
    if (!selectedClient || !selectedVehicle || selectedServices.length === 0) {
      toast.warning('Por favor, preencha todos os campos obrigatórios.');
      return;
    }

    setIsSaving(true);
    const client = clients.find(c => c.id == selectedClient);
    const vehicle = vehicles.find(v => v.id == selectedVehicle);

    const quoteData = {
      cliente_id: selectedClient,
      veiculo_id: selectedVehicle,
      valor_total: valorTotal,
      desconto: desconto,
      observacoes,
      status: defaultStatus || 'ORCAMENTO',
      data_agendamento: defaultDate ? (() => {
        const d = new Date(defaultDate);
        const [h, m] = selectedTime.split(':');
        d.setHours(parseInt(h), parseInt(m), 0, 0);
        return d.toISOString();
      })() : null,
      servico: selectedServices.map(s => s.nome).join(', '),
      servicos_detalhados: selectedServices.map(s => {
        return { 
          nome: s.nome || 'Serviço', 
          preco_base: s.preco_custom || 0, // Agora enviamos o preço customizado como base da OS
          preco_original: s.preco_base,
          garantia: s.garantia || '12 Meses',
          progresso: 0,
          controle_estoque: s.controle_estoque || false,
          materiais: (s.materiais || []).map(m => ({
            material_id: m.material_id || null,
            quantidade_utilizada: m.quantidade || 0
          }))
        };
      })
    };

    const result = await onSave(quoteData);
    setIsSaving(false);
    if (result.success) onClose();
  };

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[200] flex items-center justify-center p-4 md:p-6 overflow-hidden">
      <div className="bg-white rounded-[3rem] w-full max-w-4xl h-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-white/20 animate-fadeIn text-slate-800">
        
        {/* Header Fixo */}
        <div className="p-8 bg-white flex items-center justify-between border-b border-slate-50 shrink-0">
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center shadow-xl">
              <Plus size={28} className="text-primary" />
            </div>
            <div>
              <h3 className="text-2xl font-black tracking-tight uppercase">
                {defaultStatus === 'AGUARDANDO' ? 'Novo Agendamento (OS)' : 'Novo Orçamento'}
              </h3>
              <div className="flex items-center gap-3 mt-1.5">
                {[1, 2, 3, 4].map((s) => (
                  <div key={s} className="flex items-center gap-2">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-black transition-all ${step >= s ? 'bg-primary text-white shadow-lg shadow-primary/30' : 'bg-slate-100 text-slate-400'}`}>
                      {s}
                    </div>
                    {s < 4 && <div className={`w-6 h-0.5 rounded-full transition-all ${step > s ? 'bg-primary' : 'bg-slate-100'}`} />}
                  </div>
                ))}
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4">
                  Passo {step} de 4
                </span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-4 hover:bg-slate-50 rounded-full transition-all group">
            <X size={28} className="text-slate-200 group-hover:text-slate-900" />
          </button>
        </div>

        {/* Corpo com Split Lateral */}
        <div className="flex-1 flex overflow-hidden">
          {/* Sidebar de Passos */}
          <div className="w-64 bg-slate-50/50 border-r border-slate-100 p-8 hidden md:block shrink-0">
            <div className="space-y-8">
              <StepItem number={1} title="Cliente" active={step === 1} completed={step > 1} />
              <StepItem number={2} title="Veículo" active={step === 2} completed={step > 2} />
              <StepItem number={3} title="Serviços" active={step === 3} completed={step > 3} />
              <StepItem number={4} title="Resumo" active={step === 4} completed={step > 4} />
              
              <div className="pt-8 mt-8 border-t border-slate-100">
                 <p className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Resumo Financeiro</p>
                 <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10">
                    <p className="text-[8px] font-black text-primary uppercase mb-1">Total Estimado</p>
                    <p className="text-lg font-black text-primary tracking-tighter">
                      R$ {subTotal.toLocaleString('pt-BR')}
                    </p>
                 </div>
              </div>
            </div>
          </div>

          <div className="flex-1 flex flex-col overflow-hidden bg-white">
            <div className="flex-1 p-8 overflow-y-auto custom-scrollbar">
              
              {/* STEP 1: CLIENTE */}
              {step === 1 && (
                <div className="space-y-6 animate-slideInRight">
                  <div className="flex items-center justify-between">
                      <h4 className="text-xl font-black text-slate-800 uppercase">Selecione o Cliente</h4>
                      <button 
                          onClick={() => setShowQuickAddClient(!showQuickAddClient)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                              showQuickAddClient ? 'bg-slate-100 text-slate-500' : 'bg-primary/10 text-primary hover:bg-primary/20'
                          }`}
                      >
                          {showQuickAddClient ? <X size={14} /> : <UserPlus size={14} />}
                          {showQuickAddClient ? 'Cancelar' : 'Novo Cliente'}
                      </button>
                  </div>

                  {showQuickAddClient ? (
                      <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 space-y-4 animate-scaleUp">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nome Completo</label>
                                  <input 
                                      type="text" 
                                      className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-primary transition-all text-sm font-bold"
                                      placeholder="Ex: João Silva"
                                      value={newClientData.nome}
                                      onChange={e => setNewClientData({...newClientData, nome: e.target.value})}
                                  />
                              </div>
                              <div className="space-y-2">
                                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">WhatsApp / Telefone</label>
                                  <input 
                                      type="text" 
                                      className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-primary transition-all text-sm font-bold"
                                      placeholder="(00) 00000-0000"
                                      value={newClientData.telefone}
                                      onChange={e => setNewClientData({...newClientData, telefone: e.target.value})}
                                  />
                              </div>
                          </div>
                      </div>
                  ) : (
                      <>
                          <div className="relative">
                              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                              <input 
                                  type="text" 
                                  placeholder="Buscar por nome, telefone ou email..." 
                                  className="w-full pl-12 pr-4 py-4 bg-slate-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-primary/20 transition-all font-bold text-sm shadow-inner"
                                  value={searchTerm}
                                  onChange={e => setSearchTerm(e.target.value)}
                              />
                          </div>

                          <div className="grid grid-cols-1 gap-3">
                              {filteredClients.map(client => (
                                  <button 
                                      key={client.id}
                                      onClick={() => { setSelectedClient(client.id); setStep(2); }}
                                      className={`flex items-center justify-between p-5 rounded-2xl border-2 transition-all ${
                                          selectedClient == client.id ? 'border-primary bg-primary/5' : 'border-slate-100 hover:border-slate-200 bg-white'
                                      }`}
                                  >
                                      <div className="flex items-center gap-4 text-left">
                                          <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 font-bold text-sm border border-slate-100">
                                              {client.nome.charAt(0)}
                                          </div>
                                          <div>
                                              <p className="text-sm font-bold text-slate-700">{client.nome}</p>
                                              <p className="text-[10px] text-slate-400 font-mono tracking-tighter">{client.telefone || client.email}</p>
                                          </div>
                                      </div>
                                      <ChevronRight size={18} className="text-slate-200" />
                                  </button>
                              ))}
                              {filteredClients.length === 0 && (
                                  <div className="p-8 text-center text-slate-400 italic">Nenhum cliente encontrado. Tente buscar pelo nome ou telefone.</div>
                              )}
                          </div>
                      </>
                  )}
                </div>
              )}

              {/* STEP 2: VEÍCULO */}
              {step === 2 && (
                <div className="space-y-6 animate-slideInRight">
                  <div className="flex items-center justify-between">
                      <h4 className="text-xl font-black text-slate-800 uppercase">Selecione o Veículo</h4>
                      <button 
                          onClick={() => setShowQuickAddVehicle(!showQuickAddVehicle)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                              showQuickAddVehicle ? 'bg-slate-100 text-slate-500' : 'bg-primary/10 text-primary hover:bg-primary/20'
                          }`}
                      >
                          {showQuickAddVehicle ? <X size={14} /> : <Plus size={14} />}
                          {showQuickAddVehicle ? 'Cancelar' : 'Novo Veículo'}
                      </button>
                  </div>

                  {showQuickAddVehicle ? (
                      <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 space-y-4 animate-scaleUp">
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div className="space-y-2">
                                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Marca</label>
                                  <input 
                                      type="text" 
                                      className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-primary transition-all text-sm font-bold"
                                      placeholder="Ex: BMW"
                                      value={newVehicleData.marca}
                                      onChange={e => setNewVehicleData({...newVehicleData, marca: e.target.value})}
                                  />
                              </div>
                              <div className="space-y-2">
                                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Modelo</label>
                                  <input 
                                      type="text" 
                                      className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-primary transition-all text-sm font-bold"
                                      placeholder="Ex: X5"
                                      value={newVehicleData.modelo}
                                      onChange={e => setNewVehicleData({...newVehicleData, modelo: e.target.value})}
                                  />
                              </div>
                              <div className="space-y-2">
                                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Placa</label>
                                  <input 
                                      type="text" 
                                      className="w-full px-4 py-3 rounded-xl border border-slate-200 outline-none focus:border-primary transition-all text-sm font-bold font-mono"
                                      placeholder="ABC-1234"
                                      value={newVehicleData.placa}
                                      onChange={e => setNewVehicleData({...newVehicleData, placa: e.target.value.toUpperCase()})}
                                  />
                              </div>
                              <div className="space-y-2">
                                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tipo</label>
                                  <div className="flex gap-2">
                                    <button 
                                      type="button"
                                      onClick={() => setNewVehicleData({...newVehicleData, tipo: 'CARRO'})}
                                      className={`flex-1 py-3 rounded-xl border-2 text-[10px] font-black uppercase transition-all ${newVehicleData.tipo === 'CARRO' ? 'border-primary bg-primary/5 text-primary' : 'border-slate-100 text-slate-400'}`}
                                    >Carro</button>
                                    <button 
                                      type="button"
                                      onClick={() => setNewVehicleData({...newVehicleData, tipo: 'MOTO'})}
                                      className={`flex-1 py-3 rounded-xl border-2 text-[10px] font-black uppercase transition-all ${newVehicleData.tipo === 'MOTO' ? 'border-primary bg-primary/5 text-primary' : 'border-slate-100 text-slate-400'}`}
                                    >Moto</button>
                                  </div>
                              </div>
                          </div>
                      </div>
                  ) : (
                      <div className="grid grid-cols-1 gap-4">
                          {vehicles.length > 0 ? vehicles.map(vehicle => (
                              <button 
                              key={vehicle.id}
                              onClick={() => { setSelectedVehicle(vehicle.id); setStep(3); }}
                              className={`flex items-center justify-between p-6 rounded-[2rem] border-2 transition-all ${
                                  selectedVehicle == vehicle.id ? 'border-primary bg-primary/5' : 'border-slate-100 hover:border-slate-200 bg-white'
                              }`}
                              >
                              <div className="flex items-center gap-4 text-left">
                                  <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 shadow-inner">
                                  <Car size={24} />
                                  </div>
                                  <div>
                                  <p className="font-bold text-slate-700">{vehicle.marca} {vehicle.modelo}</p>
                                  <p className="text-xs text-slate-400 font-mono tracking-tighter">{vehicle.placa} • {vehicle.cor}</p>
                                  </div>
                              </div>
                              <ChevronRight size={20} className="text-slate-200" />
                              </button>
                          )) : (
                              <div className="p-12 text-center text-slate-400 italic bg-slate-50 rounded-[2rem] border border-dashed border-slate-200">
                                Clique no botão "+" acima para cadastrar um veículo.
                              </div>
                          )}
                      </div>
                  )}
                </div>
              )}

              {/* STEP 3: SERVIÇOS */}
              {step === 3 && (
                <div className="space-y-6 animate-slideInRight">
                  <h4 className="text-xl font-black text-slate-800 uppercase">Escolha os Serviços</h4>
                  <div className="grid grid-cols-1 gap-3">
                    {catalog
                      .filter(service => {
                        const vehicle = vehicles.find(v => v.id == selectedVehicle);
                        if (!vehicle || !service.tipo_veiculo) return true;
                        const vt = (vehicle.tipo || 'CARRO').trim().toUpperCase();
                        const st = service.tipo_veiculo.trim().toUpperCase();
                        return st === 'AMBOS' || st === vt;
                      })
                      .map(service => (
                      <div key={service.id} className="flex flex-col">
                        <button 
                          onClick={() => handleServiceToggle(service)}
                        className={`flex items-center justify-between p-5 rounded-2xl border-2 transition-all ${
                          selectedServices.find(s => s.id === service.id) ? 'border-primary bg-primary/5' : 'border-slate-100 hover:border-slate-200 bg-white'
                        }`}
                      >
                        <div className="flex items-center gap-4 text-left">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                            selectedServices.find(s => s.id === service.id) ? 'bg-primary text-white scale-110 shadow-lg shadow-primary/30' : 'bg-slate-50 text-slate-300'
                          }`}>
                            <Check size={16} strokeWidth={4} />
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-700">{service.nome}</p>
                            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">{service.categoria} {service.controle_estoque && '• Exige Material'}</p>
                          </div>
                        </div>
                        <p className="text-sm font-black text-slate-800">
                          R$ {service.preco_base.toLocaleString('pt-BR')}
                        </p>
                      </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* STEP 4: RESUMO */}
              {step === 4 && (
                <div className="space-y-8 animate-slideInRight">
                  <h4 className="text-xl font-black text-slate-800 uppercase">Resumo da Proposta</h4>
                  
                  <div className="bg-slate-50 rounded-[2.5rem] p-8 space-y-6 border border-slate-100 shadow-inner">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                      <div>
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Cliente</span>
                          <p className="font-bold text-slate-700">{clients.find(c => c.id == selectedClient)?.nome}</p>
                      </div>
                      <div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-2">Veículo</span>
                        {(() => {
                          const v = vehicles.find(v => v.id == selectedVehicle);
                          return <p className="font-bold text-slate-700">{v?.marca} {v?.modelo} ({v?.placa})</p>;
                        })()}
                      </div>
                    </div>

                      <div>
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-4">Serviços Selecionados (Personalizar Preço)</span>
                        <div className="space-y-3">
                          {selectedServices.map(service => (
                            <div key={service.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm transition-all hover:border-primary/20">
                              <div className="space-y-0.5">
                                <p className="text-xs font-black text-slate-700 uppercase tracking-tight">{service.nome}</p>
                                <p className="text-[9px] text-slate-400 font-bold uppercase">Original: R$ {service.preco_base.toLocaleString('pt-BR')}</p>
                              </div>
                              <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-100 group-focus-within:border-primary/30 transition-all">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">R$</span>
                                <input 
                                  type="number" 
                                  className="bg-transparent border-none outline-none text-sm font-black text-slate-800 w-24 text-right"
                                  value={service.preco_custom}
                                  onChange={(e) => handleUpdateServicePrice(service.id, e.target.value)}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                    <div className="space-y-4 pt-6 border-t border-slate-200">
                      <div className="flex justify-between items-center text-slate-400">
                        <span className="text-[10px] font-black uppercase tracking-widest">Subtotal</span>
                        <span className="text-sm font-bold">R$ {subTotal.toLocaleString('pt-BR')}</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Desconto (%)</span>
                          <input 
                            type="number"
                            className="bg-transparent border-b-2 border-slate-200 focus:border-rose-300 outline-none text-sm font-black text-rose-500 w-16 transition-all text-center"
                            value={desconto}
                            onChange={(e) => setDesconto(Number(e.target.value) || 0)}
                          />
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Valor Final</span>
                          <p className="text-3xl font-black text-primary drop-shadow-sm">R$ {valorTotal.toLocaleString('pt-BR')}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {defaultStatus === 'AGUARDANDO' && (
                    <div className="space-y-4">
                      {/* Seletor de Horário */}
                      <div className="bg-white p-6 rounded-2xl border-2 border-primary/20 shadow-sm">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg text-primary">
                              <Clock size={18} />
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Horário do Agendamento</p>
                              <p className="text-xs font-bold text-slate-700">{defaultDate?.toLocaleDateString('pt-BR')}</p>
                            </div>
                          </div>
                          <input 
                            type="time" 
                            value={selectedTime}
                            onChange={(e) => setSelectedTime(e.target.value)}
                            className="bg-slate-100 border-none rounded-xl px-4 py-2 font-black text-primary outline-none focus:ring-2 focus:ring-primary/20 text-lg"
                          />
                        </div>
                      </div>

                      {/* Spoiler de Agenda (Ocupação) */}
                      <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                        <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                          <Info size={12} className="text-primary" /> Ocupação deste dia
                        </h5>
                        <div className="space-y-3">
                          {existingOrders
                            .filter(os => {
                              if (!['AGUARDANDO', 'EM EXECUÇÃO'].includes(os.status)) return false;
                              if (!os.data_agendamento || !defaultDate) return false;
                              const osD = new Date(os.data_agendamento);
                              const defD = new Date(defaultDate);
                              return osD.getFullYear() === defD.getFullYear() && 
                                     osD.getMonth() === defD.getMonth() && 
                                     osD.getDate() === defD.getDate();
                            })
                            .sort((a, b) => new Date(a.data_agendamento) - new Date(b.data_agendamento))
                            .map((os, idx) => (
                              <div key={idx} className="flex items-center justify-between bg-white p-3 rounded-xl border border-slate-100 text-[11px]">
                                <div className="flex items-center gap-3">
                                  <span className="font-black text-slate-900 border-r pr-3 border-slate-100">
                                    {new Date(os.data_agendamento).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                  </span>
                                  <span className="font-bold text-slate-600 uppercase truncate max-w-[120px]">{os.cliente_nome}</span>
                                </div>
                                <span className="text-[9px] font-black bg-primary/5 text-primary px-2 py-0.5 rounded uppercase tracking-tighter">{os.servico}</span>
                              </div>
                            ))}
                          {existingOrders.filter(os => {
                            if (!['AGUARDANDO', 'EM EXECUÇÃO'].includes(os.status)) return false;
                            if (!os.data_agendamento || !defaultDate) return false;
                            const osD = new Date(os.data_agendamento);
                            const defD = new Date(defaultDate);
                            return osD.getFullYear() === defD.getFullYear() && 
                                   osD.getMonth() === defD.getMonth() && 
                                   osD.getDate() === defD.getDate();
                          }).length === 0 && (
                            <p className="text-[10px] text-slate-300 font-bold uppercase italic text-center py-2">Sem outros serviços para este dia</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Observações</label>
                      <textarea 
                          className="w-full h-32 p-6 border-2 border-slate-50 rounded-[2rem] text-sm bg-slate-50 focus:border-primary/20 focus:bg-white outline-none transition-all font-bold placeholder:text-slate-200 resize-none shadow-inner"
                          placeholder="Notas sobre o orçamento..."
                          value={observacoes}
                          onChange={(e) => setObservacoes(e.target.value)}
                      />
                  </div>
                </div>
              )}
            </div>

            {/* Rodapé Fixo */}
            <div className="p-6 md:p-8 border-t border-slate-50 bg-white shrink-0">
               <div className="flex gap-4">
                  {step > 1 && (
                    <button 
                      onClick={() => setStep(step - 1)}
                      className="px-8 py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-400 hover:bg-slate-50 transition-all border border-slate-100"
                    >
                      Voltar
                    </button>
                  )}
                  {step < 4 ? (
                    <button 
                      onClick={async () => {
                        if (step === 1 && showQuickAddClient) {
                          await handleQuickAddClient();
                        } else if (step === 2 && showQuickAddVehicle) {
                          await handleQuickAddVehicle();
                        } else {
                          setStep(step + 1);
                        }
                      }}
                      disabled={(step === 1 && !selectedClient && !showQuickAddClient) || (step === 2 && !selectedVehicle && !showQuickAddVehicle) || (step === 3 && selectedServices.length === 0)}
                      className={`flex-1 py-5 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.2em] shadow-xl transition-all flex items-center justify-center gap-3 bg-slate-900 text-white shadow-slate-200 hover:-translate-y-1 active:translate-y-0`}
                    >
                      Continuar <ChevronRight size={18} />
                    </button>
                  ) : (
                    <button 
                      onClick={handleFinalSave}
                      disabled={isSaving}
                      className={`flex-1 py-5 bg-primary text-white rounded-[2rem] text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-primary/20 flex items-center justify-center gap-3 active:scale-[0.98] transition-all ${isSaving ? 'opacity-50 cursor-wait' : ''}`}
                    >
                      {isSaving ? (
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      ) : (
                          <><Save size={16} strokeWidth={3} /> {defaultStatus === 'AGUARDANDO' ? 'Confirmar Agendamento' : 'Gerar Orçamento'}</>
                      )}
                    </button>
                  )}
               </div>
            </div>
          </div>
        </div>

      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(0,0,0,0.05); border-radius: 10px; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideInRight { from { opacity: 0; transform: translateX(30px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes scaleUp { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
        .animate-fadeIn { animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
        .animate-slideInRight { animation: slideInRight 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
        .animate-scaleUp { animation: scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1); }
      `}} />
    </div>
  );
};

const StepItem = ({ number, title, active, completed }) => (
  <div className="flex items-center gap-4 transition-all duration-500">
    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black transition-all ${
      active ? 'bg-primary text-white shadow-lg shadow-primary/30 scale-110' : 
      completed ? 'bg-emerald-500 text-white' : 'bg-white text-slate-300 border border-slate-100 shadow-sm'
    }`}>
      {completed ? <Check size={20} strokeWidth={3} /> : number}
    </div>
    <span className={`text-[11px] font-black uppercase tracking-widest ${
      active ? 'text-slate-800' : 'text-slate-300'
    }`}>
      {title}
    </span>
  </div>
);

export default NovoOrcamentoModal;
