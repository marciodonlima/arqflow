'use client'

import Link from 'next/link'
import { useState, useTransition } from 'react'
import { fazerCheckout } from '@/acoes/dia'

export function FormCheckout({
  opcoes,
  fechado,
  abertoAnterior,
  escolhida,
}: {
  opcoes: { id: string; titulo: string; projeto: string }[]
  fechado: boolean
  abertoAnterior: string
  escolhida: string | null
}) {
  const [pendente, iniciar] = useTransition()
  const [pronto, setPronto] = useState(fechado)

  if (pronto)
    return (
      <div className="hero">
        <span className="hero-rotulo">Dia fechado</span>
        <p className="hero-titulo">Bom trabalho. Pode desligar.</p>
        <p className="hero-motivo">Amanhã o ARQFLOW começa pelo que você escolheu. O resto está anotado e não vai fugir.</p>
        <div className="botoes">
          <button type="button" className="btn btn-sec" onClick={() => setPronto(false)}>Editar check-out</button>
          <Link href="/hoje" className="btn-texto">Voltar para hoje</Link>
        </div>
      </div>
    )

  return (
    <form
      className="pilha-g"
      action={(fd) =>
        iniciar(async () => {
          await fazerCheckout(fd)
          setPronto(true)
        })
      }
    >
      <label className="campo">
        <span className="rotulo" style={{ color: 'var(--af-tert)' }}>2 · O que ficou aberto</span>
        <textarea name="aberto" defaultValue={abertoAnterior} placeholder="Pendências, ideias soltas, o que você precisa lembrar amanhã." rows={4} />
      </label>
      <fieldset className="campo">
        <legend className="rotulo" style={{ color: 'var(--af-tert)' }}>3 · Por onde começar amanhã</legend>
        {opcoes.length === 0 ? (
          <p className="apoio" style={{ marginTop: 8 }}>Nenhuma tarefa prevista. Amanhã é um bom dia para planejar.</p>
        ) : (
          <div className="pilha" style={{ gap: 8, marginTop: 8 }}>
            {opcoes.map((o, i) => (
              <label key={o.id} className="cartao-opcao">
                <input type="radio" name="amanha_tarefa" value={o.id} defaultChecked={escolhida ? escolhida === o.id : i === 0} />
                <div>
                  <strong>{o.titulo}</strong>
                  <small>{o.projeto}</small>
                </div>
              </label>
            ))}
          </div>
        )}
      </fieldset>
      <div>
        <button className="btn btn-largo" disabled={pendente} style={{ maxWidth: 320 }}>{pendente ? 'Fechando…' : 'Fechar o dia'}</button>
      </div>
    </form>
  )
}
