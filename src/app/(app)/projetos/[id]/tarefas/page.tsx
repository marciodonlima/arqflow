import { notFound } from 'next/navigation'
import { ESSENCIAIS_PLANEJAMENTO } from '@/lib/biblioteca'
import { carregarProjeto, sessao } from '@/lib/dados'
import { TarefasView } from './TarefasView'

export default async function Tarefas({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ v?: string }> }) {
  const [{ id }, { v }] = await Promise.all([params, searchParams])
  const { supabase, perfil, hoje } = await sessao()
  const dados = await carregarProjeto(supabase, perfil, hoje, id)
  if (!dados) notFound()
  const { projeto, tarefas, saude } = dados
  const planejamentoAberto = ESSENCIAIS_PLANEJAMENTO.filter((c) => tarefas.some((t) => t.chave === c && t.status !== 'feita')).length
  return (
    <TarefasView
      visao={v === 'lista' || v === 'cronograma' ? v : 'quadro'}
      projeto={{ id: projeto.id, nome: projeto.nome, cor: projeto.cor, inicio: projeto.data_inicio, entrega: projeto.data_entrega }}
      tarefas={tarefas}
      hoje={hoje}
      planejamentoAberto={planejamentoAberto}
      ritmoPlano={saude.ritmoPlano ?? Math.max(1.5, perfil.horas_dia / 2)}
    />
  )
}
