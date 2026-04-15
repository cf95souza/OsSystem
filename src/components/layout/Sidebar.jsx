import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Wrench, 
  Package, 
  TrendingUp, 
  Calendar, 
  UserSquare2, 
  Settings, 
  LogOut,
  ChevronRight,
  Monitor,
  LifeBuoy,
  X,
  Image
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useBrand } from '../../contexts/BrandContext';
import { useNavigate } from 'react-router-dom';

const Sidebar = ({ activePage, setActivePage, isOpen, setIsOpen }) => {
  const { profile, signOut } = useAuth();
  const { name: lojaName, logoUrl } = useBrand();
  const navigate = useNavigate();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['ADM', 'GESTOR'] },
    { id: 'agenda', label: 'Agenda', icon: Calendar, roles: ['ADM', 'GESTOR'] },
    { id: 'vendas', label: 'Vendas', icon: TrendingUp, roles: ['ADM', 'GESTOR'] },
    { id: 'ordens', label: 'Ordens de Serviço', icon: Wrench, roles: ['ADM', 'GESTOR', 'OPERADOR'] },
    { id: 'clientes', label: 'Clientes', icon: Users, roles: ['ADM', 'GESTOR'] },
    { id: 'servicos', label: 'Serviços', icon: UserSquare2, roles: ['ADM', 'GESTOR'] },
    { id: 'estoque', label: 'Estoque', icon: Package, roles: ['ADM', 'GESTOR'] },
    { id: 'trabalhos', label: 'Trabalhos', icon: Image, roles: ['ADM', 'GESTOR'] },
    { id: 'colaboradores', label: 'Colaboradores', icon: UserSquare2, roles: ['ADM', 'GESTOR'] },
    { id: 'relatorios', label: 'Relatórios', icon: TrendingUp, roles: ['ADM', 'GESTOR'] },
    { id: 'settings', label: 'Configurações', icon: Settings, roles: ['ADM', 'GESTOR'] },
    { id: 'ajuda', label: 'Ajuda', icon: LifeBuoy, roles: ['ADM', 'GESTOR'] },
  ];

  // Filtra itens permitidos para o cargo
  const userRole = String(profile?.cargo || '').toUpperCase();
  const filteredItems = menuItems.filter(item => 
    item.roles.map(r => r.toUpperCase()).includes(userRole) || userRole === 'ADM'
  );

  return (
    <aside className={`w-72 bg-white border-r border-slate-100 flex flex-col h-screen fixed lg:sticky top-0 left-0 z-50 transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0 shadow-2xl lg:shadow-none' : '-translate-x-full lg:translate-x-0'}`}>
      {/* Brand Logo */}
      <div className="p-8 relative">
        <button 
          onClick={() => setIsOpen(false)}
          className="lg:hidden absolute top-6 right-6 p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
        >
          <X size={20} />
        </button>
        <div className="flex flex-col items-center justify-center text-center gap-2">
          {logoUrl ? (
             <div className="w-16 h-16 mb-2 rounded-2xl shadow-xl overflow-hidden border border-slate-100 flex-shrink-0">
                <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
             </div>
          ) : (
            <div className="w-12 h-12 mb-2 bg-primary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 rotate-3">
              <Wrench className="text-white" size={24} />
            </div>
          )}
          <div className="w-full">
            <h1 className="text-lg font-black text-slate-800 tracking-tighter uppercase italic leading-tight break-words" title={lojaName}>{lojaName || 'OsSystem'}</h1>
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1 leading-none">Management v2.5</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto custom-scrollbar">
        <p className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 mt-2">Menu Principal</p>
        
        {filteredItems.map((item) => (
          <button
            key={item.id}
            onClick={() => setActivePage(item.id)}
            className={`w-full flex items-center justify-between px-4 py-3.5 rounded-2xl transition-all duration-300 group ${
              activePage === item.id 
                ? 'bg-primary text-white shadow-xl shadow-primary/20 scale-[1.02]' 
                : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800'
            }`}
          >
            <div className="flex items-center gap-3">
              <item.icon size={20} className={activePage === item.id ? 'text-white' : 'text-slate-400 group-hover:text-primary transition-colors'} />
              <span className="text-sm font-bold tracking-tight">{item.label}</span>
            </div>
            {activePage === item.id && <ChevronRight size={16} />}
          </button>
        ))}

        <div className="pt-8 mb-4 border-t border-slate-50 mt-8 mx-4">
           <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Monitoramento</p>
           <a 
             href="/tv" 
             target="_blank" 
             className="w-full flex items-center gap-3 px-4 py-3.5 text-slate-500 hover:bg-slate-50 hover:text-slate-800 rounded-2xl transition-all group"
           >
             <Monitor size={20} className="text-slate-400 group-hover:text-emerald-500 transition-colors" />
             <span className="text-sm font-bold tracking-tight">Monitor TV</span>
           </a>
        </div>
      </nav>

      {/* User Footer */}
      <div className="p-4 mt-auto">
        <div className="bg-slate-50 rounded-3xl p-4 border border-slate-100">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-2xl bg-white border border-slate-200 flex items-center justify-center text-primary font-black shadow-sm uppercase shrink-0">
              {profile?.nome?.charAt(0) || 'U'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-black text-slate-800 truncate leading-none mb-1">{profile?.nome || 'Usuário'}</p>
              <span className="text-[9px] font-black text-primary uppercase tracking-widest">{profile?.cargo || 'Membro'}</span>
            </div>
          </div>
          <button 
            onClick={signOut}
            className="w-full flex items-center justify-center gap-2 py-2.5 bg-white hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-xl text-xs font-black uppercase tracking-widest transition-all border border-slate-100 hover:border-red-100"
          >
            <LogOut size={14} /> Sair
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
