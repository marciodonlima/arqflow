import Link from 'next/link'
import { Icone } from './Icone'

// Cabeçalho de página: título à esquerda, ação principal sempre no canto superior direito
export function Cabecalho({
  titulo,
  subtitulo,
  acoes,
  voltar,
  antesDoTitulo,
}: {
  titulo: React.ReactNode
  subtitulo?: React.ReactNode
  acoes?: React.ReactNode
  voltar?: { href: string; rotulo: string }
  antesDoTitulo?: React.ReactNode
}) {
  return (
    <header className="cabecalho">
      <div className="cabecalho-texto">
        {voltar && (
          <Link href={voltar.href} className="voltar">
            <Icone nome="seta" />
            {voltar.rotulo}
          </Link>
        )}
        <div className="cabecalho-linha">
          {antesDoTitulo}
          <h1 className="titulo-pagina">{titulo}</h1>
        </div>
        {subtitulo && <div className="apoio">{subtitulo}</div>}
      </div>
      {acoes && <div className="cabecalho-acoes">{acoes}</div>}
    </header>
  )
}
