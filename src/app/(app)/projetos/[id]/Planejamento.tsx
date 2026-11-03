'use client'

import { useState, useTransition } from 'react'
import { salvarDadosProjeto } from '@/acoes/projetos'
import { useConcluir } from '@/components/Check'
import { Icone } from '@/components/Icone'
import { PainelTarefa } from '@/components/PainelTarefa'
import { ETAPAS_PLANEJAMENTO, MODELO_POR_CHAVE } from '@/lib/biblioteca'
import type { Tarefa } from '@/lib/tipos'

export function Planejamento({ projetoId, essenciais, partido }: { projetoId: string; essenciais: Tarefa[]; partido: string }) {
  const [abertaId, setAbertaId] = useState<string | null>(null)
  const aberta = essenciais.find((t) => t.id === abertaId) ?? null
  const [pendente, iniciar] = useTransition()
  const [salvo, setSalvo] = useState(false)
  const feitas = essenciais.filter((t) => t.status === 'feita').length
  const completo = essenciais.length > 0 && feitas === essenciais.length

  return (
    <div className="placa pilha">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
        <span className="rotulo rotulo-acento">Planejamento</span>
        <span className="meta numero">{feitas} de {essenciais.length} etapas essenciais</span>
      </div>
      <div className="progresso" aria-hidden="true">
        <i style={{ width: `${essenciais.length ? (feitas / essenciais.length) * 100 : 0}%` }} />
      </div>
      {completo ? (
        <div className="aviso">
          <Icone nome="check" />
          <span><b>Fundação sólida.</b> O planejamento está completo: as próximas fases partem de um problema bem formulado.</span>
        </div>
      ) : (
        <p className="apoio">
          Do orçamento ao conceito, estas etapas parecem tempo parado, mas são o que encurta o resto do projeto. Toque em cada uma para ver por que importa e como fazer.
        </p>
      )}
      <div className="etapas">
        {ETAPAS_PLANEJAMENTO.map((e) => {
          const lista = essenciais.filter((t) => t.etapa === e.chave)
          if (lista.length === 0) return null
          return (
            <div key={e.chave} className="pilha" style={{ gap: 0 }}>
              <span className="meta" style={{ padding: '8px 0 2px' }}>{e.nome}</span>
              {lista.map((t) => (
                <Etapa key={t.id} tarefa={t} aoAbrir={() => setAbertaId(t.id)} />
              ))}
            </div>
          )
        })}
      </div>
      <form
        className="pilha"
        style={{ gap: 8 }}
        action={(fd) =>
          iniciar(async () => {
            await salvarDadosProjeto(projetoId, fd)
            setSalvo(true)
          })
        }
      >
        <label className="campo">
          <span>Partido do projeto</span>
          <textarea name="partido" defaultValue={partido} rows={2} placeholder="A ideia que guia as decisões, em uma ou duas frases." onChange={() => setSalvo(false)} />
        </label>
        <div className="botoes">
          <button className="btn btn-sec btn-pequeno" disabled={pendente}>Salvar partido</button>
          {salvo && <span className="meta">Salvo.</span>}
        </div>
      </form>
      <PainelTarefa tarefa={aberta} projetoId={projetoId} aoFechar={() => setAbertaId(null)} />
    </div>
  )
}

function Etapa({ tarefa, aoAbrir }: { tarefa: Tarefa; aoAbrir: () => void }) {
  const { feita, alternar } = useConcluir(tarefa.id, tarefa.status === 'feita')
  const resumo = MODELO_POR_CHAVE[tarefa.chave ?? '']?.porque
  return (
    <div className={`etapa${feita ? ' feita' : ''}`}>
      <button type="button" className="marcador" aria-pressed={feita} aria-label={`${feita ? 'Reabrir' : 'Concluir'}: ${tarefa.titulo}`} onClick={alternar}>
        {feita && <Icone nome="check" />}
      </button>
      <button type="button" className="etapa-texto" onClick={aoAbrir}>
        <strong>{tarefa.titulo}</strong>
        {!feita && resumo && <span className="meta">{resumo.split('. ')[0]}.</span>}
      </button>
    </div>
  )
}
