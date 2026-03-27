import { useState, useEffect } from 'react';
import { supabase, hasRealConnection } from '../lib/supabase';

export const useOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    if (hasRealConnection()) {
      const { data, error } = await supabase
        .from('ordens_servico')
        .select('*, clientes(nome, telefone), veiculos(modelo, marca, placa, tipo), checklist_avarias(id)')
        .order('id', { ascending: false });
      
      if (!error && data) {
        setOrders(data.map(os => {
          const veiculoObj = Array.isArray(os.veiculos) ? os.veiculos[0] : os.veiculos;
          const clienteObj = Array.isArray(os.clientes) ? os.clientes[0] : os.clientes;
          
          return {
            ...os,
            cliente_nome: clienteObj?.nome || 'Cliente',
            cliente_telefone: clienteObj?.telefone,
            veiculo_desc: veiculoObj ? `${veiculoObj.marca || ''} ${veiculoObj.modelo || ''}`.trim() || 'Veículo' : 'Veículo',
            veiculo_tipo: veiculoObj?.tipo || 'CARRO',
            placa: veiculoObj?.placa,
            valor_total: Number(os.valor_total) || 0,
            desconto: Number(os.desconto) || 0,
            has_checklist: Array.isArray(os.checklist_avarias) && os.checklist_avarias.length > 0
          };
        }));
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
    if (hasRealConnection()) {
        const channel = supabase
            .channel('os-changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'ordens_servico' }, fetchOrders)
            .subscribe();
        return () => supabase.removeChannel(channel);
    }
  }, []);

  const saveOrderChecklist = async (osId, data, signatureBase64) => {
    if (hasRealConnection()) {
      const targetOsId = Number(osId);
      
      // 1. Limpa checklist anterior
      await supabase.from('checklist_avarias').delete().eq('os_id', targetOsId);

      // 2. Tenta salvar o novo checklist (estratégia resiliente)
      let checklistError;
      
      // Tentativa A: Com a coluna 'quilometragem'
      const { error: errorA } = await supabase
        .from('checklist_avarias')
        .insert({ 
          os_id: targetOsId, 
          pontos_avaria: data.points, 
          notas: data.generalNotes,
          quilometragem: data.km
        });
      
      checklistError = errorA;

      // Tentativa B: Fallback se a coluna não existir (salva KM dentro das notas)
      if (errorA && (errorA.code === '42703' || errorA.message?.includes('column "quilometragem" does not exist'))) {
        const { error: errorB } = await supabase
          .from('checklist_avarias')
          .insert({ 
            os_id: targetOsId, 
            pontos_avaria: data.points, 
            notas: `[KM: ${data.km || 'N/A'}] ${data.generalNotes || ''}`
          });
        checklistError = errorB;
      }

      // 3. Salva a assinatura se houver
      if (!checklistError && signatureBase64) {
        await supabase.from('os_midia').delete().eq('os_id', targetOsId).eq('tipo', 'assinatura');
        await supabase
          .from('os_midia')
          .insert({
            os_id: targetOsId,
            url: signatureBase64,
            tipo: 'assinatura'
          });
      }

      if (!checklistError) await fetchOrders();
      return { success: !checklistError, error: checklistError };
    }
    return { success: true };
  };

  const updateOrderProgress = async (id, data) => {
    if (hasRealConnection()) {
      try {
        const { error } = await supabase
          .from('ordens_servico')
          .update(data)
          .eq('id', id);

        if (error) {
           console.error('Erro ao atualizar OS:', error);
           // Fallback agressivo se colunas não existirem
           if (error.code === '42703' || error.message?.includes('column')) {
              console.warn('Fallback ativado: Limpando colunas inexistentes...');
              const minimalData = { 
                status: data.status, 
                progresso: data.progresso || 100 
              };
              // Preserva observações e técnicos se existirem no objeto original
              if (data.observacoes) minimalData.observacoes = data.observacoes;
              if (data.tecnico) minimalData.tecnico = data.tecnico;
              if (data.tecnico_id) minimalData.tecnico_id = data.tecnico_id;

              const { error: fallbackError } = await supabase
                .from('ordens_servico')
                .update(minimalData)
                .eq('id', id);
              
              if (fallbackError) throw fallbackError;
           } else {
             throw error;
           }
        }
        await fetchOrders();
        return { success: true };
      } catch (error) {
        console.error('Falha crítica no hook useOrders:', error);
        return { success: false, error };
      }
    }
    return { success: true };
  };

  const deliverOrder = async (id) => {
    return await updateOrderProgress(id, { status: 'ENTREGUE', progresso: 100 });
  };

  return { orders, loading, fetchOrders, updateOrderProgress, saveOrderChecklist, deliverOrder };
};

