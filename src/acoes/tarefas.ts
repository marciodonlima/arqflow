'use server'

import { revalidatePath } from 'next/cache'
import { sessao } from '@/lib/dados'
import { hojeEm } from '@/lib/datas'
import type { Fase, ModoTarefa, StatusTarefa } from '@/lib/tipos'

const FASES: Fase[] = ['planejamento', 'estudo', 'anteprojeto', 'executivo', 'entrega']
const MODOS: ModoTarefa[] = ['analitico', 'criativo', 'operacional', 'relacional']

export async function alternarTarefa(tarefaId: string, feita: boolean) {
  const { supabase } = await sessao()
  await supabase
    .from('tarefas')
    .update(feita ? { status: 'feita', concluida_em: new Date().toISOString() } : { status: 'a_fazer', concluida_em: null })
    .eq('id', tarefaId)
  revalidatePath('/', 'layout')
}

export async function marcarStatus(tarefaId: string, status: StatusTarefa) {
  const { supabase } = await sessao()
  await supabase
    .from('tarefas')
    .update({ status, concluida_em: status === 'feita' ? new Date().toISOString() : null })
    .eq('id', tarefaId)
  revalidatePath('/', 'layout')
}

function numero(v: FormDataEntryValue | null): number | null {
  const s = String(v ?? '').trim().replace(',', '.')
  if (!s) return null
  const n = Number(s)
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 10) / 10 : null
}

export async function salvarTarefa(tarefaId: string, fd: FormData) {
  const { supabase } = await sessao()
  const campos: Record<string, unknown> = {}
  const titulo = String(fd.get('titulo') ?? '').trim()
  if (titulo) campos.titulo = titulo
  const est = numero(fd.get('horas_estimadas'))
  if (est != null && est > 0) campos.horas_estimadas = est
  if (fd.has('horas_reais')) campos.horas_reais = numero(fd.get('horas_reais'))
  if (fd.has('data_prevista')) {
    const d = String(fd.get('data_prevista') ?? '')
    campos.data_prevista = /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : null
  }
  if (fd.has('link')) {
    const l = String(fd.get('link') ?? '').trim()
    campos.link = l ? (/^https?:\/\//.test(l) ? l : `https://${l}`) : null
  }
  if (fd.has('notas')) campos.notas = String(fd.get('notas') ?? '').trim()
  if (fd.has('registro')) campos.registro = String(fd.get('registro') ?? '').trim()
  const modo = String(fd.get('modo') ?? '') as ModoTarefa
  if (MODOS.includes(modo)) campos.modo = modo
  const fase = String(fd.get('fase') ?? '') as Fase
  if (FASES.includes(fase)) campos.fase = fase
  await supabase.from('tarefas').update(campos).eq('id', tarefaId)
  revalidatePath('/', 'layout')
}

export async function criarTarefa(projetoId: string, fase: Fase, fd: FormData) {
  const { supabase, user } = await sessao()
  const titulo = String(fd.get('titulo') ?? '').trim()
  if (!titulo || !FASES.includes(fase)) return
  const { data: ultima } = await supabase
    .from('tarefas')
    .select('ordem')
    .eq('projeto_id', projetoId)
    .eq('fase', fase)
    .order('ordem', { ascending: false })
    .limit(1)
    .maybeSingle()
  const { data: anterior } = ultima
    ? { data: ultima }
    : await supabase
        .from('tarefas')
        .select('ordem')
        .eq('projeto_id', projetoId)
        .in('fase', FASES.slice(0, FASES.indexOf(fase)))
        .order('ordem', { ascending: false })
        .limit(1)
        .maybeSingle()
  await supabase.from('tarefas').insert({
    user_id: user.id,
    projeto_id: projetoId,
    fase,
    titulo,
    modo: 'operacional',
    tipo: 'execucao',
    horas_estimadas: numero(fd.get('horas_estimadas')) ?? 1,
    ordem: (anterior?.ordem ?? 0) + 1,
  })
  revalidatePath('/', 'layout')
}

export async function excluirTarefa(tarefaId: string) {
  const { supabase } = await sessao()
  await supabase.from('tarefas').delete().eq('id', tarefaId)
  revalidatePath('/', 'layout')
}

export async function adiarParaAmanha(tarefaId: string) {
  const { supabase, perfil } = await sessao()
  const hoje = hojeEm(perfil.fuso)
  const d = new Date(hoje + 'T12:00:00Z')
  do d.setUTCDate(d.getUTCDate() + 1)
  while (d.getUTCDay() === 0 || d.getUTCDay() === 6)
  await supabase.from('tarefas').update({ data_prevista: d.toISOString().slice(0, 10) }).eq('id', tarefaId)
  revalidatePath('/', 'layout')
}
