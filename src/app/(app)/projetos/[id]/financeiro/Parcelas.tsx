'use client'

import { useTransition } from 'react'
import { adicionarParcela, criarParcelasPadrao, excluirParcela, marcarParcela, salvarParcela } from '@/acoes/projetos'
import { Icone } from '@/components/Icone'
import { nomeFase } from '@/lib/biblioteca'
import { dataCurta } from '@/lib/datas'
import { reais } from '@/lib/formato'
import type { Parcela } from '@/lib/tipos'

const ROTULO = { prevista: 'Prevista', a_receber: 'A receber', recebida: 'Recebida' }

export function Parcelas({ projetoId, parcelas, temValor, contratado, hoje }: { projetoId: string; parcelas: Parcela[]; temValor: boolean; contratado: boolean; hoje: string }) {
  const [pendente, iniciar] = useTransition()
  return (
    <section className="pilha">
      <div className="secao-topo">
        <h2 className="titulo-secao">Parcelas</h2>
        <div className="botoes">
          {temValor && (
            <button type="button" className="btn btn-sec btn-pequeno" disabled={pendente} onClick={() => iniciar(() => criarParcelasPadrao(projetoId))}>
              {parcelas.length ? 'Refazer pelo padrão' : 'Gerar parcelas pelas fases'}
            </button>
          )}
          <button type="button" className="btn btn-sec btn-pequeno" disabled={pendente} onClick={() => iniciar(() => adicionarParcela(projetoId))}>
            <Icone nome="mais" /> Parcela
          </button>
        </div>
      </div>
      {!contratado && <p className="aviso">As parcelas nascem quando o contrato é assinado: 30% na assinatura e o restante pelas fases, na proporção das horas.</p>}
      {parcelas.length === 0 ? (
        <p className="apoio">Nenhuma parcela ainda.</p>
      ) : (
        <div className="tabela-rolagem">
          <table className="tabela">
            <thead>
              <tr>
                <th>Descrição</th>
                <th>Gatilho</th>
                <th className="num">Vencimento</th>
                <th className="num">Valor</th>
                <th>Situação</th>
                <th style={{ width: 40 }}><span className="sr">Excluir</span></th>
              </tr>
            </thead>
            <tbody>
              {parcelas.map((p) => (
                <tr key={p.id} className={p.status === 'recebida' ? 'feita' : undefined}>
                  <td>
                    <input defaultValue={p.descricao} aria-label="Descrição" onBlur={(e) => e.target.value !== p.descricao && iniciar(() => salvarParcela(p.id, campo('descricao', e.target.value)))} />
                  </td>
                  <td className="meta">{p.fase ? `Fim de ${nomeFase(p.fase).toLowerCase()}` : 'Assinatura'}</td>
                  <td className="num">
                    <input type="date" defaultValue={p.vencimento ?? ''} aria-label="Vencimento" onChange={(e) => iniciar(() => salvarParcela(p.id, campo('vencimento', e.target.value)))} />
                  </td>
                  <td className="num">
                    <input
                      inputMode="decimal"
                      style={{ textAlign: 'right' }}
                      defaultValue={String(p.valor).replace('.', ',')}
                      aria-label="Valor"
                      onBlur={(e) => iniciar(() => salvarParcela(p.id, campo('valor', e.target.value)))}
                    />
                  </td>
                  <td>
                    <button
                      type="button"
                      className={`selo selo-parcela-${p.status}`}
                      disabled={pendente || p.status === 'prevista'}
                      title={p.status === 'prevista' ? 'Libera quando a fase for concluída' : p.status === 'recebida' ? 'Desfazer recebimento' : 'Marcar como recebida'}
                      onClick={() => iniciar(() => marcarParcela(p.id, p.status !== 'recebida', hoje))}
                    >
                      {p.status === 'recebida' && <Icone nome="check" />}
                      {ROTULO[p.status]}
                      {p.status === 'recebida' && p.recebida_em ? ` ${dataCurta(p.recebida_em)}` : ''}
                    </button>
                  </td>
                  <td>
                    <button type="button" className="fechar" style={{ margin: 0 }} aria-label="Excluir parcela" onClick={() => iniciar(() => excluirParcela(p.id))}>
                      <Icone nome="fechar" />
                    </button>
                  </td>
                </tr>
              ))}
              <tr className="total">
                <td colSpan={3}>Total</td>
                <td className="num numero">{reais(parcelas.reduce((a, p) => a + p.valor, 0))}</td>
                <td colSpan={2} />
              </tr>
            </tbody>
          </table>
        </div>
      )}
      <p className="meta">Uma parcela prevista vira "a receber" sozinha quando a fase dela é concluída. Marque como recebida quando o dinheiro entrar.</p>
    </section>
  )
}

function campo(nome: string, valor: string) {
  const fd = new FormData()
  fd.set(nome, valor)
  return fd
}
