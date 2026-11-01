// Motor do ARQFLOW: transforma o perfil do projeto em tarefas com horas,
// e distribui as tarefas no calendário quando o contrato é assinado.

import {
  MODELOS,
  SETORES,
  ehArquitetura,
  ehResidencial,
  modeloAmbiente,
  type Contexto,
  type ModeloTarefa,
} from './biblioteca'
import { diasUteisEntre, proximoDiaUtil, somarDiasUteis } from './datas'
import type { AmbienteEscolhido, Escopo, Fase, ModoTarefa, Tipologia, TipoTarefa } from './tipos'

export interface TarefaGerada {
  chave: string
  fase: Fase
  etapa: string | null
  titulo: string
  modo: ModoTarefa
  tipo: TipoTarefa
  essencial: boolean
  horas_estimadas: number
  ordem: number
  depende_de: string[]
}

const meiaHora = (h: number) => Math.max(0.5, Math.round(h * 2) / 2)

export function montarContexto(tipologia: Tipologia, escopos: Escopo[], ambientes: AmbienteEscolhido[], area: number | null): Contexto {
  const unidades: Contexto['unidades'] = []
  for (const a of ambientes) {
    const m = modeloAmbiente(a.chave, a.nome)
    const qtd = Math.max(1, Math.min(20, Math.round(a.qtd || 1)))
    for (let i = 1; i <= qtd; i++) {
      unidades.push({
        chave: qtd > 1 ? `${a.chave}-${i}` : a.chave,
        nome: qtd > 1 ? `${a.nome} ${i}` : a.nome,
        setor: m.setor,
        peso: m.peso,
        molhada: !!m.molhada,
        marcenaria: !!m.marcenaria,
      })
    }
  }
  const somaPesos = unidades.reduce((s, u) => s + u.peso, 0)
  const somaMolhadas = unidades.filter((u) => u.molhada).length
  // A área só pesa nas tarefas marcadas com escalaArea; 120 m² é a referência.
  const fatorArea = area && area > 0 ? Math.min(2, Math.max(0.75, Math.sqrt(area / 120))) : 1
  return {
    tipologia,
    escopos,
    arq: ehArquitetura(tipologia),
    res: ehResidencial(tipologia),
    unidades,
    somaPesos,
    somaMolhadas,
    fatorArea,
  }
}

function horasDe(m: ModeloTarefa, c: Contexto, pesos = c.somaPesos): number {
  let h = m.horas + (m.porPeso ?? 0) * pesos + (m.porMolhada ?? 0) * c.somaMolhadas
  if (m.escalaArea) h *= c.fatorArea
  return meiaHora(h)
}

const tituloDe = (m: ModeloTarefa, c: Contexto) => (typeof m.titulo === 'function' ? m.titulo(c) : m.titulo)

export const VISITAS_DE_OBRA = 4

