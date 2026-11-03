import 'server-only'
import { redirect } from 'next/navigation'
import { cache } from 'react'
import { hojeEm } from './datas'
import { calcularSaude, type Saude } from './saude'
import { criarClienteServidor } from './supabase/server'
import type { Apontamento, Captura, Dia, Parcela, Perfil, Projeto, Tarefa, TimerAtivo } from './tipos'

const PERFIL_PADRAO: Omit<Perfil, 'id'> = {
  nome: '',
  custo_hora: 120,
  margem: 25,
  horas_dia: 6,
  checkout_hora: '18:00',
  estilo: 'calcario',
  esquema: 'claro',
  fuso: 'America/Sao_Paulo',
  plano: 'solo',
  custos: {},
  horas_produtivas_mes: null,
  impostos: 0,
  uf: 'RJ',
  cidade: 'Rio de Janeiro',
  onboarding_ok: false,
}

const num = (v: unknown, padrao = 0) => (v == null || v === '' || Number.isNaN(Number(v)) ? padrao : Number(v))
const numOuNulo = (v: unknown) => (v == null || v === '' || Number.isNaN(Number(v)) ? null : Number(v))

function normalizarPerfil(p: Partial<Perfil> & { id: string }): Perfil {
  return {
    ...PERFIL_PADRAO,
    ...p,
    custo_hora: num(p.custo_hora, PERFIL_PADRAO.custo_hora),
    margem: num(p.margem, PERFIL_PADRAO.margem),
    horas_dia: num(p.horas_dia, PERFIL_PADRAO.horas_dia),
    impostos: num(p.impostos, 0),
    horas_produtivas_mes: numOuNulo(p.horas_produtivas_mes),
    custos: (p.custos as Record<string, number>) ?? {},
  } as Perfil
}

export function normalizarTarefa(t: Tarefa): Tarefa {
  return {
    ...t,
    horas_estimadas: num(t.horas_estimadas, 1),
    horas_reais: numOuNulo(t.horas_reais),
    depende_de: t.depende_de ?? [],
    checklist: Array.isArray(t.checklist) ? t.checklist : [],
    timer_inicio: t.timer_inicio ?? null,
  }
}

export function normalizarProjeto(p: Projeto): Projeto {
  return {
    ...p,
    area_m2: numOuNulo(p.area_m2),
    valor_proposta: numOuNulo(p.valor_proposta),
    valor_contrato: numOuNulo(p.valor_contrato),
    prazo_dias: numOuNulo(p.prazo_dias),
    prazo_tipo: p.prazo_tipo === 'uteis' ? 'uteis' : 'corridos',
    escopos: p.escopos ?? [],
    ambientes: p.ambientes ?? [],
    briefing: p.briefing ?? {},
    programa: p.programa ?? [],
    detalhes: (p.detalhes as Record<string, unknown>) ?? {},
    cor: p.cor ?? null,
  }
}

const normalizarParcela = (x: Parcela): Parcela => ({ ...x, valor: num(x.valor) })

export const sessao = cache(async function sessao() {
  const supabase = await criarClienteServidor()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/entrar')
  const { data } = await supabase.from('perfis').select('*').eq('id', user.id).maybeSingle()
  let perfil: Perfil
  if (data) perfil = normalizarPerfil(data as Perfil)
  else {
    const nome = (user.user_metadata?.nome as string) ?? ''
    await supabase.from('perfis').insert({ id: user.id, nome })
    perfil = normalizarPerfil({ id: user.id, nome })
  }
  return { supabase, user, perfil, hoje: hojeEm(perfil.fuso) }
})

export type Cliente = Awaited<ReturnType<typeof criarClienteServidor>>

export async function projetosDe(supabase: Cliente, status?: string[]) {
  let q = supabase.from('projetos').select('*').order('criado_em', { ascending: true })
  if (status) q = q.in('status', status)
  const { data, error } = await q
  if (error) throw new Error(error.message)
  return (data as Projeto[]).map(normalizarProjeto)
}

