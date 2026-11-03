import type { Metadata } from 'next'
import { apontamentosDesde, capturasAbertas, carregarCarteira, diaDe, sessao, timerAtivo } from '@/lib/dados'
import { hojeEm, horaEm } from '@/lib/datas'
import { montarDia } from '@/lib/prioridade'
import { HojeView, type ItemHoje } from './HojeView'

export const metadata: Metadata = { title: 'Hoje' }

export default async function Hoje() {
  const { supabase, perfil, hoje } = await sessao()
  const hora = horaEm(perfil.fuso)
  const [{ projetos, tarefas, saudes }, dia, capturas, anterior, apontamentos, timer] = await Promise.all([
    carregarCarteira(supabase, perfil, hoje),
    diaDe(supabase, hoje),
    capturasAbertas(supabase),
    supabase.from('dias').select('data, amanha_tarefa').lt('data', hoje).not('amanha_tarefa', 'is', null).order('data', { ascending: false }).limit(1).maybeSingle(),
    apontamentosDesde(supabase, new Date(Date.now() - 36 * 3600000).toISOString()),
    timerAtivo(supabase),
  ])
  const ativos = projetos.filter((p) => p.status === 'andamento' || p.status === 'proposta')
  const { lista, extras } = montarDia(tarefas, ativos, hoje, dia?.modo ?? null, perfil.horas_dia, saudes)

  const escolhida = anterior.data?.amanha_tarefa as string | undefined
  if (escolhida) {
    const i = lista.findIndex((x) => x.tarefa.id === escolhida)
    const j = extras.findIndex((x) => x.tarefa.id === escolhida)
    const item = i >= 0 ? lista.splice(i, 1)[0] : j >= 0 ? extras.splice(j, 1)[0] : null
    if (item) lista.unshift({ ...item, motivo: 'Você escolheu começar por aqui no último check-out.' })
    else {
      const t = tarefas.find((x) => x.id === escolhida && x.status !== 'feita')
      const p = t && ativos.find((x) => x.id === t.projeto_id)
      if (t && p) lista.unshift({ tarefa: t, projeto: p, pontos: 1, combina: false, motivo: 'Você escolheu começar por aqui no último check-out.' })
    }
  }
  // O que está rodando no cronômetro sempre abre o dia
  if (timer) {
    const i = lista.findIndex((x) => x.tarefa.id === timer.tarefaId)
    if (i > 0) lista.unshift(lista.splice(i, 1)[0])
  }

  const mapa = (x: { tarefa: (typeof tarefas)[number]; projeto: (typeof projetos)[number]; motivo: string; combina?: boolean }): ItemHoje => ({
    tarefa: x.tarefa,
    projeto: x.projeto.nome,
    projetoId: x.projeto.id,
    cor: x.projeto.cor,
    motivo: x.motivo,
    combina: !!x.combina,
    proposta: x.projeto.status === 'proposta',
  })

  const concluidas = tarefas
    .filter((t) => t.status === 'feita' && t.concluida_em && hojeEm(perfil.fuso, new Date(t.concluida_em)) === hoje)
    .map((t) => {
      const p = projetos.find((x) => x.id === t.projeto_id)!
      return mapa({ tarefa: t, projeto: p, motivo: '' })
    })

  const horasHoje = apontamentos
    .filter((a) => hojeEm(perfil.fuso, new Date(a.inicio)) === hoje)
    .reduce((s, a) => s + (a.horas ?? (a.fim ? 0 : (Date.now() - new Date(a.inicio).getTime()) / 3600000)), 0)

  const alertas = ativos
    .map((p) => ({ p, s: saudes[p.id] }))
    .filter((x) => x.s && (x.s.status === 'atrasado' || x.s.status === 'atencao'))
    .sort((a, b) => (a.s.status === b.s.status ? a.s.impactoMargem - b.s.impactoMargem : a.s.status === 'atrasado' ? -1 : 1))
    .map(({ p, s }) => ({
      id: p.id,
      nome: p.nome,
      cor: p.cor,
      status: s.status,
      manchete: s.manchete,
      motivos: s.motivos.slice(0, 2),
      impacto: s.impactoMargem,
      diasAtraso: s.diasAtraso,
    }))

  const entregas = projetos
    .filter((p) => p.status === 'andamento' && p.data_entrega)
    .sort((a, b) => (a.data_entrega! < b.data_entrega! ? -1 : 1))
    .slice(0, 5)
    .map((p) => ({ id: p.id, nome: p.nome, cor: p.cor, data: p.data_entrega!, status: saudes[p.id].status, diasAtraso: saudes[p.id].diasAtraso }))

  return (
    <HojeView
      nome={perfil.nome}
      hoje={hoje}
      hora={hora}
      modo={dia?.modo ?? null}
      fechouDia={!!dia?.checkout_em}
      horasDia={perfil.horas_dia}
      checkout={perfil.checkout_hora}
      lista={lista.map(mapa)}
      extras={extras.slice(0, 10).map(mapa)}
      concluidas={concluidas}
      alertas={alertas}
      entregas={entregas}
      capturas={capturas.length}
      temProjetos={projetos.length > 0}
      horasHoje={horasHoje}
    />
  )
}
