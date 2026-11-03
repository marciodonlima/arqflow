import type { Metadata } from 'next'
import { apontamentosDesde, capturasAbertas, carregarCarteira, diaDe, sessao } from '@/lib/dados'
import { diaUtilSeguinte, hojeEm } from '@/lib/datas'
import { montarDia } from '@/lib/prioridade'
import { Checkout, type ItemCheckout } from './Checkout'

export const metadata: Metadata = { title: 'Fechar o dia' }

export default async function PaginaCheckout() {
  const { supabase, perfil, hoje } = await sessao()
  const amanha = diaUtilSeguinte(hoje)
  const [{ projetos, tarefas, saudes }, dia, capturas, apontamentos] = await Promise.all([
    carregarCarteira(supabase, perfil, hoje),
    diaDe(supabase, hoje),
    capturasAbertas(supabase),
    apontamentosDesde(supabase, new Date(Date.now() - 36 * 3600000).toISOString()),
  ])
  const ativos = projetos.filter((p) => p.status === 'andamento' || p.status === 'proposta')
  const nome = (id: string) => projetos.find((p) => p.id === id)
  const horasHojePorTarefa = new Map<string, number>()
  for (const a of apontamentos) {
    if (hojeEm(perfil.fuso, new Date(a.inicio)) !== hoje) continue
    const h = a.horas ?? (a.fim ? 0 : (Date.now() - new Date(a.inicio).getTime()) / 3600000)
    horasHojePorTarefa.set(a.tarefa_id, (horasHojePorTarefa.get(a.tarefa_id) ?? 0) + h)
  }

  // O que fez parte do dia: o plano de hoje, o que começou, o que vencia hoje e o que foi concluído
  const { lista } = montarDia(tarefas, ativos, hoje, dia?.modo ?? null, perfil.horas_dia, saudes)
  const ids = new Set<string>(lista.map((x) => x.tarefa.id))
  for (const t of tarefas) {
    const concluidaHoje = t.status === 'feita' && t.concluida_em && hojeEm(perfil.fuso, new Date(t.concluida_em)) === hoje
    if (concluidaHoje || t.status === 'fazendo' || (t.status !== 'feita' && t.data_prevista && t.data_prevista <= hoje) || horasHojePorTarefa.has(t.id)) ids.add(t.id)
  }
  const itens: ItemCheckout[] = [...ids]
    .map((id) => tarefas.find((t) => t.id === id)!)
    .filter((t) => t && nome(t.projeto_id))
    .map((t) => ({
      id: t.id,
      titulo: t.titulo,
      projeto: nome(t.projeto_id)!.nome,
      cor: nome(t.projeto_id)!.cor,
      feita: t.status === 'feita',
      horasHoje: horasHojePorTarefa.get(t.id) ?? 0,
      horasReais: t.horas_reais,
      horasEstimadas: t.horas_estimadas,
      atrasada: !!t.data_prevista && t.data_prevista < hoje && t.status !== 'feita',
    }))
    .sort((a, b) => Number(b.feita) - Number(a.feita))

  const { lista: listaAmanha } = montarDia(tarefas, ativos, amanha, null, perfil.horas_dia, saudes)
  const opcoes = listaAmanha.slice(0, 8).map((x) => ({ id: x.tarefa.id, titulo: x.tarefa.titulo, projeto: x.projeto.nome, cor: x.projeto.cor }))

  return (
    <Checkout
      itens={itens}
      capturas={capturas.map((c) => ({ id: c.id, texto: c.texto, origem: c.origem, projetoId: c.projeto_id }))}
      projetos={ativos.map((p) => ({ id: p.id, nome: p.nome }))}
      opcoesAmanha={opcoes}
      fechado={!!dia?.checkout_em}
      abertoAnterior={dia?.aberto ?? ''}
      escolhida={dia?.amanha_tarefa ?? null}
    />
  )
}
