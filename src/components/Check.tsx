'use client'

import { useEffect, useState, useTransition } from 'react'
import { alternarTarefa } from '@/acoes/tarefas'
import { Icone } from './Icone'

export function useConcluir(id: string, inicial: boolean) {
  const [feita, setFeita] = useState(inicial)
  const [, iniciar] = useTransition()
  useEffect(() => setFeita(inicial), [inicial])
  const alternar = () => {
    const nova = !feita
    setFeita(nova)
    iniciar(() => alternarTarefa(id, nova))
  }
  return { feita, alternar }
}

export function Check({ feita, aoAlternar, titulo }: { feita: boolean; aoAlternar: () => void; titulo: string }) {
  return (
    <button type="button" className="check" aria-pressed={feita} aria-label={`${feita ? 'Reabrir' : 'Concluir'}: ${titulo}`} onClick={aoAlternar}>
      <span className="check-caixa">
        <Icone nome="check" />
      </span>
    </button>
  )
}
