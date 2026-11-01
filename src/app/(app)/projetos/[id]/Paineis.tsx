'use client'

import { useState, useTransition } from 'react'
import { assinarContrato, mudarStatus, redistribuir, salvarDadosProjeto } from '@/acoes/projetos'
import { Icone } from '@/components/Icone'
import { dataCurta } from '@/lib/datas'
import { horasTotais, reais } from '@/lib/formato'
import type { Projeto } from '@/lib/tipos'

const LIMITE_SOLO = 5

export function PainelProposta({
  projeto,
  horas,
  sugerido,
  custoHora,
  margem,
  hoje,
  ativos,
}: {
  projeto: Projeto
  horas: number
  sugerido: number
  custoHora: number
  margem: number
  hoje: string
  ativos: number
}) {
  const [contrato, setContrato] = useState(false)
  const [pendente, iniciar] = useTransition()
  const arquivada = projeto.status === 'arquivado'

  return (
    <div className="placa pilha">
      <span className="rotulo rotulo-acento">{arquivada ? 'Proposta arquivada' : 'Proposta'}</span>
      <div className="numeros" style={{ gridTemplateColumns: 'repeat(3, minmax(0, 1fr))' }}>
        <div className="numero-bloco">
          <b>{horasTotais(horas)}</b>
          <span>estimadas</span>
        </div>
        <div className="numero-bloco">
          <b>{reais(sugerido)}</b>
          <span>sugerido · {reais(custoHora)}/h + {margem}%</span>
        </div>
        <div className="numero-bloco">
          <b>{reais(projeto.valor_proposta)}</b>
          <span>valor proposto</span>
        </div>
      </div>

      <form action={(fd) => iniciar(() => salvarDadosProjeto(projeto.id, fd))} style={{ display: 'flex', gap: 8, alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <label className="campo" style={{ flex: '1 1 200px' }}>
          <span>Valor da proposta (R$)</span>
          <input name="valor_proposta" inputMode="decimal" defaultValue={projeto.valor_proposta ?? ''} />
        </label>
        <button className="btn btn-sec" disabled={pendente}>Salvar valor</button>
      </form>

      {!arquivada && !contrato && (
        <>
          <p className="apoio">
            Quando o cliente assinar, marque o contrato: as tarefas ganham datas, o comercial fica concluído e o projeto passa a contar como ativo.
          </p>
          <div className="botoes">
            <button type="button" className="btn" onClick={() => setContrato(true)}>
              Contrato assinado
              <Icone nome="seta" />
            </button>
            <button type="button" className="btn btn-sec" disabled={pendente} onClick={() => iniciar(() => mudarStatus(projeto.id, 'arquivado'))}>
              Proposta não aceita
            </button>
          </div>
        </>
      )}

      {!arquivada && contrato && (
        <form className="pilha" action={(fd) => iniciar(() => assinarContrato(projeto.id, fd))}>
          {ativos >= LIMITE_SOLO && (
            <p className="aviso">Você já tem {ativos} projetos ativos. O plano Solo foi pensado para até {LIMITE_SOLO} ao mesmo tempo.</p>
          )}
          <div className="grade-3">
            <label className="campo">
              <span>Início</span>
              <input name="data_inicio" type="date" defaultValue={hoje} required />
            </label>
            <label className="campo">
              <span>Entrega combinada</span>
              <input name="data_entrega" type="date" defaultValue={projeto.data_entrega ?? ''} />
            </label>
            <label className="campo">
              <span>Valor do contrato (R$)</span>
              <input name="valor_contrato" inputMode="decimal" defaultValue={projeto.valor_proposta ?? ''} />
            </label>
          </div>
          <p className="meta">Sem data de entrega, o ARQFLOW sugere uma a partir das horas e da sua jornada.</p>
          <div className="botoes">
            <button className="btn" disabled={pendente}>{pendente ? 'Distribuindo as tarefas…' : 'Confirmar contrato'}</button>
            <button type="button" className="btn btn-sec" onClick={() => setContrato(false)}>Cancelar</button>
          </div>
        </form>
      )}
    </div>
  )
}

export function PainelFinanceiro({
  projeto,
  total,
  horasFeitas,
  restantes,
  diasRestantes,
  custoHora,
  horasDia,
  ritmo,
  atrasadas,
}: {
  projeto: Projeto
  total: number
  horasFeitas: number
  restantes: number
  diasRestantes: number
  custoHora: number
  horasDia: number
  ritmo: number | null
  atrasadas: number
}) {
  const [pendente, iniciar] = useTransition()
  const [redist, setRedist] = useState(false)
  const custo = total * custoHora
  const valor = projeto.valor_contrato ?? projeto.valor_proposta ?? 0
  const margem = valor - custo
  const pct = total ? Math.round((horasFeitas / total) * 100) : 0
  const porDia = diasRestantes > 0 ? restantes / diasRestantes : null
  const projecao = ritmo ? total * ritmo * custoHora : null

  return (
    <div className="placa pilha">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', gap: 12 }}>
        <span className="rotulo rotulo-acento">Andamento</span>
        {projeto.data_entrega && <span className="meta">entrega {dataCurta(projeto.data_entrega)}</span>}
      </div>
      <div className="numeros">
        <div className="numero-bloco">
          <b>{reais(valor)}</b>
          <span>contrato</span>
        </div>
        <div className="numero-bloco">
          <b>{reais(custo)}</b>
          <span>custo estimado</span>
        </div>
        <div className="numero-bloco">
          <b>{reais(margem)}</b>
          <span>margem{valor ? ` · ${Math.round((margem / valor) * 100)}%` : ''}</span>
        </div>
        <div className="numero-bloco">
          <b>{pct}%</b>
          <span>{horasTotais(horasFeitas)} de {horasTotais(total)}</span>
        </div>
      </div>
      <div className="progresso" aria-hidden="true">
        <i style={{ width: `${pct}%` }} />
      </div>

      {porDia != null && (
        <p className="apoio">
          Faltam {horasTotais(restantes)} em {diasRestantes} dias úteis: {horasTotais(Math.round(porDia * 10) / 10)} por dia neste projeto.
          {porDia > horasDia * 0.6 && ' É bastante para um projeto só. Vale renegociar o prazo agora, enquanto há margem para conversa.'}
        </p>
      )}
      {ritmo != null && Math.abs(ritmo - 1) >= 0.1 && (
        <div className="aviso">
          <Icone nome="relogio" />
          <span>
            As tarefas estão levando {Math.round(Math.abs(ritmo - 1) * 100)}% {ritmo > 1 ? 'a mais' : 'a menos'} que o estimado.
            {projecao != null && ` No ritmo atual, o custo final fica perto de ${reais(projecao)}.`}
          </span>
        </div>
      )}
      {atrasadas > 0 && (
        <p className="apoio">
          {atrasadas} {atrasadas === 1 ? 'tarefa passou' : 'tarefas passaram'} da data prevista. Redistribuir recalcula o cronograma a partir de hoje, sem culpa.
        </p>
      )}

      {!redist ? (
        <div className="botoes">
          <button type="button" className="btn btn-sec btn-pequeno" onClick={() => setRedist(true)}>Redistribuir datas</button>
        </div>
      ) : (
        <form className="botoes" style={{ alignItems: 'flex-end' }} action={(fd) => iniciar(async () => { await redistribuir(projeto.id, fd); setRedist(false) })}>
          <label className="campo" style={{ flex: '1 1 180px' }}>
            <span>Nova entrega (opcional)</span>
            <input name="data_entrega" type="date" defaultValue={projeto.data_entrega ?? ''} />
          </label>
          <button className="btn btn-pequeno" disabled={pendente}>Recalcular</button>
          <button type="button" className="btn btn-sec btn-pequeno" onClick={() => setRedist(false)}>Cancelar</button>
        </form>
      )}
    </div>
  )
}
