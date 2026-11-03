'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState, useTransition } from 'react'
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  closestCorners,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { criarTarefa, moverTarefa } from '@/acoes/tarefas'
import { Check, useConcluir } from '@/components/Check'
import { BotaoCronometro } from '@/components/Cronometro'
import { Icone, type NomeIcone } from '@/components/Icone'
import { PainelTarefa } from '@/components/PainelTarefa'
import { FASES, MODOS_TAREFA, nomeFase } from '@/lib/biblioteca'
import { estiloCor } from '@/lib/cores'
import { dataCurta, diferencaDias, quando, somarDias } from '@/lib/datas'
import { horas, horasTotais } from '@/lib/formato'
import type { Fase, Tarefa } from '@/lib/tipos'

type Visao = 'quadro' | 'lista' | 'cronograma'
type Proj = { id: string; nome: string; cor: string | null; inicio: string | null; entrega: string | null }

export function TarefasView({
  visao,
  projeto,
  tarefas,
  hoje,
  planejamentoAberto,
  ritmoPlano,
}: {
  visao: Visao
  projeto: Proj
  tarefas: Tarefa[]
  hoje: string
  planejamentoAberto: number
  ritmoPlano: number
}) {
  const [abertaId, setAbertaId] = useState<string | null>(null)
  const [ocultarFeitas, setOcultar] = useState(false)
  const aberta = tarefas.find((t) => t.id === abertaId) ?? null
  const feitas = tarefas.filter((t) => t.status === 'feita').length
  const atrasadas = tarefas.filter((t) => t.status !== 'feita' && t.data_prevista && t.data_prevista < hoje).length
  const visiveis = ocultarFeitas ? tarefas.filter((t) => t.status !== 'feita') : tarefas
  const base = `/projetos/${projeto.id}/tarefas`

  return (
    <section className="pilha">
      <div className="barra-visao">
        <div className="segmentado" role="group" aria-label="Visualização">
          <Link href={base} aria-pressed={visao === 'quadro'} className="seg">
            <Icone nome="quadro" /> Quadro
          </Link>
          <Link href={`${base}?v=lista`} aria-pressed={visao === 'lista'} className="seg">
            <Icone nome="lista" /> Lista
          </Link>
          <Link href={`${base}?v=cronograma`} aria-pressed={visao === 'cronograma'} className="seg">
            <Icone nome="gantt" /> Cronograma
          </Link>
        </div>
        <div className="barra-visao-info">
          <span className="meta numero">
            {feitas} de {tarefas.length} concluídas
            {atrasadas > 0 && <span className="atraso-mini"> · {atrasadas} atrasadas</span>}
          </span>
          <label className="alternar">
            <input type="checkbox" checked={ocultarFeitas} onChange={(e) => setOcultar(e.target.checked)} />
            <span>Ocultar concluídas</span>
          </label>
        </div>
      </div>

      {visao === 'quadro' && <Quadro projeto={projeto} tarefas={visiveis} hoje={hoje} planejamentoAberto={planejamentoAberto} aoAbrir={setAbertaId} />}
      {visao === 'lista' && <Lista projeto={projeto} tarefas={visiveis} hoje={hoje} aoAbrir={setAbertaId} />}
      {visao === 'cronograma' && <Cronograma projeto={projeto} tarefas={visiveis} hoje={hoje} ritmoPlano={ritmoPlano} aoAbrir={setAbertaId} />}

      <PainelTarefa tarefa={aberta} projetoNome={projeto.nome} projetoId={projeto.id} aoFechar={() => setAbertaId(null)} />
    </section>
  )
}

// ---------------------------------------------------------------- Quadro

