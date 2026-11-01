'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { FASES, escoposPadrao, modeloAmbiente } from '@/lib/biblioteca'
import { sessao, projetoPorId, projetosDe } from '@/lib/dados'
import { hojeEm } from '@/lib/datas'
import { distribuirDatas, gerarTarefas, montarContexto, valorSugerido } from '@/lib/motor'
import type { AmbienteEscolhido, Escopo, Fase, LinhaPrograma, Tipologia } from '@/lib/tipos'

const TIPOLOGIAS_VALIDAS: Tipologia[] = ['res_int', 'res_arq', 'com_int', 'com_arq']
const ESCOPOS_VALIDOS: Escopo[] = ['executivo', 'interiores', 'compatibilizacao', 'aprovacao', 'obra', 'render']

const texto = (fd: FormData, k: string) => String(fd.get(k) ?? '').trim()
function numero(fd: FormData, k: string): number | null {
  const v = texto(fd, k).replace(/\./g, '').replace(',', '.')
  if (!v) return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}
const data = (fd: FormData, k: string) => (/^\d{4}-\d{2}-\d{2}$/.test(texto(fd, k)) ? texto(fd, k) : null)

function atualizarTudo() {
  revalidatePath('/', 'layout')
}

async function emLotes<T>(itens: T[], fn: (t: T) => PromiseLike<unknown>, tamanho = 10) {
  for (let i = 0; i < itens.length; i += tamanho) await Promise.all(itens.slice(i, i + tamanho).map(fn))
}

// Ritmo de horas por dia para um projeto sem prazo: divide a jornada entre os projetos ativos
function ritmoPara(horasDia: number, ativos: number) {
  return Math.max(1.5, Math.round((horasDia / Math.max(1, ativos)) * 2) / 2)
}

export type EstadoProjeto = { erro?: string } | undefined

export async function criarProjeto(_: EstadoProjeto, fd: FormData): Promise<EstadoProjeto> {
  const { supabase, user, perfil } = await sessao()
  const hoje = hojeEm(perfil.fuso)

  const nome = texto(fd, 'nome')
  const tipologia = texto(fd, 'tipologia') as Tipologia
  if (!nome) return { erro: 'Dê um nome ao projeto.' }
  if (!TIPOLOGIAS_VALIDAS.includes(tipologia)) return { erro: 'Escolha a tipologia.' }
  const escopos = fd.getAll('escopos').map(String).filter((e): e is Escopo => ESCOPOS_VALIDOS.includes(e as Escopo))
  let ambientes: AmbienteEscolhido[] = []
  try {
    ambientes = (JSON.parse(texto(fd, 'ambientes') || '[]') as AmbienteEscolhido[])
      .filter((a) => a && a.chave && a.qtd > 0)
      .map((a) => ({ chave: String(a.chave), nome: String(a.nome || modeloAmbiente(a.chave).nome), qtd: Math.min(20, Math.max(1, Math.round(a.qtd))) }))
  } catch {
    ambientes = []
  }
  if (ambientes.length === 0) return { erro: 'Escolha pelo menos um ambiente.' }

  const area = numero(fd, 'area_m2')
  const situacao = texto(fd, 'situacao') === 'contratado' ? 'contratado' : 'proposta'
  const ctx = montarContexto(tipologia, escopos.length ? escopos : escoposPadrao(tipologia), ambientes, area)
  const geradas = gerarTarefas(ctx)
  const totalHoras = geradas.reduce((s, t) => s + t.horas_estimadas, 0)

  const { data: projeto, error } = await supabase
    .from('projetos')
    .insert({
      user_id: user.id,
      nome,
      cliente: texto(fd, 'cliente'),
      tipologia,
      escopos: ctx.escopos,
      ambientes,
      area_m2: area,
      status: 'proposta',
      data_entrega: data(fd, 'data_entrega'),
      valor_proposta: valorSugerido(totalHoras, perfil.custo_hora, perfil.margem),
      notas: texto(fd, 'notas'),
      programa: programaInicial(ambientes),
    })
    .select('id')
    .single()
  if (error || !projeto) return { erro: 'Não foi possível salvar o projeto. Confira se o script do banco foi rodado no Supabase.' }

  const linhas = geradas.map((t) => ({
    user_id: user.id,
    projeto_id: projeto.id,
    chave: t.chave,
    fase: t.fase,
    etapa: t.etapa,
    titulo: t.titulo,
    modo: t.modo,
    tipo: t.tipo,
    essencial: t.essencial,
    horas_estimadas: t.horas_estimadas,
    ordem: t.ordem * 10,
    depende_de: t.depende_de,
    data_prevista: t.etapa === 'comercial' && t.chave !== 'contrato' ? hoje : null,
  }))
  const { error: erroTarefas } = await supabase.from('tarefas').insert(linhas)
  if (erroTarefas) {
    await supabase.from('projetos').delete().eq('id', projeto.id)
    return { erro: 'Não foi possível gerar as tarefas. Tente de novo.' }
  }

  if (situacao === 'contratado') {
    const faseAtual = texto(fd, 'fase_atual') as Fase
    await contratar(projeto.id, {
      inicio: data(fd, 'data_inicio') ?? hoje,
      entrega: data(fd, 'data_entrega'),
      valor: numero(fd, 'valor_contrato'),
      faseAtual: FASES.some((f) => f.chave === faseAtual) ? faseAtual : 'planejamento',
    })
  }
  atualizarTudo()
  redirect(`/projetos/${projeto.id}`)
}

