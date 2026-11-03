'use client'

import { useState, useTransition } from 'react'
import { redistribuir } from '@/acoes/projetos'

export function Redistribuir({ projetoId, entrega }: { projetoId: string; entrega: string | null }) {
  const [aberto, setAberto] = useState(false)
  const [pendente, iniciar] = useTransition()
  if (!aberto)
    return (
      <button type="button" className="btn btn-sec btn-pequeno" onClick={() => setAberto(true)} title="Recalcula as datas das tarefas pendentes a partir de hoje">
        Redistribuir datas
      </button>
    )
  return (
    <form
      className="botoes"
      style={{ alignItems: 'flex-end' }}
      action={(fd) =>
        iniciar(async () => {
          await redistribuir(projetoId, fd)
          setAberto(false)
        })
      }
    >
      <label className="campo" style={{ minWidth: 170 }}>
        <span>Entrega (pode renegociar)</span>
        <input name="data_entrega" type="date" defaultValue={entrega ?? ''} />
      </label>
      <button className="btn btn-pequeno" disabled={pendente}>{pendente ? 'Recalculando…' : 'Recalcular'}</button>
      <button type="button" className="btn btn-sec btn-pequeno" onClick={() => setAberto(false)}>Cancelar</button>
    </form>
  )
}
