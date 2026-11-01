import type { Metadata } from 'next'
import { Arte } from '@/components/Arte'
import { FormEntrar } from './FormEntrar'

export const metadata: Metadata = { title: 'Entrar' }

export default async function Entrar({ searchParams }: { searchParams: Promise<{ erro?: string }> }) {
  const { erro } = await searchParams
  return (
    <main className="entrar">
      <div className="entrar-arte">
        <Arte />
      </div>
      <div className="entrar-form">
        <div className="pilha">
          <p className="marca" style={{ paddingLeft: 0 }}>ARQFLOW</p>
          <p className="apoio">Organiza o trabalho e alivia o peso que ele deixa na cabeça.</p>
        </div>
        {erro === 'link' && <p className="erro">Não deu para concluir pelo link. Se você estava confirmando o e-mail, ele provavelmente já está confirmado: entre com e-mail e senha.</p>}
        <FormEntrar />
      </div>
    </main>
  )
}
