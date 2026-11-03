'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { sessao } from '@/lib/dados'
import { diaUtilSeguinte } from '@/lib/datas'
import type { Estilo, ModoDia, Origem, PreferenciaEsquema } from '@/lib/tipos'

const MODOS: ModoDia[] = ['afiado', 'criativo', 'mecanico', 'nebuloso']
const ORIGENS: Origem[] = ['ideia', 'whatsapp', 'email', 'ligacao', 'pessoalmente']
const ESTILOS: Estilo[] = ['basalto', 'calcario', 'concreto', 'musgo', 'nanquim']
const ESQUEMAS: PreferenciaEsquema[] = ['claro', 'escuro', 'auto']
const atualizar = () => revalidatePath('/', 'layout')

export async function escolherModo(modo: ModoDia) {
  if (!MODOS.includes(modo)) return
  const { supabase, user, hoje } = await sessao()
  await supabase.from('dias').upsert({ user_id: user.id, data: hoje, modo }, { onConflict: 'user_id,data' })
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
  atualizar()
  return { ok: !error }
}

export async function tratarCaptura(capturaId: string, acao: 'tarefa' | 'resolvida' | 'descartada', fd?: FormData) {
  const { supabase, user, hoje } = await sessao()
  if (acao === 'tarefa') {
    const projetoId = String(fd?.get('projeto_id') ?? '')
    if (!projetoId) return
    const { data: cap } = await supabase.from('capturas').select('*').eq('id', capturaId).maybeSingle()
    if (!cap) return
    const { data: proxima } = await supabase.from('tarefas').select('fase, ordem').eq('projeto_id', projetoId).neq('status', 'feita').order('ordem').limit(1).maybeSingle()
    const relacional = ['whatsapp', 'email', 'ligacao', 'pessoalmente'].includes(cap.origem)
    const quando = String(fd?.get('quando') ?? 'hoje')
    await supabase.from('tarefas').insert({
      user_id: user.id,
      projeto_id: projetoId,
      fase: proxima?.fase ?? 'planejamento',
      titulo: cap.texto.slice(0, 200),
      modo: relacional ? 'relacional' : 'operacional',
      tipo: 'execucao',
      horas_estimadas: Number(fd?.get('horas') ?? 0.5) || 0.5,
      ordem: (proxima?.ordem ?? 0) + 1,
      data_prevista: quando === 'amanha' ? diaUtilSeguinte(hoje) : hoje,
      notas: cap.texto.length > 200 ? cap.texto : '',
    })
    await supabase.from('capturas').update({ status: 'virou_tarefa', projeto_id: projetoId }).eq('id', capturaId)
  } else {
    await supabase.from('capturas').update({ status: acao }).eq('id', capturaId)
  }
  atualizar()
}

export interface DecisoesCheckout {
  concluidas: { id: string; horas: number | null }[]
  adiar: string[]
  aberto: string
  amanha: string | null
}

// Check-out guiado: grava horas, conclui, passa o resto para amanhã e marca por onde começar
export async function fazerCheckout(d: DecisoesCheckout) {
  const { supabase, user, hoje } = await sessao()
  const agora = new Date().toISOString()
  const amanha = diaUtilSeguinte(hoje)
  // Fecha cronômetro que tenha ficado aberto
  const { data: aberto } = await supabase.from('apontamentos').select('id, tarefa_id, inicio').is('fim', null).limit(1).maybeSingle()
  if (aberto) {
    const horas = Math.max(0, (Date.now() - new Date(aberto.inicio).getTime()) / 3600000)
    await supabase.from('apontamentos').update({ fim: agora, horas: Math.round(horas * 100) / 100 }).eq('id', aberto.id)
    const { data: t } = await supabase.from('tarefas').select('horas_reais').eq('id', aberto.tarefa_id).maybeSingle()
    await supabase.from('tarefas').update({ timer_inicio: null, horas_reais: Math.round(((Number(t?.horas_reais) || 0) + horas) * 100) / 100 }).eq('id', aberto.tarefa_id)
  }
  for (const c of d.concluidas.slice(0, 50)) {
    const campos: Record<string, unknown> = { status: 'feita' }
    const { data: atual } = await supabase.from('tarefas').select('status, concluida_em').eq('id', c.id).maybeSingle()
    if (atual?.status !== 'feita' || !atual?.concluida_em) campos.concluida_em = agora
    if (c.horas != null && c.horas >= 0) campos.horas_reais = Math.round(c.horas * 100) / 100
    await supabase.from('tarefas').update(campos).eq('id', c.id)
  }
  if (d.adiar.length) await supabase.from('tarefas').update({ data_prevista: amanha, status: 'a_fazer' }).in('id', d.adiar.slice(0, 50)).neq('status', 'feita')
  if (d.amanha) await supabase.from('tarefas').update({ data_prevista: amanha }).eq('id', d.amanha).neq('status', 'feita')
  await supabase.from('dias').upsert(
    { user_id: user.id, data: hoje, checkout_em: agora, aberto: String(d.aberto ?? '').slice(0, 2000), amanha_tarefa: d.amanha || null },
    { onConflict: 'user_id,data' },
  )
  atualizar()
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
      ...(/^\d{2}:\d{2}$/.test(hora) ? { checkout_hora: hora } : {}),
    })
    .eq('id', user.id)
  atualizar()
}

export async function salvarAparencia(estilo: Estilo, esquema: PreferenciaEsquema) {
  if (!ESTILOS.includes(estilo) || !ESQUEMAS.includes(esquema)) return
  const c = await cookies()
  const opt = { path: '/', maxAge: 60 * 60 * 24 * 365, sameSite: 'lax' as const }
  c.set('af_estilo', estilo, opt)
  c.set('af_esquema', esquema, opt)
  const { supabase, user } = await sessao()
  await supabase.from('perfis').update({ estilo, esquema }).eq('id', user.id)
}
