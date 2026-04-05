# Guia de Desenvolvimento - OsSystem (White Label PWA)

Este documento é a bússola do projeto. Ele define as fases, objetivos e o progresso em tempo real. **Consultar este arquivo antes de qualquer nova implementação.**

## 🎯 Objetivo Geral
Criar uma aplicação White Label para estética automotiva (PPF, Insulfilm, Envelopamento) com:
- **PWA Mobile:** Para o Operador realizar checklists e gerir OS.
- **Web Dashboard:** Para o Gestor controlar a loja, estoque e faturamento.
- **TV Real-time:** Para exibição do status de produção na loja.
- **Infra:** Supabase (Auth/DB/Realtime) + Vercel (Hospedagem).

---

## 🛠️ Stack Tecnológica
- **Frontend:** React + Vite
- **Estilização:** Tailwind CSS (Baseado no `ui-design-system` e `dashboard-layout`)
- **Backend:** Supabase (PostgreSQL + Realtime)
- **PWA:** Vite PWA Plugin

---

## 🚀 Fases e Funcionalidades Detalhadas

### ✅ Fase 1: Setup e Fundação (Concluída)

### ✅ Fase 2: Design System e App Shell (Concluída)
- [x] Criação do `Sidebar` e `Header` profissionais (Skill: `dashboard-layout`).
- [x] Implementação de **Variáveis de Ambiente (.env)** para personalização.
- [x] **BrandContext:** Sistema de cores e logos dinâmicos.
- [x] Layouts base para Desktop (Gestor) e Mobile (Operador).
- [x] Ajustar layout do Certificado para A4 (Compactação Cirúrgica)
- [x] Implementar cálculo dinâmico de garantia (Anos/Meses) com base no serviço
- [x] Corrigir persistência do prazo de garantia na criação da OS
- [x] Sincronizar atualizações nos repositórios principal e do cliente

**Próxima Fase**: Monitoramento e Suporte de Produção.

### ✅ Fase 3: Módulo Gestor - Ordens de Serviço e Checklist (Concluída)
- [x] **Cadastros:** Clientes, Veículos, Serviços e Materiais/Estoque.
- [x] **Agenda Inteligente:** Calendário interativo para gestão de horários.
- [x] **Vendas/Orçamentos:** Fluxo de orçamento que vira OS após aprovação.
- [x] **Checklist Digital de Avarias (O Diferencial):** Mapa visual do veículo (SVG interativo) onde o gestor marca pontos de dano antes de iniciar.
- [x] **Certificado de Garantia:** Geração automática de PDF baseado no tempo de garantia do serviço. [x]
- [x] **Integração WhatsApp:** Botões de um clique para enviar confirmação de agenda e aviso de conclusão de serviço. [x]

### ✅ Fase 4: Módulo Operador (PWA Mobile)
- [x] **Dashboard Real:** KPIs de Fila Geral, Atribuídos e Finalizados (Histórico).
- [x] **Fila Organizada:** Divisão entre "Meus Serviços" e "Disponíveis para Coleta".
- [x] **Perfil:** Edição de Nome, E-mail e Troca de Senha.
- [x] **Execução Técnica:** Botão de Observação funcional e Sincronização Real-time com a TV.
- [x] **Finalização:** Registro de tempo de execução e mudança de status real para histórico.

### ✅ Fase 5: Visualização TV (Experiência do Cliente) (Concluída)
- [x] **Painel Real-time:** Status dos carros em produção com animações de progresso.
- [x] **Identificação:** Nome do cliente, Veículo e Serviço.
- [x] **Relógio e Data:** Estética premium sincronizada.

### ✅ Fase 6: Configurações e Persistência de Marca (Concluída)
- [x] **Tabela de Configurações:** Criar tabela no Supabase para armazenar ID do YouTube, Cores e Logo.
- [x] **Painel do Gestor:** Tela para editar o link da Playlist/Vídeo do YouTube.
- [x] **Integração Dinâmica:** Monitor TV passa a ler o vídeo do banco de dados, permitindo trocas sem novo deploy.
- [x] **White Label Real:** Gestão completa de identidade visual via interface.

### ✅ Fase 7: Autenticação e RBAC (Supabase Auth) - CONCLUÍDO
- [x] Implementação do Supabase Auth (E-mail/Senha).
- [x] Criação da tabela `perfis` e Trigger de auto-criação.
- [x] Desenvolvimento do `AuthContext` e Hook `useAuth`.
- [x] Criação da Tela de Login Premium.
- [x] Proteção de Rotas por Cargo (ADM, Gestor, Operador).
- [x] Garantia de acesso público ao Monitor TV.

