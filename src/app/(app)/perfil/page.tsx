import type { Metadata } from 'next'
import { sair } from '@/acoes/auth'
import { Aparencia } from '@/components/Aparencia'
import { Cabecalho } from '@/components/Cabecalho'
import { sessao } from '@/lib/dados'
import { FormPerfil } from './FormPerfil'

export const metadata: Metadata = { title: 'Perfil' }

export default async function Perfil() {
  const { perfil, user } = await sessao()
  return (
    <div style={{ maxWidth: 680 }}>
      <Cabecalho titulo="Perfil" subtitulo={`${user.email} · plano Solo`} />
      <div className="pilha-g">
        <FormPerfil perfil={perfil} />
        <section className="pilha">
          <h2 className="titulo-secao">Aparência</h2>
          <div style={{ maxWidth: 300 }}>
            <Aparencia estilo={perfil.estilo} esquema={perfil.esquema} />
          </div>
        </section>
        <form action={sair}>
          <button className="btn btn-sec">Sair da conta</button>
        </form>
      </div>
    </div>
  )
}
