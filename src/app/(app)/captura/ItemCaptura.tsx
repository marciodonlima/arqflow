'use client'

import { useTransition } from 'react'
import { tratarCaptura } from '@/acoes/dia'

export function ItemCaptura({
  id,
  texto,
  meta,
  projetoId,
  projetos,
}: {
  id: string
  texto: string
  meta: string
  projetoId: string | null
  projetos: { id: string; nome: string }[]
}) {
  const [pendente, iniciar] = useTransition()
  return (
    <div className="captura-item" style={{ opacity: pendente ? 0.5 : 1 }}>
      <p style={{ whiteSpace: 'pre-wrap' }}>{texto}</p>
      <span className="meta">{meta}</span>
      <div className="captura-acoes">
        {projetos.length > 0 && (
          <form className="captura-acoes" action={(fd) => iniciar(() => tratarCaptura(id, 'tarefa', fd))}>
            <select name="projeto_id" defaultValue={projetoId ?? projetos[0].id} aria-label="Projeto">
              {projetos.map((p) => <option key={p.id} value={p.id}>{p.nome}</option>)}
            </select>
            <button className="btn btn-pequeno" disabled={pendente}>Virar tarefa de hoje</button>
          </form>
        )}
        <button type="button" className="btn btn-sec btn-pequeno" disabled={pendente} onClick={() => iniciar(() => tratarCaptura(id, 'resolvida'))}>Já resolvi</button>
        <button type="button" className="btn-texto" style={{ color: 'var(--af-tert)', fontSize: 13 }} disabled={pendente} onClick={() => iniciar(() => tratarCaptura(id, 'descartada'))}>Descartar</button>
      </div>
    </div>
  )
}
