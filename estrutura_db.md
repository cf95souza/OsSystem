# Estrutura do Banco de Dados - OsSystem (Produção)

Este arquivo contém o script mestre para a criação completa do banco de dados em um novo ambiente Supabase. 

> [!IMPORTANT]
> Este script utiliza Funções Security Definer para evitar erros de "Infinite Recursion" nas políticas de segurança (RLS).

## 🚀 Script SQL Mestre
Copie e cole o conteúdo abaixo no **SQL Editor** do Supabase.

```sql
-- ============================================================================
-- SCRIPT MESTRE DE CRIAÇÃO DO BANCO DE DADOS - OSSYSTEM (VERSÃO PRODUÇÃO)
-- ============================================================================

-- 1. TIPOS E ENUMS
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE public.user_role AS ENUM ('ADM', 'GESTOR', 'OPERADOR');
  END IF;
END $$;

-- 2. TABELAS
CREATE TABLE IF NOT EXISTS public.loja_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome_loja TEXT NOT NULL DEFAULT 'OsSystem',
    logo_url TEXT,
    youtube_id TEXT,
    primary_color TEXT DEFAULT '#059669',
    secondary_color TEXT DEFAULT '#1e293b',
    accent_color TEXT DEFAULT '#4f46e5',
    monitor_bg_color TEXT DEFAULT '#0f172a',
    whatsapp TEXT,
    instagram_url TEXT,
    youtube_social_url TEXT,
    tiktok_url TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    email TEXT,
    telefone TEXT,
    cpf_cnpj TEXT,
    endereco TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.veiculos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID REFERENCES public.clientes(id) ON DELETE CASCADE,
    modelo TEXT NOT NULL,
    marca TEXT,
    placa TEXT UNIQUE,
    cor TEXT,
    ano TEXT,
    tipo TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.servicos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    descricao TEXT,
    preco_base DECIMAL(10,2),
    tempo_estimado INTERVAL,
    categoria TEXT,
    tipo_veiculo TEXT DEFAULT 'AMBOS',
    garantia TEXT DEFAULT '12 meses',
    controle_estoque BOOLEAN DEFAULT false,
    materiais JSONB DEFAULT '[]'
);

CREATE TABLE IF NOT EXISTS public.estoque_materiais (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    quantidade DECIMAL(10,2) DEFAULT 0,
    unidade TEXT,
    preco_custo DECIMAL(10,2),
    minimo_alerta DECIMAL(10,2)
);

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  nome text,
  email text,
  cargo public.user_role DEFAULT 'OPERADOR',
  status boolean DEFAULT true,
  avatar_url text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.ordens_servico (
    id SERIAL PRIMARY KEY,
    cliente_id UUID REFERENCES public.clientes(id),
    veiculo_id UUID REFERENCES public.veiculos(id),
    status TEXT DEFAULT 'AGUARDANDO', 
    progresso INTEGER DEFAULT 0,
    data_inicio TIMESTAMP WITH TIME ZONE,
    data_fim TIMESTAMP WITH TIME ZONE,
    valor_total DECIMAL(10,2),
    desconto DECIMAL(10,2) DEFAULT 0,
    servico TEXT,
    data_agendamento TIMESTAMP WITH TIME ZONE,
    tecnico_id UUID REFERENCES public.profiles(id),
    observacoes TEXT,
    tecnico TEXT,
    servicos_detalhados JSONB DEFAULT '[]',
    tempo_decorrido INTEGER DEFAULT 0,
    valor_pago DECIMAL(10,2) DEFAULT 0,
    historico_pagamentos JSONB DEFAULT '[]',
    tracking_token UUID DEFAULT gen_random_uuid(),
    obs_tecnico TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.checklist_avarias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    os_id INTEGER REFERENCES public.ordens_servico(id) ON DELETE CASCADE,
    pontos_avaria JSONB DEFAULT '[]',
    notas TEXT,
    quilometragem TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.os_midia (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    os_id INTEGER REFERENCES public.ordens_servico(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    tipo TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.notificacoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    titulo TEXT NOT NULL,
    mensagem TEXT NOT NULL,
    tipo TEXT DEFAULT 'ALERTA', 
    item_id UUID,
    lida BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS public.trabalhos_recentes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    titulo TEXT NOT NULL,
    url TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    categoria TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. FUNÇÕES E TRIGGERS (CONEXÃO AUTH <-> PUBLIC)
-- ----------------------------------------------------------------------------

-- A. Gatilho para criar perfil automático
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email, cargo)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.email, 'OPERADOR');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- B. Função de Verificação de Cargo (Prevenção de Loop Infinito RLS)
CREATE OR REPLACE FUNCTION public.check_user_role(required_roles public.user_role[])
RETURNS boolean AS $$
BEGIN
  RETURN (
    SELECT (cargo = ANY(required_roles))
    FROM public.profiles
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 4. SEGURANÇA (RLS)
-- ----------------------------------------------------------------------------
ALTER TABLE public.loja_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.veiculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ordens_servico ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_avarias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.os_midia ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.servicos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.estoque_materiais ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notificacoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trabalhos_recentes ENABLE ROW LEVEL SECURITY;

-- POLÍTICAS PARA ADM E GESTORES (Usando check_user_role para evitar recursão)
CREATE POLICY "Profiles: Próprio ou Gestores" ON public.profiles FOR ALL USING (auth.uid() = id OR public.check_user_role(ARRAY['ADM'::public.user_role, 'GESTOR'::public.user_role]));
CREATE POLICY "Config: Gestores total" ON public.loja_config FOR ALL USING (public.check_user_role(ARRAY['ADM'::public.user_role, 'GESTOR'::public.user_role]));
CREATE POLICY "Clientes: Gestores total" ON public.clientes FOR ALL USING (public.check_user_role(ARRAY['ADM'::public.user_role, 'GESTOR'::public.user_role]));
CREATE POLICY "Veiculos: Gestores total" ON public.veiculos FOR ALL USING (public.check_user_role(ARRAY['ADM'::public.user_role, 'GESTOR'::public.user_role]));
CREATE POLICY "OS: Gestores total" ON public.ordens_servico FOR ALL USING (public.check_user_role(ARRAY['ADM'::public.user_role, 'GESTOR'::public.user_role]));
CREATE POLICY "Servicos: Gestores total" ON public.servicos FOR ALL USING (public.check_user_role(ARRAY['ADM'::public.user_role, 'GESTOR'::public.user_role]));
CREATE POLICY "Estoque: Gestores total" ON public.estoque_materiais FOR ALL USING (public.check_user_role(ARRAY['ADM'::public.user_role, 'GESTOR'::public.user_role]));
CREATE POLICY "Notificacoes: Gestores total" ON public.notificacoes FOR ALL USING (public.check_user_role(ARRAY['ADM'::public.user_role, 'GESTOR'::public.user_role]));
CREATE POLICY "Trabalhos: Gestores total" ON public.trabalhos_recentes FOR ALL USING (public.check_user_role(ARRAY['ADM'::public.user_role, 'GESTOR'::public.user_role]));

-- POLÍTICAS PARA OPERADORES (Apenas o essencial)
CREATE POLICY "Leitura essencial para Operador" ON public.servicos FOR SELECT USING (auth.uid() IN (SELECT id FROM public.profiles WHERE cargo = 'OPERADOR'));
CREATE POLICY "Gestão de OS para Operador" ON public.ordens_servico FOR ALL USING (auth.uid() IN (SELECT id FROM public.profiles WHERE cargo = 'OPERADOR'));

-- POLÍTICAS PÚBLICAS (MONITOR TV / LINK CLIENTE)
CREATE POLICY "Monitor TV Config Pública" ON public.loja_config FOR SELECT USING (true);
CREATE POLICY "Monitor TV Perfis Pública" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Monitor TV OS Pública" ON public.ordens_servico FOR SELECT USING (true);
CREATE POLICY "Trabalhos: Leitura Pública" ON public.trabalhos_recentes FOR SELECT USING (true);

-- 5. STORAGE
-- Criar bucket 'os-photos' manualmente como PUBLIC.

-- 6. ADMIN PROMOTION
-- UPDATE public.profiles SET cargo = 'ADM' WHERE email = 'cf95.souza@gmail.com';

-- 7. REALTIME
ALTER PUBLICATION supabase_realtime ADD TABLE ordens_servico, loja_config, notificacoes, estoque_materiais, trabalhos_recentes;
```

## 📋 Passo a Passo de Deploy
1. Crie um novo projeto no Supabase.
2. Rode o script SQL acima no SQL Editor.
3. Crie o bucket `os-photos` no Storage (Público).
4. Realize o cadastro inicial do administrador.
5. Rode o comando de promoção SQL (item 6 do script).
