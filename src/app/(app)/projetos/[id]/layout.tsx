import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Icone } from '@/components/Icone'
import { TIPOLOGIAS } from '@/lib/biblioteca'
import { projetoPorId, sessao } from '@/lib/dados'
import { AbasProjeto } from './AbasProjeto'
import { AcoesProjeto } from './AcoesProjeto'

const STATUS: Record<string, string> = {
  proposta: 'Em proposta',
  andamento: 'Em andamento',
  pausado: 'Pausado',
  concluido: 'Concluído',
  arquivado: 'Arquivado',
}

export default async function LayoutProjeto({ children, params }: { children: React.ReactNode; params: Promise<{ id: string }> }) {
  const { id } = await params
  const { supabase } = await sessao()
  const projeto = await projetoPorId(supabase, id)
  if (!projeto) notFound()
  const tip = TIPOLOGIAS.find((t) => t.chave === projeto.tipologia)?.nome
  return (
    <>
      <Link href="/projetos" className="voltar">
        <Icone nome="seta" />
        Projetos
      </Link>
      <header className="cabecalho" style={{ marginBottom: 'var(--space-5)' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <h1 className="titulo-pagina">{projeto.nome}</h1>
            <span className={projeto.status === 'andamento' ? 'chip' : 'chip chip-neutro'}>{STATUS[projeto.status]}</span>
          </div>
          <p className="apoio">{[projeto.cliente, tip].filter(Boolean).join(' · ')}</p>
        </div>
        <AcoesProjeto id={projeto.id} status={projeto.status} />
      </header>
      <AbasProjeto id={projeto.id} />
      {children}
    </>
  )
}
