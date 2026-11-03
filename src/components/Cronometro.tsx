'use client'

import Link from 'next/link'
import { useEffect, useState, useTransition } from 'react'
import { iniciarCronometro, pararCronometro } from '@/acoes/tarefas'
import { estiloCor } from '@/lib/cores'
import type { TimerAtivo } from '@/lib/tipos'
import { Icone } from './Icone'

export function decorrido(inicio: string, agora: number) {
  const s = Math.max(0, Math.floor((agora - new Date(inicio).getTime()) / 1000))
  const h = Math.floor(s / 3600)
  const m = Math.floor((s % 3600) / 60)
  const seg = s % 60
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${String(seg).padStart(2, '0')}` : `${m}:${String(seg).padStart(2, '0')}`
}

export function useAgora(ativo = true) {
  const [agora, setAgora] = useState(() => Date.now())
  useEffect(() => {
    if (!ativo) return
    const t = setInterval(() => setAgora(Date.now()), 1000)
    return () => clearInterval(t)
  }, [ativo])
  return agora
}

// Indicador fixo no topo enquanto o cronômetro roda
export function CronometroGlobal({ timer }: { timer: TimerAtivo | null }) {
  const agora = useAgora(!!timer)
  const [pendente, iniciar] = useTransition()
  if (!timer) return null
  return (
    <div className="cronometro cor-projeto" style={estiloCor(timer.cor)} role="status" aria-live="off">
      <span className="cronometro-ponto" aria-hidden="true" />
      <Link href={`/projetos/${timer.projetoId}/tarefas`} className="cronometro-texto" title={`${timer.titulo} · ${timer.projetoNome}`}>
        <span className="cronometro-tarefa">{timer.titulo}</span>
        <span className="cronometro-projeto">{timer.projetoNome}</span>
      </Link>
      <span className="cronometro-tempo numero">{decorrido(timer.inicio, agora)}</span>
      <button type="button" className="cronometro-botao" disabled={pendente} onClick={() => iniciar(() => pararCronometro(false))} aria-label="Pausar cronômetro" title="Pausar">
        <Icone nome="pausa" />
      </button>
      <button type="button" className="cronometro-botao" disabled={pendente} onClick={() => iniciar(() => pararCronometro(true))} aria-label="Concluir tarefa" title="Concluir tarefa">
        <Icone nome="check" />
      </button>
    </div>
  )
}

// Botão de começar/pausar numa tarefa específica
export function BotaoCronometro({
  tarefaId,
  rodando,
  inicio,
  rotulo = false,
  grande = false,
}: {
  tarefaId: string
  rodando: boolean
  inicio?: string | null
  rotulo?: boolean
  grande?: boolean
}) {
  const [pendente, iniciar] = useTransition()
  const agora = useAgora(rodando && !!inicio && grande)
  const acao = () => iniciar(() => (rodando ? pararCronometro(false) : iniciarCronometro(tarefaId)))
  if (grande)
    return (
      <button type="button" className={`btn btn-largo${rodando ? ' rodando' : ''}`} disabled={pendente} onClick={acao}>
        <Icone nome={rodando ? 'pausa' : 'play'} />
        {rodando ? `Pausar · ${inicio ? decorrido(inicio, agora) : ''}` : 'Começar e cronometrar'}
      </button>
    )
  return (
    <button
      type="button"
      className={`play${rodando ? ' rodando' : ''}`}
      disabled={pendente}
      onClick={acao}
      aria-label={rodando ? 'Pausar cronômetro' : 'Começar e cronometrar'}
      title={rodando ? 'Pausar' : 'Começar'}
    >
      <Icone nome={rodando ? 'pausa' : 'play'} />
      {rotulo && <span>{rodando ? 'Pausar' : 'Começar'}</span>}
    </button>
  )
}
