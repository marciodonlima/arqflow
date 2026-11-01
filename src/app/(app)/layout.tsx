import Link from 'next/link'
import { Aparencia } from '@/components/Aparencia'
import { BotaoCapturar, CapturaProvider } from '@/components/Captura'
import { Icone } from '@/components/Icone'
import { BarraInferior, LinkProjeto, NavLateral } from '@/components/Navegacao'
import { capturasAbertas, projetosDe, sessao } from '@/lib/dados'
import { iniciais } from '@/lib/formato'

export default async function LayoutApp({ children }: { children: React.ReactNode }) {
  const { supabase, perfil, user } = await sessao()
  const [projetos, capturas] = await Promise.all([projetosDe(supabase, ['andamento', 'proposta']), capturasAbertas(supabase)])
  const lista = [...projetos].sort((a, b) => (a.status === b.status ? a.nome.localeCompare(b.nome) : a.status === 'andamento' ? -1 : 1))

  return (
    <CapturaProvider projetos={lista.map((p) => ({ id: p.id, nome: p.nome }))}>
      <div className="shell">
        <aside className="lateral">
          <Link href="/hoje" className="marca">ARQFLOW</Link>
          <BotaoCapturar largo />
          <NavLateral capturas={capturas.length} />
          {lista.length > 0 && (
            <div className="pilha" style={{ gap: 6 }}>
              <span className="rotulo" style={{ paddingLeft: 10 }}>Projetos</span>
              <div className="lateral-projetos">
                {lista.slice(0, 8).map((p) => (
                  <LinkProjeto key={p.id} id={p.id} nome={p.nome} proposta={p.status === 'proposta'} />
                ))}
              </div>
              <Link href="/projetos/novo" className="lateral-novo">
                <Icone nome="mais" />
                Novo projeto
              </Link>
            </div>
          )}
          <div className="lateral-rodape">
            <Aparencia estilo={perfil.estilo} esquema={perfil.esquema} />
            <Link href="/perfil" className="perfil-link">
              <span className="avatar">{iniciais(perfil.nome || user.email || '')}</span>
              <span>{perfil.nome || 'Seu perfil'}</span>
            </Link>
          </div>
        </aside>
        <main className="conteudo">{children}</main>
        <BarraInferior />
      </div>
    </CapturaProvider>
  )
}
