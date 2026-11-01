'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Icone, type NomeIcone } from './Icone'
import { BotaoCapturar } from './Captura'

const ITENS: { href: string; nome: string; icone: NomeIcone }[] = [
  { href: '/hoje', nome: 'Hoje', icone: 'hoje' },
  { href: '/projetos', nome: 'Projetos', icone: 'projetos' },
  { href: '/painel', nome: 'Painel', icone: 'painel' },
  { href: '/captura', nome: 'Caixa de captura', icone: 'caixa' },
  { href: '/checkout', nome: 'Check-out', icone: 'lua' },
]

const ativo = (p: string, href: string) => p === href || p.startsWith(href + '/')

export function NavLateral({ capturas }: { capturas: number }) {
  const p = usePathname()
  return (
    <nav className="nav-lateral" aria-label="Navegação principal">
      {ITENS.map((i) => (
        <Link key={i.href} href={i.href} aria-current={ativo(p, i.href) ? 'page' : undefined}>
          <Icone nome={i.icone} />
          <span>{i.nome}</span>
          {i.href === '/captura' && capturas > 0 && <span className="contador">{capturas}</span>}
        </Link>
      ))}
    </nav>
  )
}

export function BarraInferior() {
  const p = usePathname()
  const item = (href: string, nome: string, icone: NomeIcone) => (
    <Link href={href} className="barra-item" aria-current={ativo(p, href) ? 'page' : undefined}>
      <Icone nome={icone} />
      <span>{nome}</span>
    </Link>
  )
  return (
    <nav className="barra" aria-label="Navegação principal">
      {item('/hoje', 'Hoje', 'hoje')}
      {item('/projetos', 'Projetos', 'projetos')}
      <BotaoCapturar />
      {item('/painel', 'Painel', 'painel')}
      {item('/perfil', 'Perfil', 'perfil')}
    </nav>
  )
}

export function LinkProjeto({ id, nome, proposta }: { id: string; nome: string; proposta: boolean }) {
  const p = usePathname()
  return (
    <Link href={`/projetos/${id}`} aria-current={p.startsWith(`/projetos/${id}`) ? 'page' : undefined}>
      <i className={proposta ? 'proposta' : undefined} aria-hidden="true" />
      <span>{nome}</span>
      {proposta && <span className="sr">(em proposta)</span>}
    </Link>
  )
}
