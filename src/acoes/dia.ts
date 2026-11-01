'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { sessao } from '@/lib/dados'
import { hojeEm } from '@/lib/datas'
import type { Estilo, Esquema, ModoDia, Origem } from '@/lib/tipos'

const MODOS: ModoDia[] = ['afiado', 'criativo', 'mecanico', 'nebuloso']
const ORIGENS: Origem[] = ['ideia', 'whatsapp', 'email', 'ligacao', 'pessoalmente']
const ESTILOS: Estilo[] = ['basalto', 'calcario', 'concreto', 'musgo', 'nanquim']
const ESQUEMAS: Esquema[] = ['claro', 'escuro']

export async function escolherModo(modo: ModoDia) {
  if (!MODOS.includes(modo)) return
  const { supabase, user, perfil } = await sessao()
  await supabase.from('dias').upsert({ user_id: user.id, data: hojeEm(perfil.fuso), modo }, { onConflict: 'user_id,data' })
  revalidatePath('/hoje')
}

export async function capturar(fd: FormData): Promise<{ ok: boolean }> {
  const { supabase, user } = await sessao()
  const texto = String(fd.get('texto') ?? '').trim()
  if (!texto) return { ok: false }
  const origem = String(fd.get('origem') ?? 'ideia') as Origem
  const projeto = String(fd.get('projeto_id') ?? '')
  const { error } = await supabase.from('capturas').insert({
    user_id: user.id,
    texto: texto.slice(0, 2000),
    origem: ORIGENS.includes(origem) ? origem : 'ideia',
    projeto_id: projeto || null,
  })
  revalidatePath('/', 'layout')
  return { ok: !error }
}

export async function tratarCaptura(capturaId: string, acao: 'tarefa' | 'resolvida' | 'descartada', fd?: FormData) {
  const { supabase, user, perfil } = await sessao()
  if (acao === 'tarefa') {
    const projetoId = String(fd?.get('projeto_id') ?? '')
    if (!projetoId) return
    const { data: cap } = await supabase.from('capturas').select('*').eq('id', capturaId).maybeSingle()
    if (!cap) return
    // A tarefa entra na fase em andamento do projeto, logo depois da próxima pendente
    const { data: proxima } = await supabase
      .from('tarefas')
      .select('fase, ordem')
      .eq('projeto_id', projetoId)
      .neq('status', 'feita')
      .order('ordem')
      .limit(1)
      .maybeSingle()
    const relacional = ['whatsapp', 'email', 'ligacao', 'pessoalmente'].includes(cap.origem)
    await supabase.from('tarefas').insert({
      user_id: user.id,
      projeto_id: projetoId,
      fase: proxima?.fase ?? 'planejamento',
      titulo: cap.texto.slice(0, 200),
      modo: relacional ? 'relacional' : 'operacional',
      tipo: 'execucao',
      horas_estimadas: Number(fd?.get('horas') ?? 0.5) || 0.5,
      ordem: (proxima?.ordem ?? 0) + 1,
      data_prevista: hojeEm(perfil.fuso),
      notas: cap.texto.length > 200 ? cap.texto : '',
    })
    await supabase.from('capturas').update({ status: 'virou_tarefa', projeto_id: projetoId }).eq('id', capturaId)
  } else {
    await supabase.from('capturas').update({ status: acao }).eq('id', capturaId)
  }
  revalidatePath('/', 'layout')
}

export async function fazerCheckout(fd: FormData) {
  const { supabase, user, perfil } = await sessao()
  const amanha = String(fd.get('amanha_tarefa') ?? '')
  await supabase.from('dias').upsert(
    {
      user_id: user.id,
      data: hojeEm(perfil.fuso),
      checkout_em: new Date().toISOString(),
      aberto: String(fd.get('aberto') ?? '').trim(),
      amanha_tarefa: amanha || null,
    },
    { onConflict: 'user_id,data' },
  )
  revalidatePath('/', 'layout')
}

export async function salvarPerfil(fd: FormData) {
  const { supabase, user } = await sessao()
  const num = (k: string, min: number, max: number) => {
    const n = Number(String(fd.get(k) ?? '').replace(',', '.'))
    return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : undefined
  }
  const hora = String(fd.get('checkout_hora') ?? '')
  await supabase
    .from('perfis')
    .update({
      nome: String(fd.get('nome') ?? '').trim(),
      custo_hora: num('custo_hora', 0, 100000),
      margem: num('margem', 0, 500),
      horas_dia: num('horas_dia', 1, 16),
      ...( /^\d{2}:\d{2}$/.test(hora) ? { checkout_hora: hora } : {}),
    })
    .eq('id', user.id)
  revalidatePath('/', 'layout')
}

export async function salvarAparencia(estilo: Estilo, esquema: Esquema) {
  if (!ESTILOS.includes(estilo) || !ESQUEMAS.includes(esquema)) return
  const c = await cookies()
  const opt = { path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' as const }
  c.set('af_estilo', estilo, opt)
  c.set('af_esquema', esquema, opt)
  const { supabase, user } = await sessao()
  await supabase.from('perfis').update({ estilo, esquema }).eq('id', user.id)
}
