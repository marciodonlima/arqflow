-- ARQFLOW · banco de dados v0.1
-- Cole este arquivo inteiro no Supabase → SQL Editor → New query → Run.
-- Pode ser rodado de novo sem problema: ele só cria o que ainda não existe.

-- ---------------------------------------------------------------
-- Perfis: uma linha por pessoa, criada automaticamente no cadastro
-- ---------------------------------------------------------------
create table if not exists public.perfis (
  id uuid primary key references auth.users (id) on delete cascade,
  nome text not null default '',
  custo_hora numeric(10, 2) not null default 120,
  margem numeric(5, 2) not null default 25,
  horas_dia numeric(4, 1) not null default 6,
  checkout_hora text not null default '18:00',
  estilo text not null default 'calcario',
  esquema text not null default 'claro',
  fuso text not null default 'America/Sao_Paulo',
  plano text not null default 'solo',
  criado_em timestamptz not null default now()
);

-- ---------------------------------------------------------------
-- Projetos: entram como proposta e viram projeto no contrato
-- ---------------------------------------------------------------
create table if not exists public.projetos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  nome text not null,
  cliente text not null default '',
  tipologia text not null,
  escopos text[] not null default '{}',
  ambientes jsonb not null default '[]',
  area_m2 numeric(10, 2),
  status text not null default 'proposta'
    check (status in ('proposta', 'andamento', 'pausado', 'concluido', 'arquivado')),
  data_inicio date,
  data_entrega date,
  valor_proposta numeric(12, 2),
  valor_contrato numeric(12, 2),
  briefing jsonb not null default '{}',
  programa jsonb not null default '[]',
  partido text not null default '',
  notas text not null default '',
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index if not exists projetos_user_idx on public.projetos (user_id, status);

-- ---------------------------------------------------------------
-- Tarefas: geradas pelo motor a partir do perfil do projeto
-- ---------------------------------------------------------------
create table if not exists public.tarefas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  projeto_id uuid not null references public.projetos (id) on delete cascade,
  chave text,
  fase text not null
    check (fase in ('planejamento', 'estudo', 'anteprojeto', 'executivo', 'entrega')),
  etapa text,
  titulo text not null,
  modo text not null default 'operacional'
    check (modo in ('analitico', 'criativo', 'operacional', 'relacional')),
  tipo text not null default 'execucao'
    check (tipo in ('execucao', 'exploracao')),
  essencial boolean not null default false,
  horas_estimadas numeric(6, 1) not null default 1,
  horas_reais numeric(6, 1),
  ordem integer not null default 0,
  data_prevista date,
  depende_de text[] not null default '{}',
  status text not null default 'a_fazer'
    check (status in ('a_fazer', 'fazendo', 'feita')),
  concluida_em timestamptz,
  link text,
  notas text not null default '',
  registro text not null default '',
  criado_em timestamptz not null default now()
);

create index if not exists tarefas_projeto_idx on public.tarefas (projeto_id, ordem);
create index if not exists tarefas_user_idx on public.tarefas (user_id, status, data_prevista);

-- ---------------------------------------------------------------
-- Capturas: o que sai da cabeça pelo botão central
-- ---------------------------------------------------------------
create table if not exists public.capturas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  texto text not null,
  origem text not null default 'ideia'
    check (origem in ('ideia', 'whatsapp', 'email', 'ligacao', 'pessoalmente')),
  projeto_id uuid references public.projetos (id) on delete set null,
  status text not null default 'aberta'
    check (status in ('aberta', 'virou_tarefa', 'resolvida', 'descartada')),
  criado_em timestamptz not null default now()
);

create index if not exists capturas_user_idx on public.capturas (user_id, status);

-- ---------------------------------------------------------------
-- Dias: abertura (modo do dia) e check-out
-- ---------------------------------------------------------------
create table if not exists public.dias (
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  data date not null,
  modo text check (modo in ('afiado', 'criativo', 'mecanico', 'nebuloso')),
  checkout_em timestamptz,
  aberto text not null default '',
  amanha_tarefa uuid references public.tarefas (id) on delete set null,
  primary key (user_id, data)
);

-- ---------------------------------------------------------------
-- Segurança: cada pessoa só enxerga e altera o que é seu
-- ---------------------------------------------------------------
alter table public.perfis enable row level security;
alter table public.projetos enable row level security;
alter table public.tarefas enable row level security;
alter table public.capturas enable row level security;
alter table public.dias enable row level security;

drop policy if exists "perfil proprio" on public.perfis;
create policy "perfil proprio" on public.perfis
  for all to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

drop policy if exists "projetos proprios" on public.projetos;
create policy "projetos proprios" on public.projetos
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "tarefas proprias" on public.tarefas;
create policy "tarefas proprias" on public.tarefas
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (select 1 from public.projetos p where p.id = projeto_id and p.user_id = (select auth.uid()))
  );