### ✅ Fase 8: Gestão de Colaboradores e Realismo de Dados (Concluída)
- [x] **Painel de Usuários:** Refatoração completa da tela de `Colaboradores` integrada ao Supabase.
- [x] Fase 8: Dashboard em Tempo Real e Desmockagem
    - [x] Substituir dados mockados no Dashboard por métricas reais (Supabase)
    - [x] Fase 10: Orçamentos e OS Inteligentes 🚗🏍️💡
    - [x] Padronizar tipos de veículos no banco (CARRO/MOTO)
    - [x] Implementar filtragem dinâmica no modal de orçamento
    - [x] Implementar campos de Desconto e ajuste de preços finais
    - [x] Integrar Agendamento (Data e Técnico) ao fluxo de Aprovação
    - [x] Especializar Checklist Digital para Carro ou Moto
    - [x] Estabilizar Dashboard e Listas contra dados inconsistentes (Null Guards)
áficos
- [x] Fase 9: Especialização de Serviços por Veículo 🚗🏍️
    - [x] Adicionar distinção entre Carro, Moto ou Ambos no catálogo
    - [x] Implementar badges visuais de aplicabilidade nos cards
    - [x] Refinamento visual corporativo (Bordas, Sombras e Tipografia) conforme design system
    - [x] Validar persistência no Supabase após migração SQL
- [x] **Regras de Proteção:** Implementação da regra de ouro (ADM não desativa a si mesmo).
- [x] **Gestão de Marca:** White Label dinâmico e centralizado no `BrandContext` com persistência em banco.
- [x] **Sincronização Real-time:** Ativação de WebSockets em todas as tabelas principais para espelhamento instantâneo.
- [x] **Estabilização de Auth & Redirecionamento (F5 Fix):** Resolução definitiva de loops e atrasos no login/logout com redirecionamento RBAC instantâneo.
- [x] **Dashboard Real-time:** Desmockagem da Performance de Serviços e KPIs baseados em dados reais de catálogo e OS.

### ✅ Fase 11: Refinamentos de UX e Sincronização Final - CONCLUÍDO
- [x] Correção do link WhatsApp para usar o telefone real do cliente.
- [x] Implementação de Desconto em Porcentagem (%) com cálculo automático.
- [x] Retenção de orçamentos aprovados na tela de Vendas para acompanhamento.
- [x] Agenda de Conflitos: Visualização de ocupação do dia no modal de agendamento.
- [x] Limpeza de nomes de técnicos (remover e-mails e cargos do select).
- [x] Estabilização do salvamento de checklist e assinatura digital.

---

## 💎 Diferenciais Estratégicos (Onde vamos ganhar o mercado)

Para entregar um produto superior aos concorrentes, implementaremos:

1. **Checklist Visual 2D/3D:** Em vez de apenas texto, um desenho técnico do carro onde se clica para apontar riscos ou amassados. Isso gera confiança extrema no cliente.
2. **Histórico de Manutenção Pós-Venda:** O sistema avisará o gestor (e opcionalmente o cliente) após 6 meses/1 ano para uma "revisão de garantia" (ex: conferir se o PPF está levantando). Isso gera recorrência.
3. **Link de Acompanhamento para o Cliente:** Enviar um link único para o cliente ver o progresso do carro dele pelo celular, sem precisar ligar para a loja.
4. **Baixa Automática de Estoque:** Gastou 5 metros de PPF? O sistema já retira do estoque e avisa se estiver acabando.

---

## 🏢 Regras White Label (Versão Single-Tenant)
1. **Instância Única:** Cada cliente terá seu próprio deploy e seu próprio banco de dados Supabase.
2. **Cores/Logo:** Configuradas via `.env` ou Painel de Configurações do Gestor.

### ✅ Fase 12: Estabilização e Auditoria Técnica
- [x] **F5 Fix:** Correção definitiva da persistência de sessão no refresh da página.
- [x] **UI Serviços:** Novo formulário de cadastro (mais bonito), campo de Garantia e ajuste de Descrição.
- [x] **UI Vendas:** Menu de 3 pontos sem scroll, botão "APROVAR" e correção de texto no WhatsApp.
- [x] **Monitor TV PRO:** Melhorar legibilidade (texto maior), exibir 4 carros e vídeo reduzido.
- [x] **Lógica de Entrega:** Botão "Entregue" para limpar a TV e mover para histórico final.
- [x] **Configurações:** Corrigir persistência de cores, logo e vídeo no banco de dados.

