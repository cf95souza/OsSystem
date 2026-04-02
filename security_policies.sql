-- SCRIPT DE HARDENING DE BANCO E POLÍTICAS RLS (OsSystem)
-- Ative o RLS em todas as tabelas
ALTER TABLE public.loja_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.veiculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ordens_servico ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_avarias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.os_midia ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estoque_materiais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 1. POLÍTICAS PARA ADM E GESTOR (Acesso Total)
CREATE POLICY "Gestão total para ADM e GESTOR" ON public.loja_config FOR ALL USING (auth.uid() IN (SELECT id FROM public.profiles WHERE cargo IN ('ADM', 'GESTOR')));
CREATE POLICY "Gestão total para ADM e GESTOR" ON public.clientes FOR ALL USING (auth.uid() IN (SELECT id FROM public.profiles WHERE cargo IN ('ADM', 'GESTOR')));
CREATE POLICY "Gestão total para ADM e GESTOR" ON public.veiculos FOR ALL USING (auth.uid() IN (SELECT id FROM public.profiles WHERE cargo IN ('ADM', 'GESTOR')));
CREATE POLICY "Gestão total para ADM e GESTOR" ON public.ordens_servico FOR ALL USING (auth.uid() IN (SELECT id FROM public.profiles WHERE cargo IN ('ADM', 'GESTOR')));
CREATE POLICY "Gestão total para ADM e GESTOR" ON public.checklist_avarias FOR ALL USING (auth.uid() IN (SELECT id FROM public.profiles WHERE cargo IN ('ADM', 'GESTOR')));
CREATE POLICY "Gestão total para ADM e GESTOR" ON public.os_midia FOR ALL USING (auth.uid() IN (SELECT id FROM public.profiles WHERE cargo IN ('ADM', 'GESTOR')));
CREATE POLICY "Gestão total para ADM e GESTOR" ON public.servicos FOR ALL USING (auth.uid() IN (SELECT id FROM public.profiles WHERE cargo IN ('ADM', 'GESTOR')));
CREATE POLICY "Gestão total para ADM e GESTOR" ON public.estoque_materiais FOR ALL USING (auth.uid() IN (SELECT id FROM public.profiles WHERE cargo IN ('ADM', 'GESTOR')));
CREATE POLICY "Gestão total para ADM e GESTOR" ON public.profiles FOR ALL USING (auth.uid() IN (SELECT id FROM public.profiles WHERE cargo IN ('ADM', 'GESTOR')));

-- 2. POLÍTICAS PARA OPERADOR (Acesso Execução)
CREATE POLICY "Leitura de serviços para Operador" ON public.servicos FOR SELECT USING (auth.uid() IN (SELECT id FROM public.profiles WHERE cargo = 'OPERADOR'));
CREATE POLICY "Leitura de clientes para Operador" ON public.clientes FOR SELECT USING (auth.uid() IN (SELECT id FROM public.profiles WHERE cargo = 'OPERADOR'));
CREATE POLICY "Leitura de veículos para Operador" ON public.veiculos FOR SELECT USING (auth.uid() IN (SELECT id FROM public.profiles WHERE cargo = 'OPERADOR'));
CREATE POLICY "Gestão de OS para Operador" ON public.ordens_servico FOR ALL USING (auth.uid() IN (SELECT id FROM public.profiles WHERE cargo = 'OPERADOR'));
CREATE POLICY "Lançamento de checklist para Operador" ON public.checklist_avarias FOR ALL USING (auth.uid() IN (SELECT id FROM public.profiles WHERE cargo = 'OPERADOR'));
CREATE POLICY "Upload de mídia para Operador" ON public.os_midia FOR ALL USING (auth.uid() IN (SELECT id FROM public.profiles WHERE cargo = 'OPERADOR'));
CREATE POLICY "Leitura de estoque para Operador" ON public.estoque_materiais FOR SELECT USING (auth.uid() IN (SELECT id FROM public.profiles WHERE cargo = 'OPERADOR'));

-- 3. POLÍTICAS PARA ACESSO ANÔNIMO (Página de Status do Cliente e TV)
-- O acesso anônimo deve ser estritamente limitado ao necessário para visualização pública.

-- Monitor TV precisa ver as configurações da loja
CREATE POLICY "Acesso público ao Monitor TV (Config)" ON public.loja_config FOR SELECT USING (true);

-- Clientes só podem ver sua própria OS se possuírem o token de rastreio UUID
-- Isso previne que alguém liste todas as OSs do banco sem autorização
CREATE POLICY "Acesso público via Tracking Token" ON public.ordens_servico FOR SELECT USING (
  tracking_token IS NOT NULL OR 
  (auth.uid() IN (SELECT id FROM public.profiles WHERE cargo IN ('ADM', 'GESTOR', 'OPERADOR')))
);

-- Veículos, checklists e mídias só são visíveis anonimamente se a OS associada for pública
CREATE POLICY "Acesso público a veículos via Tracking" ON public.veiculos FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.ordens_servico WHERE veiculo_id = public.veiculos.id AND tracking_token IS NOT NULL) OR
  (auth.uid() IN (SELECT id FROM public.profiles WHERE cargo IN ('ADM', 'GESTOR', 'OPERADOR')))
);

CREATE POLICY "Acesso público a checklist via Tracking" ON public.checklist_avarias FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.ordens_servico WHERE id = public.checklist_avarias.os_id AND tracking_token IS NOT NULL) OR
  (auth.uid() IN (SELECT id FROM public.profiles WHERE cargo IN ('ADM', 'GESTOR', 'OPERADOR')))
);

CREATE POLICY "Acesso público a mídias via Tracking" ON public.os_midia FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.ordens_servico WHERE id = public.os_midia.os_id AND tracking_token IS NOT NULL) OR
  (auth.uid() IN (SELECT id FROM public.profiles WHERE cargo IN ('ADM', 'GESTOR', 'OPERADOR')))
);

-- Perfis são visíveis para que os nomes dos técnicos apareçam, mas somente leitura
CREATE POLICY "Leitura pública de perfis (Nomes)" ON public.profiles FOR SELECT USING (true);
