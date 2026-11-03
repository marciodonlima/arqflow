// Saúde do projeto: prazo, horas e dinheiro, calculados a partir do cronograma que o próprio
// ARQFLOW montou e das horas reais cronometradas. É o que transforma tarefas em decisão.

import { FASES } from './biblioteca'
import { diasUteisAte, diasUteisEntre, proximoDiaUtil, somarDiasUteis } from './datas'
import type { Parcela, Perfil, Projeto, Tarefa } from './tipos'

export type StatusSaude = 'em_dia' | 'atencao' | 'atrasado' | 'proposta' | 'parado'

export interface Saude {
  projetoId: string
  status: StatusSaude
  // horas
  horasTotais: number
  horasFeitas: number // estimadas das tarefas concluídas
  horasRestantes: number
  horasReais: number // cronometradas ou informadas
  ritmo: number | null // real ÷ estimado nas tarefas concluídas com horas reais (1 = no estimado)
  horasProjetadas: number
  progresso: number // 0–1, pelas horas estimadas concluídas
  progressoEsperado: number | null // 0–1, pelo cronograma até hoje
  // prazo
  entrega: string | null
  diasUteisRestantes: number | null
  horasAtrasoPlano: number // horas que o cronograma já pedia e ainda não foram feitas
  diasAtraso: number // dias úteis de atraso projetado na entrega (0 = no prazo)
  conclusaoProjetada: string | null
  tarefasAtrasadas: number
  horasPorDiaNecessarias: number | null
  ritmoPlano: number | null // horas por dia que o cronograma original previa
  // dinheiro
  valor: number
  custoHora: number
  custoPrevisto: number
  custoProjetado: number
  margemPrevista: number
  margemProjetada: number
  impactoMargem: number // projetada − prevista
  valorHoraPrevisto: number | null
  valorHoraProjetado: number | null
  parcelasAtrasadas: number // valor de parcelas cuja fase está atrasada
  // leitura humana
  manchete: string
  motivos: string[]
}

const r1 = (n: number) => String(Math.round(n * 10) / 10).replace('.', ',')

