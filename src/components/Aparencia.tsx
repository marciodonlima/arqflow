'use client'

import { useEffect, useState, useTransition } from 'react'
import { salvarAparencia } from '@/acoes/dia'
import { ESTILOS, FONTE_URL, esquemaPorHora } from '@/lib/aparencia'
import type { Estilo, PreferenciaEsquema } from '@/lib/tipos'
import { Icone } from './Icone'

export function Aparencia({ estilo: e0, esquema: s0 }: { estilo: Estilo; esquema: PreferenciaEsquema }) {
  const [estilo, setEstilo] = useState(e0)
  const [pref, setPref] = useState<PreferenciaEsquema>(s0)
  const [, iniciar] = useTransition()

  function aplicar(e: Estilo, s: PreferenciaEsquema, salvar = true) {
    setEstilo(e)
    setPref(s)
    const raiz = document.documentElement
    raiz.dataset.estilo = e
    raiz.dataset.pref = s
    raiz.dataset.theme = s === 'auto' ? esquemaPorHora(new Date().getHours()) : s
    const link = document.getElementById('af-fonte') as HTMLLinkElement | null
    if (link && link.href !== FONTE_URL[e]) link.href = FONTE_URL[e]
    if (salvar) iniciar(() => salvarAparencia(e, s))
  }

  // O perfil manda: num aparelho novo, aplica o que está salvo na conta
  useEffect(() => {
    const raiz = document.documentElement
    if (raiz.dataset.estilo !== e0 || raiz.dataset.pref !== s0) aplicar(e0, s0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const nome = ESTILOS.find((x) => x.chave === estilo)?.nome
  const nomeEsquema = pref === 'auto' ? 'automático' : pref
  return (
    <div className="pilha" style={{ gap: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <span className="rotulo">Estilo</span>
        <span className="meta">{nome}, {nomeEsquema}</span>
      </div>
      <div className="amostras" role="group" aria-label="Estilo">
        {ESTILOS.map((x) => (
          <button
            key={x.chave}
            type="button"
            className={`amostra af-swatch-${x.chave}`}
            aria-label={`Estilo ${x.nome}`}
            aria-pressed={estilo === x.chave}
            title={x.nome}
            onClick={() => aplicar(x.chave, pref)}
          >
            <span className="af-swatch-fill" />
          </button>
        ))}
      </div>
      <div className="esquemas tres" role="group" aria-label="Claro, escuro ou automático">
        <button type="button" aria-pressed={pref === 'claro'} onClick={() => aplicar(estilo, 'claro')}>
          <Icone nome="claro" />
          <span>Claro</span>
        </button>
        <button type="button" aria-pressed={pref === 'escuro'} onClick={() => aplicar(estilo, 'escuro')}>
          <Icone nome="escuro" />
          <span>Escuro</span>
        </button>
        <button type="button" aria-pressed={pref === 'auto'} onClick={() => aplicar(estilo, 'auto')} title="Claro das 6h às 18h, escuro depois">
          <Icone nome="relogio" />
          <span>Auto</span>
        </button>
      </div>
    </div>
  )
}