function Quadro({ projeto, tarefas, hoje, planejamentoAberto, aoAbrir }: { projeto: Proj; tarefas: Tarefa[]; hoje: string; planejamentoAberto: number; aoAbrir: (id: string) => void }) {
  const inicial = useMemo(() => {
    const c = {} as Record<Fase, string[]>
    for (const f of FASES) c[f.chave] = tarefas.filter((t) => t.fase === f.chave).sort((a, b) => a.ordem - b.ordem).map((t) => t.id)
    return c
  }, [tarefas])
  const [colunas, setColunas] = useState(inicial)
  const [arrastando, setArrastando] = useState<string | null>(null)
  const [, iniciar] = useTransition()
  const origem = useRef<Fase | null>(null)
  useEffect(() => setColunas(inicial), [inicial])

  const porId = useMemo(() => new Map(tarefas.map((t) => [t.id, t])), [tarefas])
  const faseAtiva = FASES.find((f) => tarefas.some((t) => t.fase === f.chave && t.status !== 'feita'))?.chave
  const sensores = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 220, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const colunaDe = (id: string): Fase | undefined => (FASES.some((f) => f.chave === id) ? (id as Fase) : FASES.find((f) => colunas[f.chave].includes(id))?.chave)

  function aoIniciar(e: DragStartEvent) {
    setArrastando(String(e.active.id))
    origem.current = colunaDe(String(e.active.id)) ?? null
  }
  function aoPassar(e: DragOverEvent) {
    const ativo = String(e.active.id)
    const sobre = e.over ? String(e.over.id) : null
    if (!sobre) return
    const de = colunaDe(ativo)
    const para = colunaDe(sobre)
    if (!de || !para || de === para) return
    setColunas((c) => {
      const destino = c[para].filter((x) => x !== ativo)
      const idx = destino.indexOf(sobre)
      destino.splice(idx >= 0 ? idx : destino.length, 0, ativo)
      return { ...c, [de]: c[de].filter((x) => x !== ativo), [para]: destino }
    })
  }
  function aoSoltar(e: DragEndEvent) {
    const ativo = String(e.active.id)
    const sobre = e.over ? String(e.over.id) : null
    setArrastando(null)
    if (!sobre) {
      setColunas(inicial)
      return
    }
    const para = colunaDe(sobre) ?? colunaDe(ativo)
    if (!para) return
    let lista = colunas[para]
    const i = lista.indexOf(ativo)
    const j = lista.indexOf(sobre)
    if (i >= 0 && j >= 0 && i !== j) lista = arrayMove(lista, i, j)
    setColunas((c) => ({ ...c, [para]: lista }))
    const mudou = para !== origem.current || lista.join() !== inicial[para].join()
    if (mudou) iniciar(() => moverTarefa(ativo, para, lista))
  }

  const tArrastada = arrastando ? porId.get(arrastando) : undefined

  return (
    <DndContext sensors={sensores} collisionDetection={closestCorners} onDragStart={aoIniciar} onDragOver={aoPassar} onDragEnd={aoSoltar} onDragCancel={() => { setArrastando(null); setColunas(inicial) }}>
      <div className="kanban">
        {FASES.map((f) => {
          const ids = colunas[f.chave]
          const lista = ids.map((id) => porId.get(id)).filter((t): t is Tarefa => !!t)
          const feitas = lista.filter((t) => t.status === 'feita').length
          const h = lista.filter((t) => t.status !== 'feita').reduce((s, t) => s + t.horas_estimadas, 0)
          return (
            <Coluna key={f.chave} id={f.chave} titulo={f.nome} ativa={faseAtiva === f.chave} contagem={`${feitas}/${lista.length}${h > 0 ? ` · ${horasTotais(h)}` : ''}`}>
              {f.chave === 'estudo' && planejamentoAberto > 0 && (
                <p className="coluna-aviso">
                  O planejamento ainda tem {planejamentoAberto} {planejamentoAberto === 1 ? 'etapa aberta' : 'etapas abertas'}. Avançar sem elas costuma custar revisões aqui.
                </p>
              )}
              <SortableContext items={ids} strategy={verticalListSortingStrategy}>
                {lista.map((t) => (
                  <CartaoOrdenavel key={t.id} tarefa={t} hoje={hoje} aoAbrir={() => aoAbrir(t.id)} />
                ))}
              </SortableContext>
              <NovaTarefa projetoId={projeto.id} fase={f.chave} />
            </Coluna>
          )
        })}
      </div>
      <DragOverlay>{tArrastada ? <Cartao tarefa={tArrastada} hoje={hoje} flutuando /> : null}</DragOverlay>
    </DndContext>
  )
}

function Coluna({ id, titulo, ativa, contagem, children }: { id: string; titulo: string; ativa: boolean; contagem: string; children: React.ReactNode }) {
  const { setNodeRef, isOver } = useDroppable({ id })
  return (
    <div ref={setNodeRef} className={`coluna${isOver ? ' sobre' : ''}`}>
      <div className={`coluna-topo${ativa ? ' ativa' : ''}`}>
        <h3>{titulo}</h3>
        <span>{contagem}</span>
      </div>
      {children}
    </div>
  )
}

function CartaoOrdenavel({ tarefa, hoje, aoAbrir }: { tarefa: Tarefa; hoje: string; aoAbrir: () => void }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: tarefa.id })
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.35 : 1 }} {...attributes} {...listeners}>
      <Cartao tarefa={tarefa} hoje={hoje} aoAbrir={aoAbrir} />
    </div>
  )
}

