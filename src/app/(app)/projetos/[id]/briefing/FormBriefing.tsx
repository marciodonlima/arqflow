'use client'

import { useState, useTransition } from 'react'
import { salvarBriefing } from '@/acoes/projetos'

export function FormBriefing({
  projetoId,
  perguntas,
  respostas,
  concluido,
}: {
  projetoId: string
  perguntas: { chave: string; pergunta: string; dica?: string }[]
  respostas: Record<string, string>
  concluido: boolean
}) {
  const [pendente, iniciar] = useTransition()
  const [aviso, setAviso] = useState('')
  const respondidas = perguntas.filter((p) => (respostas[p.chave] ?? '').trim()).length

  return (
    <form
      className="pilha-g"
      onChange={() => setAviso('')}
      action={(fd) =>
        iniciar(async () => {
          await salvarBriefing(projetoId, fd)
          setAviso(fd.get('concluir') === '1' ? 'Briefing salvo e concluído.' : 'Briefing salvo.')
        })
      }
    >
      <p className="meta">{respondidas} de {perguntas.length} perguntas respondidas{concluido ? ' · etapa concluída' : ''}</p>
      {perguntas.map((p, i) => (
        <label key={p.chave} className="campo">
          <span style={{ color: 'var(--af-ink)', fontSize: 15 }}>
            {i + 1}. {p.pergunta}
          </span>
          {p.dica && <small>{p.dica}</small>}
          <textarea name={`q_${p.chave}`} defaultValue={respostas[p.chave] ?? ''} rows={3} />
        </label>
      ))}
      <div className="botoes barra-acoes">
        <button className="btn" name="concluir" value="0" disabled={pendente}>Salvar</button>
        {!concluido && (
          <button className="btn btn-sec" name="concluir" value="1" disabled={pendente}>Salvar e concluir o briefing</button>
        )}
        {aviso && <span className="meta" role="status">{aviso}</span>}
      </div>
    </form>
  )
}
