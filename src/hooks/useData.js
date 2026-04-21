import { useState, useEffect } from 'react';
import { toast } from '../utils/toast';
import { supabase, hasRealConnection } from '../lib/supabase';

export const useOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    if (hasRealConnection()) {
      const { data, error } = await supabase
        .from('ordens_servico')
        .select('*, clientes(nome, telefone), veiculos(modelo, marca, placa, tipo, ano), checklist_avarias(id), tecnico_ref:profiles!ordens_servico_tecnico_id_fkey(nome)')
        .order('id', { ascending: false });
      
      if (!error && data) {
        setOrders(data.map(os => {
          const veiculoObj = Array.isArray(os.veiculos) ? os.veiculos[0] : os.veiculos;
          const clienteObj = Array.isArray(os.clientes) ? os.clientes[0] : os.clientes;
          
          return {
            ...os,
            cliente_nome: clienteObj?.nome || 'Cliente',
            cliente_telefone: clienteObj?.telefone,
            veiculo_desc: veiculoObj ? `${veiculoObj.marca || ''} ${veiculoObj.modelo || ''} ${veiculoObj.ano ? '(' + veiculoObj.ano + ')' : ''}`.trim() || 'Veículo' : 'Veículo',
            veiculo_tipo: veiculoObj?.tipo || 'CARRO',
            placa: veiculoObj?.placa,
            valor_total: Number(os.valor_total) || 0,
            desconto: Number(os.desconto) || 0,
            has_checklist: Array.isArray(os.checklist_avarias) && os.checklist_avarias.length > 0,
            tecnico: os.tecnico_ref?.nome || os.tecnico || 'Nenhum', // Prioriza o nome da tabela profiles
            valor_pago: Number(os.valor_pago) || 0,
            saldo_devedor: (Number(os.valor_total) || 0) - (Number(os.valor_pago) || 0),
            historico_pagamentos: os.historico_pagamentos || []
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
            .channel('os-changes-realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'ordens_servico' }, (payload) => {
                console.log('Realtime update received:', payload);
                fetchOrders();
            })
            .subscribe((status) => {
                console.log('Realtime subscription status:', status);
                if (status === 'CHANNEL_ERROR') {
                    console.error('Falha na conexão Realtime. Verifique se o Realtime está habilitado no painel do Supabase para a tabela ordens_servico.');
                }
            });

        return () => {
            supabase.removeChannel(channel);
        };
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
      // Atualização Otimista para resposta imediata na UI
      setOrders(current => current.map(os => os.id === id ? { ...os, ...data } : os));

      try {
        // Intercepta ENTREGA para dar baixa no estoque (Status Final)
        // O usuário solicitou que o estoque só seja movimentado quando marcado como ENTREGUE
        const isDelivered = data.status === 'ENTREGUE';
        if (isDelivered) {
           const { data: currentOs } = await supabase.from('ordens_servico').select('status, servicos_detalhados').eq('id', id).single();
           
           // Só abate se não estava Entregue antes (Evita duplicidade)
           const wasAlreadyDelivered = currentOs?.status === 'ENTREGUE';

           if (currentOs && !wasAlreadyDelivered && currentOs.servicos_detalhados) {
              for (const serv of currentOs.servicos_detalhados) {
                 if (serv.controle_estoque && Array.isArray(serv.materiais)) {
                    for (const mat of serv.materiais) {
                       if (mat.material_id && mat.quantidade_utilizada > 0) {
                          const { data: matData } = await supabase.from('estoque_materiais').select('quantidade').eq('id', mat.material_id).single();
                          if (matData) {
                             const novoEstoque = Math.max(0, matData.quantidade - mat.quantidade_utilizada);
                             await supabase.from('estoque_materiais').update({ quantidade: novoEstoque }).eq('id', mat.material_id);
                          }
                       }
                    }
                 }
              }
           }
        }

        const { error } = await supabase
          .from('ordens_servico')
          .update(data)
          .eq('id', id);

        if (error) {
           console.error('Erro ao atualizar OS:', error);
           // Rollback otimista em caso de erro crítico
           await fetchOrders();
           
           if (error.code === '42703' || error.message?.includes('column')) {
              const minimalData = { 
                status: data.status, 
                progresso: data.progresso || 100 
              };
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
        
        // Se não houver erro, o estado já foi atualizado otimisticamente
        // mas o fetchOrders garante que pegamos dados desnormalizados do banco (nomes, etc)
        fetchOrders(); 
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

  const registerPayment = async (osId, paymentData) => {
    if (hasRealConnection()) {
      try {
        const { data: os, error: fetchError } = await supabase
          .from('ordens_servico')
          .select('valor_pago, historico_pagamentos')
          .eq('id', osId)
          .single();
        
        if (fetchError) throw fetchError;

        const currentPaid = Number(os.valor_pago) || 0;
        const currentHistory = os.historico_pagamentos || [];

        const newPaid = currentPaid + Number(paymentData.valor);
        const newHistory = [...currentHistory, {
          valor: Number(paymentData.valor),
          metodo: paymentData.metodo,
          tipo: paymentData.tipo || 'PARCIAL',
          data: new Date().toISOString()
        }];

        const { error: updateError } = await supabase
          .from('ordens_servico')
          .update({
            valor_pago: newPaid,
            historico_pagamentos: newHistory
          })
          .eq('id', osId);

        if (updateError) throw updateError;
        
        await fetchOrders();
        return { success: true };
      } catch (error) {
        console.error('Erro ao registrar pagamento:', error);
        return { success: false, error };
      }
    }
    return { success: true };
  };

  const deletePayment = async (osId, paymentIndex) => {
    if (hasRealConnection()) {
      try {
        const { data: os, error: fetchError } = await supabase
          .from('ordens_servico')
          .select('valor_pago, historico_pagamentos')
          .eq('id', osId)
          .single();
        
        if (fetchError) throw fetchError;

        const history = os.historico_pagamentos || [];
        const paymentToRemove = history[paymentIndex];

        if (!paymentToRemove) return { success: false, error: 'Pagamento não encontrado' };

        const newHistory = history.filter((_, idx) => idx !== paymentIndex);
        const newPaid = Math.max(0, (Number(os.valor_pago) || 0) - (Number(paymentToRemove.valor) || 0));

        const { error: updateError } = await supabase
          .from('ordens_servico')
          .update({
            valor_pago: newPaid,
            historico_pagamentos: newHistory
          })
          .eq('id', osId);

        if (updateError) throw updateError;
        await fetchOrders();
        return { success: true };
      } catch (error) {
        return { success: false, error };
      }
    }
    return { success: true };
  };

  const removeServiceFromOrder = async (osId, serviceIndex) => {
    if (hasRealConnection()) {
      try {
        const { data: os, error: fetchError } = await supabase
          .from('ordens_servico')
          .select('*')
          .eq('id', osId)
          .single();
        
        if (fetchError) throw fetchError;

        const services = os.servicos_detalhados || [];
        if (services.length <= 1) return { success: false, error: 'Não é possível remover o único serviço da OS.' };

        const serviceToRemove = services[serviceIndex];
        const newServices = services.filter((_, idx) => idx !== serviceIndex);
        
        // 1. Reverter Estoque se a OS já estiver Entregue
        if (os.status === 'ENTREGUE' && serviceToRemove.controle_estoque && Array.isArray(serviceToRemove.materiais)) {
          for (const mat of serviceToRemove.materiais) {
            if (mat.material_id && mat.quantidade_utilizada > 0) {
              const { data: matData } = await supabase.from('estoque_materiais').select('quantidade').eq('id', mat.material_id).single();
              if (matData) {
                const novoEstoque = matData.quantidade + mat.quantidade_utilizada;
                await supabase.from('estoque_materiais').update({ quantidade: novoEstoque }).eq('id', mat.material_id);
              }
            }
          }
        }

        // 2. Recalcular Total e Título
        const newTotal = newServices.reduce((acc, curr) => acc + (Number(curr.valor) || 0), 0);
        const newServiceTitle = newServices.map(s => s.nome).join(', ');

        const { error: updateError } = await supabase
          .from('ordens_servico')
          .update({
            servicos_detalhados: newServices,
            valor_total: newTotal,
            servico: newServiceTitle
          })
          .eq('id', osId);

        if (updateError) throw updateError;
        await fetchOrders();
        return { success: true };
      } catch (error) {
        return { success: false, error };
      }
    }
    return { success: true };
  };

  const uploadOsPhoto = async (osId, file) => {
    if (hasRealConnection()) {
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${osId}/${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        // 1. Upload para o Bucket 'os-photos'
        const { error: uploadError, data } = await supabase.storage
          .from('os-photos')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // 2. Pegar URL Pública
        const { data: { publicUrl } } = supabase.storage
          .from('os-photos')
          .getPublicUrl(filePath);

        // 3. Salvar na Tabela 'os_midia'
        const { error: dbError } = await supabase
          .from('os_midia')
          .insert({
            os_id: osId,
            url: publicUrl,
            tipo: 'execucao'
          });

        if (dbError) throw dbError;

        return { success: true, url: publicUrl };
      } catch (error) {
        console.error('Erro no upload de foto:', error);
        return { success: false, error };
      }
    }
    return { success: true, url: URL.createObjectURL(file) };
  };

  const fetchOsPhotos = async (osId) => {
    if (hasRealConnection()) {
      const { data, error } = await supabase
        .from('os_midia')
        .select('*')
        .eq('os_id', osId)
        .order('created_at', { ascending: false });
      
      return { success: !error, data: data || [], error };
    }
    return { success: true, data: [] };
  };

  const updateOrderServices = async (osId, newServices, newTotal) => {
    if (hasRealConnection()) {
      try {
        const { error } = await supabase
          .from('ordens_servico')
          .update({
            servicos_detalhados: newServices,
            valor_total: newTotal,
            servico: newServices.map(s => s.nome).join(', ')
          })
          .eq('id', osId);

        if (error) throw error;
        await fetchOrders();
        return { success: true };
      } catch (error) {
        console.error('Erro ao atualizar serviços da OS:', error);
        return { success: false, error };
      }
    }
    return { success: true };
  };

  return { orders, loading, fetchOrders, updateOrderProgress, saveOrderChecklist, deliverOrder, registerPayment, deletePayment, removeServiceFromOrder, uploadOsPhoto, fetchOsPhotos, updateOrderServices };
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
      // Normalização
      const normalizedPhone = (clientData.telefone || '').replace(/\D/g, '');
      const normalizedName = (clientData.nome || '').toUpperCase().trim();
      
      const cleanData = {
        ...clientData,
        nome: normalizedName,
        telefone: normalizedPhone
      };

      // Verificação de Duplicidade
      const { data: existing } = await supabase
        .from('clientes')
        .select('id, nome')
        .eq('telefone', normalizedPhone);
      
      if (existing && existing.length > 0) {
        return { 
          success: false, 
          error: { message: `Este telefone já está cadastrado para: ${existing[0].nome}` } 
        };
      }

      const { data, error } = await supabase.from('clientes').insert([cleanData]).select();
      return { success: !error, error, data: data?.[0] };
    }
    return { success: true };
  };

  const updateClient = async (id, clientData) => {
    if (hasRealConnection()) {
      // Normalização
      const normalizedPhone = (clientData.telefone || '').replace(/\D/g, '');
      const normalizedName = (clientData.nome || '').toUpperCase().trim();
      
      const cleanData = {
        ...clientData,
        nome: normalizedName,
        telefone: normalizedPhone
      };

      // Verificação de Duplicidade (Exceto o próprio registro sendo editado)
      const { data: existing } = await supabase
        .from('clientes')
        .select('id, nome')
        .eq('telefone', normalizedPhone)
        .neq('id', id);
      
      if (existing && existing.length > 0) {
        return { 
          success: false, 
          error: { message: `Este telefone já pertence ao cliente: ${existing[0].nome}` } 
        };
      }
      const { error } = await supabase.from('clientes').update(cleanData).eq('id', id);
      if (!error) await fetchClients();
      return { success: !error, error };
    }
    return { success: true };
  };

  const deleteClient = async (id) => {
    if (hasRealConnection()) {
      const { error } = await supabase.from('clientes').delete().eq('id', id);
      if (!error) await fetchClients();
      return { success: !error, error };
    }
    return { success: true };
  };

  return { clients, loading, saveClient, updateClient, deleteClient };
};

export const useQuotes = () => {
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchQuotes = async () => {
    if (hasRealConnection()) {
      const { data, error } = await supabase
        .from('ordens_servico')
        .select('*, clientes(nome, telefone), veiculos(modelo, marca, placa, ano), tecnico_ref:profiles!ordens_servico_tecnico_id_fkey(nome)')
        .in('status', ['ORCAMENTO', 'AGUARDANDO', 'EM EXECUÇÃO', 'CONCLUÍDO', 'ENTREGUE', 'CANCELADO'])
        .order('created_at', { ascending: false });
      
      if (!error && data) {
        setQuotes(data.map(q => {
          const veiculoObj = Array.isArray(q.veiculos) ? q.veiculos[0] : q.veiculos;
          const clienteObj = Array.isArray(q.clientes) ? q.clientes[0] : q.clientes;

          return {
            ...q,
            cliente_nome: clienteObj?.nome || 'Cliente',
            cliente_telefone: clienteObj?.telefone,
            veiculo_desc: veiculoObj ? `${veiculoObj.marca || ''} ${veiculoObj.modelo || ''} ${veiculoObj.ano ? '(' + veiculoObj.ano + ')' : ''}`.trim() || 'Veículo' : 'Veículo',
            placa: veiculoObj?.placa,
            valor: Number(q.valor_total) || 0,
            desconto: Number(q.desconto) || 0,
            tecnico: q.tecnico_ref?.nome || q.tecnico || 'Nenhum', // Prioriza o nome da tabela profiles
            valor_pago: Number(q.valor_pago) || 0,
            saldo_devedor: (Number(q.valor_total) || 0) - (Number(q.valor_pago) || 0),
            historico_pagamentos: q.historico_pagamentos || []
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
      const { data, error } = await supabase
        .from('ordens_servico')
        .insert([{ 
          ...quoteData, 
          status: quoteData.status || 'ORCAMENTO',
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
      const updates = { 
        status: 'AGUARDANDO',
        data_agendamento: appointmentData.data_agendamento,
        tecnico_id: appointmentData.tecnico_id,
        valor_total: appointmentData.valor_total, // Permite ajuste de preço na aprovação
        data_inicio: new Date().toISOString()
      };

      // Se houver adiantamento
      if (appointmentData.valor_pago_agora > 0) {
        updates.valor_pago = Number(appointmentData.valor_pago_agora);
        updates.historico_pagamentos = [{
          valor: Number(appointmentData.valor_pago_agora),
          metodo: appointmentData.metodo_pagamento || 'PIX',
          data: new Date().toISOString(),
          tipo: 'ADIANTAMENTO'
        }];
      }

      const { error } = await supabase
        .from('ordens_servico')
        .update(updates)
        .eq('id', appointmentData.id);
      if (!error) await fetchQuotes();
      return { success: !error, error };
    }
    return { success: true };
  };

  const registerPayment = async (osId, paymentData) => {
    if (hasRealConnection()) {
      try {
        // 1. Busca estado atual
        const { data: os, error: fetchError } = await supabase
          .from('ordens_servico')
          .select('valor_pago, historico_pagamentos')
          .eq('id', osId)
          .single();
        
        if (fetchError) throw fetchError;

        const currentPaid = Number(os.valor_pago) || 0;
        const currentHistory = os.historico_pagamentos || [];

        // 2. Adiciona novo pagamento
        const newPaid = currentPaid + Number(paymentData.valor);
        const newHistory = [...currentHistory, {
          valor: Number(paymentData.valor),
          metodo: paymentData.metodo,
          tipo: paymentData.tipo || 'PARCIAL',
          data: new Date().toISOString()
        }];

        // 3. Persiste
        const { error: updateError } = await supabase
          .from('ordens_servico')
          .update({
            valor_pago: newPaid,
            historico_pagamentos: newHistory
          })
          .eq('id', osId);

        if (updateError) throw updateError;
        
        await fetchQuotes();
        return { success: true };
      } catch (error) {
        console.error('Erro ao registrar pagamento:', error);
        return { success: false, error };
      }
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

  const cancelQuote = async (quoteId) => {
    if (hasRealConnection()) {
      const { error } = await supabase
        .from('ordens_servico')
        .update({ status: 'CANCELADO' })
        .eq('id', quoteId);
      if (!error) await fetchQuotes();
      return { success: !error, error };
    }
    return { success: true };
  };

  const deletePayment = async (osId, paymentIndex) => {
    if (hasRealConnection()) {
      try {
        const { data: os, error: fetchError } = await supabase
          .from('ordens_servico')
          .select('valor_pago, historico_pagamentos')
          .eq('id', osId)
          .single();
        
        if (fetchError) throw fetchError;

        const history = os.historico_pagamentos || [];
        const paymentToRemove = history[paymentIndex];

        if (!paymentToRemove) return { success: false, error: 'Pagamento não encontrado' };

        const newHistory = history.filter((_, idx) => idx !== paymentIndex);
        const newPaid = Math.max(0, (Number(os.valor_pago) || 0) - (Number(paymentToRemove.valor) || 0));

        const { error: updateError } = await supabase
          .from('ordens_servico')
          .update({
            valor_pago: newPaid,
            historico_pagamentos: newHistory
          })
          .eq('id', osId);

        if (updateError) throw updateError;
        await fetchQuotes();
        return { success: true };
      } catch (error) {
        return { success: false, error };
      }
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

  const updateQuoteServices = async (quoteId, newServices, newTotal) => {
    if (hasRealConnection()) {
      try {
        const { error } = await supabase
          .from('ordens_servico')
          .update({
            servicos_detalhados: newServices,
            valor_total: newTotal,
            servico: newServices.map(s => s.nome).join(', ')
          })
          .eq('id', quoteId);

        if (error) throw error;
        await fetchQuotes();
        return { success: true };
      } catch (error) {
        console.error('Erro ao atualizar serviços do orçamento:', error);
        return { success: false, error };
      }
    }
    return { success: true };
  };

  return { quotes, loading, fetchQuotes, saveQuote, approveQuote, reopenQuote, deleteQuote, cancelQuote, registerPayment, deletePayment, updateQuoteServices };
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

  const updateVehicle = async (id, vehicleData) => {
    if (hasRealConnection()) {
      const { error } = await supabase.from('veiculos').update(vehicleData).eq('id', id);
      if (!error) await fetchVehicles();
      return { success: !error, error };
    }
    return { success: true };
  };

  const deleteVehicle = async (id) => {
    if (hasRealConnection()) {
      const { error } = await supabase.from('veiculos').delete().eq('id', id);
      if (!error) await fetchVehicles();
      return { success: !error, error };
    }
    return { success: true };
  };

  return { vehicles, loading, saveVehicle, updateVehicle, deleteVehicle };
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
        if (error.code === '42703') {
          const safeData = { ...serviceData };
          
          if (error.message?.includes('garantia')) {
             delete safeData.garantia;
          }
          if (error.message?.includes('materiais')) {
             delete safeData.materiais;
             toast.warning("Aviso: Os MATERIAIS não foram salvos pois a coluna 'materiais' não foi encontrada!");
          }

          const { data: retryData, error: retryError } = await supabase.from('servicos').insert([safeData]).select();
          if (!retryError) {
             await fetchCatalog();
             return { success: true, data: retryData?.[0] };
          }
          toast.error('Erro no fallback de serviço: ' + retryError.message);
          return { success: false, error: retryError };
        }
        toast.error('Erro ao salvar serviço: ' + error.message);
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
        if (error.code === '42703') {
          const safeData = { ...serviceData };
          
          if (error.message?.includes('garantia')) {
             delete safeData.garantia;
          }
          if (error.message?.includes('materiais')) {
             delete safeData.materiais;
             toast.warning("Aviso: Os MATERIAIS não foram atualizados pois a coluna 'materiais' não foi encontrada!");
          }

          const { error: retryError } = await supabase.from('servicos').update(safeData).eq('id', id);
          if (!retryError) {
             await fetchCatalog();
             return { success: true };
          }
          toast.error('Erro no fallback de atualizar serviço: ' + retryError.message);
          return { success: false, error: retryError };
        }
        toast.error('Erro ao atualizar serviço: ' + error.message);
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

export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = async () => {
    if (hasRealConnection()) {
      const { data, error } = await supabase
        .from('notificacoes')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (!error && data) setNotifications(data);
    }
    setLoading(false);
  };

  const markAsRead = async (id) => {
    if (hasRealConnection()) {
      await supabase.from('notificacoes').update({ lida: true }).eq('id', id);
      fetchNotifications();
    }
  };

  const markAllAsRead = async () => {
    if (hasRealConnection()) {
      await supabase.from('notificacoes').update({ lida: true }).eq('lida', false);
      fetchNotifications();
    }
  };

  const clearNotification = async (id) => {
    if (hasRealConnection()) {
      await supabase.from('notificacoes').delete().eq('id', id);
      fetchNotifications();
    }
  };

  useEffect(() => {
    fetchNotifications();
    if (hasRealConnection()) {
      const channel = supabase
        .channel('notificacoes-realtime')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'notificacoes' }, () => {
          fetchNotifications();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, []);

  return { notifications, loading, markAsRead, markAllAsRead, clearNotification, fetchNotifications };
};

export const createNotification = async (data) => {
  if (hasRealConnection()) {
    const { error } = await supabase.from('notificacoes').insert(data);
    return { success: !error, error };
  }
  return { success: true };
};

export const useWorks = () => {
  const [works, setWorks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchWorks = async () => {
    if (hasRealConnection()) {
      const { data, error } = await supabase
        .from('trabalhos_recentes')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (!error && data) setWorks(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchWorks();
    if (hasRealConnection()) {
      const channel = supabase
        .channel('works-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'trabalhos_recentes' }, fetchWorks)
        .subscribe();
      return () => supabase.removeChannel(channel);
    }
  }, []);

  const uploadWork = async (file, titulo, categoria) => {
    if (hasRealConnection()) {
      try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `${fileName}`;

        // 1. Upload para o Bucket 'trabalhos-recentes'
        const { error: uploadError } = await supabase.storage
          .from('trabalhos-recentes')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        // 2. Pegar URL Pública
        const { data: { publicUrl } } = supabase.storage
          .from('trabalhos-recentes')
          .getPublicUrl(filePath);

        // 3. Salvar na Tabela 'trabalhos_recentes'
        const { error: dbError } = await supabase
          .from('trabalhos_recentes')
          .insert({
            titulo: titulo || file.name,
            url: publicUrl,
            storage_path: filePath,
            categoria: categoria || 'Geral'
          });

        if (dbError) throw dbError;

        await fetchWorks();
        return { success: true, url: publicUrl };
      } catch (error) {
        console.error('Erro no upload do trabalho:', error);
        return { success: false, error };
      }
    }
    return { success: true };
  };

  const deleteWork = async (workId, storagePath) => {
    if (hasRealConnection()) {
      try {
        console.log('Iniciando exclusão do trabalho:', { workId, storagePath });
        
        // 1. Deleta do Storage
        if (storagePath) {
          const { error: storageError } = await supabase.storage
            .from('trabalhos-recentes')
            .remove([storagePath]);
          
          if (storageError) {
            console.error('Erro ao remover do storage:', storageError);
            // Se for erro de permissão (403), paramos por aqui para não deixar o DB órfão
            if (storageError.status === 403 || storageError.message?.includes('Permission')) {
              return { success: false, error: 'Sem permissão no Storage (403). Verifique as Políticas.' };
            }
            // Outros erros de storage apenas avisamos e continuamos
          }
        }

        // 2. Deleta do DB
        const { error: dbError } = await supabase
          .from('trabalhos_recentes')
          .delete()
          .eq('id', workId);

        if (dbError) {
          console.error('Erro ao remover do banco:', dbError);
          throw dbError;
        }

        await fetchWorks();
        return { success: true };
      } catch (error) {
        console.error('Erro crítico ao excluir trabalho:', error);
        return { success: false, error: error.message || 'Erro inesperado ao excluir.' };
      }
    }
    return { success: true };
  };

  const renameWork = async (workId, newTitle) => {
    if (hasRealConnection()) {
      const { error } = await supabase
        .from('trabalhos_recentes')
        .update({ titulo: newTitle })
        .eq('id', workId);
      
      if (!error) await fetchWorks();
      return { success: !error, error };
    }
    return { success: true };
  };

  return { works, loading, uploadWork, deleteWork, renameWork, fetchWorks };
};
