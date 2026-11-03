export function Kpi({ valor, rotulo, detalhe, destaque }: { valor: React.ReactNode; rotulo: string; detalhe?: React.ReactNode; destaque?: 'bom' | 'ruim' }) {
  return (
    <div className={`kpi${destaque ? ` kpi-${destaque}` : ''}`}>
      <span className="kpi-rotulo">{rotulo}</span>
      <b className="kpi-valor numero">{valor}</b>
      {detalhe && <span className="kpi-detalhe">{detalhe}</span>}
    </div>
  )
}
