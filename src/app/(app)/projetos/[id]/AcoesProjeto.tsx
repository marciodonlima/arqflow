'use client'

import { useState, useTransition } from 'react'
import { excluirProjeto, mudarStatus } from '@/acoes/projetos'
import type { StatusProjeto } from '@/lib/tipos'

export function AcoesProjeto({ id, status }: { id: string; status: StatusProjeto }) {
  const [pendente, iniciar] = useTransition()
  const [confirmar, setConfirmar] = useState(false)
  const acao = (s: StatusProjeto) => iniciar(() => mudarStatus(id, s))
  return (
    <div className="botoes">
      {status === 'andamento' && (
        <>
          <button className="btn btn-sec btn-pequeno" disabled={pendente} onClick={() => acao('pausado')}>Pausar</button>
          <button className="btn btn-sec btn-pequeno" disabled={pendente} onClick={() => acao('concluido')}>Concluir projeto</button>
        </>
      )}
      {status === 'pausado' && <button className="btn btn-sec btn-pequeno" disabled={pendente} onClick={() => acao('andamento')}>Retomar</button>}
      {(status === 'arquivado' || status === 'concluido') && (
        <button className="btn btn-sec btn-pequeno" disabled={pendente} onClick={() => acao(status === 'arquivado' ? 'proposta' : 'andamento')}>
          {status === 'arquivado' ? 'Reabrir proposta' : 'Reabrir projeto'}
        </button>
      )}
      <button
        className="btn btn-perigo btn-pequeno"
        disabled={pendente}
        onClick={() => (confirmar ? iniciar(() => excluirProjeto(id)) : setConfirmar(true))}
        onBlur={() => setConfirmar(false)}
      >
        {confirmar ? 'Confirmar exclusão' : 'Excluir'}
      </button>
    </div>
  )
}
