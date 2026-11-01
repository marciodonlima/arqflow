import Link from 'next/link'

export default function NaoEncontrado() {
  return (
    <main className="entrar">
      <div className="entrar-form">
        <p className="marca" style={{ paddingLeft: 0 }}>ARQFLOW</p>
        <h1 className="titulo-secao">Esta página não existe</h1>
        <p className="apoio">O link pode ter mudado, ou o projeto foi excluído.</p>
        <Link href="/hoje" className="btn" style={{ alignSelf: 'flex-start' }}>Voltar para hoje</Link>
      </div>
    </main>
  )
}