### ✅ Fase 13: Diferenciais Estratégicos e Pós-Venda
- [x] **Garantia Digital:** Gerador de Certificado em PDF com dados da OS e prazos.
- [x] **Link do Cliente:** Página pública para o cliente acompanhar o progresso em tempo real. (Sincronizado via TV)
- [x] **Notificação Automática:** WhatsApp automático ao atingir 100% de conclusão.
- [x] **Estabilidade PWA:** Ajustes de contraste e fix do cronômetro (Fase 14/15 consolidada).
- [x] **Ergonomia Mobile:** Redução de escala do cronômetro (4xl) e correção de acessibilidade dos botões de ação para evitar sobreposição do menu.

### ✅ Fase 17: Múltiplos Serviços & Monitor Compacto (Concluído)
- [x] Controle granular de progresso por item e TV otimizada.

### ✅ Fase 18: Ajustes Habilidade Gestor - Parte 1 (Concluída)
- [x] **Dashboard:**
  - Corrigir a barra de rolagem horizontal indevida na listagem de Ordens Recentes.
  - Revisar e corrigir a lógica de todos os KPIs do Dashboard para garantir que os cálculos batam com a lista real e com a tela de Vendas.
- [x] **Vendas:**
  - Transformar o menu de ações de cada orçamento (os 3 pontinhos) em um pop-up flutuante (`absolute`/`fixed`) para não empurrar o layout para baixo nem gerar barras de rolagem.
- [x] **Ordens de Serviço:**
  - Substituir o `window.confirm` do fim do Checklist Visual por um pop-up React customizado e bonito com a opção "Enviar Link" e "Não Enviar".
  - Refatorar o botão "Ações / Enviar Link": Se a OS estiver em andamento, manda o acompanhamento sem precisar refazer checklist; se estiver concluída, exibe alerta "Serviço já concluído".
  - Criar o botão "Finalizar" para concluir a OS de fato (ex: retirando da TV e mudando status) e para liberar o gerador de Certificado de Garantia.

### ✅ Fase 18: Ajustes Habilidade Gestor - Parte 2 (Resoluções de Bug & CRUDs - Concluída)
- [x] **Clientes:**
  - Diagnosticar e resolver problema de demora no carregamento da lista (otimização de view/query).
  - Expandir as ações do cliente: criar painel ou modal de Edição de Cliente (permitir editar Nomes, Telefones e E-mails), além do Histórico já existente.
- [x] **Serviços:**
  - Corrigir o crash fatal da página (`ReferenceError: Type is not defined` na linha 430).
  - Restabelecer a funcionalidade de todos os botões (Novo Serviço, Detalhes/Edição, Excluir) permitindo ajuste de valor, nome, categorias e tipo de automóvel (Carro, Moto ou Ambos).
- [x] **Estoque:**
  - Dar vida à tela: conectar os botões inativos e finalizar o fluxo CRUD (Criar, Ler, Atualizar, Excluir) conectado à tabela real `estoque_materiais` já existente no Supabase.

### ✅ Fase 18: Ajustes Habilidade Gestor - Parte 3 (Colab & Configs - Concluída)
- [x] **Colaboradores:**
  - Habilitar edição/exibição correta do campo `nome` para os colaboradores (perfis).
  - Garantir que os select boxes de agendamento (ex: Vendas) utilizem esse Nome em vez de apenas o E-mail.
- [x] **Configurações da Loja:**
  - Diagnosticar por que as alterações de nome_loja, cores e vídeo não estão persistindo após dar F5 (Provável bug na query de Update do Supabase).
  - Adicionar campo para inserção/upload da Logo da loja (`logo_url`).
  - Refletir a Logo inserida em todo o ecossistema: TV, Certificado de Garantia e Link de Status da OS do cliente.

