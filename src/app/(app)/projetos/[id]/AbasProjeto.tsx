'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function AbasProjeto({ id, proposta }: { id: string; proposta: boolean }) {
  const p = usePathname()
  const base = `/projetos/${id}`
  const abas = [
    { href: base, nome: 'Visão geral' },
    { href: `${base}/tarefas`, nome: 'Tarefas' },
    { href: `${base}/briefing`, nome: 'Briefing' },
    { href: `${base}/programa`, nome: 'Programa' },
    { href: `${base}/proposta`, nome: proposta ? 'Proposta e contrato' : 'Proposta' },
    { href: `${base}/financeiro`, nome: 'Financeiro' },
  ]
  return (
    <nav className="abas" aria-label="Seções do projeto">
      {abas.map((a) => (
        <Link key={a.href} href={a.href} aria-current={p === a.href ? 'page' : undefined}>
          {a.nome}
        </Link>
      ))}
    </nav>
  )
}
