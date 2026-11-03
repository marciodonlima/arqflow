'use client'

import { MODOS_TAREFA } from '@/lib/biblioteca'
import { estiloCor } from '@/lib/cores'
import { horas } from '@/lib/formato'
import type { Tarefa } from '@/lib/tipos'
import { Check, useConcluir } from './Check'
import { BotaoCronometro } from './Cronometro'
import { Icone, type NomeIcone } from './Icone'

export function LinhaTarefa({
  tarefa,
  meta,
  cor,
  aoAbrir,
  destaque,
  comCronometro = true,
}: {
  tarefa: Tarefa
  meta: string
  cor?: string | null
  aoAbrir: () => void
  destaque?: string
  comCronometro?: boolean
}) {
  const { feita, alternar } = useConcluir(tarefa.id, tarefa.status === 'feita')
  const modo = MODOS_TAREFA[tarefa.modo]
  const rodando = !!tarefa.timer_inicio
  return (
    <div className={`tarefa cor-projeto${feita ? ' feita' : ''}${rodando ? ' rodando' : ''}`} style={estiloCor(cor)}>
      <Check feita={feita} aoAlternar={alternar} titulo={tarefa.titulo} />
      <button type="button" className="tarefa-abrir" onClick={aoAbrir}>
        <span className="tarefa-principal">
          <span className="tarefa-titulo">{tarefa.titulo}</span>
          <span className="tarefa-meta">
            <i className="marcador-cor" aria-hidden="true" />
            <span>{meta}</span>
            <span className="tarefa-modo">
              <Icone nome={modo.icone as NomeIcone} />
              {modo.nome}
            </span>
            {destaque && <span className="tarefa-destaque">{destaque}</span>}
          </span>
        </span>
        <span className="tarefa-est">
          {tarefa.horas_reais ? <span className="meta">{horas(tarefa.horas_reais)} de </span> : null}
          {horas(tarefa.horas_estimadas)}
        </span>
      </button>
      {comCronometro && !feita && <BotaoCronometro tarefaId={tarefa.id} rodando={rodando} />}
    </div>
  )
}
