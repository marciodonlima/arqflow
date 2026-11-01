import type { Metadata } from 'next'
import { sair } from '@/acoes/auth'
import { Aparencia } from '@/components/Aparencia'
import { sessao } from '@/lib/dados'
import { FormPerfil } from './FormPerfil'

export const metadata: Metadata = { title: 'Perfil' }

export default async function Perfil() {
  const { perfil, user } = await sessao()
  return (
    <div style={{ maxWidth: 680 }}>
      <header className="cabecalho">
        <div>
          <h1 className="titulo-pagina">Perfil</h1>
          <p className="apoio">{user.email} · plano Solo</p>
        </div>
      </header>
      <div className="pilha-g">
        <FormPerfil perfil={perfil} />
        <section className="pilha">
          <h2 className="titulo-secao">Aparência</h2>
          <div style={{ maxWidth: 260 }}>
            <Aparencia estilo={perfil.estilo} esquema={perfil.esquema} comTitulo={false} />
          </div>
        </section>
        <form action={sair}>
          <button className="btn btn-sec">Sair da conta</button>
        </form>
      </div>
    </div>
  )
}