export const useClients = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchClients = async () => {
    if (hasRealConnection()) {
      const { data, error } = await supabase.from('clientes').select('*').order('nome');
      if (!error) setClients(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchClients();
    if (hasRealConnection()) {
      const channel = supabase
        .channel('clients-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'clientes' }, fetchClients)
        .subscribe();
      return () => supabase.removeChannel(channel);
    }
  }, []);

  const saveClient = async (clientData) => {
    if (hasRealConnection()) {
      const { data, error } = await supabase.from('clientes').insert([clientData]).select();
      return { success: !error, error, data: data?.[0] };
    }
    return { success: true };
  };

  const updateClient = async (id, clientData) => {
    if (hasRealConnection()) {
      const { error } = await supabase.from('clientes').update(clientData).eq('id', id);
      if (!error) await fetchClients();
      return { success: !error, error };
    }
    return { success: true };
  };

  return { clients, loading, saveClient, updateClient };
};

export const useQuotes = () => {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchQuotes = async () => {
    if (hasRealConnection()) {
      const { data, error } = await supabase
        .from('ordens_servico')
        .select('*, clientes(nome, telefone), veiculos(modelo, marca)')
        .in('status', ['ORCAMENTO', 'AGUARDANDO', 'EM EXECUÇÃO', 'CONCLUÍDO'])
        .order('created_at', { ascending: false });
      
      if (!error && data) {
        setQuotes(data.map(q => {
          const veiculoObj = Array.isArray(q.veiculos) ? q.veiculos[0] : q.veiculos;
          const clienteObj = Array.isArray(q.clientes) ? q.clientes[0] : q.clientes;

          return {
            ...q,
            cliente_nome: clienteObj?.nome || 'Cliente',
            cliente_telefone: clienteObj?.telefone,
            veiculo_desc: veiculoObj ? `${veiculoObj.marca || ''} ${veiculoObj.modelo || ''}`.trim() || 'Veículo' : 'Veículo',
            valor: Number(q.valor_total) || 0,
            desconto: Number(q.desconto) || 0
          };
        }));
      }
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchQuotes();
    if (hasRealConnection()) {
      const channel = supabase
          .channel('quotes-changes')
          .on('postgres_changes', { event: '*', schema: 'public', table: 'ordens_servico' }, fetchQuotes)
          .subscribe();
      return () => supabase.removeChannel(channel);
    }
  }, []);

  const saveQuote = async (quoteData) => {
    if (hasRealConnection()) {
      // Orçamentos são salvos na tabela de ordens_servico com status 'ORCAMENTO'
      const { data, error } = await supabase
        .from('ordens_servico')
        .insert([{ 
          ...quoteData, 
          status: 'ORCAMENTO',
          created_at: new Date().toISOString() 
        }])
        .select();
      if (!error) await fetchQuotes();
      return { success: !error, error, data: data?.[0] };
    }
    return { success: true };
  };

  const approveQuote = async (appointmentData) => {
    if (hasRealConnection()) {
      const { error } = await supabase
        .from('ordens_servico')
        .update({ 
          status: 'AGUARDANDO',
          data_agendamento: appointmentData.data_agendamento,
          tecnico_id: appointmentData.tecnico_id,
          data_inicio: new Date().toISOString()
        })
        .eq('id', appointmentData.id);
      if (!error) await fetchQuotes();
      return { success: !error, error };
    }
    return { success: true };
  };

  const deleteQuote = async (quoteId) => {
    if (hasRealConnection()) {
      const { error } = await supabase
        .from('ordens_servico')
        .delete()
        .eq('id', quoteId);
      if (!error) await fetchQuotes();
      return { success: !error, error };
    }
    return { success: true };
  };

  const reopenQuote = async (quoteId) => {
    if (hasRealConnection()) {
      const { error } = await supabase
        .from('ordens_servico')
        .update({ 
          status: 'ORCAMENTO',
          data_agendamento: null,
          tecnico_id: null,
          data_inicio: null
        })
        .eq('id', quoteId);
      if (!error) await fetchQuotes();
      return { success: !error, error };
    }
    return { success: true };
  };

  return { quotes, loading, saveQuote, approveQuote, deleteQuote, reopenQuote };
};

export const useVehicles = (clienteId) => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchVehicles = async () => {
    if (hasRealConnection() && clienteId) {
      const { data, error } = await supabase.from('veiculos').select('*').eq('cliente_id', clienteId);
      if (!error) setVehicles(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchVehicles();
  }, [clienteId]);

  const saveVehicle = async (vehicleData) => {
    if (hasRealConnection()) {
      const { data, error } = await supabase.from('veiculos').insert([{ ...vehicleData, cliente_id: clienteId }]).select();
      if (!error) await fetchVehicles(); // Força atualização local imediata
      return { success: !error, error, data: data?.[0] };
    }
    return { success: true };
  };

  return { vehicles, loading, saveVehicle };
};

export const useCatalog = () => {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchCatalog = async () => {
    if (hasRealConnection()) {
      const { data, error } = await supabase.from('servicos').select().order('nome');
      if (!error) setServices(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCatalog();
    if (hasRealConnection()) {
      const channel = supabase
        .channel('services-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'servicos' }, fetchCatalog)
        .subscribe();
      return () => supabase.removeChannel(channel);
    }
  }, []);

  const saveService = async (serviceData) => {
    if (hasRealConnection()) {
      const { data, error } = await supabase.from('servicos').insert([serviceData]).select();
      
      if (error) {
        // Fallback: Tenta sem a coluna 'garantia' se ela não existir no banco
        if (error.code === '42703' || error.message?.includes('garantia')) {
          const safeData = { ...serviceData };
          delete safeData.garantia;
          const { data: retryData, error: retryError } = await supabase.from('servicos').insert([safeData]).select();
          if (!retryError) await fetchCatalog();
          return { success: !retryError, error: retryError, data: retryData?.[0] };
        }
        return { success: false, error };
      }

      await fetchCatalog();
      return { success: !error, error, data: data?.[0] };
    }
    return { success: true };
  };

  const updateService = async (id, serviceData) => {
    if (hasRealConnection()) {
      const { error } = await supabase.from('servicos').update(serviceData).eq('id', id);
      
      if (error) {
        // Fallback: Tenta sem a coluna 'garantia' se ela não existir no banco
        if (error.code === '42703' || error.message?.includes('garantia')) {
          const safeData = { ...serviceData };
          delete safeData.garantia;
          const { error: retryError } = await supabase.from('servicos').update(safeData).eq('id', id);
          if (!retryError) await fetchCatalog();
          return { success: !retryError, error: retryError };
        }
        return { success: false, error };
      }

      await fetchCatalog();
      return { success: !error, error };
    }
    return { success: true };
  };

  const deleteService = async (id) => {
    if (hasRealConnection()) {
      const { error } = await supabase.from('servicos').delete().eq('id', id);
      if (!error) await fetchCatalog();
      return { success: !error, error };
    }
    return { success: true };
  };

  return { services, loading, saveService, updateService, deleteService };
};

export const useProfiles = () => {
    const [profiles, setProfiles] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchProfiles = async () => {
        if (hasRealConnection()) {
            const { data, error } = await supabase.from('profiles').select('*').order('nome');
            if (!error && data) setProfiles(data);
        }
        setLoading(false);
    };

    useEffect(() => {
        fetchProfiles();
        if (hasRealConnection()) {
            const channel = supabase
                .channel('profiles-changes')
                .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, fetchProfiles)
                .subscribe();
            return () => supabase.removeChannel(channel);
        }
    }, []);

    const updateProfile = async (id, updates) => {
        if (hasRealConnection()) {
            const { error } = await supabase.from('profiles').update(updates).eq('id', id);
            return { success: !error, error };
        }
        return { success: true };
    };

    return { profiles, loading, updateProfile, fetchProfiles };
};

export const useInventory = () => {
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchInventory = async () => {
    if (hasRealConnection()) {
      const { data, error } = await supabase.from('estoque_materiais').select('*').order('nome');
      if (!error) setInventory(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchInventory();
    if (hasRealConnection()) {
      const channel = supabase
        .channel('inventory-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'estoque_materiais' }, fetchInventory)
        .subscribe();
      return () => supabase.removeChannel(channel);
    }
  }, []);

  const saveItem = async (itemData) => {
    if (hasRealConnection()) {
      const { data, error } = await supabase.from('estoque_materiais').insert([itemData]).select();
      if (!error) await fetchInventory();
      return { success: !error, error, data: data?.[0] };
    }
    return { success: true };
  };

  const updateItem = async (id, itemData) => {
    if (hasRealConnection()) {
      const { error } = await supabase.from('estoque_materiais').update(itemData).eq('id', id);
      if (!error) await fetchInventory();
      return { success: !error, error };
    }
    return { success: true };
  };

  const deleteItem = async (id) => {
    if (hasRealConnection()) {
      const { error } = await supabase.from('estoque_materiais').delete().eq('id', id);
      if (!error) await fetchInventory();
      return { success: !error, error };
    }
    return { success: true };
  };

  return { inventory, loading, fetchInventory, saveItem, updateItem, deleteItem };
};