drop policy if exists "capturas proprias" on public.capturas;
create policy "capturas proprias" on public.capturas
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "dias proprios" on public.dias;
create policy "dias proprios" on public.dias
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

grant select, insert, update, delete on public.perfis, public.projetos, public.tarefas, public.capturas, public.dias to authenticated;

-- ---------------------------------------------------------------
-- Cadastro: cria o perfil assim que a conta nasce
-- ---------------------------------------------------------------
create or replace function public.criar_perfil()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.perfis (id, nome)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'nome', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists ao_criar_conta on auth.users;
create trigger ao_criar_conta
  after insert on auth.users
  for each row execute function public.criar_perfil();

-- Contas que já existiam antes deste script também ganham perfil
insert into public.perfis (id, nome)
select u.id, coalesce(u.raw_user_meta_data ->> 'nome', '')
from auth.users u
on conflict (id) do nothing;

-- Mantém a data de atualização dos projetos
create or replace function public.tocar_atualizado()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;

drop trigger if exists projetos_atualizado on public.projetos;
create trigger projetos_atualizado
  before update on public.projetos
  for each row execute function public.tocar_atualizado();

-- ===============================================================
-- v0.2 · estrutura e produtividade
-- ===============================================================

alter table public.perfis add column if not exists custos jsonb not null default '{}';
alter table public.perfis add column if not exists horas_produtivas_mes numeric(6, 1);
alter table public.perfis add column if not exists impostos numeric(5, 2) not null default 0;
alter table public.perfis add column if not exists uf text not null default 'RJ';
alter table public.perfis add column if not exists cidade text not null default 'Rio de Janeiro';
alter table public.perfis add column if not exists onboarding_ok boolean not null default false;

alter table public.projetos add column if not exists cor text;
alter table public.projetos add column if not exists prazo_dias integer;
alter table public.projetos add column if not exists prazo_tipo text not null default 'corridos';
alter table public.projetos add column if not exists detalhes jsonb not null default '{}';

alter table public.tarefas add column if not exists checklist jsonb not null default '[]';
alter table public.tarefas add column if not exists timer_inicio timestamptz;

-- Horas reais: cada vez que o cronômetro roda vira um apontamento
create table if not exists public.apontamentos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  tarefa_id uuid not null references public.tarefas (id) on delete cascade,
  projeto_id uuid not null references public.projetos (id) on delete cascade,
  inicio timestamptz not null default now(),
  fim timestamptz,
  horas numeric(6, 2),
  nota text not null default '',
  criado_em timestamptz not null default now()
);
create index if not exists apontamentos_user_idx on public.apontamentos (user_id, inicio);
create index if not exists apontamentos_projeto_idx on public.apontamentos (projeto_id);

-- Parcelas do contrato, ligadas às fases
create table if not exists public.parcelas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  projeto_id uuid not null references public.projetos (id) on delete cascade,
  descricao text not null default '',
  valor numeric(12, 2) not null default 0,
  fase text,
  vencimento date,
  status text not null default 'prevista' check (status in ('prevista', 'a_receber', 'recebida')),
  recebida_em date,
  ordem integer not null default 0,
  criado_em timestamptz not null default now()
);
create index if not exists parcelas_projeto_idx on public.parcelas (projeto_id, ordem);

-- Propostas, contratos e outros documentos do projeto
create table if not exists public.documentos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  projeto_id uuid not null references public.projetos (id) on delete cascade,
  tipo text not null default 'outro' check (tipo in ('proposta', 'contrato', 'outro')),
  titulo text not null default '',
  conteudo text not null default '',
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
create index if not exists documentos_projeto_idx on public.documentos (projeto_id, tipo);

-- Conversas com o assistente
create table if not exists public.mensagens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  projeto_id uuid references public.projetos (id) on delete cascade,
  papel text not null check (papel in ('user', 'assistant')),
  conteudo text not null,
  criado_em timestamptz not null default now()
);
create index if not exists mensagens_user_idx on public.mensagens (user_id, projeto_id, criado_em);

alter table public.apontamentos enable row level security;
alter table public.parcelas enable row level security;
alter table public.documentos enable row level security;
alter table public.mensagens enable row level security;

drop policy if exists "apontamentos proprios" on public.apontamentos;
create policy "apontamentos proprios" on public.apontamentos
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "parcelas proprias" on public.parcelas;
create policy "parcelas proprias" on public.parcelas
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "documentos proprios" on public.documentos;
create policy "documentos proprios" on public.documentos
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "mensagens proprias" on public.mensagens;
create policy "mensagens proprias" on public.mensagens
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

grant select, insert, update, delete on public.apontamentos, public.parcelas, public.documentos, public.mensagens to authenticated;
