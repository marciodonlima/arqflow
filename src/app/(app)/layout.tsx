import Link from 'next/link'
import { AtualizarBanco } from '@/components/AtualizarBanco'
import { BotaoCapturar, CapturaProvider } from '@/components/Captura'
import { CronometroGlobal } from '@/components/Cronometro'
import { Icone } from '@/components/Icone'
import { BarraInferior, LinkProjeto, NavLateral } from '@/components/Navegacao'
import { bancoAtualizado, capturasAbertas, carregarCarteira, sessao, timerAtivo } from '@/lib/dados'
import { iniciais } from '@/lib/formato'

export default async function LayoutApp({ children }: { children: React.ReactNode }) {
  const { supabase, perfil, user, hoje } = await sessao()
  if (!(await bancoAtualizado(supabase))) return <AtualizarBanco />
  const [{ projetos, saudes }, capturas, timer] = await Promise.all([carregarCarteira(supabase, perfil, hoje), capturasAbertas(supabase), timerAtivo(supabase)])
  const ativos = projetos.filter((p) => p.status === 'andamento' || p.status === 'proposta')
  const lista = [...ativos].sort((a, b) => (a.status === b.status ? a.nome.localeCompare(b.nome) : a.status === 'andamento' ? -1 : 1))
  const atencao = ativos.filter((p) => ['atrasado', 'atencao'].includes(saudes[p.id]?.status)).length

  return (
    <CapturaProvider projetos={lista.map((p) => ({ id: p.id, nome: p.nome }))}>
      <div className="shell">
        <aside className="lateral">
          <Link href="/hoje" className="marca">ARQFLOW</Link>
          <NavLateral capturas={capturas.length} atencao={atencao} />
          <div className="lateral-secao">
            <div className="lateral-secao-topo">
              <span className="rotulo">Projetos ativos</span>
              <Link href="/projetos/novo" className="lateral-mais" aria-label="Novo projeto" title="Novo projeto">
                <Icone nome="mais" />
              </Link>
            </div>
            <div className="lateral-projetos">
              {lista.length === 0 && <p className="meta" style={{ padding: '4px 10px' }}>Nenhum projeto ainda.</p>}
              {lista.slice(0, 12).map((p) => (
                <LinkProjeto key={p.id} id={p.id} nome={p.nome} cor={p.cor} proposta={p.status === 'proposta'} status={saudes[p.id]?.status ?? 'em_dia'} />
              ))}
            </div>
          </div>
          <div className="lateral-rodape">
            <Link href="/perfil" className="perfil-link">
              <span className="avatar">{iniciais(perfil.nome || user.email || '')}</span>
              <span className="perfil-nome">
                <span>{perfil.nome || 'Seu perfil'}</span>
                <span className="meta">Perfil, custos e estilo</span>
              </span>
            </Link>
          </div>
        </aside>
        <div className="principal">
          <div className="topo">
            <Link href="/hoje" className="marca topo-marca">ARQFLOW</Link>
            <div className="topo-direita">
              <CronometroGlobal timer={timer} />
              <BotaoCapturar />
              <Link href="/perfil" className="avatar topo-avatar" aria-label="Perfil">{iniciais(perfil.nome || user.email || '')}</Link>
            </div>
          </div>
          <main className="conteudo">{children}</main>
        </div>
        <BarraInferior capturas={capturas.length} />
      </div>
    </CapturaProvider>
  )
}