function programaInicial(ambientes: AmbienteEscolhido[]): LinhaPrograma[] {
  const linhas: LinhaPrograma[] = []
  for (const a of ambientes) {
    const m = modeloAmbiente(a.chave, a.nome)
    for (let i = 1; i <= a.qtd; i++) {
      linhas.push({
        id: `${a.chave}-${i}`,
        ambiente: a.qtd > 1 ? `${a.nome} ${i}` : a.nome,
        setor: m.setor,
        area: null,
        requisitos: '',
      })
    }
  }
  return linhas
}

async function contratar(
  projetoId: string,
  { inicio, entrega, valor, faseAtual }: { inicio: string; entrega: string | null; valor: number | null; faseAtual?: Fase },
) {
  const { supabase, perfil } = await sessao()
  const agora = new Date().toISOString()
  const projeto = await projetoPorId(supabase, projetoId)
  if (!projeto) return

  // O comercial está resolvido quando o contrato é assinado. Só a assinatura conta como feita hoje;
  // o que foi resolvido antes do app fica concluído sem data, para não inflar o dia.
  await supabase.from('tarefas').update({ status: 'feita', concluida_em: agora }).eq('projeto_id', projetoId).eq('chave', 'contrato').neq('status', 'feita')
  await supabase.from('tarefas').update({ status: 'feita', concluida_em: null }).eq('projeto_id', projetoId).eq('etapa', 'comercial').neq('status', 'feita')

  // Projeto que já estava em andamento: fases anteriores à atual entram como feitas
  if (faseAtual && faseAtual !== 'planejamento') {
    const anteriores = FASES.slice(0, FASES.findIndex((f) => f.chave === faseAtual)).map((f) => f.chave)
    await supabase.from('tarefas').update({ status: 'feita', concluida_em: null }).eq('projeto_id', projetoId).in('fase', anteriores).neq('status', 'feita')
  }

  const ativos = (await projetosDe(supabase, ['andamento'])).filter((p) => p.id !== projetoId).length
  const { data: pendentes } = await supabase.from('tarefas').select('id, ordem, horas_estimadas').eq('projeto_id', projetoId).neq('status', 'feita')
  const dist = distribuirDatas(
    (pendentes ?? []).map((t) => ({ id: t.id, ordem: t.ordem, horas_estimadas: Number(t.horas_estimadas) })),
    inicio,
    entrega,
    ritmoPara(perfil.horas_dia, ativos + 1),
  )
  await emLotes(Object.entries(dist.datas), ([id, d]) => supabase.from('tarefas').update({ data_prevista: d }).eq('id', id))

  await supabase
    .from('projetos')
    .update({
      status: 'andamento',
      data_inicio: inicio,
      data_entrega: entrega ?? dist.entregaSugerida,
      valor_contrato: valor ?? projeto.valor_proposta,
    })
    .eq('id', projetoId)
}

