'use client'

import { useRef, useState, useTransition } from 'react'
import { criarTarefa } from '@/acoes/tarefas'
import { Check, useConcluir } from '@/components/Check'
import { Icone, type NomeIcone } from '@/components/Icone'
import { PainelTarefa } from '@/components/PainelTarefa'
import { FASES, MODOS_TAREFA } from '@/lib/biblioteca'
import { quando } from '@/lib/datas'
import { horas, horasTotais } from '@/lib/formato'
import type { Fase, Tarefa } from '@/lib/tipos'

export function Kanban({
  projetoId,
  projetoNome,
  tarefas,
  hoje,
  planejamentoAberto,
}: {
  projetoId: string
  projetoNome: string
  tarefas: Tarefa[]
  hoje: string
  planejamentoAberto: number
}) {
  const [aberta, setAberta] = useState<Tarefa | null>(null)
  const faseAtiva = FASES.find((f) => tarefas.some((t) => t.fase === f.chave && t.status !== 'feita'))?.chave

  return (
    <section className="pilha">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <h2 className="titulo-secao">Fluxo do projeto</h2>
        <span className="meta">{tarefas.filter((t) => t.status === 'feita').length} de {tarefas.length} tarefas</span>
      </div>
      <div className="kanban">
        {FASES.map((f) => {
          const lista = tarefas.filter((t) => t.fase === f.chave).sort((a, b) => a.ordem - b.ordem)
          const feitas = lista.filter((t) => t.status === 'feita').length
          const h = lista.filter((t) => t.status !== 'feita').reduce((s, t) => s + t.horas_estimadas, 0)
          return (
            <div key={f.chave} className="coluna">
              <div className={`coluna-topo${faseAtiva === f.chave ? ' ativa' : ''}`}>
                <h3>{f.nome}</h3>
                <span>{feitas}/{lista.length}{h > 0 ? ` · ${horasTotais(h)}` : ''}</span>
              </div>
              {f.chave === 'estudo' && planejamentoAberto > 0 && (
                <p className="coluna-aviso">
                  O planejamento ainda tem {planejamentoAberto} {planejamentoAberto === 1 ? 'etapa aberta' : 'etapas abertas'}. Avançar sem elas costuma custar revisões aqui.
                </p>
              )}
              {lista.map((t) => (
                <Cartao key={t.id} tarefa={t} hoje={hoje} aoAbrir={() => setAberta(t)} />
              ))}
              <NovaTarefa projetoId={projetoId} fase={f.chave} />
            </div>
          )
        })}
      </div>
      <PainelTarefa tarefa={aberta} projetoNome={projetoNome} projetoId={projetoId} aoFechar={() => setAberta(null)} />
    </section>
  )
}

function Cartao({ tarefa, hoje, aoAbrir }: { tarefa: Tarefa; hoje: string; aoAbrir: () => void }) {
  const { feita, alternar } = useConcluir(tarefa.id, tarefa.status === 'feita')
  const modo = MODOS_TAREFA[tarefa.modo]
  const atrasada = !feita && tarefa.data_prevista && tarefa.data_prevista < hoje
  return (
    <div className={`cartao-tarefa${feita ? ' feita' : ''}${tarefa.status === 'fazendo' && !feita ? ' fazendo' : ''}`}>
      <Check feita={feita} aoAlternar={alternar} titulo={tarefa.titulo} />
      <button type="button" className="tarefa-principal" onClick={aoAbrir} style={{ flex: 1 }}>
        <span className="tarefa-titulo">{tarefa.titulo}</span>
        <span className="tarefa-meta">
          <Icone nome={modo.icone as NomeIcone} />
          <span>{horas(tarefa.horas_estimadas)}</span>
          {tarefa.data_prevista && <span>· {atrasada ? `desde ${quando(tarefa.data_prevista, hoje).replace('prevista para ', '')}` : quando(tarefa.data_prevista, hoje)}</span>}
          {tarefa.link && <Icone nome="link" />}
        </span>
      </button>
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
      <input name="titulo" placeholder="+ Adicionar tarefa" aria-label="Nova tarefa" disabled={pendente} />
    </form>
  )
}
