'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { FASES, escoposPadrao, modeloAmbiente } from '@/lib/biblioteca'
import { proximaCor, CORES_PROJETO } from '@/lib/cores'
import { sessao, projetoPorId, projetosDe, type Cliente } from '@/lib/dados'
import { entregaPorPrazo } from '@/lib/datas'
import { distribuirDatas, gerarTarefas, montarContexto, valorSugerido } from '@/lib/motor'
import type { AmbienteEscolhido, Escopo, Fase, LinhaPrograma, PrazoTipo, Tipologia } from '@/lib/tipos'

const TIPOLOGIAS_VALIDAS: Tipologia[] = ['res_int', 'res_arq', 'com_int', 'com_arq']
const ESCOPOS_VALIDOS: Escopo[] = ['executivo', 'interiores', 'compatibilizacao', 'aprovacao', 'obra', 'render']

const texto = (fd: FormData, k: string) => String(fd.get(k) ?? '').trim()
// Aceita "29.350", "29350,50", "120.5" e "1.234,5"
function numero(fd: FormData, k: string): number | null {
  let v = texto(fd, k).replace(/[R$\s]/g, '')
  if (!v) return null
  if (v.includes(',')) v = v.replace(/\./g, '').replace(',', '.')
  else if (/^\d{1,3}(\.\d{3})+$/.test(v)) v = v.replace(/\./g, '')
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}
const data = (fd: FormData, k: string) => (/^\d{4}-\d{2}-\d{2}$/.test(texto(fd, k)) ? texto(fd, k) : null)
const prazoTipo = (fd: FormData): PrazoTipo => (texto(fd, 'prazo_tipo') === 'uteis' ? 'uteis' : 'corridos')

const atualizarTudo = () => revalidatePath('/', 'layout')

async function emLotes<T>(itens: T[], fn: (t: T) => PromiseLike<unknown>, tamanho = 10) {
  for (let i = 0; i < itens.length; i += tamanho) await Promise.all(itens.slice(i, i + tamanho).map(fn))
}

function ritmoPara(horasDia: number, ativos: number) {
  return Math.max(1.5, Math.round((horasDia / Math.max(1, ativos)) * 2) / 2)
}

export type EstadoProjeto = { erro?: string } | undefined

export async function criarProjeto(_: EstadoProjeto, fd: FormData): Promise<EstadoProjeto> {
  const { supabase, user, perfil, hoje } = await sessao()

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
  const prazoDias = numero(fd, 'prazo_dias')
  const tipoPrazo = prazoTipo(fd)
  const situacao = texto(fd, 'situacao') === 'contratado' ? 'contratado' : 'proposta'
  const ctx = montarContexto(tipologia, escopos.length ? escopos : escoposPadrao(tipologia), ambientes, area)
  const geradas = gerarTarefas(ctx)
  const totalHoras = geradas.reduce((s, t) => s + t.horas_estimadas, 0)

  const existentes = await projetosDe(supabase)
  const corEscolhida = texto(fd, 'cor')
  const cor = CORES_PROJETO.some((c) => c.chave === corEscolhida) ? corEscolhida : proximaCor(existentes.filter((p) => ['andamento', 'proposta'].includes(p.status)).map((p) => p.cor))

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
      prazo_dias: prazoDias ? Math.round(prazoDias) : null,
      prazo_tipo: tipoPrazo,
      valor_proposta: valorSugerido(totalHoras, perfil.custo_hora, perfil.margem),
      notas: texto(fd, 'notas'),
      programa: programaInicial(ambientes),
      cor,
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
    const inicio = data(fd, 'data_inicio') ?? hoje
    await contratar(supabase, perfil.horas_dia, projeto.id, {
      inicio,
      entrega: prazoDias ? entregaPorPrazo(inicio, Math.round(prazoDias), tipoPrazo) : null,
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
      linhas.push({ id: `${a.chave}-${i}`, ambiente: a.qtd > 1 ? `${a.nome} ${i}` : a.nome, setor: m.setor, area: null, requisitos: '' })
    }
  }
  return linhas
}

async function contratar(
  supabase: Cliente,
  horasDia: number,
  projetoId: string,
  { inicio, entrega, valor, faseAtual }: { inicio: string; entrega: string | null; valor: number | null; faseAtual?: Fase },
) {
  const agora = new Date().toISOString()
  const projeto = await projetoPorId(supabase, projetoId)
  if (!projeto) return

  // Só a assinatura conta como feita hoje; o comercial anterior fica concluído sem data
  await supabase.from('tarefas').update({ status: 'feita', concluida_em: agora }).eq('projeto_id', projetoId).eq('chave', 'contrato').neq('status', 'feita')
  await supabase.from('tarefas').update({ status: 'feita', concluida_em: null }).eq('projeto_id', projetoId).eq('etapa', 'comercial').neq('status', 'feita')
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
    ritmoPara(horasDia, ativos + 1),
  )
  await emLotes(Object.entries(dist.datas), ([id, d]) => supabase.from('tarefas').update({ data_prevista: d }).eq('id', id))

  const valorFinal = valor ?? projeto.valor_proposta
  await supabase
    .from('projetos')
    .update({ status: 'andamento', data_inicio: inicio, data_entrega: entrega ?? dist.entregaSugerida, valor_contrato: valorFinal })
    .eq('id', projetoId)

  // Parcelas padrão, se ainda não houver
  const { count } = await supabase.from('parcelas').select('id', { count: 'exact', head: true }).eq('projeto_id', projetoId)
  if (!count && valorFinal) await gerarParcelasPadrao(supabase, projetoId, valorFinal, inicio)
}

