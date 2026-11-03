'use server'

import { revalidatePath } from 'next/cache'
import { sessao, type Cliente } from '@/lib/dados'
import { diaUtilSeguinte, hojeEm } from '@/lib/datas'
import type { Fase, ItemChecklist, ModoTarefa, StatusTarefa } from '@/lib/tipos'

const FASES: Fase[] = ['planejamento', 'estudo', 'anteprojeto', 'executivo', 'entrega']
const MODOS: ModoTarefa[] = ['analitico', 'criativo', 'operacional', 'relacional']
const atualizar = () => revalidatePath('/', 'layout')

function numero(v: FormDataEntryValue | null): number | null {
  const s = String(v ?? '').trim().replace(',', '.')
  if (!s) return null
  const n = Number(s)
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) / 100 : null
}

// ---------------- Cronômetro ----------------

async function fecharAberto(supabase: Cliente) {
  const { data: aberto } = await supabase.from('apontamentos').select('id, tarefa_id, inicio').is('fim', null).limit(1).maybeSingle()
  if (!aberto) return null
  const fim = new Date()
  const horas = Math.max(0, (fim.getTime() - new Date(aberto.inicio).getTime()) / 3600000)
  await supabase.from('apontamentos').update({ fim: fim.toISOString(), horas: Math.round(horas * 100) / 100 }).eq('id', aberto.id)
  const { data: t } = await supabase.from('tarefas').select('horas_reais').eq('id', aberto.tarefa_id).maybeSingle()
  await supabase
    .from('tarefas')
    .update({ timer_inicio: null, horas_reais: Math.round(((Number(t?.horas_reais) || 0) + horas) * 100) / 100 })
    .eq('id', aberto.tarefa_id)
  return aberto.tarefa_id as string
}

export async function iniciarCronometro(tarefaId: string) {
  const { supabase, user } = await sessao()
  await fecharAberto(supabase)
  const { data: t } = await supabase.from('tarefas').select('projeto_id').eq('id', tarefaId).maybeSingle()
  if (!t) return
  const agora = new Date().toISOString()
  await supabase.from('apontamentos').insert({ user_id: user.id, tarefa_id: tarefaId, projeto_id: t.projeto_id, inicio: agora })
  await supabase.from('tarefas').update({ timer_inicio: agora, status: 'fazendo', concluida_em: null }).eq('id', tarefaId)
  atualizar()
}

export async function pararCronometro(concluir = false) {
  const { supabase } = await sessao()
  const id = await fecharAberto(supabase)
  if (id && concluir) {
    await supabase.from('tarefas').update({ status: 'feita', concluida_em: new Date().toISOString() }).eq('id', id)
    await liberarParcelas(supabase, id)
  }
  atualizar()
}

// Quando uma fase fica toda concluída, a parcela ligada a ela passa a "a receber"
async function liberarParcelas(supabase: Cliente, tarefaId: string) {
  const { data: t } = await supabase.from('tarefas').select('projeto_id').eq('id', tarefaId).maybeSingle()
  if (!t) return
  const { data: lista } = await supabase.from('tarefas').select('fase, status').eq('projeto_id', t.projeto_id)
  if (!lista) return
  const completas = FASES.filter((f) => lista.some((x) => x.fase === f) && lista.filter((x) => x.fase === f).every((x) => x.status === 'feita'))
  if (completas.length) await supabase.from('parcelas').update({ status: 'a_receber' }).eq('projeto_id', t.projeto_id).eq('status', 'prevista').in('fase', completas)
}

// ---------------- Status e edição ----------------

export async function alternarTarefa(tarefaId: string, feita: boolean) {
  const { supabase } = await sessao()
  if (feita) {
    const { data: aberto } = await supabase.from('apontamentos').select('tarefa_id').is('fim', null).limit(1).maybeSingle()
    if (aberto?.tarefa_id === tarefaId) await fecharAberto(supabase)
  }
  await supabase
    .from('tarefas')
    .update(feita ? { status: 'feita', concluida_em: new Date().toISOString() } : { status: 'a_fazer', concluida_em: null })
    .eq('id', tarefaId)
  if (feita) await liberarParcelas(supabase, tarefaId)
  atualizar()
}

export async function marcarStatus(tarefaId: string, status: StatusTarefa) {
  await alternarTarefa(tarefaId, status === 'feita')
  if (status === 'fazendo') {
    const { supabase } = await sessao()
    await supabase.from('tarefas').update({ status: 'fazendo' }).eq('id', tarefaId)
    atualizar()
  }
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
  atualizar()
}

export async function salvarChecklist(tarefaId: string, itens: ItemChecklist[]) {
  const { supabase } = await sessao()
  const limpos = itens.slice(0, 50).map((i) => ({ id: String(i.id), texto: String(i.texto).slice(0, 200), feito: !!i.feito }))
  await supabase.from('tarefas').update({ checklist: limpos }).eq('id', tarefaId)
  atualizar()
}

export async function criarTarefa(projetoId: string, fase: Fase, fd: FormData) {
  const { supabase, user } = await sessao()
  const titulo = String(fd.get('titulo') ?? '').trim()
  if (!titulo || !FASES.includes(fase)) return
  const { data: ultima } = await supabase
    .from('tarefas')
    .select('ordem, data_prevista')
    .eq('projeto_id', projetoId)
    .in('fase', FASES.slice(0, FASES.indexOf(fase) + 1))
    .order('ordem', { ascending: false })
    .limit(1)
    .maybeSingle()
  await supabase.from('tarefas').insert({
    user_id: user.id,
    projeto_id: projetoId,
    fase,
    titulo,
    modo: MODOS.includes(String(fd.get('modo')) as ModoTarefa) ? String(fd.get('modo')) : 'operacional',
    tipo: 'execucao',
    horas_estimadas: numero(fd.get('horas_estimadas')) ?? 1,
    ordem: (ultima?.ordem ?? 0) + 1,
    data_prevista: ultima?.data_prevista ?? null,
  })
  atualizar()
}

// Arrastar no quadro: muda a fase e reordena a coluna de destino
export async function moverTarefa(tarefaId: string, fase: Fase, idsNaOrdem: string[]) {
  const { supabase } = await sessao()
  if (!FASES.includes(fase)) return
  const { data: t } = await supabase.from('tarefas').select('projeto_id').eq('id', tarefaId).maybeSingle()
  if (!t) return
  const { data: lista } = await supabase.from('tarefas').select('id, ordem, fase').eq('projeto_id', t.projeto_id).order('ordem')
  if (!lista) return
  // As ordens disponíveis da coluna de destino (mais a da tarefa movida) são redistribuídas na nova sequência
  const doDestino = lista.filter((x) => x.fase === fase || x.id === tarefaId)
  const ordens = doDestino.map((x) => x.ordem).sort((a, b) => a - b)
  const seq = idsNaOrdem.filter((id) => doDestino.some((x) => x.id === id))
  await supabase.from('tarefas').update({ fase }).eq('id', tarefaId)
  await Promise.all(seq.map((id, i) => supabase.from('tarefas').update({ ordem: ordens[i] ?? ordens[ordens.length - 1] + i }).eq('id', id)))
  atualizar()
}

export async function excluirTarefa(tarefaId: string) {
  const { supabase } = await sessao()
  await supabase.from('tarefas').delete().eq('id', tarefaId)
  atualizar()
}

export async function adiarParaAmanha(tarefaId: string) {
  const { supabase, perfil } = await sessao()
  await supabase.from('tarefas').update({ data_prevista: diaUtilSeguinte(hojeEm(perfil.fuso)) }).eq('id', tarefaId)
  atualizar()
}