function Cartao({ tarefa, hoje, aoAbrir, flutuando }: { tarefa: Tarefa; hoje: string; aoAbrir?: () => void; flutuando?: boolean }) {
  const { feita, alternar } = useConcluir(tarefa.id, tarefa.status === 'feita')
  const modo = MODOS_TAREFA[tarefa.modo]
  const atrasada = !feita && !!tarefa.data_prevista && tarefa.data_prevista < hoje
  const rodando = !!tarefa.timer_inicio
  const check = tarefa.checklist ?? []
  const estourou = tarefa.horas_reais != null && tarefa.horas_reais > tarefa.horas_estimadas
  return (
    <div className={`cartao-tarefa${feita ? ' feita' : ''}${tarefa.status === 'fazendo' && !feita ? ' fazendo' : ''}${atrasada ? ' atrasada' : ''}${flutuando ? ' flutuando' : ''}`}>
      <div onPointerDown={(e) => e.stopPropagation()}>
        <Check feita={feita} aoAlternar={alternar} titulo={tarefa.titulo} />
      </div>
      <button type="button" className="tarefa-principal" onClick={aoAbrir}>
        <span className="tarefa-titulo">{tarefa.titulo}</span>
        <span className="tarefa-meta">
          <Icone nome={modo.icone as NomeIcone} />
          <span className={estourou ? 'estouro' : undefined}>
            {tarefa.horas_reais ? `${horas(tarefa.horas_reais)}/` : ''}
            {horas(tarefa.horas_estimadas)}
          </span>
          {tarefa.data_prevista && <span className={atrasada ? 'atraso-mini' : undefined}>· {atrasada ? `desde ${dataCurta(tarefa.data_prevista)}` : quando(tarefa.data_prevista, hoje)}</span>}
          {check.length > 0 && <span>· ☐ {check.filter((c) => c.feito).length}/{check.length}</span>}
          {tarefa.link && <Icone nome="link" />}
        </span>
      </button>
      {!feita && !flutuando && (
        <div onPointerDown={(e) => e.stopPropagation()}>
          <BotaoCronometro tarefaId={tarefa.id} rodando={rodando} />
        </div>
      )}
    </div>
  )
}

function NovaTarefa({ projetoId, fase }: { projetoId: string; fase: Fase }) {
  const form = useRef<HTMLFormElement>(null)
  const [pendente, iniciar] = useTransition()
  return (
    <form
      ref={form}
      className="nova-tarefa"
      action={(fd) =>
        iniciar(async () => {
          await criarTarefa(projetoId, fase, fd)
          form.current?.reset()
        })
      }
    >
      <input name="titulo" placeholder="+ Adicionar tarefa" aria-label={`Nova tarefa em ${nomeFase(fase)}`} disabled={pendente} />
    </form>
  )
}

// ---------------------------------------------------------------- Lista