### ✅ Fase 19: Refinamento de UX, Responsividade e Sticky Modals (Concluída)
- [x] **Sticky Modals:** Refatoração de todos os modais extensos (`Agendamento`, `Novo Orcamento`, `Vendas`, `Serviços`, `Checklist`, `Certificado`) para usar cabeçalho e rodapé fixos.
- [x] **Responsividade Crítica:** Garantia de que botões de ação permaneçam visíveis em monitores pequenos (1366x768) e dispositivos móveis.
- [x] **Lógica de Faturamento:** Revisão dos contadores de `Vendas.jsx` e `Dashboard.jsx` para incluir ordens "Entregues" no total convertido.
- [x] **Visibilidade de Histórico:** Inclusão do status "ENTREGUE" na Agenda e telas de Gestão, garantindo que o carro não "suma" após a entrega.
- [x] **Ergonomia do Executor:** Refatoração da Folha de Obra do Operador para manter o botão "Finalizar" sempre acessível.

### ✅ Fase 20: Sincronização de Faturamento e Fluxo de Entrega (Concluída)
- [x] Correção do cálculo de faturamento total incluindo ordens "ENTREGUES".
- [x] Implementação do status "ENTREGUE" na Agenda e telas de Gestão.
- [x] Garantia de que a entrega remove o veículo da TV em tempo real.

### ✅ Fase 21: Ergonomia e Responsividade Pro (Concluída)
- [x] Modais com cabeçalho e rodapé fixos para melhor usabilidade em OS longas.
- [x] Ajuste de escala para resolução 1366x768 (Padrão corporativo).
- [x] Refatoração da Folha de Obra para manter o botão "Finalizar" sempre visível.

### ✅ Fase 22: Identidade Visual Avançada (Concluída)
- [x] Persistência da Logomarca dinâmica em todo o sistema (TV, Link Cliente, Certificado).
- [x] Implementação da Cor de Fundo do Monitor configurável via painel.
- [x] Sincronização global de marca via BrandContext.

### ✅ Fase 23: Monitor TV Real-time Precision (Concluída)
- [x] **Layout Dinâmico Inteligente**: 
    - Sem Vídeo: Grade 2x2 (4 slots) equilibrada.
    - Com Vídeo: Divisão 50/50 com 3 slots fixos verticais.
- [x] Refatoração do **Card Bicolor**: Lado Azul (Info) e Lado Escuro (Execução).
- [x] Tipografia Dinâmica: Ajuste automático de fontes dependendo do layout (Compacto vs. Full).

### ✅ Fase 24: Integração de Redes Sociais e WhatsApp (Concluída)
- [x] Expansão da tabela `loja_config` para suportar canais sociais.
- [x] Novos campos em Configurações: WhatsApp, Instagram, YouTube e TikTok.
- [x] Botões de contato dinâmicos no Link do Cliente (visibilidade condicional).

### ✅ Fase 27: Responsividade Global - Gestor Mobile & Tablet (Concluída)
- [x] **App Shell:** Refatoração do `DashboardLayout` e `Sidebar` com controle Offcanvas (Menu Hamburger).
- [x] **Grades Automáticas:** Layout do `Dashboard`, `Vendas` e `OrdensServico` configurado de `grid-cols-4` limitante para contêineres colapsáveis flexíveis (`sm:grid-cols-2`, `xl:grid-cols-4`).
- [x] **Prevenção de Quebra (Tabelas e Cards):** Implementação de rolagens nativas seguras horizontais (`overflow-x-auto`) nas telas de Clientes e Serviços.
- [x] **Ergonomia Modular:** Ajustes em modais de Orçamento (paddings variáveis `p-6 md:p-10`) e botões flexíveis expansíveis para acomodar o toque.

### ✅ Fase 28: Padronização UX e Estoque Avançado (Concluída)
- [x] **Padronização Visual:** Unificar as cores de status (Aguardando, Em Execução, Concluído, Entregue) em todas as telas (`Dashboard`, `Vendas`, `OrdensServico`, `Operador`, `TV` e `Agenda`).
- [x] **Fluxo de Vendas:** Novo botão de atalho "Ir para Ordem de Serviço" para propostas aprovadas, simplificando os próximos passos.
- [x] **Integração de Estoque na OS:** Habilitado flag `Controle de Estoque` no Catálogo de Serviços, vinculando materiais específicos (Ex: metros de PPF) diretamente à etapa do orçamento/OS com baixa automática na conclusão.
- [x] **Estoque Rápido:** Adição de atalho para "Repor Produto" diretamente na tela de listagem de materiais.
- [x] **Branding e PWA:** Inserção dinâmica da Logomarca (do Banco de Dados) como Favicon da aplicação em tempo real.

