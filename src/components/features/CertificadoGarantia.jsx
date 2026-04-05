import React, { useRef } from 'react';
import { 
  FileCheck, 
  Printer, 
  ShieldCheck, 
  Calendar, 
  User, 
  Car, 
  Award,
  Shield,
  CheckCircle,
  QrCode,
  X
} from 'lucide-react';
import { useBrand } from '../../contexts/BrandContext';
import { toast } from '../../utils/toast';

const CertificadoGarantia = ({ os, onClose }) => {
  const { name, colors, logoUrl } = useBrand();
  const printRef = useRef();

  if (!os) return null;

  const handlePrint = () => {
    const printContents = printRef.current.innerHTML;
    const styles = Array.from(document.querySelectorAll('style, link[rel="stylesheet"]'))
      .map(node => node.outerHTML)
      .join('');
      
    const printWindow = window.open('', '_blank', 'width=800,height=900');
    if (!printWindow) {
      toast.warning("Seu navegador bloqueou o pop-up. Por favor, permita pop-ups para imprimir o certificado.");
      return;
    }
    
    printWindow.document.write(`
      <html>
        <head>
          <title>Certificado de Garantia - OS #${os.id}</title>
          ${styles}
          <style>
            @media print {
              body { background: white !important; margin: 0; padding: 0; }
              @page { size: A4 portrait; margin: 0.8cm; }
              .no-print { display: none !important; }
            }
            body { background: white; }
          </style>
        </head>
        <body class="bg-white p-0 m-0">
          <div class="font-sans text-slate-900 bg-white">
             ${printContents}
          </div>
          <script>
            // Pequeno delay para garantir que as fontes e os estilos Tailwind carreguem na nova janela
            setTimeout(() => {
              window.print();
              window.close();
            }, 500);
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Lógica de cálculo dinâmico de garantia
  const getWarrantyInfo = () => {
    if (!os.servicos_detalhados || !Array.isArray(os.servicos_detalhados)) {
      return { texto: os.garantia || '12 Meses', data: os.data_validade || '19/03/2027' };
    }

    // Função para converter texto em meses para comparação
    const toMonths = (str) => {
      if (!str) return 0;
      const num = parseInt(str.replace(/\D/g, '')) || 0;
      if (str.toUpperCase().includes('ANO')) return num * 12;
      return num;
    };

    // Encontrar o serviço com a maior garantia
    const maiorServico = os.servicos_detalhados.reduce((max, s) => {
      return toMonths(s.garantia) > toMonths(max.garantia) ? s : max;
    }, os.servicos_detalhados[0] || { garantia: '12 Meses' });

    const texto = maiorServico.garantia || '12 Meses';
    const meses = toMonths(texto);
    
    // Calcular data baseada na OS (created_at ou data_fim)
    const baseDate = new Date(os.created_at || new Date());
    const validUntil = new Date(baseDate);
    validUntil.setMonth(validUntil.getMonth() + meses);

    return { 
      texto: texto.toUpperCase(), 
      data: validUntil.toLocaleDateString('pt-BR') 
    };
  };

  const { texto: garantiaTexto, data: dataValidade } = getWarrantyInfo();

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-[200] flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl overflow-hidden flex flex-col relative animate-fadeIn no-print max-h-[90vh]">
        
        {/* Barra de Ações (Visualização) - Cabeçalho Fixo */}
        <div className="p-6 bg-slate-900 flex items-center justify-between border-b border-white/5 no-print shrink-0 z-50">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
                <FileCheck className="text-primary" size={24} />
            </div>
            <div>
                <h3 className="text-white font-black uppercase text-xs tracking-widest">Visualização do Certificado</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">OS #{os.id}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={handlePrint}
              className="bg-primary hover:bg-emerald-700 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 transition-all shadow-lg shadow-primary/20"
            >
              <Printer size={16} strokeWidth={3} /> Imprimir PDF
            </button>
            <button 
              onClick={onClose}
              className="p-3 hover:bg-white/10 rounded-full transition-all group"
            >
              <X size={24} className="text-slate-500 group-hover:text-white" />
            </button>
          </div>
        </div>

        {/* ÁREA DO CERTIFICADO (O QUE SERÁ IMPRESSO) - Corpo Rolável */}
        <div 
          ref={printRef}
          className="certificate-print-area flex-1 overflow-y-auto p-4 md:p-8 bg-white text-slate-900 font-sans print:p-0 custom-scrollbar"
        >
          <div className="border-[8px] print:border-0 border-slate-50 p-4 print:p-2 relative w-full max-w-[794px] mx-auto min-h-0 flex flex-col justify-between overflow-hidden">
            
            {/* Background Decor */}
            <div className="absolute -top-32 -right-32 w-96 h-96 bg-slate-50 rounded-full blur-3xl opacity-50 print:hidden" />
            <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-primary/5 rounded-full blur-3xl opacity-50 print:hidden" />

            {/* Content Container with surgical compacting */}
            <div className="relative z-10 space-y-4">
              {/* Top Corners Decor */}
              <div className="absolute top-0 right-0 w-24 h-24 border-t-2 border-r-2 border-slate-100 rounded-tr-3xl" />
              <div className="absolute top-0 left-0 w-24 h-24 border-t-2 border-l-2 border-slate-100 rounded-tl-3xl" />

              {/* Logo & Header Section - More Compact */}
              <div className="text-center pt-2 pb-2">
                <div className="inline-block p-4 border border-slate-50 rounded-3xl bg-white shadow-xl shadow-slate-200/20 mb-2">
                  <img src={logoUrl || "/logo-lucas.png"} alt="Logomarca" className="h-20 w-auto object-contain" />
                </div>
                <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter">{name || 'Lucas Envelopamento'}</h1>
                <p className="text-[10px] font-black text-primary uppercase tracking-[0.4em] mt-1 italic">Estética Automotiva de Elite</p>
              </div>

              {/* Certificate Title - Compacted Padding */}
              <div className="text-center py-4 relative">
                <div className="absolute left-1/2 -bottom-2 -translate-x-1/2 w-12 h-1 bg-primary rounded-full opacity-20" />
                <h2 className="text-2xl font-serif italic text-slate-800">Certificado de Garantia</h2>
                <p className="text-[11px] text-slate-500 max-w-lg mx-auto mt-2 font-medium leading-relaxed">
                  Este documento oficial atesta que o veículo descrito abaixo recebeu tratamentos de proteção e estética utilizando tecnologia de ponta, seguindo os mais rigorosos protocolos de qualidade.
                </p>
              </div>

              {/* Data Grid Section - Reduzido py-6 para py-4 */}
              <div className="grid grid-cols-2 gap-4 py-4 px-6 bg-slate-50/50 rounded-[2rem] border border-slate-100 relative overflow-hidden">
                 <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-slate-400">
                        <User size={18} />
                    </div>
                    <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Proprietário</p>
                        <p className="text-sm font-black text-slate-800 uppercase line-clamp-1">{os.cliente_nome || os.cliente}</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-slate-400">
                        <FileCheck className="text-primary" size={18} />
                    </div>
                    <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Número de Registro</p>
                        <p className="text-sm font-black text-slate-800 italic">#{String(os.id).padStart(4, '0')}</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-slate-400">
                        <Car size={18} />
                    </div>
                    <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Veículo Selecionado</p>
                        <p className="text-sm font-black text-slate-800 uppercase line-clamp-1">{os.veiculo_desc || os.veiculo}</p>
                    </div>
                 </div>
                 <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-slate-400">
                        <Calendar size={18} />
                    </div>
                    <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Data de Execução</p>
                        <p className="text-sm font-black text-slate-800">{os.data || new Date(os.created_at).toLocaleDateString('pt-BR')}</p>
                    </div>
                 </div>
              </div>

              {/* Tags de Serviços Aplicados - Mais compactas */}
              <div className="text-center">
                 <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest mb-2">Serviços e Proteções Aplicadas</p>
                 <div className="flex flex-wrap justify-center gap-2">
                    {(os.servico || '').split(',').map((s, i) => (
                        <span key={i} className="px-3 py-1 bg-white border border-slate-100 rounded-lg text-[9px] font-black text-slate-600 uppercase flex items-center gap-1.5 shadow-sm">
                            <Shield className="text-emerald-500" size={10} strokeWidth={3} /> {s.trim()}
                        </span>
                    ))}
                 </div>
              </div>
            </div>

            {/* Warranty Badge Section - Surgical Compacted (p-8 para p-6) */}
            <div className="my-2 px-8">
               <div className="bg-slate-900 rounded-[2.5rem] p-6 text-white relative overflow-hidden flex items-center justify-between shadow-2xl">
                  {/* Subtle BG Icon - Scaled Down */}
                  <Shield size={120} className="absolute -right-6 -bottom-6 text-white/5 rotate-12" />
                  
                  <div className="relative z-10">
                     <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] mb-1">Certificado de Proteção</p>
                     <h3 className="text-4xl font-black tracking-tighter flex items-baseline gap-2">
                        {garantiaTexto.split(' ')[0]} <span className="text-xl uppercase text-white/50">{garantiaTexto.split(' ')[1]}</span>
                     </h3>
                     <div className="flex items-center gap-2 mt-2 py-2 px-3 bg-white/5 rounded-xl border border-white/5 w-fit">
                        <Calendar size={14} className="text-primary" />
                        <p className="text-[10px] font-black uppercase tracking-widest">Válido até <span className="text-primary">{dataValidade}</span></p>
                     </div>
                  </div>

                  <div className="flex flex-col items-center gap-2 relative z-10 bg-white/5 p-4 rounded-3xl border border-white/10 backdrop-blur-sm">
                      <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-slate-900 shadow-lg shadow-primary/20">
                          <QrCode size={24} />
                      </div>
                      <p className="text-[8px] font-black uppercase tracking-widest text-center leading-tight opacity-60">Autenticidade<br/>Verificada</p>
                  </div>
               </div>
            </div>

            {/* Signatures & Footer - Slipped up (mt-8 para mt-4) */}
            <div className="px-12 mt-4 pt-4 mb-4">
              <div className="grid grid-cols-2 gap-16">
                <div className="text-center">
                  <div className="h-px bg-slate-200 mb-2 w-full" />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Responsável Técnico</p>
                </div>
                <div className="text-center">
                  <div className="h-px bg-slate-200 mb-2 w-full" />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Diretor de Qualidade</p>
                </div>
              </div>
              <p className="text-[8px] text-center text-slate-300 font-bold uppercase mt-4 max-w-xs mx-auto leading-relaxed">
                A validade desta garantia está condicionada à manutenção preventiva conforme manual do proprietário entregue no ato do serviço.
              </p>
            </div>

            {/* Bottom Corners Decor */}
            <div className="absolute bottom-0 right-0 w-24 h-24 border-b-2 border-r-2 border-slate-100 rounded-br-3xl" />
            <div className="absolute bottom-0 left-0 w-24 h-24 border-b-2 border-l-2 border-slate-100 rounded-bl-3xl" />
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes fadeIn { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        .animate-fadeIn { animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1); }
      `}} />
    </div>
  );
};

export default CertificadoGarantia;
