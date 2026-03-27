# Estrutura do Banco de Dados - OsSystem

Este arquivo contém os scripts SQL para criação das tabelas e regras de segurança do sistema. Utilize o SQL Editor do Supabase para executar este comando.

## 🚀 Script de Criação (SQL)

```sql
-- TABELA DE CONFIGURAÇÕES DA LOJA (WHITE LABEL)
CREATE TABLE IF NOT EXISTS public.loja_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome_loja TEXT NOT NULL DEFAULT 'OsSystem',
    logo_url TEXT,
    youtube_id TEXT,
    primary_color TEXT DEFAULT '#059669',
    secondary_color TEXT DEFAULT '#1e293b',
    accent_color TEXT DEFAULT '#4f46e5',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- TABELA DE CLIENTES
CREATE TABLE IF NOT EXISTS public.clientes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    email TEXT,
    telefone TEXT,
    cpf_cnpj TEXT,
    endereco TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- TABELA DE VEÍCULOS
CREATE TABLE IF NOT EXISTS public.veiculos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cliente_id UUID REFERENCES public.clientes(id) ON DELETE CASCADE,
    modelo TEXT NOT NULL,
    marca TEXT,
    placa TEXT UNIQUE,
    cor TEXT,
    ano TEXT,
    tipo TEXT, -- Ex: SUV, SEDAN, MOTO
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- TABELA DE SERVIÇOS
CREATE TABLE IF NOT EXISTS public.servicos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    descricao TEXT,
    preco_base DECIMAL(10,2),
    tempo_estimado INTERVAL,
    categoria TEXT, -- Ex: PPF, Estética, Mecânica
    tipo_veiculo TEXT DEFAULT 'AMBOS', -- Valores: 'CARRO', 'MOTO', 'AMBOS'
    garantia TEXT DEFAULT '12 meses'
);

-- TABELA DE ESTOQUE/MATERIAIS
CREATE TABLE IF NOT EXISTS public.estoque_materiais (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome TEXT NOT NULL,
    quantidade DECIMAL(10,2) DEFAULT 0,
    unidade TEXT, -- m, un, l
    preco_custo DECIMAL(10,2),
    minimo_alerta DECIMAL(10,2)
);

-- TABELA DE ORDENS DE SERVIÇO (OS)
CREATE TABLE IF NOT EXISTS public.ordens_servico (
    id SERIAL PRIMARY KEY,
    cliente_id UUID REFERENCES public.clientes(id),
    veiculo_id UUID REFERENCES public.veiculos(id),
    status TEXT DEFAULT 'AGUARDANDO', -- AGUARDANDO, EM EXECUÇÃO, CONCLUÍDO, CANCELADO
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- TABELA DE CHECKLIST DE AVARIAS (MAPA VISUAL)
CREATE TABLE IF NOT EXISTS public.checklist_avarias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    os_id INTEGER REFERENCES public.ordens_servico(id) ON DELETE CASCADE,
    pontos_avaria JSONB DEFAULT '[]', -- Armazena coordenadas e tipos de dano (risco, amassado)
    notas TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- TABELA DE FOTOS DA OS (ANTES/DEPOIS)
CREATE TABLE IF NOT EXISTS public.os_midia (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    os_id INTEGER REFERENCES public.ordens_servico(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    tipo TEXT, -- 'antes', 'depois', 'durante'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

INSERT INTO public.loja_config (id, nome_loja, youtube_id) 
VALUES (gen_random_uuid(), 'Auto Wrap Pro', '-qAnDdG-l1Y')
ON CONFLICT DO NOTHING;
```

## 🛠️ Patch: Adicionar Colunas Avançadas (Execute se o operador não conseguir finalizar)
Se ao tentar finalizar a OS o sistema der erro de "Column does not exist", execute este comando no SQL Editor:

```sql
ALTER TABLE public.ordens_servico 
ADD COLUMN IF NOT EXISTS servicos_detalhados JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS tempo_decorrido INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS data_fim TIMESTAMP WITH TIME ZONE;
```

---

## 🔐 Configuração de Segurança (RLS)

> [!IMPORTANT]
> Se você receber erros de permissão (401 ou 42501) ao tentar salvar ou ler dados, você deve desativar a Segurança de Nível de Linha (RLS) no Supabase ou criar políticas de acesso para o perfil `anon`.
> 
> **Para desativar o RLS em todas as tabelas (recomendado para simplificar o desenvolvimento):**

```sql
-- Rode estes comandos no SQL Editor do Supabase para liberar o acesso:
ALTER TABLE public.loja_config DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.veiculos DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.ordens_servico DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_avarias DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.os_midia DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.servicos DISABLE ROW LEVEL SECURITY;
```

```

## 👥 Gestão de Usuários e Permissões (RBAC)

Para habilitar a autenticação segura e o controle de acesso por cargos, utilize o script abaixo.

### 📋 Tabela de Perfis (`public.profiles`)
Esta tabela estende o `auth.users` do Supabase com informações de cargo e status.

```sql
-- 1. Criar Tipo ENUM para Cargos (Com proteção contra erro se já existir)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
    CREATE TYPE public.user_role AS ENUM ('ADM', 'GESTOR', 'OPERADOR');
  END IF;
END $$;

-- 2. Criar Tabela de Perfis
CREATE TABLE public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  nome text,
  email text,
  cargo public.user_role DEFAULT 'OPERADOR',
  status boolean DEFAULT true,
  avatar_url text,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Habilitar RLS em Perfis
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 4. Políticas de Perfil (O usuário pode ver/editar seu próprio perfil)
CREATE POLICY "Usuários podem ver seu próprio perfil" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Usuários podem editar seu próprio perfil" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- 5. Função Trigger para criar perfil automático ao cadastrar no Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, nome, email, cargo)
  VALUES (new.id, new.raw_user_meta_data->>'full_name', new.email, 'OPERADOR');
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Gatilho (Trigger) para rodar a função
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
```

---

## 🏗️ Pendências de Estrutura (Fase 18)
Não foram detectadas necessidades imediatas de criação de novas tabelas ou colunas para a **Fase 18 completa (Partes 1, 2 e 3)**, uma vez que:
- O controle de Dashboard é apenas lógica de leitura no front-end.
- O Pop-up do botão Vendas é puramente CSS/React.
- A finalização de OS e Certificado podem reutilizar a data já existente (`data_fim`) e o status (`CONCLUÍDO`) na tabela `ordens_servico`.
- O CRUD de **Estoque** fará uso da tabela `estoque_materiais` já existente.
- A edição de **Clientes** fará uso das colunas genéricas `email` e `telefone` da tabela `clientes`.
- Os erros de **Serviços** são unicamente bugs de Frontend (variáveis não definidas), toda a estrutura (`tipo_veiculo`, etc) já está criada no banco.
- O campo de nome para **Colaboradores** já existe explicitamente na tabela de `public.profiles` sob a coluna `nome`.
- A persistência de **Configurações e Logo** fará uso da tabela `loja_config`, que já detém a coluna dedicada `logo_url`, além de cores e nome. A falha de persistência atual provém apenas da lógica de atualização da interface.