### ✅ Fase 28.1: Estoque Avançado - Automação Baseada no Catálogo (Concluída)
- [x] **Configuração Mestre:** Refatorada a interface de Catálogo de Serviços (`Servicos.jsx`) permitindo gerentes construírem "receitas" com múltiplos insumos necessários para execução de cada pacote.
- [x] **Redução de Fricção (Orçamento):** Retirada toda a carga dos Vendedores. O modal do Orçamento não exibe nem exige vínculo de múltiplos materiais (já são copiados ativamente e silenciosamente do catálogo em formato JSON Array).
- [x] **Lógica de Dedução:** A engine `updateOrderProgress` percorre a lista de produtos (injetada na OS) e faz os descontos sequenciais no estoque da corporação sem atrito.

### ✅ Fase 28.2: Refinamento Visual (Certificados e Logos) (Concluída)
- [x] **Impressão Cirúrgica:** Refatoração drástica (`window.open`) para emissão do Certificado de Garantia em PDF, injetando CSS dinâmico que ignora o layout pai e evita dores de cabeça como corte de páginas.
- [x] **Enquadramento A4:** Ajuste de paddings verticais e borders (`print:`) permitindo respiro visual na tela comum e encolhimento harmonioso no papel de 285mm.
- [x] **Design do Símbolo da Loja:** Conserto de variância de dados (`logoUrl`) e melhoria da UX de símbolos espalhados. Sidebar e TV agora abraçam perfeitamente as imagens de logotipo que o usuário manda, arredondando cantos estilo MacOS (App Icon).

### ✅ Fase 28.3: Sistema Global de Notificações - Toasts (Concluída)
- [x] Padrão Ouro: Desenvolver arquitetura Global de Popups Event-Driven para dispensar re-renders com uso de bibliotecas pesadas de fora.
- [x] Extermínio Inicial dos Alerts: Substituição de ~12 popups cinzas nativos.
- [x] Polir componentes (como Checklist Automotivo e persistência de Supabase) para se integrarem em silêncio de fundo disparando avisos laterais elegantes de "Sucesso".

- [x] **Ordens de Serviço**:
    - [x] Corrigir botões de "Entrega" e "Conclusão de Serviço".
    - [x] Garantir baixa única de estoque (Idempotência).

- [x] **Gestão de Clientes**:
    - [x] Implementar contador de serviços concluídos por cliente.
    - [x] Melhorar painel lateral de detalhes (perfil do cliente).
- [x] **Controle de Estoque**:
    - [x] Substituir `window.prompt` por modal de reposição premium.
    - [x] Validar entrada de quantidades (apenas números).
- [x] **Colaboradores**:
    - [x] Incluir campo "Nome" no modal de edição.
    - [x] Proteger campo "E-mail" (somente leitura com cadeado).
- [x] **Camada de Segurança & Estabilização**:
    - [x] Implementar Prevenção de IDOR (UUID Tracking Token) nos links de status dos clientes. **(Concluído)**
    - [x] Hardening de Banco (Habilitar RLS em todas as tabelas e configurar Políticas). **(Concluído - SQL Executado)**
    - [x] Padronização de Notificações (Auditoria completa de Toasts). **(Concluído - Sistema 100% Event-Driven)**
    - [x] Estabilizar Sessão no Refresh (Garantir persistência ao dar F5 no navegador).
    - [x] Corrigir Erros Críticos (ReferenceError: toast is not defined em múltiplos módulos).


---
### ✅ Fase 29: Estabilização Crítica e Segurança de Produção (Concluída)
- [x] **RLS & Recursion Fix:** Correção do loop infinito nas políticas de segurança da tabela `profiles`.
- [x] **Schema Profiles:** Adição das colunas `nome` e `telefone` na tabela `profiles` para suporte completo ao CRUD de colaboradores.
- [x] **Sincronização de Técnicos:** Implantação da desnormalização do nome do técnico nas Ordens de Serviço para persistência de exibição.
- [x] **Fix de Produção (Require Error):** Implementação de shims de compatibilidade (`global`, `process`, `require`) no `index.html` e `vite.config.js` para resolver crashes em dispositivos móveis (Safari/Vercel).
- [x] **Auditoria de Importações:** Correção de `ReferenceError` (useState, icons) em `Servicos.jsx` e `OrdensServico.jsx`.
- [x] **Versionamento Final:** Commit e Push de todas as melhorias para o repositório principal.