export async function assinarContrato(projetoId: string, fd: FormData) {
  const { perfil } = await sessao()
  await contratar(projetoId, {
    inicio: data(fd, 'data_inicio') ?? hojeEm(perfil.fuso),
    entrega: data(fd, 'data_entrega'),
    valor: numero(fd, 'valor_contrato'),
  })
  atualizarTudo()
}

export async function redistribuir(projetoId: string, fd: FormData) {
  const { supabase, perfil } = await sessao()
  const hoje = hojeEm(perfil.fuso)
  const entrega = data(fd, 'data_entrega')
  const ativos = (await projetosDe(supabase, ['andamento'])).length
  const { data: pendentes } = await supabase.from('tarefas').select('id, ordem, horas_estimadas').eq('projeto_id', projetoId).neq('status', 'feita')
  const dist = distribuirDatas(
    (pendentes ?? []).map((t) => ({ id: t.id, ordem: t.ordem, horas_estimadas: Number(t.horas_estimadas) })),
    hoje,
    entrega,
    ritmoPara(perfil.horas_dia, ativos),
  )
  await emLotes(Object.entries(dist.datas), ([id, d]) => supabase.from('tarefas').update({ data_prevista: d }).eq('id', id))
  await supabase.from('projetos').update({ data_entrega: entrega ?? dist.entregaSugerida }).eq('id', projetoId)
  atualizarTudo()
}

export async function mudarStatus(projetoId: string, status: 'proposta' | 'andamento' | 'pausado' | 'concluido' | 'arquivado') {
  const { supabase } = await sessao()
  await supabase.from('projetos').update({ status }).eq('id', projetoId)
  atualizarTudo()
}

export async function salvarDadosProjeto(projetoId: string, fd: FormData) {
  const { supabase } = await sessao()
  const campos: Record<string, unknown> = {}
  if (fd.has('nome') && texto(fd, 'nome')) campos.nome = texto(fd, 'nome')
  if (fd.has('cliente')) campos.cliente = texto(fd, 'cliente')
  if (fd.has('valor_proposta')) campos.valor_proposta = numero(fd, 'valor_proposta')
  if (fd.has('valor_contrato')) campos.valor_contrato = numero(fd, 'valor_contrato')
  if (fd.has('partido')) campos.partido = texto(fd, 'partido')
  if (fd.has('notas')) campos.notas = texto(fd, 'notas')
  await supabase.from('projetos').update(campos).eq('id', projetoId)
  atualizarTudo()
}

export async function excluirProjeto(projetoId: string) {
  const { supabase } = await sessao()
  await supabase.from('projetos').delete().eq('id', projetoId)
  atualizarTudo()
  redirect('/projetos')
}

export async function salvarBriefing(projetoId: string, fd: FormData) {
  const { supabase } = await sessao()
  const respostas: Record<string, string> = {}
  for (const [k, v] of fd.entries()) if (k.startsWith('q_')) respostas[k.slice(2)] = String(v).trim()
  await supabase.from('projetos').update({ briefing: respostas }).eq('id', projetoId)
  if (fd.get('concluir') === '1') await concluirPorChave(projetoId, 'briefing')
  atualizarTudo()
}

export async function salvarPrograma(projetoId: string, linhas: LinhaPrograma[], concluir?: 'programa' | 'setorizacao') {
  const { supabase } = await sessao()
  const limpas = linhas.slice(0, 200).map((l) => ({
    id: String(l.id),
    ambiente: String(l.ambiente).slice(0, 120),
    setor: String(l.setor).slice(0, 40),
    area: l.area == null || Number.isNaN(Number(l.area)) ? null : Number(l.area),
    requisitos: String(l.requisitos ?? '').slice(0, 600),
  }))
  await supabase.from('projetos').update({ programa: limpas }).eq('id', projetoId)
  if (concluir) await concluirPorChave(projetoId, concluir)
  atualizarTudo()
}

async function concluirPorChave(projetoId: string, chave: string) {
  const { supabase } = await sessao()
  await supabase
    .from('tarefas')
    .update({ status: 'feita', concluida_em: new Date().toISOString() })
    .eq('projeto_id', projetoId)
    .eq('chave', chave)
    .neq('status', 'feita')
}
