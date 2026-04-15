import React, { useState, useRef } from 'react';
import { 
  Image as ImageIcon, 
  Plus, 
  Trash2, 
  Edit3, 
  Camera, 
  Loader2, 
  X, 
  Search, 
  Calendar,
  Tag,
  Maximize2
} from 'lucide-react';
import { useWorks } from '../hooks/useData';
import { toast } from '../utils/toast';

const Trabalhos = () => {
  const { works, loading, uploadWork, deleteWork, renameWork } = useWorks();
  const [searchTerm, setSearchTerm] = useState('');
  const [uploading, setUploading] = useState(false);
  const [renamingWork, setRenamingWork] = useState(null);
  const [workToDelete, setWorkToDelete] = useState(null);
  const [showPreview, setShowPreview] = useState(null);
  const fileInputRef = useRef(null);

  // Filtragem local
  const filteredWorks = works.filter(w => 
    w.titulo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    w.categoria?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione apenas imagens.');
      return;
    }

    setUploading(true);
    const res = await uploadWork(file, file.name.split('.')[0], 'Geral');
    setUploading(false);
    
    if (res.success) {
      toast.success('Trabalho adicionado com sucesso!');
    } else {
      toast.error('Erro ao subir imagem. Tente novamente.');
    }
    
    // Reseta o input para permitir subir o mesmo arquivo se necessário
    e.target.value = '';
  };

  const handleDeleteClick = (work) => {
    setWorkToDelete(work);
  };

  const confirmDelete = async () => {
    if (!workToDelete) return;
    
    const res = await deleteWork(workToDelete.id, workToDelete.storage_path);
    if (res.success) {
      toast.success('Trabalho removido com sucesso.');
      setWorkToDelete(null);
    } else {
      // Exibe o erro específico retornado pela hook
      toast.error(`Falha ao excluir: ${res.error}`);
      setWorkToDelete(null);
    }
  };

  const handleRenameSubmit = async (e) => {
    e.preventDefault();
    const newTitle = e.target.titulo.value;
    if (!newTitle) return;

    const res = await renameWork(renamingWork.id, newTitle);
    if (res.success) {
      toast.success('Título atualizado!');
      setRenamingWork(null);
    } else {
      toast.error('Erro ao atualizar título.');
    }
  };

  if (loading && works.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="animate-spin text-primary mb-4" size={48} />
        <p className="text-slate-500 font-bold animate-pulse">Carregando Galeria...</p>
      </div>
    );
  }

  return (
    <div className="fade-in space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-800 uppercase tracking-tighter">Trabalhos Recentes</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Gerencie as fotos do seu portfólio para o catálogo futuro.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileChange} 
            className="hidden" 
            accept="image/*"
          />
          <button 
            onClick={handleUploadClick}
            disabled={uploading}
            className="btn-primary flex items-center gap-2 justify-center shadow-lg shadow-primary/20"
          >
            {uploading ? <Loader2 size={20} className="animate-spin" /> : <Plus size={20} />}
            {uploading ? 'Enviando...' : 'Novo Trabalho'}
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 items-center bg-white p-2 rounded-2xl border border-slate-100 shadow-sm">
        <div className="relative flex-1 w-full group">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-primary transition-colors" />
          <input 
            type="text" 
            placeholder="Buscar por título ou categoria..." 
            className="w-full pl-11 pr-4 py-3 bg-transparent outline-none text-sm font-bold text-slate-700 placeholder:text-slate-300 placeholder:font-bold"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="h-8 w-px bg-slate-100 hidden md:block"></div>
        <div className="px-4 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">
          {filteredWorks.length} Itens Encontrados
        </div>
      </div>

      {/* Grid / Empty State */}
      {filteredWorks.length === 0 ? (
        <div className="bg-white rounded-[2.5rem] border border-slate-100 p-20 text-center shadow-sm">
          <div className="w-24 h-24 bg-slate-50 text-slate-200 rounded-[2rem] flex items-center justify-center mx-auto mb-8 border border-slate-100/50">
            <Camera size={48} />
          </div>
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight mb-2">Nada por aqui ainda</h2>
          <p className="text-sm text-slate-500 font-medium max-w-sm mx-auto mb-10 leading-relaxed">
            Seu portfólio está vazio. Suba as melhores fotos dos trabalhos realizados para impressionar seus clientes no catálogo.
          </p>
          <button 
            onClick={handleUploadClick}
            className="px-10 py-4 bg-slate-900 hover:bg-black text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] transition-all hover:scale-105 active:scale-95 shadow-xl shadow-slate-200"
          >
            Subir Primeiro Trabalho
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-20">
          {filteredWorks.map((work) => (
            <div key={work.id} className="group relative bg-white rounded-3xl border border-slate-100 p-3 shadow-sm hover:shadow-2xl hover:shadow-slate-200/50 transition-all duration-500 hover:-translate-y-2">
              {/* Image Container */}
              <div className="relative aspect-square rounded-2xl overflow-hidden bg-slate-50 cursor-pointer" onClick={() => setShowPreview(work)}>
                <img 
                  src={work.url} 
                  alt={work.titulo} 
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 ease-out"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                  <div className="flex gap-2">
                     <span className="bg-white/20 backdrop-blur-md text-white text-[9px] font-black px-2 py-1 rounded-lg border border-white/20 uppercase tracking-widest">
                       {work.categoria || 'Geral'}
                     </span>
                  </div>
                </div>
                <div className="absolute top-2 right-2 flex flex-col gap-2 translate-x-12 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300">
                  <button 
                    onClick={(e) => { e.stopPropagation(); setShowPreview(work); }}
                    className="p-2.5 bg-white text-slate-800 rounded-xl hover:bg-primary hover:text-white shadow-xl transition-all"
                  >
                    <Maximize2 size={16} />
                  </button>
                </div>
              </div>

              {/* Info Area */}
              <div className="mt-4 px-1 pb-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight truncate mb-0.5" title={work.titulo}>
                      {work.titulo}
                    </h3>
                    <div className="flex items-center gap-3 text-slate-400">
                      <div className="flex items-center gap-1">
                        <Calendar size={10} strokeWidth={3} />
                        <span className="text-[9px] font-black uppercase tracking-widest">{new Date(work.created_at).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <button 
                      onClick={() => setRenamingWork(work)}
                      className="p-2 text-slate-400 hover:text-primary transition-colors"
                      title="Renomear"
                    >
                      <Edit3 size={16} />
                    </button>
                    <button 
                      onClick={() => handleDeleteClick(work)}
                      className="p-2 text-slate-400 hover:text-rose-500 transition-colors"
                      title="Excluir"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      {workToDelete && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden animate-scaleUp">
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-6">
                <Trash2 size={32} />
              </div>
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-2">Excluir Trabalho?</h3>
              <p className="text-sm text-slate-500 font-medium mb-8">
                Esta ação é permanente e removerá a foto "<strong>{workToDelete.titulo}</strong>" da galeria e do servidor.
              </p>
              
              <div className="flex gap-3">
                <button 
                  onClick={() => setWorkToDelete(null)}
                  className="flex-1 py-4 text-xs font-black text-slate-400 uppercase tracking-widest hover:bg-slate-50 rounded-2xl transition-all"
                >
                  Cancelar
                </button>
                <button 
                  onClick={confirmDelete}
                  className="flex-1 py-4 bg-rose-500 hover:bg-rose-600 text-white text-xs font-black uppercase tracking-widest rounded-2xl shadow-xl shadow-rose-200 transition-all"
                >
                  Sim, Excluir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Renomear */}
      {renamingWork && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-sm rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in duration-300">
            <div className="p-6 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-black text-slate-800 uppercase tracking-tighter text-sm">Renomear Trabalho</h3>
              <button 
                onClick={() => setRenamingWork(null)}
                className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-all"
              >
                <X size={18} />
              </button>
            </div>
            
            <form onSubmit={handleRenameSubmit} className="p-8 space-y-6">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-1">Novo Nome do Arquivo</label>
                <div className="relative">
                  <Edit3 className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" size={16} />
                  <input 
                    name="titulo" 
                    defaultValue={renamingWork.titulo} 
                    autoFocus
                    required 
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl outline-none focus:ring-4 focus:ring-primary/10 focus:border-primary transition-all text-sm font-bold shadow-inner"
                    placeholder="Ex: Envelopamento BMW M3"
                  />
                </div>
                <p className="text-[9px] text-slate-400 font-medium px-1">Este nome será exibido no seu catálogo de trabalhos.</p>
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  type="button"
                  onClick={() => setRenamingWork(null)}
                  className="flex-1 py-4 text-xs font-black text-slate-400 uppercase tracking-widest hover:bg-slate-50 rounded-2xl transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 btn-primary py-4 rounded-2xl shadow-xl shadow-primary/20"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && (
        <div 
          className="fixed inset-0 bg-slate-900/95 backdrop-blur-md z-[250] flex flex-col items-center justify-center p-4 pb-12 animate-in fade-in duration-300"
          onClick={() => setShowPreview(null)}
        >
          <button className="absolute top-6 right-6 p-4 text-white hover:bg-white/10 rounded-full transition-all">
            <X size={32} />
          </button>
          
          <div className="max-w-4xl w-full h-[70vh] flex items-center justify-center" onClick={e => e.stopPropagation()}>
            <img 
               src={showPreview.url} 
               alt={showPreview.titulo} 
               className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"
            />
          </div>
          
          <div className="mt-8 text-center text-white" onClick={e => e.stopPropagation()}>
            <h3 className="text-xl font-black uppercase tracking-widest">{showPreview.titulo}</h3>
            <div className="flex items-center justify-center gap-4 mt-2 text-white/50">
              <span className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                <Tag size={12} /> {showPreview.categoria || 'Geral'}
              </span>
              <span className="text-[10px] font-black uppercase tracking-widest flex items-center gap-1">
                <Calendar size={12} /> {new Date(showPreview.created_at).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Styles */}
      <style>{`
        @keyframes scaleUp {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
        .animate-scaleUp {
          animation: scaleUp 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }
      `}</style>
    </div>
  );
};

export default Trabalhos;
