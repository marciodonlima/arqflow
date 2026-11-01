import 'server-only'
import { redirect } from 'next/navigation'
import { criarClienteServidor } from './supabase/server'
import type { Captura, Dia, Perfil, Projeto, Tarefa } from './tipos'

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
}

function normalizarPerfil(p: Partial<Perfil> & { id: string }): Perfil {
  return {
    ...PERFIL_PADRAO,
    ...p,
    custo_hora: Number(p.custo_hora ?? PERFIL_PADRAO.custo_hora),
    margem: Number(p.margem ?? PERFIL_PADRAO.margem),
    horas_dia: Number(p.horas_dia ?? PERFIL_PADRAO.horas_dia),
  } as Perfil
}

export function normalizarTarefa(t: Tarefa): Tarefa {
  return {
    ...t,
    horas_estimadas: Number(t.horas_estimadas),
    horas_reais: t.horas_reais == null ? null : Number(t.horas_reais),
    depende_de: t.depende_de ?? [],
  }
}

export function normalizarProjeto(p: Projeto): Projeto {
  return {
    ...p,
    area_m2: p.area_m2 == null ? null : Number(p.area_m2),
    valor_proposta: p.valor_proposta == null ? null : Number(p.valor_proposta),
    valor_contrato: p.valor_contrato == null ? null : Number(p.valor_contrato),
    escopos: p.escopos ?? [],
    ambientes: p.ambientes ?? [],
    briefing: p.briefing ?? {},
    programa: p.programa ?? [],
  }
}

export async function sessao() {
  const supabase = await criarClienteServidor()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/entrar')
  const { data } = await supabase.from('perfis').select('*').eq('id', user.id).maybeSingle()
  let perfil: Perfil
  if (data) perfil = normalizarPerfil(data as Perfil)
  else {
    // Conta criada antes do script do banco: cria o perfil agora
    const nome = (user.user_metadata?.nome as string) ?? ''
    await supabase.from('perfis').insert({ id: user.id, nome })
    perfil = normalizarPerfil({ id: user.id, nome })
  }
  return { supabase, user, perfil }
}

type Cliente = Awaited<ReturnType<typeof criarClienteServidor>>

export async function projetosDe(supabase: Cliente, status?: string[]) {
  let q = supabase.from('projetos').select('*').order('criado_em', { ascending: false })
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

export async function diaDe(supabase: Cliente, data: string) {
  const { data: d } = await supabase.from('dias').select('*').eq('data', data).maybeSingle()
  return (d as Dia | null) ?? null
}

export async function capturasAbertas(supabase: Cliente) {
  const { data } = await supabase.from('capturas').select('*').eq('status', 'aberta').order('criado_em', { ascending: false })
  return (data as Captura[] | null) ?? []
}
