import type { Metadata } from 'next'
import { carregarCarteira, sessao } from '@/lib/dados'
import { gradeDoMes, inicioDoMes } from '@/lib/datas'
import { AgendaView } from './AgendaView'

export const metadata: Metadata = { title: 'Agenda' }

export default async function Agenda({ searchParams }: { searchParams: Promise<{ m?: string }> }) {
  const { m } = await searchParams
  const { supabase, perfil, hoje } = await sessao()
  const mes = m && /^\d{4}-\d{2}$/.test(m) ? `${m}-01` : inicioDoMes(hoje)
  const semanas = gradeDoMes(mes)
  const de = semanas[0][0]
  const ate = semanas[semanas.length - 1][6]
  const { projetos, tarefas, saudes } = await carregarCarteira(supabase, perfil, hoje)
  const ativos = projetos.filter((p) => p.status === 'andamento' || p.status === 'proposta')
  const doPeriodo = tarefas.filter((t) => t.data_prevista && t.data_prevista >= de && t.data_prevista <= ate && ativos.some((p) => p.id === t.projeto_id))
  return (
    <AgendaView
      mes={mes}
      hoje={hoje}
      semanas={semanas}
      tarefas={doPeriodo}
      projetos={ativos.map((p) => ({ id: p.id, nome: p.nome, cor: p.cor, entrega: p.data_entrega, status: saudes[p.id]?.status ?? 'em_dia' }))}
    />
  )
}
