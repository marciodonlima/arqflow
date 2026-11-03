'use client'

import { dataCurta } from '@/lib/datas'
import type { PrazoTipo } from '@/lib/tipos'

export function PrazoCampos({
  dias,
  setDias,
  tipo,
  setTipo,
  entrega,
  rotulo,
}: {
  dias: string
  setDias: (v: string) => void
  tipo: PrazoTipo
  setTipo: (t: PrazoTipo) => void
  entrega: string | null
  rotulo: string
}) {
  return (
    <div className="campo">
      <span>{rotulo}</span>
      <div className="prazo">
        <input name="prazo_dias" className="entrada" inputMode="numeric" value={dias} onChange={(e) => setDias(e.target.value.replace(/\D/g, ''))} placeholder="60" aria-label="Prazo em dias" />
        <div className="segmentado" role="group" aria-label="Tipo de dia">
          <button type="button" aria-pressed={tipo === 'corridos'} onClick={() => setTipo('corridos')}>dias corridos</button>
          <button type="button" aria-pressed={tipo === 'uteis'} onClick={() => setTipo('uteis')}>dias úteis</button>
        </div>
        <input type="hidden" name="prazo_tipo" value={tipo} />
      </div>
      <small>{entrega ? `Entrega em ${dataCurta(entrega)} de ${entrega.slice(0, 4)}` : 'Sem prazo, o ARQFLOW sugere uma data pelas horas e pela sua jornada.'}</small>
    </div>
  )
}
