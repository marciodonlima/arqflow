'use client'

import { useEffect, useState, useTransition } from 'react'
import { salvarAparencia } from '@/acoes/dia'
import { ESTILOS, FONTE_URL } from '@/lib/aparencia'
import type { Esquema, Estilo } from '@/lib/tipos'
import { Icone } from './Icone'

export function Aparencia({ estilo: e0, esquema: s0, comTitulo = true }: { estilo: Estilo; esquema: Esquema; comTitulo?: boolean }) {
  const [estilo, setEstilo] = useState(e0)
  const [esquema, setEsquema] = useState(s0)
  const [, iniciar] = useTransition()

  function aplicar(e: Estilo, s: Esquema) {
    setEstilo(e)
    setEsquema(s)
    const raiz = document.documentElement
    raiz.dataset.estilo = e
    raiz.dataset.theme = s
    const link = document.getElementById('af-fonte') as HTMLLinkElement | null
    if (link && link.href !== FONTE_URL[e]) link.href = FONTE_URL[e]
    iniciar(() => salvarAparencia(e, s))
  }

  // O perfil manda: num aparelho novo, aplica o estilo salvo na conta
  useEffect(() => {
    const raiz = document.documentElement
    if (raiz.dataset.estilo !== e0 || raiz.dataset.theme !== s0) aplicar(e0, s0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const nome = ESTILOS.find((x) => x.chave === estilo)?.nome
  return (
    <div className="pilha" style={{ gap: 10 }}>
      {comTitulo && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
          <span className="rotulo">Aparência</span>
          <span className="meta">{nome}, {esquema}</span>
        </div>
      )}
      <div className="amostras" role="group" aria-label="Estilo">
        {ESTILOS.map((x) => (
          <button
            key={x.chave}
            type="button"
            className={`amostra af-swatch-${x.chave}`}
            aria-label={`Estilo ${x.nome}`}
            aria-pressed={estilo === x.chave}
            title={x.nome}
            onClick={() => aplicar(x.chave, esquema)}
          >
            <span className="af-swatch-fill" />
          </button>
        ))}
      </div>
      <div className="esquemas" role="group" aria-label="Claro ou escuro">
        <button type="button" aria-pressed={esquema === 'claro'} onClick={() => aplicar(estilo, 'claro')}>
          <Icone nome="claro" />
          <span>Claro</span>
        </button>
        <button type="button" aria-pressed={esquema === 'escuro'} onClick={() => aplicar(estilo, 'escuro')}>
          <Icone nome="escuro" />
          <span>Escuro</span>
        </button>
      </div>
    </div>
  )
}
