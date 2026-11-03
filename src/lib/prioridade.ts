// Priorização do dia. Pesos: urgência 35%, sequência 20%, risco do projeto 15%, modo do dia 30%.
// O modo do dia escolhe entre as tarefas que podem ser feitas agora, não só entre as datas de hoje.

import { MODOS_DIA, MODOS_TAREFA, chaveBase } from './biblioteca'
import { dataCurta, diferencaDias, somarDias } from './datas'
import type { Saude } from './saude'
import type { ModoDia, ModoTarefa, Projeto, Tarefa } from './tipos'

export interface ItemDoDia {
  tarefa: Tarefa
  projeto: Projeto
  pontos: number
  motivo: string
  combina: boolean
}

const AFINIDADE: Record<ModoDia, Record<ModoTarefa, number>> = {
  afiado: { analitico: 1, operacional: 0.55, criativo: 0.45, relacional: 0.4 },
  criativo: { criativo: 1, analitico: 0.45, relacional: 0.45, operacional: 0.2 },
  mecanico: { operacional: 1, relacional: 0.6, analitico: 0.3, criativo: 0.15 },
  nebuloso: { operacional: 0.75, relacional: 0.7, criativo: 0.3, analitico: 0.2 },
}

export function afinidade(modo: ModoDia | null, t: Tarefa): number {
  if (!modo) return 0.5
  let v = AFINIDADE[modo][t.modo]
  const h = t.horas_estimadas
  if (modo === 'nebuloso') {
    if (h <= 1.5) v += 0.25
    if (h > 4) v -= 0.35
  }
  if (modo === 'mecanico' && h <= 2) v += 0.1
  if (modo === 'afiado' && h >= 3 && t.modo === 'analitico') v += 0.1
  return Math.max(0, Math.min(1, v))
}

function urgencia(t: Tarefa, hoje: string): number {
  if (!t.data_prevista) return 0.3
  const d = diferencaDias(t.data_prevista, hoje)
  if (d < 0) return 1
  if (d === 0) return 0.8
  if (d <= 2) return 0.6
  if (d <= 5) return 0.4
  return 0.2
}

export function montarDia(
  tarefas: Tarefa[],
  projetos: Projeto[],
  hoje: string,
  modo: ModoDia | null,
  horasDia: number,
  saudes: Record<string, Saude> = {},
): { lista: ItemDoDia[]; extras: ItemDoDia[] } {
  const porProjeto = new Map<string, Tarefa[]>()
  for (const t of tarefas) {
    const l = porProjeto.get(t.projeto_id) ?? []
    l.push(t)
    porProjeto.set(t.projeto_id, l)
  }
  const janela = somarDias(hoje, 3)
  const candidatos: ItemDoDia[] = []

  for (const p of projetos) {
    if (p.status !== 'andamento' && p.status !== 'proposta') continue
    const todas = (porProjeto.get(p.id) ?? []).sort((a, b) => a.ordem - b.ordem)
    const feitas = new Set(todas.filter((t) => t.status === 'feita').map((t) => chaveBase(t.chave)))
    const pendentes = todas.filter((t) => t.status !== 'feita')
    const fase = pendentes[0]?.fase
    const saude = saudes[p.id]
    const proposta = p.status === 'proposta'

    pendentes.forEach((t, pos) => {
      if (proposta && (t.etapa !== 'comercial' || t.chave === 'contrato')) return
      // Leque: o que está na janela de datas, o que já começou, e as próximas da fase em andamento
      const naJanela = !!t.data_prevista && t.data_prevista <= janela
      const naFase = t.fase === fase && pos < 8
      if (!proposta && !naJanela && !naFase && t.status !== 'fazendo') return

      const bloqueada = t.depende_de.some((d) => pendentes.some((x) => chaveBase(x.chave) === d && x.id !== t.id) && !feitas.has(d))
      let seq = pos === 0 ? 1 : pos === 1 ? 0.75 : pos === 2 ? 0.55 : pos === 3 ? 0.4 : 0.3
      if (bloqueada) seq *= 0.5
      if (t.status === 'fazendo') seq = 1
      const risco = proposta ? 0.8 : saude?.status === 'atrasado' ? 1 : saude?.status === 'atencao' ? 0.7 : 0.4
      const u = urgencia(t, hoje)
      const m = afinidade(modo, t)
      const pontos = 0.35 * u + 0.2 * seq + 0.15 * risco + 0.3 * m
      candidatos.push({ tarefa: t, projeto: p, pontos, combina: m >= 0.85, motivo: motivoDe(t, p, hoje, modo, pos, m, saude, bloqueada) })
    })
  }

  candidatos.sort((a, b) => b.pontos - a.pontos)
  const lista: ItemDoDia[] = []
  const extras: ItemDoDia[] = []
  let soma = 0
  for (const c of candidatos) {
    if (soma < horasDia || lista.length === 0) {
      lista.push(c)
      soma += Math.min(c.tarefa.horas_estimadas, horasDia)
    } else extras.push(c)
  }
  return { lista, extras }
}

function motivoDe(t: Tarefa, p: Projeto, hoje: string, modo: ModoDia | null, pos: number, afin: number, saude: Saude | undefined, bloqueada: boolean): string {
  const nomeModo = MODOS_DIA.find((x) => x.chave === modo)?.nome.toLowerCase()
  const tipo = MODOS_TAREFA[t.modo].nome.toLowerCase()
  if (t.status === 'fazendo') return 'Você já começou. Terminar o que está aberto alivia a cabeça.'
  if (t.data_prevista && t.data_prevista < hoje) {
    const extra = saude && saude.diasAtraso > 0 ? ` ${p.nome} já projeta ${saude.diasAtraso} ${saude.diasAtraso === 1 ? 'dia' : 'dias'} de atraso.` : ''
    return `Estava prevista para ${dataCurta(t.data_prevista)}.${extra}`
  }
  if (p.status === 'proposta') return `Fechar a proposta transforma ${p.nome} em trabalho contratado.`
  if (modo && afin >= 0.85) return `Tarefa ${tipo}: combina com um dia ${nomeModo}.`
  if (saude?.status === 'atrasado') return `${p.nome} está atrasado: cada hora aqui recupera o cronograma.`
  if (t.fase === 'planejamento') return 'Cada hora de planejamento agora poupa revisões lá na frente.'
  if (pos === 0 && !bloqueada) return `É o próximo passo de ${p.nome}.`
  if (t.data_prevista === hoje) return 'Está prevista para hoje no cronograma.'
  return `Mantém ${p.nome} no ritmo do cronograma.`
}

export function fraseDoModo(modo: ModoDia | null): string {
  switch (modo) {
    case 'afiado':
      return 'Dia afiado: tarefas analíticas e de precisão subiram na fila.'
    case 'criativo':
      return 'Dia criativo: estudos, conceito e escolhas de material vêm primeiro.'
    case 'mecanico':
      return 'Dia mecânico: tarefas operacionais e mais curtas subiram na fila.'
    case 'nebuloso':
      return 'Dia nebuloso: o ARQFLOW trouxe primeiro o que é curto e concreto.'
    default:
      return 'Escolha como você chega hoje e o ARQFLOW reorganiza a fila.'
  }
}