function Lista({ projeto, tarefas, hoje, aoAbrir }: { projeto: Proj; tarefas: Tarefa[]; hoje: string; aoAbrir: (id: string) => void }) {
  return (
    <div className="lista-fases cor-projeto" style={estiloCor(projeto.cor)}>
      {FASES.map((f) => {
        const lista = tarefas.filter((t) => t.fase === f.chave).sort((a, b) => a.ordem - b.ordem)
        if (lista.length === 0) return null
        return (
          <section key={f.chave} className="pilha" style={{ gap: 4 }}>
            <div className="secao-topo">
              <h3 className="rotulo">{f.nome}</h3>
              <span className="meta numero">{horasTotais(lista.reduce((s, t) => s + t.horas_estimadas, 0))}</span>
            </div>
            <div className="tabela-rolagem">
              <table className="tabela tabela-tarefas">
                <thead>
                  <tr>
                    <th style={{ width: 44 }}><span className="sr">Concluir</span></th>
                    <th>Tarefa</th>
                    <th>Esforço</th>
                    <th className="num">Data</th>
                    <th className="num">Estimado</th>
                    <th className="num">Real</th>
                    <th style={{ width: 48 }}><span className="sr">Cronômetro</span></th>
                  </tr>
                </thead>
                <tbody>
                  {lista.map((t) => (
                    <LinhaLista key={t.id} tarefa={t} hoje={hoje} aoAbrir={() => aoAbrir(t.id)} />
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        )
      })}
    </div>
  )
}

function LinhaLista({ tarefa, hoje, aoAbrir }: { tarefa: Tarefa; hoje: string; aoAbrir: () => void }) {
  const { feita, alternar } = useConcluir(tarefa.id, tarefa.status === 'feita')
  const atrasada = !feita && !!tarefa.data_prevista && tarefa.data_prevista < hoje
  const estourou = tarefa.horas_reais != null && tarefa.horas_reais > tarefa.horas_estimadas
  return (
    <tr className={feita ? 'feita' : undefined}>
      <td><Check feita={feita} aoAlternar={alternar} titulo={tarefa.titulo} /></td>
      <td>
        <button type="button" className="link-tarefa" onClick={aoAbrir}>{tarefa.titulo}</button>
      </td>
      <td className="meta">{MODOS_TAREFA[tarefa.modo].nome}</td>
      <td className={`num numero${atrasada ? ' atraso-mini' : ''}`}>{tarefa.data_prevista ? dataCurta(tarefa.data_prevista) : '—'}</td>
      <td className="num numero">{horas(tarefa.horas_estimadas)}</td>
      <td className={`num numero${estourou ? ' estouro' : ''}`}>{tarefa.horas_reais ? horas(tarefa.horas_reais) : '—'}</td>
      <td>{!feita && <BotaoCronometro tarefaId={tarefa.id} rodando={!!tarefa.timer_inicio} />}</td>
    </tr>
  )
}

// ---------------------------------------------------------------- Cronograma

const DIA_PX = 16

function Cronograma({ projeto, tarefas, hoje, ritmoPlano, aoAbrir }: { projeto: Proj; tarefas: Tarefa[]; hoje: string; ritmoPlano: number; aoAbrir: (id: string) => void }) {
  const comData = tarefas.filter((t) => t.data_prevista)
  if (comData.length === 0)
    return <p className="aviso">As tarefas ganham datas quando o contrato é assinado. Depois disso, o cronograma aparece aqui.</p>
  const datas = comData.map((t) => t.data_prevista as string).sort()
  const inicio = [projeto.inicio, datas[0], hoje].filter(Boolean).sort()[0] as string
  const fimBase = [projeto.entrega, datas[datas.length - 1], hoje].filter(Boolean).sort().reverse()[0] as string
  const fim = somarDias(fimBase, 5)
  const totalDias = diferencaDias(fim, inicio) + 1
  const semanas: { dia: string; x: number }[] = []
  for (let i = 0; i < totalDias; i += 7) semanas.push({ dia: somarDias(inicio, i), x: i * DIA_PX })
  const xDe = (d: string) => diferencaDias(d, inicio) * DIA_PX
  // A barra ocupa os dias úteis que a tarefa pede no ritmo do plano (convertidos em dias corridos)
  const largura = (t: Tarefa) => Math.max(1, Math.ceil(t.horas_estimadas / Math.max(0.5, ritmoPlano)) * 1.4) * DIA_PX

  return (
    <div className="cronograma cor-projeto" style={estiloCor(projeto.cor)}>
      <div className="cronograma-rolagem">
        <div className="cronograma-grade" style={{ width: totalDias * DIA_PX + 260 }}>
          <div className="crono-cabeca">
            <div className="crono-nome" />
            <div className="crono-tempo" style={{ width: totalDias * DIA_PX }}>
              {semanas.map((s) => (
                <span key={s.dia} style={{ left: s.x }}>{dataCurta(s.dia)}</span>
              ))}
            </div>
          </div>
          {FASES.map((f) => {
            const lista = comData.filter((t) => t.fase === f.chave).sort((a, b) => a.ordem - b.ordem)
            if (lista.length === 0) return null
            return (
              <div key={f.chave}>
                <div className="crono-fase">{f.nome}</div>
                {lista.map((t) => {
                  const atrasada = t.status !== 'feita' && t.data_prevista! < hoje
                  return (
                    <div key={t.id} className="crono-linha">
                      <button type="button" className="crono-nome link-tarefa" onClick={() => aoAbrir(t.id)} title={t.titulo}>
                        {t.titulo}
                      </button>
                      <div className="crono-tempo" style={{ width: totalDias * DIA_PX }}>
                        <span
                          className={`crono-barra${t.status === 'feita' ? ' feita' : ''}${atrasada ? ' atrasada' : ''}${t.timer_inicio ? ' rodando' : ''}`}
                          style={{ left: xDe(t.data_prevista!), width: largura(t) }}
                          title={`${t.titulo} · ${dataCurta(t.data_prevista)} · ${horas(t.horas_estimadas)}`}
                        />
                      </div>
                    </div>
                  )
                })}
              </div>
            )
          })}
          <div className="crono-marca hoje" style={{ left: 260 + xDe(hoje) }} title="Hoje"><span>hoje</span></div>
          {projeto.entrega && <div className="crono-marca entrega" style={{ left: 260 + xDe(projeto.entrega) }} title="Entrega"><span>entrega</span></div>}
        </div>
      </div>
    </div>
  )
}
