import React from 'react';
import { Users, TrendingUp, Clock, CheckCircle, ExternalLink } from 'lucide-react';
import { useOrders, useClients, useCatalog } from '../hooks/useData';

const StatCard = ({ icon: Icon, label, value, trend, color, loading }) => {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    emerald: 'bg-emerald-50 text-emerald-600',
    amber: 'bg-amber-50 text-amber-600',
    purple: 'bg-purple-50 text-purple-600'
  };

  return (
    <div className="card-premium p-4 flex items-center gap-4 hover:scale-[1.02] transition-all duration-300">
      <div className={`p-3 rounded-xl ${colors[color] || colors.blue} shadow-sm shrink-0`}>
        <Icon size={20} />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1 truncate">{label}</p>
        {loading ? (
          <div className="h-6 w-16 bg-slate-100 animate-pulse rounded-lg"></div>
        ) : (
          <h4 className="text-xl font-black text-slate-800 tracking-tight truncate">{value}</h4>
        )}
      </div>
    </div>
  );
};

const CategoryStat = ({ label, value, color }) => (
  <div className="space-y-2">
    <div className="flex justify-between text-[10px] font-black uppercase tracking-wider">
      <span className="text-slate-500">{label}</span>
      <span className="text-primary">{value}%</span>
    </div>
    <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-50">
      <div className={`h-full ${color} rounded-full`} style={{ width: `${value}%` }}></div>
    </div>
  </div>
);

const Dashboard = () => {
  const { orders, loading: loadingOrders } = useOrders();
  const { clients, loading: loadingClients } = useClients();
  const { services, loading: loadingCatalog } = useCatalog();

  // Cálculos Padronizados com Vendas
  const ordensAtivas = (orders || []).filter(os => os && os.status !== 'ORCAMENTO' && os.status !== 'CANCELADO');
  
  const totalFaturamento = ordensAtivas.reduce((acc, os) => acc + (Number(os.valor_total) || 0), 0);

  const aguardando = ordensAtivas.filter(os => String(os.status || '').toUpperCase().includes('AGUARDA')).length;
  const emExecucao = ordensAtivas.filter(os => String(os.status || '').toUpperCase().includes('EXECU')).length;
  const concluidas = ordensAtivas.filter(os => String(os.status || '').toUpperCase().includes('CONCLU')).length;
  const entregues = ordensAtivas.filter(os => String(os.status || '').toUpperCase() === 'ENTREGUE').length;

  // Cálculo de Performance de Serviços Real (Baseado no total de serviços prestados)
  const performanceRaw = (services || [])
    .filter(s => s && s.nome)
    .map(service => {
      const count = ordensAtivas.filter(o => 
        o && o.servico && (
          o.servico === service.nome || 
          o.servico.split(', ').includes(service.nome)
        )
      ).length;
      return { label: service.nome, count };
    });

  const totalServicesCount = performanceRaw.reduce((acc, current) => acc + current.count, 0);

  const performanceData = performanceRaw
    .map(item => ({
      label: item.label,
      value: totalServicesCount > 0 ? Math.round((item.count / totalServicesCount) * 100) : 0
    }))
    .sort((a, b) => b.value - a.value).slice(0, 6);

  const formatCurrency = (val) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="fade-in space-y-8 pb-10">
      {/* Grid de KPIs Dinâmicos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        <StatCard 
          icon={Users} 
          label="Total de Clientes" 
          value={(clients || []).length} 
          trend="Total na base" 
          color="blue" 
          loading={loadingClients} 
        />
        <StatCard 
          icon={TrendingUp} 
          label="Faturamento Convertido" 
          value={formatCurrency(totalFaturamento)} 
          trend="Soma de OS Aprovadas" 
          color="emerald" 
          loading={loadingOrders} 
        />
        <StatCard 
          icon={Clock} 
          label="Aguardando Início" 
          value={aguardando} 
          trend={`${emExecucao} em execução agora`} 
          color="amber" 
          loading={loadingOrders} 
        />
        <StatCard 
          icon={CheckCircle} 
          label="Concluídas" 
          value={concluidas} 
          trend="Aguardando entrega" 
          color="purple" 
          loading={loadingOrders} 
        />
        <StatCard 
          icon={ExternalLink} 
          label="Entregues" 
          value={entregues} 
          trend="Histórico para PDF" 
          color="blue" 
          loading={loadingOrders} 
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
        {/* Ordens Recentes Reais */}
        <div className="xl:col-span-2 card-premium p-8 flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-slate-800 text-xl uppercase tracking-tight flex items-center gap-3">
              <Clock size={24} className="text-primary" /> Ordens Recentes
            </h3>
          </div>
          
          <div className="space-y-3 flex-1 overflow-y-auto max-h-[450px] pr-4 custom-scrollbar overflow-x-hidden">
            {(ordensAtivas.length === 0 && !loadingOrders) && (
              <p className="text-center text-slate-400 py-10 font-bold uppercase tracking-widest text-xs">Nenhuma ordem em andamento</p>
            )}
            {ordensAtivas.slice(0, 6).map((os) => os && (
              <div key={os.id} className="flex flex-col sm:flex-row sm:items-center justify-between py-4 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-all px-4 rounded-2xl -mx-2 group gap-3">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 shrink-0 rounded-xl bg-white border border-slate-100 flex items-center justify-center text-slate-400 font-black text-[10px] group-hover:bg-primary group-hover:text-white group-hover:border-primary transition-all shadow-sm">
                    OS#{os.id}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-black text-slate-800 leading-none mb-1 truncate">{os.cliente_nome}</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest truncate">
                      {os.veiculo_desc} • <span className="text-slate-300">{os.servico || 'Não especificado'}</span>
                    </p>
                  </div>
                </div>
                <div className="flex justify-start sm:justify-end shrink-0">
                  <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${
                    String(os.status || '').toUpperCase().includes('EXECU') ? 'bg-blue-100 text-blue-600' : 
                    String(os.status || '').toUpperCase().includes('AGUARDA') ? 'bg-amber-100 text-amber-600' :
                    'bg-emerald-100 text-emerald-600'
                  }`}>
                    {os.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Desempenho Real (Performance de Serviços) */}
        <div className="card-premium p-8 flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-slate-800 text-xl uppercase tracking-tight flex items-center gap-3">
              <TrendingUp size={24} className="text-primary" /> Performance de Serviços
            </h3>
          </div>
          
          <div className="space-y-8 mt-10">
            {loadingCatalog ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-4 bg-slate-100 animate-pulse rounded-full"></div>
                ))}
              </div>
            ) : performanceData.length === 0 ? (
              <p className="text-center text-slate-400 py-10 font-bold uppercase tracking-widest text-xs">Nenhum serviço cadastrado no catálogo</p>
            ) : (
              (performanceData || []).map((item, idx) => {
                const colors = ['bg-primary', 'bg-blue-500', 'bg-amber-500', 'bg-purple-500', 'bg-rose-500', 'bg-emerald-500'];
                return item && (
                  <CategoryStat 
                    key={idx} 
                    label={item.label} 
                    value={item.value} 
                    color={colors[idx % colors.length]} 
                  />
                );
              })
            )}
          </div>
          
          <div className="mt-10 p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <p className="text-[11px] text-slate-500 font-medium leading-relaxed italic">
              <strong>Nota:</strong> Dados baseados no mix de serviços criados no seu catálogo e registrados em OS.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