### ✅ Fase 30: Auditoria Técnica e PWA Pro (Concluída)
- [x] **PWA Update Prompt:** Troca de `autoUpdate` para `Prompt` com notificação de "Nova Versão" elegante (Toast).
- [x] **Performance (Lazy Loading):** Implementação de Code Splitting em todas as rotas principais.
- [x] **Segurança (RLS Hardening):** Pente-fino nas políticas de banco, protegendo dados anônimos via UUID.
- [x] **Maturidade de Código:** Limpeza de arquivos temporários e padronização da estrutura do projeto.
- [x] **Versionamento:** Sincronização final com o repositório Git.

### ✅ Fase 31: Módulo de Relatórios Estratégicos (Concluído)
- [x] **Data Aggregation:** Queries de filtragem reativa por período integrada ao hook `useOrders`.
- [x] **Relatórios UI:** Dashboard de análise com KPIs de Faturamento, Ticket Médio e Eficiência.
- [x] **Gráficos de Performance:** Barra de produtividade por técnico baseada em valor gerado.
- [x] **Multisseleção Pro:** Implementação de filtros de Status e Serviços com checkboxes (Check-all logic).
- [x] **Impressão Cirúrgica:** Refatoração de CSS global para focar apenas no grid de auditoria (A4 optimized).
- [x] **Ordenação Cronológica:** Exibição crescente por data para auditoria de linha do tempo.

### ✅ Fase 32: Flexibilidade de Preços nos Orçamentos (Concluída)
- [x] **Edição de Valor no Orçamento:** Permitir que o gestor altere o valor de um serviço manualmente no momento da criação do orçamento/OS, mesmo que exista um valor pré-definido no catálogo.
- [x] **Ajuste por Dificuldade:** Campo de entrada numérica que herda o preço padrão mas permite override manual.

### ✅ Fase 33: Controle Financeiro e Pagamentos (Concluída)
- [x] **Esquema de Pagamentos:** Adicionar colunas de controle financeiro na tabela `ordens_servico` (valor_pago, historico_pagamentos).
- [x] **Combo de Pagamento (Pop-up $):** Modal para registro de adiantamentos e saldo restante com seleção de método (PIX, Crédito, etc).
- [x] **Indicadores Financeiros:** Exibir saldo devedor e total pago nas listas de Vendas e OS.
- [x] **Flexibilidade Total:** Permitir que o serviço siga para execução mesmo sem pagamento inicial, conforme a necessidade do gestor.

---
### ✅ Fase 34: Estabilização e Customização White Label (Operador Focus) (Concluída)
- [x] **Privacidade Operacional**: Ocultação de cronômetro e notificações para o cargo de operador.
- [x] **Upload Real de Mídia**: Integração do Storage Supabase (bucket `os-photos`) para registro de execução.
- [x] **Infraestrutura**: Resolução de erros de WebSocket Realtime e limpeza de avisos de console (Router flags).
- [x] **Segurança de Dados**: Garantia de persistência de tempo decorrido mesmo com UI oculta.


---
### ✅ Fase 35: Segurança de Acesso, Gestão de Usuários e Notificações (Concluída)
- [x] **Segurança de Acesso**: Link "Esqueceu sua senha? Contate o Administrador" funcional via WhatsApp.
- [x] **Alteração de Senha**: Módulo de troca de senha (mín. 6 chars) no perfil do Operador e Gestor.
- [x] **Gestão de Equipe**: Implementação do modal "Novo Usuário" (Signup via ADM sem troca de sessão).
- [x] **Notificações Inteligentes (Sino)**: 
    - [x] Lógica de alertas proativos e retroativos para Estoque Baixo (< Mínimo Alerta).
    - [x] Interface do Sino no Header com filtro de apenas "Não Lidas" e botão "Limpar Tudo".
    - [x] Estabilização de UX: Painel limpo que some ao marcar como lido.

### ✅ Fase 36: Flexibilidade Administrativa e Edição de Valores (Concluída)
- [x] **Edição Dinâmica**: Implementar modal de ajuste individual de Preço e Garantia para cada item da OS/Orçamento.
- [x] **Recálculo em Tempo Real**: Atualização automática do Valor Total ao editar serviços.
- [x] **UX Gestão**: Centralização da funcionalidade no menu "Ações" (três pontinhos) da tela de Vendas.
- [x] **Segurança Financeira**: Bloqueio de edição para Operadores e avisos sobre pagamentos já registrados.

---
*Última atualização: 05/04/2026 às 19:40 - STATUS: FASE 36 CONCLUÍDA 🚀*
```
