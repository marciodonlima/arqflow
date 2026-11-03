'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { estiloCor } from '@/lib/cores'
import type { StatusSaude } from '@/lib/saude'
import { Icone, type NomeIcone } from './Icone'

const LUGARES: { href: string; nome: string; curto: string; icone: NomeIcone }[] = [
  { href: '/hoje', nome: 'Hoje', curto: 'Hoje', icone: 'hoje' },
  { href: '/projetos', nome: 'Projetos', curto: 'Projetos', icone: 'projetos' },
  { href: '/agenda', nome: 'Agenda', curto: 'Agenda', icone: 'agenda' },
  { href: '/painel', nome: 'Painel', curto: 'Painel', icone: 'painel' },
  { href: '/captura', nome: 'Caixa de entrada', curto: 'Caixa', icone: 'caixa' },
]

const ativo = (p: string, href: string) => p === href || p.startsWith(href + '/') || (href === '/hoje' && p === '/checkout')

export function NavLateral({ capturas, atencao }: { capturas: number; atencao: number }) {
  const p = usePathname()
  return (
    <nav className="nav-lateral" aria-label="Navegação principal">
      {LUGARES.map((i) => (
        <Link key={i.href} href={i.href} aria-current={ativo(p, i.href) ? 'page' : undefined}>
          <Icone nome={i.icone} />
          <span>{i.nome}</span>
          {i.href === '/captura' && capturas > 0 && <span className="contador">{capturas}</span>}
          {i.href === '/projetos' && atencao > 0 && <span className="contador contador-alerta" title="Projetos que pedem atenção">{atencao}</span>}
        </Link>
      ))}
    </nav>
  )
}

export function BarraInferior({ capturas }: { capturas: number }) {
  const p = usePathname()
  return (
    <nav className="barra" aria-label="Navegação principal">
      {LUGARES.map((i) => (
        <Link key={i.href} href={i.href} className="barra-item" aria-current={ativo(p, i.href) ? 'page' : undefined}>
          <span className="barra-icone">
            <Icone nome={i.icone} />
            {i.href === '/captura' && capturas > 0 && <span className="barra-contador">{capturas}</span>}
          </span>
          <span>{i.curto}</span>
        </Link>
      ))}
    </nav>
  )
}

export function LinkProjeto({ id, nome, cor, proposta, status }: { id: string; nome: string; cor: string | null; proposta: boolean; status: StatusSaude }) {
  const p = usePathname()
  return (
    <Link href={`/projetos/${id}`} className="cor-projeto" style={estiloCor(cor)} aria-current={p.startsWith(`/projetos/${id}`) ? 'page' : undefined}>
      <i className={proposta ? 'marcador-cor vazado' : 'marcador-cor'} aria-hidden="true" />
      <span className="lateral-projeto-nome">{nome}</span>
      {(status === 'atrasado' || status === 'atencao') && <span className={`ponto-saude ponto-${status}`} title={status === 'atrasado' ? 'Atrasado' : 'Atenção'} />}
      {proposta && <span className="sr">(em proposta)</span>}
    </Link>
  )
}
