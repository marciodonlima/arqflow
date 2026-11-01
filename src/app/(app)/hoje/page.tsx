import type { Metadata } from 'next'
import { diaDe, projetosDe, sessao, tarefasDe, capturasAbertas, normalizarTarefa } from '@/lib/dados'
import { hojeEm, horaEm } from '@/lib/datas'
import { montarDia } from '@/lib/prioridade'
import type { Tarefa } from '@/lib/tipos'
import { HojeView } from './HojeView'

export const metadata: Metadata = { title: 'Hoje' }

export default async function Hoje() {
  const { supabase, perfil } = await sessao()
  const hoje = hojeEm(perfil.fuso)
  const hora = horaEm(perfil.fuso)
  const [projetos, dia, capturas, anterior] = await Promise.all([
    projetosDe(supabase, ['andamento', 'proposta']),
    diaDe(supabase, hoje),
    capturasAbertas(supabase),
    supabase.from('dias').select('data, amanha_tarefa').lt('data', hoje).not('amanha_tarefa', 'is', null).order('data', { ascending: false }).limit(1).maybeSingle(),
  ])
  const tarefas = await tarefasDe(supabase, projetos.map((p) => p.id))
  const { lista, extras } = montarDia(tarefas, projetos, hoje, dia?.modo ?? null, perfil.horas_dia)

  // Tarefa escolhida no check-out do último dia vai para o topo
  const escolhida = anterior.data?.amanha_tarefa as string | undefined
  if (escolhida) {
    const i = lista.findIndex((x) => x.tarefa.id === escolhida)
    const j = extras.findIndex((x) => x.tarefa.id === escolhida)
    const item = i >= 0 ? lista.splice(i, 1)[0] : j >= 0 ? extras.splice(j, 1)[0] : null
    if (item) lista.unshift({ ...item, motivo: 'Você escolheu começar por aqui no último check-out.' })
    else {
      const t = tarefas.find((x) => x.id === escolhida && x.status !== 'feita')
      const p = t && projetos.find((x) => x.id === t.projeto_id)
      if (t && p) lista.unshift({ tarefa: t, projeto: p, pontos: 1, motivo: 'Você escolheu começar por aqui no último check-out.' })
    }
  }

  const concluidasHoje: Tarefa[] = tarefas
    .filter((t) => t.status === 'feita' && t.concluida_em && hojeEm(perfil.fuso, new Date(t.concluida_em)) === hoje)
    .map(normalizarTarefa)

  const entregas = projetos
    .filter((p) => p.status === 'andamento' && p.data_entrega && p.data_entrega >= hoje)
    .sort((a, b) => (a.data_entrega! < b.data_entrega! ? -1 : 1))
    .slice(0, 4)
    .map((p) => ({ id: p.id, nome: p.nome, data: p.data_entrega! }))

  return (
    <HojeView
      nome={perfil.nome}
      hoje={hoje}
      hora={hora}
      modo={dia?.modo ?? null}
      fechouDia={!!dia?.checkout_em}
      horasDia={perfil.horas_dia}
      checkout={perfil.checkout_hora}
      lista={lista.map((x) => ({ tarefa: x.tarefa, projeto: x.projeto.nome, projetoId: x.projeto.id, motivo: x.motivo, proposta: x.projeto.status === 'proposta' }))}
      extras={extras.slice(0, 8).map((x) => ({ tarefa: x.tarefa, projeto: x.projeto.nome, projetoId: x.projeto.id, motivo: x.motivo, proposta: x.projeto.status === 'proposta' }))}
      concluidas={concluidasHoje.map((t) => ({ tarefa: t, projeto: projetos.find((p) => p.id === t.projeto_id)?.nome ?? '', projetoId: t.projeto_id, motivo: '', proposta: false }))}
      entregas={entregas}
      capturas={capturas.length}
      temProjetos={projetos.length > 0}
    />
  )
}
