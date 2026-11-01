'use client'

import { useState, useTransition } from 'react'
import { salvarPrograma } from '@/acoes/projetos'
import type { LinhaPrograma } from '@/lib/tipos'

export function EditorPrograma({
  projetoId,
  linhasIniciais,
  setores,
  referencias,
  programaFeito,
  setorizacaoFeita,
}: {
  projetoId: string
  linhasIniciais: LinhaPrograma[]
  setores: { chave: string; nome: string }[]
  referencias: Record<string, [number, number]>
  programaFeito: boolean
  setorizacaoFeita: boolean
}) {
  const [linhas, setLinhas] = useState<LinhaPrograma[]>(linhasIniciais)
  const [pendente, iniciar] = useTransition()
  const [aviso, setAviso] = useState('')

  const mudar = (id: string, campo: keyof LinhaPrograma, valor: string) => {
    setAviso('')
    setLinhas((ls) =>
      ls.map((l) => (l.id === id ? { ...l, [campo]: campo === 'area' ? (valor.trim() === '' ? null : Number(valor.replace(',', '.'))) : valor } : l)),
    )
  }
  const adicionar = () => setLinhas((ls) => [...ls, { id: `novo-${Date.now()}`, ambiente: '', setor: setores[0].chave, area: null, requisitos: '' }])
  const remover = (id: string) => setLinhas((ls) => ls.filter((l) => l.id !== id))

  const total = linhas.reduce((s, l) => s + (Number(l.area) || 0), 0)
  const porSetor = setores.map((s) => {
    const ls = linhas.filter((l) => l.setor === s.chave)
    const area = ls.reduce((t, l) => t + (Number(l.area) || 0), 0)
    return { ...s, area, quantos: ls.length }
  })

  const salvar = (concluir?: 'programa' | 'setorizacao') =>
    iniciar(async () => {
      await salvarPrograma(projetoId, linhas.filter((l) => l.ambiente.trim()), concluir)
      setAviso(concluir === 'programa' ? 'Programa salvo e concluído.' : concluir === 'setorizacao' ? 'Setorização concluída.' : 'Salvo.')
    })

  const fmt = (n: number) => n.toLocaleString('pt-BR', { maximumFractionDigits: 1 })

  return (
    <div className="pilha-g">
      <section className="pilha">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <h2 className="titulo-secao">Ambientes</h2>
          <span className="meta numero">{linhas.length} ambientes · {fmt(total)} m²</span>
        </div>
        <div className="tabela-rolagem">
          <table className="tabela">
            <thead>
              <tr>
                <th>Ambiente</th>
                <th style={{ width: 150 }}>Setor</th>
                <th className="num">Área (m²)</th>
                <th>Atividades, mobiliário e requisitos</th>
                <th style={{ width: 40 }}><span className="sr">Remover</span></th>
              </tr>
            </thead>
            <tbody>
              {linhas.map((l) => {
                const ref = referencias[l.id]
                return (
                  <tr key={l.id}>
                    <td><input value={l.ambiente} onChange={(e) => mudar(l.id, 'ambiente', e.target.value)} aria-label="Ambiente" placeholder="Nome do ambiente" /></td>
                    <td>
                      <select value={l.setor} onChange={(e) => mudar(l.id, 'setor', e.target.value)} aria-label="Setor">
                        {setores.map((s) => <option key={s.chave} value={s.chave}>{s.nome}</option>)}
                      </select>
                    </td>
                    <td className="num">
                      <input
                        inputMode="decimal"
                        style={{ textAlign: 'right' }}
                        value={l.area == null ? '' : String(l.area).replace('.', ',')}
                        onChange={(e) => mudar(l.id, 'area', e.target.value)}
                        placeholder={ref ? `${fmt(ref[0])}–${fmt(ref[1])}` : ''}
                        aria-label="Área"
                      />
                    </td>
                    <td><input value={l.requisitos} onChange={(e) => mudar(l.id, 'requisitos', e.target.value)} aria-label="Requisitos" placeholder="Ex.: mesa para 6, luz natural, bancada de 2 m" /></td>
                    <td>
                      <button type="button" className="fechar" style={{ margin: 0 }} aria-label={`Remover ${l.ambiente}`} onClick={() => remover(l.id)}>×</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div>
          <button type="button" className="btn btn-sec btn-pequeno" onClick={adicionar}>+ Ambiente</button>
        </div>
        <p className="meta">As áreas em cinza são faixas de referência. Ajuste ao que o cliente precisa.</p>
      </section>

      <section className="pilha">
        <h2 className="titulo-secao">Setores</h2>
        <div className="setores">
          {porSetor.map((s) => (
            <div key={s.chave} className="setor">
              <span className="rotulo">{s.nome}</span>
              <b>{fmt(s.area)} m²</b>
              <span className="meta">
                {s.quantos} {s.quantos === 1 ? 'ambiente' : 'ambientes'}
                {total > 0 ? ` · ${Math.round((s.area / total) * 100)}%` : ''}
              </span>
            </div>
          ))}
        </div>
      </section>

      <div className="botoes barra-acoes">
        <button type="button" className="btn" disabled={pendente} onClick={() => salvar()}>Salvar</button>
        {!programaFeito && <button type="button" className="btn btn-sec" disabled={pendente} onClick={() => salvar('programa')}>Concluir programa</button>}
        {programaFeito && !setorizacaoFeita && (
          <button type="button" className="btn btn-sec" disabled={pendente} onClick={() => salvar('setorizacao')}>Concluir setorização</button>
        )}
        {aviso && <span className="meta" role="status">{aviso}</span>}
      </div>
    </div>
  )
}
