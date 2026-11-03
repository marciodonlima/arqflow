import type { Saude, StatusSaude } from '@/lib/saude'
import { ROTULO_STATUS } from '@/lib/saude'
import { Icone } from './Icone'

// Selo de saúde do projeto. Sem vermelho: o peso vem do preenchimento e do ícone.
export function SeloSaude({ status, texto, pequeno = false }: { status: StatusSaude; texto?: string; pequeno?: boolean }) {
  const icone = status === 'atrasado' ? 'alerta' : status === 'atencao' ? 'ampulheta' : status === 'em_dia' ? 'check' : 'relogio'
  return (
    <span className={`selo selo-${status}${pequeno ? ' selo-pequeno' : ''}`}>
      <Icone nome={icone} />
      {texto ?? ROTULO_STATUS[status]}
    </span>
  )
}

export function PontoSaude({ status }: { status: StatusSaude }) {
  if (status === 'em_dia' || status === 'proposta' || status === 'parado') return null
  return <span className={`ponto-saude ponto-${status}`} aria-label={ROTULO_STATUS[status]} title={ROTULO_STATUS[status]} />
}

// Barras de progresso real × esperado pelo cronograma
export function BarrasProgresso({ saude }: { saude: Saude }) {
  const real = Math.round(saude.progresso * 100)
  const esperado = saude.progressoEsperado == null ? null : Math.round(saude.progressoEsperado * 100)
  return (
    <div className="barras">
      <div className="barra-linha">
        <span className="meta">Feito</span>
        <div className="progresso"><i style={{ width: `${real}%` }} /></div>
        <span className="meta numero">{real}%</span>
      </div>
      {esperado != null && (
        <div className="barra-linha">
          <span className="meta">Previsto</span>
          <div className="progresso progresso-plano"><i style={{ width: `${esperado}%` }} /></div>
          <span className="meta numero">{esperado}%</span>
        </div>
      )}
    </div>
  )
}