export function gerarTarefas(c: Contexto): TarefaGerada[] {
  const saida: TarefaGerada[] = []
  let ordem = 0
  const base = (m: ModeloTarefa) => ({
    fase: m.fase,
    etapa: m.etapa ?? null,
    modo: m.modo,
    tipo: m.tipo,
    essencial: !!m.essencial,
    depende_de: m.depende ?? [],
  })

  for (const m of MODELOS) {
    if (m.quando && !m.quando(c)) continue

    if (m.repetir === 'setor') {
      const setores = SETORES[c.res ? 'res' : 'com']
      const presentes = setores.filter((s) => c.unidades.some((u) => u.setor === s.chave))
      if (presentes.length === 0) {
        saida.push({ ...base(m), chave: m.chave, titulo: tituloDe(m, c), horas_estimadas: horasDe(m, c), ordem: ordem++ })
        continue
      }
      for (const s of presentes) {
        const pesos = c.unidades.filter((u) => u.setor === s.chave).reduce((t, u) => t + u.peso, 0)
        saida.push({
          ...base(m),
          chave: `${m.chave}:${s.chave}`,
          titulo: `${tituloDe(m, c)} · setor ${s.nome.toLowerCase()}`,
          horas_estimadas: horasDe(m, c, pesos),
          ordem: ordem++,
        })
      }
      continue
    }

    if (m.repetir === 'marcenaria') {
      for (const u of c.unidades.filter((x) => x.marcenaria)) {
        saida.push({
          ...base(m),
          chave: `${m.chave}:${u.chave}`,
          titulo: `${tituloDe(m, c)} · ${u.nome}`,
          horas_estimadas: meiaHora(m.horas * u.peso),
          ordem: ordem++,
        })
      }
      continue
    }

    if (m.repetir === 'visitas') {
      for (let i = 1; i <= VISITAS_DE_OBRA; i++) {
        saida.push({
          ...base(m),
          chave: `${m.chave}:${i}`,
          titulo: `${tituloDe(m, c)} ${i} de ${VISITAS_DE_OBRA}`,
          horas_estimadas: meiaHora(m.horas),
          ordem: ordem++,
        })
      }
      continue
    }

    saida.push({ ...base(m), chave: m.chave, titulo: tituloDe(m, c), horas_estimadas: horasDe(m, c), ordem: ordem++ })
  }
  return saida
}

export interface ResumoFase {
  fase: Fase
  tarefas: number
  horas: number
}

export function resumirPorFase(tarefas: { fase: Fase; horas_estimadas: number }[]): ResumoFase[] {
  const fases: Fase[] = ['planejamento', 'estudo', 'anteprojeto', 'executivo', 'entrega']
  return fases.map((f) => {
    const t = tarefas.filter((x) => x.fase === f)
    return { fase: f, tarefas: t.length, horas: t.reduce((s, x) => s + Number(x.horas_estimadas), 0) }
  })
}

export function valorSugerido(horas: number, custoHora: number, margem: number): number {
  const bruto = horas * custoHora * (1 + margem / 100)
  return Math.round(bruto / 50) * 50
}

// ------------------------------------------------------------------
// Distribuição no calendário
// ------------------------------------------------------------------

export interface Distribuicao {
  datas: Record<string, string> // id da tarefa → data prevista
  entregaSugerida: string
  horasPorDia: number
  diasUteis: number
}

export const HORAS_DIA_PADRAO_PROJETO = 3

// Distribui as tarefas pendentes, na ordem do fluxo, entre o início e a entrega.
// Sem data de entrega, usa um ritmo de horas por dia para este projeto.
export function distribuirDatas(
  tarefas: { id: string; ordem: number; horas_estimadas: number }[],
  inicio: string,
  entrega: string | null,
  ritmo = HORAS_DIA_PADRAO_PROJETO,
): Distribuicao {
  const lista = [...tarefas].sort((a, b) => a.ordem - b.ordem)
  const total = lista.reduce((s, t) => s + Number(t.horas_estimadas), 0)
  const comeco = proximoDiaUtil(inicio)
  let dias: number
  let porDia: number
  if (entrega && entrega >= comeco) {
    dias = Math.max(1, diasUteisEntre(comeco, entrega))
    porDia = total / dias
  } else {
    porDia = ritmo
    dias = Math.max(1, Math.ceil(total / ritmo))
  }
  const datas: Record<string, string> = {}
  let acumulado = 0
  for (const t of lista) {
    // A tarefa fica no dia em que começa a ser feita
    const indice = Math.min(dias - 1, Math.floor((acumulado + 0.0001) / Math.max(porDia, 0.25)))
    datas[t.id] = somarDiasUteis(comeco, indice)
    acumulado += Number(t.horas_estimadas)
  }
  return {
    datas,
    entregaSugerida: entrega && entrega >= comeco ? entrega : somarDiasUteis(comeco, dias - 1),
    horasPorDia: Math.round(porDia * 10) / 10,
    diasUteis: dias,
  }
}
