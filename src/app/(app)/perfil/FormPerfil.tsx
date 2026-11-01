'use client'

import { useState, useTransition } from 'react'
import { salvarPerfil } from '@/acoes/dia'
import type { Perfil } from '@/lib/tipos'

export function FormPerfil({ perfil }: { perfil: Perfil }) {
  const [pendente, iniciar] = useTransition()
  const [salvo, setSalvo] = useState(false)
  const br = (n: number) => String(n).replace('.', ',')
  return (
    <form
      className="pilha"
      onChange={() => setSalvo(false)}
      action={(fd) =>
        iniciar(async () => {
          await salvarPerfil(fd)
          setSalvo(true)
        })
      }
    >
      <label className="campo">
        <span>Seu nome</span>
        <input name="nome" defaultValue={perfil.nome} />
      </label>
      <h2 className="titulo-secao" style={{ marginTop: 'var(--space-4)' }}>Tempo e valor</h2>
      <p className="apoio">Estes números alimentam o valor sugerido das propostas e o cálculo de margem dos projetos.</p>
      <div className="grade-2">
        <label className="campo">
          <span>Custo da sua hora (R$)</span>
          <input name="custo_hora" inputMode="decimal" defaultValue={br(perfil.custo_hora)} />
          <small>Quanto custa manter o escritório e você, dividido pelas horas produtivas do mês.</small>
        </label>
        <label className="campo">
          <span>Margem sobre o custo (%)</span>
          <input name="margem" inputMode="decimal" defaultValue={br(perfil.margem)} />
        </label>
        <label className="campo">
          <span>Horas de projeto por dia</span>
          <input name="horas_dia" inputMode="decimal" defaultValue={br(perfil.horas_dia)} />
          <small>Horas de trabalho concentrado, sem contar reuniões e imprevistos.</small>
        </label>
        <label className="campo">
          <span>Horário de desligar</span>
          <input name="checkout_hora" type="time" defaultValue={perfil.checkout_hora} />
          <small>Depois dele, o ARQFLOW sugere fechar o dia.</small>
        </label>
      </div>
      <div className="botoes">
        <button className="btn" disabled={pendente}>Salvar</button>
        {salvo && <span className="meta" role="status">Salvo.</span>}
      </div>
    </form>
  )
}
