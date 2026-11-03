'use client'

import { useEffect, useRef, useState, useTransition } from 'react'
import { excluirProjeto, mudarStatus, salvarDadosProjeto } from '@/acoes/projetos'
import { Icone } from '@/components/Icone'
import { CORES_PROJETO } from '@/lib/cores'
import type { StatusProjeto } from '@/lib/tipos'

export function AcoesProjeto({ id, status, cor }: { id: string; status: StatusProjeto; cor: string | null }) {
  const [pendente, iniciar] = useTransition()
  const [aberto, setAberto] = useState(false)
  const [confirmar, setConfirmar] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!aberto) return
    const fora = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setAberto(false)
    document.addEventListener('mousedown', fora)
    return () => document.removeEventListener('mousedown', fora)
  }, [aberto])

  const acao = (s: StatusProjeto) => iniciar(async () => { await mudarStatus(id, s); setAberto(false) })
  const trocarCor = (c: string) => {
    const fd = new FormData()
    fd.set('cor', c)
    iniciar(() => salvarDadosProjeto(id, fd))
  }

  return (
    <div className="menu" ref={ref}>
      <button type="button" className="btn btn-sec" aria-expanded={aberto} onClick={() => setAberto(!aberto)}>
        Opções
        <Icone nome="chevron" className="girar" />
      </button>
      {aberto && (
        <div className="menu-lista" role="menu">
          <div className="menu-cores">
            <span className="meta">Cor do projeto</span>
            <div className="cores">
              {CORES_PROJETO.map((c) => (
                <button
                  key={c.chave}
                  type="button"
                  className="cor-amostra"
                  style={{ '--pc': c.claro, '--pe': c.escuro } as React.CSSProperties}
                  aria-pressed={cor === c.chave}
                  aria-label={c.nome}
                  title={c.nome}
                  onClick={() => trocarCor(c.chave)}
                />
              ))}
            </div>
          </div>
          {status === 'andamento' && (
            <>
              <button type="button" role="menuitem" disabled={pendente} onClick={() => acao('pausado')}>Pausar projeto</button>
              <button type="button" role="menuitem" disabled={pendente} onClick={() => acao('concluido')}>Marcar como concluído</button>
            </>
          )}
          {status === 'pausado' && <button type="button" role="menuitem" disabled={pendente} onClick={() => acao('andamento')}>Retomar projeto</button>}
          {status === 'proposta' && <button type="button" role="menuitem" disabled={pendente} onClick={() => acao('arquivado')}>Proposta não aceita</button>}
          {(status === 'arquivado' || status === 'concluido') && (
            <button type="button" role="menuitem" disabled={pendente} onClick={() => acao(status === 'arquivado' ? 'proposta' : 'andamento')}>
              {status === 'arquivado' ? 'Reabrir proposta' : 'Reabrir projeto'}
            </button>
          )}
          <button type="button" role="menuitem" className="menu-perigo" disabled={pendente} onClick={() => (confirmar ? iniciar(() => excluirProjeto(id)) : setConfirmar(true))}>
            {confirmar ? 'Confirmar: excluir para sempre' : 'Excluir projeto'}
          </button>
        </div>
      )}
    </div>
  )
}
