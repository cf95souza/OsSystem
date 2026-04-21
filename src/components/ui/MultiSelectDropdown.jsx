import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

const MultiSelectDropdown = ({ label, options, selected, onToggle, icon: Icon, className = "" }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isAllSelected = selected.includes('TODOS');
  const count = isAllSelected ? 'TODOS' : selected.length;

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <button 
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-100 rounded-2xl text-sm font-black text-slate-600 hover:bg-slate-50 transition-all shadow-sm uppercase tracking-widest min-w-[200px] justify-between group"
      >
        <div className="flex items-center gap-2">
            {Icon && <Icon size={16} className="text-primary shrink-0 group-hover:scale-110 transition-transform" />}
            <div className="flex flex-col items-start overflow-hidden">
            <span className="text-[8px] font-black uppercase text-slate-400 leading-none mb-0.5">{label}</span>
            <span className="text-[10px] font-black text-slate-600 uppercase truncate w-full flex items-center gap-1">
                {isAllSelected ? 'TODOS' : `${count} SELEC.`}
            </span>
            </div>
        </div>
        <ChevronDown size={14} className={`transition-transform text-slate-400 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-2 w-72 bg-white border border-slate-100 shadow-2xl rounded-2xl z-[500] py-2 animate-in fade-in zoom-in duration-200">
          <div className="max-h-64 overflow-y-auto custom-scrollbar">
            {options.map((opt) => {
              const isSelected = selected.includes(opt);
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => onToggle(opt)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition-colors group"
                >
                  <span className={`text-[10px] font-black uppercase transition-colors ${isSelected ? 'text-primary' : 'text-slate-600'}`}>
                    {opt}
                  </span>
                  <div className={`w-5 h-5 rounded-lg border-2 transition-all flex items-center justify-center ${isSelected ? 'bg-primary border-primary' : 'border-slate-200 group-hover:border-primary/30'}`}>
                    {isSelected && <Check size={12} className="text-white stroke-[4]" />}
                  </div>
                </button>
              );
            })}
          </div>
          
          <div className="px-4 py-2 mt-2 border-t border-slate-50">
             <button 
               type="button"
               onClick={() => onToggle('TODOS')}
               className="w-full py-2 text-[8px] font-black text-primary uppercase tracking-widest hover:bg-primary/5 rounded-lg transition-all"
             >
               Limpar Filtros / Ver Todos
             </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MultiSelectDropdown;