export async function projetoPorId(supabase: Cliente, id: string) {
  const { data } = await supabase.from('projetos').select('*').eq('id', id).maybeSingle()
  return data ? normalizarProjeto(data as Projeto) : null
}

export async function tarefasDe(supabase: Cliente, projetoIds: string[]) {
  if (projetoIds.length === 0) return [] as Tarefa[]
  const { data, error } = await supabase.from('tarefas').select('*').in('projeto_id', projetoIds).order('ordem')
  if (error) throw new Error(error.message)
  return (data as Tarefa[]).map(normalizarTarefa)
}

export async function parcelasDe(supabase: Cliente, projetoIds: string[]) {
  if (projetoIds.length === 0) return [] as Parcela[]
  const { data } = await supabase.from('parcelas').select('*').in('projeto_id', projetoIds).order('ordem')
  return ((data as Parcela[] | null) ?? []).map(normalizarParcela)
}

export async function apontamentosDesde(supabase: Cliente, desdeIso: string) {
  const { data } = await supabase.from('apontamentos').select('*').gte('inicio', desdeIso).order('inicio')
  return ((data as Apontamento[] | null) ?? []).map((a) => ({ ...a, horas: numOuNulo(a.horas) }))
}

export async function diaDe(supabase: Cliente, data: string) {
  const { data: d } = await supabase.from('dias').select('*').eq('data', data).maybeSingle()
  return (d as Dia | null) ?? null
}

export async function capturasAbertas(supabase: Cliente) {
  const { data } = await supabase.from('capturas').select('*').eq('status', 'aberta').order('criado_em', { ascending: false })
  return (data as Captura[] | null) ?? []
}

export async function timerAtivo(supabase: Cliente): Promise<TimerAtivo | null> {
  const { data } = await supabase.from('apontamentos').select('id, tarefa_id, projeto_id, inicio').is('fim', null).order('inicio', { ascending: false }).limit(1).maybeSingle()
  if (!data) return null
  const [{ data: t }, { data: p }] = await Promise.all([
    supabase.from('tarefas').select('titulo').eq('id', data.tarefa_id).maybeSingle(),
    supabase.from('projetos').select('nome, cor').eq('id', data.projeto_id).maybeSingle(),
  ])
  return {
    apontamentoId: data.id,
    tarefaId: data.tarefa_id,
    projetoId: data.projeto_id,
    inicio: data.inicio,
    titulo: t?.titulo ?? 'Tarefa',
    projetoNome: p?.nome ?? '',
    cor: p?.cor ?? null,
  }
}

// Tudo o que as telas de visão geral precisam: projetos, tarefas, parcelas e a saúde de cada projeto
export const carregarCarteira = cache(async function carregarCarteira(supabase: Cliente, perfil: Perfil, hoje: string, status: string[] = ['andamento', 'proposta', 'pausado']) {
  const projetos = await projetosDe(supabase, status)
  const ids = projetos.map((p) => p.id)
  const [tarefas, parcelas] = await Promise.all([tarefasDe(supabase, ids), parcelasDe(supabase, ids)])
  const saudes: Record<string, Saude> = {}
  for (const p of projetos) saudes[p.id] = calcularSaude(p, tarefas, perfil, hoje, parcelas)
  return { projetos, tarefas, parcelas, saudes }
})

// Um projeto com tarefas, parcelas e saúde
export const carregarProjeto = cache(async function carregarProjeto(supabase: Cliente, perfil: Perfil, hoje: string, id: string) {
  const projeto = await projetoPorId(supabase, id)
  if (!projeto) return null
  const [tarefas, parcelas] = await Promise.all([tarefasDe(supabase, [id]), parcelasDe(supabase, [id])])
  return { projeto, tarefas, parcelas, saude: calcularSaude(projeto, tarefas, perfil, hoje, parcelas) }
})
