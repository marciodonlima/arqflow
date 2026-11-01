'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export function AbasProjeto({ id }: { id: string }) {
  const p = usePathname()
  const base = `/projetos/${id}`
  const aba = (href: string, nome: string) => (
    <Link href={href} aria-current={p === href ? 'page' : undefined}>
      {nome}
    </Link>
  )
  return (
    <nav className="abas" aria-label="Seções do projeto">
      {aba(base, 'Fluxo')}
      {aba(`${base}/briefing`, 'Briefing')}
      {aba(`${base}/programa`, 'Programa e setorização')}
    </nav>
  )
}
