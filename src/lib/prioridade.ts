// Priorização do dia: urgência 40%, dependências 30%, risco financeiro 20%, modo do dia 10%.

import { MODOS_DIA, chaveBase } from './biblioteca'
import { dataCurta, diferencaDias, somarDias } from './datas'
import type { ModoDia, ModoTarefa, Projeto, Tarefa } from './tipos'

export interface ItemDoDia {
  tarefa: Tarefa
  projeto: Projeto
  pontos: number
  motivo: string
}

const AFINIDADE: Record<ModoDia, Record<ModoTarefa, number>> = {
  afiado: { analitico: 1, operacional: 0.6, criativo: 0.5, relacional: 0.5 },
  criativo: { criativo: 1, analitico: 0.5, relacional: 0.5, operacional: 0.3 },
  mecanico: { operacional: 1, relacional: 0.6, analitico: 0.4, criativo: 0.2 },
  nebuloso: { operacional: 0.8, relacional: 0.7, criativo: 0.4, analitico: 0.3 },
}

function afinidade(modo: ModoDia | null, t: Tarefa): number {
  if (!modo) return 0.5
  let v = AFINIDADE[modo][t.modo]
  if (modo === 'nebuloso') {
    const h = Number(t.horas_estimadas)
    if (h <= 1.5) v += 0.2
    if (h > 4) v -= 0.3
  }
  return Math.max(0, Math.min(1, v))
}

function urgencia(t: Tarefa, projeto: Projeto, hoje: string): number {
  if (!t.data_prevista) return projeto.status === 'proposta' ? 0.6 : 0.2
  const d = diferencaDias(t.data_prevista, hoje)
  if (d < 0) return 1
  if (d === 0) return 0.85
  if (d <= 2) return 0.65
  if (d <= 5) return 0.45
  return 0.25
}

export function montarDia(
  tarefas: Tarefa[],
  projetos: Projeto[],
  hoje: string,
  modo: ModoDia | null,
  horasDia: number,
): { lista: ItemDoDia[]; extras: ItemDoDia[] } {
  const porProjeto = new Map<string, Tarefa[]>()
  for (const t of tarefas) {
    const l = porProjeto.get(t.projeto_id) ?? []
    l.push(t)
    porProjeto.set(t.projeto_id, l)
  }
  const janela = somarDias(hoje, 2)
  const candidatos: ItemDoDia[] = []

  for (const p of projetos) {
    if (p.status !== 'andamento' && p.status !== 'proposta') continue
    const todas = (porProjeto.get(p.id) ?? []).sort((a, b) => a.ordem - b.ordem)
    const feitas = new Set(todas.filter((t) => t.status === 'feita').map((t) => chaveBase(t.chave)))
    const pendentes = todas.filter((t) => t.status !== 'feita')
    const atrasadas = pendentes.filter((t) => t.data_prevista && t.data_prevista < hoje).length

    pendentes.forEach((t, pos) => {
      const proposta = p.status === 'proposta'
      // Em proposta, só o comercial entra no dia; em andamento, o que está na janela ou é o próximo passo.
      if (proposta && t.etapa !== 'comercial') return
      if (proposta && t.chave === 'contrato') return
      const naJanela = t.data_prevista ? t.data_prevista <= janela : pos === 0
      if (!proposta && !naJanela && t.status !== 'fazendo') return

      const u = urgencia(t, p, hoje)
      const bloqueada = t.depende_de.some((d) => pendentes.some((x) => chaveBase(x.chave) === d) && !feitas.has(d))
      let dep = pos === 0 ? 1 : pos === 1 ? 0.7 : pos === 2 ? 0.5 : 0.3
      if (bloqueada) dep *= 0.4
      if (t.status === 'fazendo') dep = Math.max(dep, 0.9)
      const fin = proposta ? 0.9 : Math.min(1, 0.3 + 0.15 * atrasadas)
      const m = afinidade(modo, t)
      const pontos = 0.4 * u + 0.3 * dep + 0.2 * fin + 0.1 * m

      candidatos.push({ tarefa: t, projeto: p, pontos, motivo: motivoDe(t, p, hoje, modo, pos, m) })
    })
  }

  candidatos.sort((a, b) => b.pontos - a.pontos)
  const lista: ItemDoDia[] = []
  const extras: ItemDoDia[] = []
  let soma = 0
  for (const c of candidatos) {
    if (soma < horasDia || lista.length === 0) {
      lista.push(c)
      soma += Math.min(Number(c.tarefa.horas_estimadas), horasDia)
    } else extras.push(c)
  }
  return { lista, extras }
}

function motivoDe(t: Tarefa, p: Projeto, hoje: string, modo: ModoDia | null, pos: number, afin: number): string {
  if (t.data_prevista && t.data_prevista < hoje) {
    return `Estava prevista para ${dataCurta(t.data_prevista)}. Resolver agora tira peso do resto da semana.`
  }
  if (p.status === 'proposta') {
    return `Fechar a proposta transforma ${p.nome} em trabalho contratado.`
  }
  if (t.status === 'fazendo') return 'Você já começou. Terminar o que está aberto alivia a cabeça.'
  if (t.fase === 'planejamento') return 'Cada hora de planejamento agora poupa revisões lá na frente.'
  if (modo && afin >= 0.9) return MODOS_DIA.find((m) => m.chave === modo)?.frase ?? ''
  if (pos === 0) return `É o próximo passo de ${p.nome} e libera as etapas seguintes.`
  if (t.data_prevista === hoje) return 'Está prevista para hoje no cronograma.'
  return `Mantém ${p.nome} no ritmo do cronograma.`
}