export function calcularSaude(
  p: Projeto,
  tarefas: Tarefa[],
  perfil: Pick<Perfil, 'custo_hora' | 'horas_dia'>,
  hoje: string,
  parcelas: Parcela[] = [],
): Saude {
  const lista = tarefas.filter((t) => t.projeto_id === p.id)
  const feitas = lista.filter((t) => t.status === 'feita')
  const pendentes = lista.filter((t) => t.status !== 'feita')
  const horasTotais = lista.reduce((s, t) => s + t.horas_estimadas, 0)
  const horasFeitas = feitas.reduce((s, t) => s + t.horas_estimadas, 0)
  const horasRestantes = pendentes.reduce((s, t) => s + t.horas_estimadas, 0)

  // Ritmo real: só conta com pelo menos 3 tarefas concluídas que tenham horas reais
  const comReal = feitas.filter((t) => t.horas_reais != null && t.horas_reais > 0)
  const estComReal = comReal.reduce((s, t) => s + t.horas_estimadas, 0)
  const realComReal = comReal.reduce((s, t) => s + (t.horas_reais ?? 0), 0)
  const ritmo = comReal.length >= 3 && estComReal > 0 ? realComReal / estComReal : null
  const fator = ritmo ?? 1

  const horasReais = lista.reduce((s, t) => s + (t.horas_reais ?? 0), 0)
  // O que já foi feito sem cronômetro conta pelo estimado
  const gastoAteAqui =
    feitas.reduce((s, t) => s + (t.horas_reais && t.horas_reais > 0 ? t.horas_reais : t.horas_estimadas), 0) +
    pendentes.reduce((s, t) => s + (t.horas_reais ?? 0), 0)
  const restanteProjetado = pendentes.reduce((s, t) => s + Math.max(0, t.horas_estimadas * fator - (t.horas_reais ?? 0)), 0)
  const horasProjetadas = gastoAteAqui + restanteProjetado

  // Prazo pelo cronograma
  const entrega = p.data_entrega
  const inicio = p.data_inicio
  let ritmoPlano: number | null = null
  let progressoEsperado: number | null = null
  if (inicio && entrega && entrega >= inicio) {
    const diasPlano = Math.max(1, diasUteisEntre(proximoDiaUtil(inicio), entrega))
    ritmoPlano = horasTotais / diasPlano
  }
  const horasPrevistasAteHoje = lista.filter((t) => t.data_prevista && t.data_prevista < hoje).reduce((s, t) => s + t.horas_estimadas, 0)
  if (horasTotais > 0 && p.status === 'andamento') progressoEsperado = Math.min(1, horasPrevistasAteHoje / horasTotais)
  const horasAtrasoPlano = Math.max(0, horasPrevistasAteHoje - feitas.filter((t) => t.data_prevista && t.data_prevista < hoje).reduce((s, t) => s + t.horas_estimadas, 0))
  const tarefasAtrasadas = pendentes.filter((t) => t.data_prevista && t.data_prevista < hoje).length

  const diasUteisRestantes = entrega ? diasUteisAte(hoje, entrega) : null
  const horasPorDiaNecessarias = diasUteisRestantes != null && diasUteisRestantes > 0 ? restanteProjetado / diasUteisRestantes : null

  let diasAtraso = 0
  let conclusaoProjetada: string | null = null
  if (p.status === 'andamento' && entrega) {
    const ritmoDia = ritmoPlano && ritmoPlano > 0 ? ritmoPlano : Math.max(1.5, perfil.horas_dia / 2)
    const diasNecessarios = Math.ceil(restanteProjetado / ritmoDia)
    conclusaoProjetada = restanteProjetado > 0 ? somarDiasUteis(hoje, Math.max(0, diasNecessarios)) : hoje
    diasAtraso = Math.max(0, diasUteisAte(entrega, conclusaoProjetada))
    if (entrega < hoje && pendentes.length > 0) diasAtraso = Math.max(diasAtraso, diasUteisAte(entrega, hoje))
  }

  // Dinheiro
  const valor = p.valor_contrato ?? p.valor_proposta ?? 0
  const custoHora = perfil.custo_hora
  const custoPrevisto = horasTotais * custoHora
  const custoProjetado = horasProjetadas * custoHora
  const margemPrevista = valor - custoPrevisto
  const margemProjetada = valor - custoProjetado
  const impactoMargem = margemProjetada - margemPrevista
  const valorHoraPrevisto = horasTotais > 0 && valor > 0 ? valor / horasTotais : null
  const valorHoraProjetado = horasProjetadas > 0 && valor > 0 ? valor / horasProjetadas : null

  // Parcelas presas a fases com tarefas atrasadas
  const fasesAtrasadas = new Set(pendentes.filter((t) => t.data_prevista && t.data_prevista < hoje).map((t) => t.fase))
  const parcelasAtrasadas = parcelas
    .filter((x) => x.projeto_id === p.id && x.status !== 'recebida' && x.fase && fasesAtrasadas.has(x.fase))
    .reduce((s, x) => s + x.valor, 0)

  // Status
  let status: StatusSaude
  if (p.status === 'proposta') status = 'proposta'
  else if (p.status !== 'andamento') status = 'parado'
  else if (diasAtraso > 2 || tarefasAtrasadas >= 4 || (valor > 0 && margemProjetada < 0)) status = 'atrasado'
  else if (diasAtraso > 0 || tarefasAtrasadas > 0 || (valor > 0 && impactoMargem < -0.05 * valor) || (horasPorDiaNecessarias ?? 0) > perfil.horas_dia * 0.6)
    status = 'atencao'
  else status = 'em_dia'

  const motivos: string[] = []
  const brl = (n: number) => Math.round(Math.abs(n)).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 })
  if (p.status === 'andamento') {
    if (diasAtraso > 0) motivos.push(`No ritmo atual, a entrega escorrega ${diasAtraso} ${diasAtraso === 1 ? 'dia útil' : 'dias úteis'}.`)
    if (tarefasAtrasadas > 0) motivos.push(`${tarefasAtrasadas} ${tarefasAtrasadas === 1 ? 'tarefa passou' : 'tarefas passaram'} da data, somando ${r1(horasAtrasoPlano)}h atrás do cronograma.`)
    if (ritmo != null && ritmo > 1.08) motivos.push(`As tarefas estão levando ${Math.round((ritmo - 1) * 100)}% a mais que o estimado.`)
    if (ritmo != null && ritmo < 0.92) motivos.push(`As tarefas estão levando ${Math.round((1 - ritmo) * 100)}% a menos que o estimado.`)
    if (valor > 0 && impactoMargem < -1) motivos.push(`A margem cai de ${brl(margemPrevista)} para ${margemProjetada < 0 ? '−' : ''}${brl(margemProjetada)}.`)
    if (parcelasAtrasadas > 0) motivos.push(`${brl(parcelasAtrasadas)} em parcelas dependem de fases atrasadas.`)
    if (horasPorDiaNecessarias != null && horasPorDiaNecessarias > perfil.horas_dia * 0.6)
      motivos.push(`Para entregar no prazo, este projeto pede ${r1(horasPorDiaNecessarias)}h por dia.`)
    if (ritmo == null && feitas.length > 0) motivos.push('Cronometre as próximas tarefas para o ARQFLOW medir o seu ritmo real.')
  }

  let manchete: string
  if (status === 'proposta') manchete = 'Em proposta'
  else if (status === 'parado') manchete = p.status === 'concluido' ? 'Concluído' : p.status === 'pausado' ? 'Pausado' : 'Arquivado'
  else if (status === 'em_dia') manchete = 'No prazo'
  else if (diasAtraso > 0) manchete = `${diasAtraso} ${diasAtraso === 1 ? 'dia' : 'dias'} de atraso projetado`
  else if (tarefasAtrasadas > 0) manchete = `${tarefasAtrasadas} ${tarefasAtrasadas === 1 ? 'tarefa atrasada' : 'tarefas atrasadas'}`
  else if (valor > 0 && impactoMargem < 0) manchete = `Margem ${brl(impactoMargem)} abaixo do previsto`
  else manchete = 'Pede atenção'

  return {
    projetoId: p.id,
    status,
    horasTotais,
    horasFeitas,
    horasRestantes,
    horasReais,
    ritmo,
    horasProjetadas,
    progresso: horasTotais > 0 ? horasFeitas / horasTotais : 0,
    progressoEsperado,
    entrega,
    diasUteisRestantes,
    horasAtrasoPlano,
    diasAtraso,
    conclusaoProjetada,
    tarefasAtrasadas,
    horasPorDiaNecessarias,
    ritmoPlano,
    valor,
    custoHora,
    custoPrevisto,
    custoProjetado,
    margemPrevista,
    margemProjetada,
    impactoMargem,
    valorHoraPrevisto,
    valorHoraProjetado,
    parcelasAtrasadas,
    manchete,
    motivos,
  }
}

export const ROTULO_STATUS: Record<StatusSaude, string> = {
  em_dia: 'No prazo',
  atencao: 'Atenção',
  atrasado: 'Atrasado',
  proposta: 'Proposta',
  parado: 'Parado',
}

export function faseAtual(tarefas: Tarefa[]): (typeof FASES)[number]['chave'] | null {
  return FASES.find((f) => tarefas.some((t) => t.fase === f.chave && t.status !== 'feita'))?.chave ?? null
}
