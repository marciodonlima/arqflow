'use client'

import { useState, useTransition } from 'react'
import { assinarContrato, mudarStatus, salvarDadosProjeto } from '@/acoes/projetos'
import { Icone } from '@/components/Icone'
import { PrazoCampos } from '@/components/PrazoCampos'
import { entregaPorPrazo } from '@/lib/datas'
import type { PrazoTipo } from '@/lib/tipos'

const LIMITE_SOLO = 5

export function FormProposta({
  projetoId,
  arquivada,
  valorProposta,
  prazoDias,
  prazoTipo,
  hoje,
  ativos,
}: {
  projetoId: string
  arquivada: boolean
  valorProposta: number | null
  prazoDias: number | null
  prazoTipo: PrazoTipo
  hoje: string
  ativos: number
}) {
  const [pendente, iniciar] = useTransition()
  const [salvo, setSalvo] = useState(false)
  const [inicio, setInicio] = useState(hoje)
  const [dias, setDias] = useState(prazoDias ? String(prazoDias) : '')
  const [tipo, setTipo] = useState<PrazoTipo>(prazoTipo)
  const n = Number(dias)
  const entrega = n > 0 ? entregaPorPrazo(inicio, Math.round(n), tipo) : null

  return (
    <>
      <form
        className="placa pilha"
        action={(fd) =>
          iniciar(async () => {
            await salvarDadosProjeto(projetoId, fd)
            setSalvo(true)
          })
        }
        onChange={() => setSalvo(false)}
      >
        <span className="rotulo rotulo-acento">{arquivada ? 'Proposta arquivada' : 'Proposta'}</span>
        <label className="campo">
          <span>Valor da proposta (R$)</span>
          <input name="valor_proposta" inputMode="decimal" defaultValue={valorProposta ?? ''} />
        </label>
        <PrazoCampos dias={dias} setDias={setDias} tipo={tipo} setTipo={setTipo} entrega={entrega} rotulo="Prazo de entrega proposto" />
        <div className="botoes">
          <button className="btn btn-sec" disabled={pendente}>Salvar proposta</button>
          {salvo && <span className="meta">Salvo.</span>}
        </div>
      </form>

      {!arquivada && (
        <form className="placa pilha" action={(fd) => iniciar(() => assinarContrato(projetoId, fd))}>
          <span className="rotulo rotulo-acento">Contrato assinado</span>
          <p className="apoio">As tarefas ganham datas até a entrega, o comercial fica concluído, as parcelas são criadas e o projeto passa a contar como ativo.</p>
          {ativos >= LIMITE_SOLO && <p className="aviso">Você já tem {ativos} projetos ativos. O plano Solo foi pensado para até {LIMITE_SOLO} ao mesmo tempo.</p>}
          <label className="campo">
            <span>Início</span>
            <input name="data_inicio" type="date" value={inicio} onChange={(e) => setInicio(e.target.value)} required />
          </label>
          <PrazoCampos dias={dias} setDias={setDias} tipo={tipo} setTipo={setTipo} entrega={entrega} rotulo="Prazo de entrega" />
          <label className="campo">
            <span>Valor do contrato (R$)</span>
            <input name="valor_contrato" inputMode="decimal" defaultValue={valorProposta ?? ''} />
          </label>
          <div className="botoes">
            <button className="btn" disabled={pendente}>
              {pendente ? 'Distribuindo as tarefas…' : 'Confirmar contrato'}
              <Icone nome="seta" />
            </button>
            <button type="button" className="btn-texto" style={{ color: 'var(--af-tert)' }} disabled={pendente} onClick={() => iniciar(() => mudarStatus(projetoId, 'arquivado'))}>
              Proposta não aceita
            </button>
          </div>
        </form>
      )}
    </>
  )
}