// Entrada na assinatura (30%) e o restante dividido pelas fases, na proporção das horas de cada uma
async function gerarParcelasPadrao(supabase: Cliente, projetoId: string, valor: number, inicio: string) {
  const { data: tarefas } = await supabase.from('tarefas').select('fase, horas_estimadas, data_prevista, status').eq('projeto_id', projetoId)
  const { data: proj } = await supabase.from('projetos').select('user_id').eq('id', projetoId).maybeSingle()
  if (!tarefas || !proj) return
  const fases = FASES.filter((f) => f.chave !== 'planejamento' && tarefas.some((t) => t.fase === f.chave))
  const horas = (f: string) => tarefas.filter((t) => t.fase === f).reduce((s, t) => s + Number(t.horas_estimadas), 0)
  const totalFases = fases.reduce((s, f) => s + horas(f.chave), 0) || 1
  const entrada = Math.round(valor * 0.3)
  let restante = valor - entrada
  const linhas = [{ user_id: proj.user_id, projeto_id: projetoId, descricao: 'Entrada na assinatura do contrato', valor: entrada, fase: null, vencimento: inicio, status: 'a_receber', ordem: 0 }]
  fases.forEach((f, i) => {
    const v = i === fases.length - 1 ? restante : Math.round(((valor - entrada) * horas(f.chave)) / totalFases)
    restante -= v
    const datas = tarefas.filter((t) => t.fase === f.chave && t.data_prevista).map((t) => t.data_prevista as string).sort()
    linhas.push({
      user_id: proj.user_id,
      projeto_id: projetoId,
      descricao: `Conclusão: ${f.nome}`,
      valor: v,
      fase: f.chave as never,
      vencimento: datas[datas.length - 1] ?? inicio,
      status: tarefas.filter((t) => t.fase === f.chave).every((t) => t.status === 'feita') ? 'a_receber' : 'prevista',
      ordem: i + 1,
    })
  })
  await supabase.from('parcelas').insert(linhas)
}

export async function assinarContrato(projetoId: string, fd: FormData) {
  const { supabase, perfil, hoje } = await sessao()
  const inicio = data(fd, 'data_inicio') ?? hoje
  const dias = numero(fd, 'prazo_dias')
  const tipo = prazoTipo(fd)
  if (dias) await supabase.from('projetos').update({ prazo_dias: Math.round(dias), prazo_tipo: tipo }).eq('id', projetoId)
  await contratar(supabase, perfil.horas_dia, projetoId, {
    inicio,
    entrega: dias ? entregaPorPrazo(inicio, Math.round(dias), tipo) : null,
    valor: numero(fd, 'valor_contrato'),
  })
  atualizarTudo()
}

export async function redistribuir(projetoId: string, fd: FormData) {
  const { supabase, perfil, hoje } = await sessao()
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
  if (fd.has('cor') && CORES_PROJETO.some((c) => c.chave === texto(fd, 'cor'))) campos.cor = texto(fd, 'cor')
  if (fd.has('prazo_dias')) campos.prazo_dias = numero(fd, 'prazo_dias')
  if (fd.has('prazo_tipo')) campos.prazo_tipo = prazoTipo(fd)
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
  if (fd.get('concluir') === '1') await concluirPorChave(supabase, projetoId, 'briefing')
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
  if (concluir) await concluirPorChave(supabase, projetoId, concluir)
  atualizarTudo()
}

async function concluirPorChave(supabase: Cliente, projetoId: string, chave: string) {
  await supabase.from('tarefas').update({ status: 'feita', concluida_em: new Date().toISOString() }).eq('projeto_id', projetoId).eq('chave', chave).neq('status', 'feita')
}

// ---------------- Parcelas ----------------

export async function criarParcelasPadrao(projetoId: string) {
  const { supabase } = await sessao()
  const p = await projetoPorId(supabase, projetoId)
  const valor = p?.valor_contrato ?? p?.valor_proposta
  if (!p || !valor) return
  await supabase.from('parcelas').delete().eq('projeto_id', projetoId).neq('status', 'recebida')
  await gerarParcelasPadrao(supabase, projetoId, valor, p.data_inicio ?? new Date().toISOString().slice(0, 10))
  atualizarTudo()
}

export async function salvarParcela(parcelaId: string, fd: FormData) {
  const { supabase } = await sessao()
  const campos: Record<string, unknown> = {}
  if (fd.has('descricao')) campos.descricao = texto(fd, 'descricao')
  if (fd.has('valor')) campos.valor = numero(fd, 'valor') ?? 0
  if (fd.has('vencimento')) campos.vencimento = data(fd, 'vencimento')
  await supabase.from('parcelas').update(campos).eq('id', parcelaId)
  atualizarTudo()
}

export async function marcarParcela(parcelaId: string, recebida: boolean, hoje?: string) {
  const { supabase } = await sessao()
  await supabase
    .from('parcelas')
    .update(recebida ? { status: 'recebida', recebida_em: hoje ?? new Date().toISOString().slice(0, 10) } : { status: 'a_receber', recebida_em: null })
    .eq('id', parcelaId)
  atualizarTudo()
}

export async function adicionarParcela(projetoId: string) {
  const { supabase, user } = await sessao()
  const { data: ultima } = await supabase.from('parcelas').select('ordem').eq('projeto_id', projetoId).order('ordem', { ascending: false }).limit(1).maybeSingle()
  await supabase.from('parcelas').insert({ user_id: user.id, projeto_id: projetoId, descricao: 'Nova parcela', valor: 0, status: 'a_receber', ordem: (ultima?.ordem ?? 0) + 1 })
  atualizarTudo()
}

export async function excluirParcela(parcelaId: string) {
  const { supabase } = await sessao()
  await supabase.from('parcelas').delete().eq('id', parcelaId)
  atualizarTudo()
}
