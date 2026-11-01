'use client'

import { MODOS_TAREFA } from '@/lib/biblioteca'
import { horas } from '@/lib/formato'
import type { Tarefa } from '@/lib/tipos'
import { Check, useConcluir } from './Check'
import { Icone, type NomeIcone } from './Icone'

export function LinhaTarefa({ tarefa, meta, aoAbrir }: { tarefa: Tarefa; meta: string; aoAbrir: () => void }) {
  const { feita, alternar } = useConcluir(tarefa.id, tarefa.status === 'feita')
  const modo = MODOS_TAREFA[tarefa.modo]
  return (
    <div className={`tarefa${feita ? ' feita' : ''}`}>
      <Check feita={feita} aoAlternar={alternar} titulo={tarefa.titulo} />
      <button type="button" className="tarefa-abrir" onClick={aoAbrir}>
        <span className="tarefa-principal">
          <span className="tarefa-titulo">{tarefa.titulo}</span>
          <span className="tarefa-meta">
            <Icone nome={modo.icone as NomeIcone} />
            <span>{meta}</span>
          </span>
        </span>
        <span className="tarefa-est">{horas(tarefa.horas_estimadas)}</span>
      </button>
    </div>
  )
}
